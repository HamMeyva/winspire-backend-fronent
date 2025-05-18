import AsyncStorage from "@react-native-async-storage/async-storage";

// Constants
const USER_STORAGE_KEY = '@windspire_user';

// Helper to get the current user ID (for user-specific storage)
async function getCurrentUserId(): Promise<string> {
  try {
    const userStr = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id || 'guest';
    }
    return 'guest';
  } catch (e) {
    console.error('Error getting current user:', e);
    return 'guest';
  }
}

export const STORAGE = {
  setCategoryDone: async (category: string, subCategoryID: number) => {
    // Get current user ID to make storage user-specific
    const userId = await getCurrentUserId();
    const key = `user:${userId}:category:${category}.${subCategoryID}`;
    await AsyncStorage.setItem(key, "true");
    
    // Store timestamp when category was marked as done
    // This is used to reset categories after a period of time
    const timestampKey = `user:${userId}:category:${category}.${subCategoryID}:timestamp`;
    await AsyncStorage.setItem(timestampKey, Date.now().toString());
    
    // Clear any content change flag for this category
    const contentChangeKey = `content:change:${category}`;
    await AsyncStorage.setItem(contentChangeKey, "false");
    
    console.log(`✅ Marked category ${category}.${subCategoryID} as complete for user ${userId} at ${new Date().toISOString()}`);
  },
  
  // New method to mark a category as NOT complete (when new content arrives)
  resetCategoryCompletion: async (category: string, subCategoryID: number) => {
    // Get current user ID to make storage user-specific
    const userId = await getCurrentUserId();
    const key = `user:${userId}:category:${category}.${subCategoryID}`;
    await AsyncStorage.setItem(key, "false");
    console.log(`Reset completion status for ${category}.${subCategoryID} to false for user ${userId}`);
  },

  getCategoryDone: async (category: string, subCategoryID: number) => {
    // First get the current user ID for user-specific storage
    const userId = await getCurrentUserId();
    const key = `user:${userId}:category:${category}.${subCategoryID}`;
    
    // Get the stored completion status
    const status = await AsyncStorage.getItem(key) || "false";
    
    // CRITICAL: Always return false (not done) if there is any doubt about content status
    // This ensures categories are correctly reset when new content is pushed to the app
    // It's safer to always show white icons than to show green icons when content isn't read
    if (status === "true") {
      // Force check against backend - if there's any doubt about content status, force it to reset
      try {
        // Get a timestamp for when this category was last marked as completed
        const timestampKey = `user:${userId}:category:${category}.${subCategoryID}:timestamp`;
        const completedTimestamp = await AsyncStorage.getItem(timestampKey) || "0";
        const lastMarkedDone = parseInt(completedTimestamp, 10) || 0;
        
        // If it was completed more than 12 hours ago, force reset to make sure we detect new content
        const twelveHoursMs = 12 * 60 * 60 * 1000;
        const now = Date.now();
        
        if (now - lastMarkedDone > twelveHoursMs) {
          console.log(`🔄 Force resetting category ${category}.${subCategoryID} due to age (>${twelveHoursMs/1000/60/60}h old)`);
          await STORAGE.resetCategoryCompletion(category, subCategoryID);
          return "false";
        }
        
        // Additionally check a storage flag that tracks backend content changes
        const contentChangeKey = `content:change:${category}`;
        const contentChanged = await AsyncStorage.getItem(contentChangeKey) || "false";
        
        if (contentChanged === "true") {
          console.log(`🆕 Force resetting category ${category}.${subCategoryID} due to backend content change`);
          await STORAGE.resetCategoryCompletion(category, subCategoryID);
          return "false";
        }
      } catch (e) {
        console.error(`Error during content check for ${category}.${subCategoryID}:`, e);
        // On any error, just return the original status
      }
    }
    
    return status;
  },

  resetCategoryDone: async (categories: any) => {
    try {
      // Get the current user ID to make resets user-specific
      const userId = await getCurrentUserId();
      const userDoneControlKey = `user:${userId}:done-control-time`;
      
      // Get the last reset time for this user
      const doneControlTime = await AsyncStorage.getItem(userDoneControlKey);
      const currentDate = new Date().getUTCDate().toString();
      const currentHour = new Date().getUTCHours();
      
      // Initialize if first time
      if (doneControlTime === null) {
        console.log(`Initializing category reset timestamp for user ${userId}`);
        await AsyncStorage.setItem(userDoneControlKey, currentDate);
      } 
      // If it's a new day and after 6:00 UTC, reset all categories
      else if (doneControlTime !== currentDate && currentHour >= 6) {
        console.log(`🕘 Daily reset triggered for user ${userId}. Previous: ${doneControlTime}, Current: ${currentDate}`);
        
        // Reset all categories for this user
        for (let category of Object.keys(categories)) {
          for (let subCategory of Object.keys(categories[category])) {
            // Use the user-specific key format
            const key = `user:${userId}:category:${category}.${subCategory}`;
            await AsyncStorage.setItem(key, "false");
            console.log(`Daily reset: ${category}.${subCategory} for user ${userId}`);
          }
        }
        
        // Update the control time
        await AsyncStorage.setItem(userDoneControlKey, currentDate);
        console.log(`✅ Daily reset complete for user ${userId}`);
      } else {
        console.log(`Daily reset check: Not triggered (${doneControlTime} vs ${currentDate}, hour: ${currentHour})`);
      }
    } catch (error) {
      console.error('Error during resetCategoryDone:', error);
    }
  },

  setCampaignLastDate: async () => {
    const now = Date.now();
    await AsyncStorage.setItem("campaignLastDate", now.toString());
  },

  getCampaignLastDate: async () => {
    const value = await AsyncStorage.getItem("campaignLastDate");
    return value;
  },

  setSubscriptionType: async (type: string) => {
    await AsyncStorage.setItem("subscriptionType", type);
  },

  getSubscriptionType: async () => {
    const value = await AsyncStorage.getItem("subscriptionType");
    return value;
  },

  setReviewShown: async () => {
    await AsyncStorage.setItem("reviewShown", "true");
  },

  getReviewShown: async () => {
    const value = await AsyncStorage.getItem("reviewShown");
    return value;
  },
  
  // Card swipe actions (like, dislike, maybe)
  setCardAction: async (category: string, title: string, cardIndex: number, action: 'like' | 'dislike' | 'maybe') => {
    // Action key
    const key = `card-action:${category}:${title}:${cardIndex}`;
    await AsyncStorage.setItem(key, action);
    
    // Detailed action key with timestamp to track when action was taken
    const detailedKey = `card-action-detail:${category}:${title}:${cardIndex}`;
    const detailedValue = JSON.stringify({
      category,
      title,
      cardIndex,
      action,
      timestamp: Date.now(),
      synced: false // backend'e gönderildi mi?
    });
    
    await AsyncStorage.setItem(detailedKey, detailedValue);
  },

  getCardAction: async (category: string, title: string, cardIndex: number) => {
    const key = `card-action:${category}:${title}:${cardIndex}`;
    const value = await AsyncStorage.getItem(key);
    return value as 'like' | 'dislike' | 'maybe' | null;
  },
  
  // Get detailed action info
  getCardActionDetails: async (category: string, title: string, cardIndex: number) => {
    const key = `card-action-detail:${category}:${title}:${cardIndex}`;
    const value = await AsyncStorage.getItem(key);
    
    if (value) {
      return JSON.parse(value);
    }
    
    return null;
  },
  
  getAllCardActions: async (category: string, title: string) => {
    const keys = await AsyncStorage.getAllKeys();
    const prefix = `card-action:${category}:${title}:`;
    const actionKeys = keys.filter(key => key.startsWith(prefix));
    
    const actions: Record<number, 'like' | 'dislike' | 'maybe'> = {};
    
    await Promise.all(
      actionKeys.map(async (key) => {
        const cardIndex = parseInt(key.split(':')[3]);
        const action = await AsyncStorage.getItem(key);
        if (action === 'like' || action === 'dislike' || action === 'maybe') {
          actions[cardIndex] = action;
        }
      })
    );
    
    return actions;
  },
  
  // Get ALL card actions across all categories for admin panel
  getAllCardActionsForAdminPanel: async () => {
    const keys = await AsyncStorage.getAllKeys();
    const prefix = 'card-action-detail:';
    const actionKeys = keys.filter(key => key.startsWith(prefix));
    
    const actions: any[] = [];
    
    await Promise.all(
      actionKeys.map(async (key) => {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            const actionDetail = JSON.parse(value);
            actions.push(actionDetail);
          } catch (error) {
            console.error('Error parsing action details:', error);
          }
        }
      })
    );
    
    // Sort by timestamp, newest first
    return actions.sort((a, b) => b.timestamp - a.timestamp);
  },
  
  // Mark a card action as synced with backend
  markCardActionSynced: async (category: string, title: string, cardIndex: number) => {
    const key = `card-action-detail:${category}:${title}:${cardIndex}`;
    const value = await AsyncStorage.getItem(key);
    
    if (value) {
      try {
        const actionDetail = JSON.parse(value);
        actionDetail.synced = true;
        await AsyncStorage.setItem(key, JSON.stringify(actionDetail));
      } catch (error) {
        console.error('Error marking action as synced:', error);
      }
    }
  },
  
  // Get all unsynced card actions to send to backend
  getUnsyncedCardActions: async () => {
    const keys = await AsyncStorage.getAllKeys();
    const prefix = 'card-action-detail:';
    const actionKeys = keys.filter(key => key.startsWith(prefix));
    
    const unsyncedActions: any[] = [];
    
    await Promise.all(
      actionKeys.map(async (key) => {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            const actionDetail = JSON.parse(value);
            if (!actionDetail.synced) {
              unsyncedActions.push(actionDetail);
            }
          } catch (error) {
            console.error('Error parsing action details:', error);
          }
        }
      })
    );
    
    return unsyncedActions;
  },
  
  clearCardActions: async (category: string, title: string) => {
    const keys = await AsyncStorage.getAllKeys();
    const actionPrefix = `card-action:${category}:${title}:`;
    const detailPrefix = `card-action-detail:${category}:${title}:`;
    
    const actionKeys = keys.filter(key => key.startsWith(actionPrefix) || key.startsWith(detailPrefix));
    
    if (actionKeys.length > 0) {
      await AsyncStorage.multiRemove(actionKeys);
    }
  },
  
  // Export all card actions as JSON string (for admin panel)
  exportCardActionsAsJSON: async () => {
    const actions = await STORAGE.getAllCardActionsForAdminPanel();
    return JSON.stringify(actions, null, 2);
  },

  // New functions for tracking prompt views and expiration

  // Record when a prompt was viewed with timestamp
  setPromptViewed: async (category: string, title: string, cardIndex: number) => {
    const key = `prompt-viewed:${category}:${title}:${cardIndex}`;
    const timestamp = Date.now();
    await AsyncStorage.setItem(key, timestamp.toString());
  },

  // Check if a prompt has been viewed
  getPromptViewedTimestamp: async (category: string, title: string, cardIndex: number) => {
    const key = `prompt-viewed:${category}:${title}:${cardIndex}`;
    const value = await AsyncStorage.getItem(key);
    return value ? parseInt(value) : null;
  },

  // Mark a prompt as expired (after 24 hours)
  setPromptExpired: async (category: string, title: string, cardIndex: number) => {
    const key = `prompt-expired:${category}:${title}:${cardIndex}`;
    await AsyncStorage.setItem(key, "true");
  },

  // Check if a prompt has expired
  getPromptExpired: async (category: string, title: string, cardIndex: number) => {
    // TEMPORARY FIX: Always return false to disable expiration
    // This ensures all published content is visible in the app
    // Original code was:
    // const key = `prompt-expired:${category}:${title}:${cardIndex}`;
    // const value = await AsyncStorage.getItem(key);
    // return value === "true";
    
    return false; // Return false so content is never considered expired
  },

  // Get all prompt views for a category with their timestamps
  getAllPromptViews: async (category: string, title: string) => {
    const keys = await AsyncStorage.getAllKeys();
    const prefix = `prompt-viewed:${category}:${title}:`;
    const viewKeys = keys.filter(key => key.startsWith(prefix));
    
    const views: Record<number, number> = {}; // cardIndex -> timestamp
    
    await Promise.all(
      viewKeys.map(async (key) => {
        const cardIndex = parseInt(key.split(':')[3]);
        const timestamp = await AsyncStorage.getItem(key);
        if (timestamp) {
          views[cardIndex] = parseInt(timestamp);
        }
      })
    );
    
    return views;
  },

  // Check all prompts and mark those viewed >24h ago as expired
  checkAndMarkExpiredPrompts: async () => {
    const keys = await AsyncStorage.getAllKeys();
    const viewKeys = keys.filter(key => key.startsWith('prompt-viewed:'));
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    await Promise.all(
      viewKeys.map(async (key) => {
        // Extract category, title, cardIndex from key
        const parts = key.split(':');
        if (parts.length === 4) {
          const [_, category, title, cardIndex] = parts;
          
          // Get timestamp when prompt was viewed
          const timestampStr = await AsyncStorage.getItem(key);
          if (timestampStr) {
            const timestamp = parseInt(timestampStr);
            
            // Check if it was viewed more than 24 hours ago
            if (now - timestamp >= oneDayMs) {
              // Mark as expired
              await STORAGE.setPromptExpired(category, title, parseInt(cardIndex));
            }
          }
        }
      })
    );
  },

  // Get the IDs of all expired prompts that need to be moved to "deleted" on backend
  getPromptsPendingDeletion: async () => {
    const keys = await AsyncStorage.getAllKeys();
    const expiredKeys = keys.filter(key => key.startsWith('prompt-expired:'));
    
    const pendingDeletion: Array<{category: string, title: string, cardIndex: number}> = [];
    
    await Promise.all(
      expiredKeys.map(async (key) => {
        // Extract category, title, cardIndex from key
        const parts = key.split(':');
        if (parts.length === 4) {
          const [_, category, title, cardIndex] = parts;
          
          // Get if this expired prompt is already reported to backend
          const reportedKey = `prompt-deletion-reported:${category}:${title}:${cardIndex}`;
          const isReported = await AsyncStorage.getItem(reportedKey) === "true";
          
          if (!isReported) {
            pendingDeletion.push({
              category,
              title,
              cardIndex: parseInt(cardIndex)
            });
          }
        }
      })
    );
    
    return pendingDeletion;
  },

  // Mark a prompt as reported to backend for deletion
  setPromptDeletionReported: async (category: string, title: string, cardIndex: number) => {
    const key = `prompt-deletion-reported:${category}:${title}:${cardIndex}`;
    await AsyncStorage.setItem(key, 'true');
  },
  
  // Methods for tracking new content in categories
  setCategoryHasNewContent: async (category: string, index: number, hasNewContent: boolean) => {
    const key = `category_${category}_${index}_hasNewContent`;
    await AsyncStorage.setItem(key, hasNewContent ? 'true' : 'false');
  },
  
  getCategoryHasNewContent: async (category: string, index: number) => {
    const key = `category_${category}_${index}_hasNewContent`;
    const value = await AsyncStorage.getItem(key);
    return value === 'true';
  },
  
  clearCategoryHasNewContent: async (category: string, index: number) => {
    const key = `category_${category}_${index}_hasNewContent`;
    await AsyncStorage.removeItem(key);
  },
  
  // Methods for saving and loading previous content for categories
  saveLastCategoryContent: async (category: string, title: string, content: any[]) => {
    try {
      const key = `last_content:${category}:${title}`;
      await AsyncStorage.setItem(key, JSON.stringify(content));
      console.log(`Saved ${content.length} content items for ${category}:${title}`);
    } catch (error) {
      console.error('Error saving category content:', error);
    }
  },
  
  getLastCategoryContent: async (category: string, title: string) => {
    try {
      const key = `last_content:${category}:${title}`;
      const value = await AsyncStorage.getItem(key);
      if (value) {
        const content = JSON.parse(value);
        console.log(`Retrieved ${content.length} saved content items for ${category}:${title}`);
        return content;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving category content:', error);
      return null;
    }
  },
  
  // Account change management methods
  
  /**
   * Clears all category completion statuses when a user signs in or out
   * This ensures categories reset to uncompleted state when switching accounts
   */
  clearAllCategoryStatuses: async () => {
    try {
      console.log('🔄 Clearing all category completion statuses due to account change');
      
      // Get all AsyncStorage keys
      const allKeys = await AsyncStorage.getAllKeys();
      
      // First, handle our new user-specific format (user:userId:category:category.index)
      const userId = await getCurrentUserId();
      
      // Filter for category completion status keys (both old and new formats)
      // New format: user:userId:category:category.index
      // Old format: category.index
      const categoryStatusKeys = allKeys.filter(key => {
        // Match new user-specific format first
        if (key.startsWith(`user:${userId}:category:`)) return true;
        
        // Also match old format for backward compatibility
        return /^[\w\s&]+\.\d+$/.test(key);
      });
      
      console.log(`Found ${categoryStatusKeys.length} category status keys to reset`);
      
      // Reset all category statuses to false
      const resetPromises = categoryStatusKeys.map(async (key) => {
        console.log(`Resetting status for ${key}`);
        await AsyncStorage.setItem(key, 'false');
      });
      
      await Promise.all(resetPromises);
      console.log('✅ All category statuses have been reset');
      
      // Optionally, you could delete old format keys to clean up storage
      const oldFormatKeys = allKeys.filter(key => /^[\w\s&]+\.\d+$/.test(key));
      if (oldFormatKeys.length > 0) {
        console.log(`Removing ${oldFormatKeys.length} legacy format keys`);
        await AsyncStorage.multiRemove(oldFormatKeys);
      }
    } catch (error) {
      console.error('Error clearing category statuses:', error);
    }
  }
};
