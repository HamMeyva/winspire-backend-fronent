const mongoose = require('mongoose');
const Content = require('./windscribe-backend/src/models/content.model');
const DeletedContent = require('./windscribe-backend/src/models/deletedContent.model');
const duplicateDetectorService = require('./windscribe-backend/src/services/duplicate-detector.service');

// Environment variables
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to database successfully');
  processDuplicates();
}).catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

async function processDuplicates() {
  try {
    console.log('Starting duplicate content cleanup...');
    
    // Find all content marked as duplicate
    const duplicateContent = await Content.find({ 
      isDuplicate: true,
      status: { $ne: 'deleted' } // Exclude already deleted content
    });
    
    console.log(`Found ${duplicateContent.length} items marked as duplicates`);
    
    if (duplicateContent.length === 0) {
      console.log('No duplicates to process.');
      mongoose.disconnect();
      return;
    }
    
    // Group duplicates by similarity
    const processedGroups = [];
    const duplicateSets = [];
    
    // Process each duplicate content
    for (const content of duplicateContent) {
      // Skip if already processed in a group
      if (processedGroups.includes(content._id.toString())) {
        continue;
      }
      
      // Find similar content to this one
      const similarContent = await duplicateDetectorService.findPotentialDuplicates(content._id);
      
      // Only process if there are actual similar items
      if (similarContent.length > 0) {
        // Filter to only include items with high similarity (>0.8 overall similarity)
        const highSimilarityItems = similarContent.filter(item => item.overallSimilarity > 0.8);
        
        if (highSimilarityItems.length > 0) {
          // Create a set of IDs including the original content
          const similarSet = [content._id.toString(), ...highSimilarityItems.map(item => item._id.toString())];
          
          // Mark all IDs as processed
          similarSet.forEach(id => {
            if (!processedGroups.includes(id)) {
              processedGroups.push(id);
            }
          });
          
          duplicateSets.push(similarSet);
        }
      }
    }
    
    console.log(`Identified ${duplicateSets.length} sets of similar content`);
    
    // Process each set of duplicates
    let processedCount = 0;
    for (const duplicateSet of duplicateSets) {
      // Get the full content objects to analyze quality
      const contentSet = await Content.find({ _id: { $in: duplicateSet } });
      
      // Sort by quality metrics (e.g., completeness, recency, etc.)
      contentSet.sort((a, b) => {
        // Example quality sorting - prioritize:
        // 1. Published content over drafts
        // 2. Content with more engagement (views, likes)
        // 3. More recently created content
        
        // Status comparison (published > pending > draft)
        const statusScore = {
          'published': 3,
          'pending': 2,
          'draft': 1
        };
        
        const statusDiff = (statusScore[b.status] || 0) - (statusScore[a.status] || 0);
        if (statusDiff !== 0) return statusDiff;
        
        // Engagement score (views + likes)
        const aEngagement = (a.stats?.views || 0) + (a.stats?.likes || 0);
        const bEngagement = (b.stats?.views || 0) + (b.stats?.likes || 0);
        if (bEngagement !== aEngagement) return bEngagement - aEngagement;
        
        // Recency (newer is better)
        return b.createdAt - a.createdAt;
      });
      
      if (contentSet.length > 1) {
        // Keep the first (highest quality) content and mark others as duplicates
        const keepContentId = contentSet[0]._id;
        const duplicateContentIds = contentSet.slice(1).map(c => c._id);
        
        console.log(`Keeping content ${keepContentId} and marking ${duplicateContentIds.length} items as duplicates`);
        
        // Mark each duplicate and move to deleted collection
        for (const duplicateId of duplicateContentIds) {
          await duplicateDetectorService.markAsDuplicate(duplicateId, keepContentId);
          processedCount++;
        }
      }
    }
    
    console.log(`Completed processing. Moved ${processedCount} duplicate items to deleted content collection.`);
    mongoose.disconnect();
    
  } catch (error) {
    console.error('Error processing duplicates:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

// Handle application shutdown
process.on('SIGINT', () => {
  mongoose.disconnect();
  process.exit(0);
}); 