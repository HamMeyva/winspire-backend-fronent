const cron = require('node-cron');
const contentService = require('./content.service.new');
const Content = require('./windscribe-backend/src/models/content.model');
const DeletedContent = require('./windscribe-backend/src/models/deletedContent.model');
const Category = require('./windscribe-backend/src/models/category.model');
const User = require('./windscribe-backend/src/models/user.model');
const mongoose = require('mongoose');

// Track if content has been manually generated today
let manualGenerationDone = false;

// Reset manual generation flag at the start of each day
const resetDailyFlags = () => {
  manualGenerationDone = false;
  console.log('Daily flags reset - manual generation status reset');
};

// Initialize scheduler service
const initScheduler = () => {
  // Reset daily flags - runs at midnight every day
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily flags reset');
    resetDailyFlags();
  });

  // Schedule daily content generation - runs at 1:00 AM every day
  cron.schedule('0 1 * * *', async () => {
    console.log('Running content generation job');
    try {
      // Only run if content hasn't been manually generated
      if (!manualGenerationDone) {
        console.log('No manual generation detected - running automatic generation');
        const summary = await generateDailyContent();
        console.log('Automatic content generation completed:', summary);
      } else {
        console.log('Manual generation was already done today - skipping automatic generation');
      }
    } catch (error) {
      console.error('Error in content generation job:', error);
    }
  });

  // Schedule content moving to deleted table - runs every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running content archiving job');
    try {
      const movedCount = await moveExpiredContentToDeleted();
      console.log(`Content archiving completed: ${movedCount} items moved to deleted table`);
    } catch (error) {
      console.error('Error in content archiving job:', error);
    }
  });

  // Schedule content recycling - runs at 2:00 AM every day
  cron.schedule('0 2 * * *', async () => {
    console.log('Running content recycling job');
    try {
      const recycledCount = await recyclePopularContent();
      console.log(`Content recycling completed: ${recycledCount} items recycled`);
    } catch (error) {
      console.error('Error in content recycling job:', error);
    }
  });

  // Schedule user streak reset check - runs at 3:00 AM every day
  cron.schedule('0 3 * * *', async () => {
    console.log('Running user streak check job');
    try {
      const updatedCount = await checkUserStreaks();
      console.log(`User streak check completed: ${updatedCount} users updated`);
    } catch (error) {
      console.error('Error in user streak check job:', error);
    }
  });

  // Schedule expired subscription check - runs at 4:00 AM every day
  cron.schedule('0 4 * * *', async () => {
    console.log('Running subscription expiry check job');
    try {
      const expiredCount = await checkExpiredSubscriptions();
      console.log(`Subscription expiry check completed: ${expiredCount} subscriptions expired`);
    } catch (error) {
      console.error('Error in subscription expiry check job:', error);
    }
  });

  console.log('Scheduler service initialized');
};

// Generate daily content for all active categories
const generateDailyContent = async () => {
  // Get admin user to assign as content creator
  const admin = await User.findOne({ role: 'admin' });
  
  if (!admin) {
    throw new Error('No admin user found to assign as content creator');
  }
  
  // Set process environment variable for admin user ID
  process.env.ADMIN_USER_ID = admin._id;
  
  // Generate content using content service
  return await contentService.generateDailyContent(10); // 10 items per category
};

// Mark that manual generation has been done today
const setManualGenerationDone = () => {
  manualGenerationDone = true;
  console.log('Manual generation marked as done for today');
  return { success: true };
};

// Move content that has been published for 10 minutes to the deleted table
const moveExpiredContentToDeleted = async () => {
  try {
    // Calculate the date 10 minutes ago instead of 24 hours ago
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
    
    // Find published content that's older than 10 minutes
    const expiredContent = await Content.find({
      status: 'published',
      publishDate: { $lt: tenMinutesAgo }
    });
    
    let movedCount = 0;
    
    // Process each expired content item
    for (const content of expiredContent) {
      // Convert to plain object and prepare for DeletedContent
      const contentData = content.toObject();
      const contentId = contentData._id;
      delete contentData._id; // Remove _id to avoid duplicate key error
      
      // Add metadata about deletion
      contentData.deletedAt = new Date();
      contentData.originalContentId = contentId;
      
      // Create entry in DeletedContent collection
      await DeletedContent.create(contentData);
      
      // Remove from main Content collection
      await Content.findByIdAndDelete(contentId);
      
      movedCount++;
    }
    
    return movedCount;
  } catch (error) {
    console.error('Error moving expired content to deleted:', error);
    throw error;
  }
};

// Recycle popular and highly-rated content
const recyclePopularContent = async () => {
  try {
    // Find recyclable content
    const recyclableContent = await contentService.findRecyclableContent(20);
    
    if (recyclableContent.length === 0) {
      return 0;
    }
    
    // Extract IDs of content to recycle
    const contentIds = recyclableContent.map(content => content._id);
    
    // Recycle content
    const recycledCount = await contentService.recycleContent(contentIds);
    
    return recycledCount;
  } catch (error) {
    console.error('Error recycling content:', error);
    throw error;
  }
};

// Check and update user streaks
const checkUserStreaks = async () => {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    // Find users who haven't logged in for more than 1 day and have a streak > 0
    const usersToUpdate = await User.find({
      lastLogin: { $lt: twoDaysAgo },
      'stats.streak.current': { $gt: 0 }
    });
    
    // Update streaks to 0 for these users
    if (usersToUpdate.length > 0) {
      const result = await User.updateMany(
        { _id: { $in: usersToUpdate.map(user => user._id) } },
        { $set: { 'stats.streak.current': 0 } }
      );
      
      return result.modifiedCount;
    }
    
    return 0;
  } catch (error) {
    console.error('Error updating user streaks:', error);
    throw error;
  }
};

// Check and handle expired subscriptions
const checkExpiredSubscriptions = async () => {
  try {
    const now = new Date();
    
    // Find users with expired subscriptions that are still marked as active or cancelled
    const usersToUpdate = await User.find({
      'subscription.endDate': { $lt: now },
      'subscription.status': { $in: ['active', 'cancelled'] },
      'subscription.tier': { $ne: 'free' }
    });
    
    // Update subscription status to expired and tier to free
    if (usersToUpdate.length > 0) {
      const result = await User.updateMany(
        { _id: { $in: usersToUpdate.map(user => user._id) } },
        {
          $set: {
            'subscription.status': 'expired',
            'subscription.tier': 'free'
          }
        }
      );
      
      return result.modifiedCount;
    }
    
    return 0;
  } catch (error) {
    console.error('Error updating expired subscriptions:', error);
    throw error;
  }
};

module.exports = {
  initScheduler,
  generateDailyContent,
  recyclePopularContent,
  checkUserStreaks,
  checkExpiredSubscriptions,
  setManualGenerationDone,
  moveExpiredContentToDeleted
}; 