import {
  View,
  StyleSheet,
  Platform,
  ScrollView,
  Dimensions,
  Text,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { observer } from "mobx-react-lite";
import React, { useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// components
import Header from "@/components/Header";
import ProgressBar from "@/components/ProgressBar";
import Footer from "@/components/Footer";
import Category from "@/components/Category";
import InfoPage from "@/components/InfoPage";
import SwipeableCardsPage from "@/components/SwipeableCardsPage";
import SettingsPage from "@/components/SettingsPage";
import LimitedTimeOfferModal from "@/components/LimitedTimeOfferModal";
import SubscriptionPageWithFreeTrial from "@/components/SubscriptionPageWithFreeTrial";
import SubscriptionPageWithoutFreeTrial from "@/components/SubscriptionPageWithoutFreeTrial";

// constants
import { Colors } from "@/constants/Colors";
import { horizontalScale, verticalScale, moderateScale } from "@/constants/Metrics";

// context
import {
  categoriesStore,
  limitedTimeOfferStore,
  offeringsStore,
  contentTypeStore,
} from "@/context/store";

// utils
import { STORAGE } from "@/utils/storage";
import { API } from "@/utils/api";

const { width } = Dimensions.get("screen");

function Main() {
  const scrollViewRef = useRef<any>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [checker, setChecker] = useState(false);
  const [subscribed, setSubscribed] = useState(true);
  const [freeTrialAvailable, setFreeTrialAvailable] = useState(false);

  const [infoBottomSheetVisible, setInfoBottomSheetVisible] =
    useState<boolean>(false);
  const [settingsBottomSheetVisible, setSettingsBottomSheetVisible] =
    useState<boolean>(false);

  const [limitedTimeOfferModalVisible, setLimitedTimeOfferModalVisible] =
    useState(false);

  const [activeTab, setActiveTab] = useState<string>(
    Object.keys(categoriesStore.categories)[0]
  );

  const [cardsPageTitle, setCardsPageTitle] = useState<string>("");
  const [cardsPageVisible, setCardsPageVisible] = useState<boolean>(false);
  
  // Store the selected category data to pass to SwipeableCardsPage
  const [selectedCategoryData, setSelectedCategoryData] = useState<any>(null);

  const [categoryDone, setCategoryDone] = useState<any[]>([]);

  const updateCategoryDone = async () => {
    try {
      console.log("==== Updating category completion status ====");
      const newCategoryDone = [];
      const activeType = contentTypeStore.activeContentType;
      
      if (!categoriesStore.categories || !categoriesStore.categories[activeType]) {
        console.log(`No categories found for active type: ${activeType}`);
        return;
      }
      
      // Get all category names for the active content type
      const categories = Object.keys(categoriesStore.categories[activeType]);
      
      // Track completed categories for progress calculation
      let completedCategories = 0;
      let totalCategories = categories.length;
      
      // Loop through each category and check if it's done
      for (const category of categories) {
        console.log(`Checking completion for category: ${category}`);
        
        // Variable to track if this entire category is completed
        let isCategoryCompleted = true;
        
        // For each category, check all subcategories (0-4)
        for (let i = 0; i < 5; i++) {
          try {
            // Get saved completion status from AsyncStorage - this is the source of truth
            const status = await STORAGE.getCategoryDone(category, i);
            
            // Get content for this category and index
            const categoryContent = categoriesStore.categories[category];
            const categoryKeys = Object.keys(categoryContent || {});
            const subcategoryId = categoryKeys[i];
            
            if (subcategoryId) {
              const content = categoryContent[subcategoryId]?.content || [];
              const hasContent = content.length > 0;
              const hasUnreadContent = content.some((item: any) => !item.read);
              
              console.log(`Category ${category}, subcategory ${i}: Has content=${hasContent}, Unread content=${hasUnreadContent}`);
              
              // For categories with no content, mark them as completed
              if (!hasContent && status !== "true") {
                console.log(`Empty category ${category}.${i} - marking as complete`);
                await STORAGE.setCategoryDone(category, i);
              }
              
              // If there is unread content, force NOT completed
              if (hasContent && hasUnreadContent && status === "true") {
                console.log(`Category ${category}.${i} has unread content - resetting completion`);
                await STORAGE.resetCategoryCompletion(category, i);
              }
            }
            
            // Get the updated status (may have been updated above)
            const updatedStatus = await STORAGE.getCategoryDone(category, i);
            newCategoryDone.push(updatedStatus);
            
            // If any subcategory is not complete, the whole category is not complete
            if (updatedStatus !== "true") {
              isCategoryCompleted = false;
            }
            
            // Report the final status
            console.log(`Final status for ${category}/${i}: ${updatedStatus}`);
          } catch (error) {
            console.error(`Error processing category ${category}.${i}:`, error);
            newCategoryDone.push("false"); // Default to not completed on error
            isCategoryCompleted = false;
          }
        }
        
        // If all subcategories are complete, count this category as complete
        if (isCategoryCompleted) {
          completedCategories++;
          console.log(`Category ${category} is FULLY COMPLETED`);
        }
      }
      
      // Calculate and log the progress
      const progressPercentage = totalCategories > 0 ? (completedCategories / totalCategories) * 100 : 0;
      console.log(`Progress calculation: ${completedCategories}/${totalCategories} = ${progressPercentage.toFixed(1)}%`);
      
      setCategoryDone(newCategoryDone);
      console.log("==== Category status update complete ====");
    } catch (error) {
      console.error("Error updating category completion status:", error);
    }
  };
  
  // Function to handle pull-to-refresh with enhanced content change detection
  const onRefresh = async () => {
    console.log('⏳ Pull-to-refresh triggered, checking for new content...');
    // Set refreshing state AFTER logging to ensure UI updates properly
    setRefreshing(true);
    
    try {
      // 1. Get previously saved content counts
      const lastSeenContentKey = 'app:last-seen-content-counts';
      let savedContentCounts: Record<string, number> = {};
      
      try {
        const savedContentStr = await AsyncStorage.getItem(lastSeenContentKey);
        if (savedContentStr) {
          savedContentCounts = JSON.parse(savedContentStr);
          console.log('📚 Retrieved previous content counts:', savedContentCounts);
        }
      } catch (error) {
        console.error('Error loading saved content counts:', error);
        // Continue even if there's an error loading saved counts
      }
      
      // 2. Record current content counts before refresh
      // Make a copy of the current categories to avoid losing them during refresh
      const existingCategories = { ...categoriesStore.categories };
      const categories = Object.keys(existingCategories);
      const preRefreshCounts: Record<string, number> = {};
      
      categories.forEach(category => {
        const categoryContent = existingCategories[category];
        let total = 0;
        
        if (categoryContent) {
          Object.keys(categoryContent).forEach(subCatId => {
            const content = categoryContent[subCatId]?.content || [];
            total += content.length;
          });
        }
        
        preRefreshCounts[category] = total;
        console.log(`Pre-refresh: ${category} has ${total} items`);
        
        // Compare with saved counts to detect possible new content
        const lastKnownCount = savedContentCounts[category] || 0;
        if (total > lastKnownCount) {
          console.log(`🔎 Possible new content in ${category} since last app run: ${lastKnownCount} -> ${total}`);
        }
      });

      // 3. Store current active categories before refresh for proper restoration
      const activeCategories = Object.keys(existingCategories);
      console.log(`💾 Saved ${activeCategories.length} active categories before refresh`);
      
      // Define refresh function with better error handling
      const refreshContent = async (contentType: string) => {
        console.log(`Refreshing content for content type: ${contentType}`);
        
        // IMPORTANT: Always ensure we have the original data preserved before attempting refresh
        const originalData = existingCategories[contentType];
        if (originalData) {
          // Make sure we have the category in the store to prevent UI disappearing
          categoriesStore.setCategory(contentType, originalData);
        }
        
        try {
          // Special case handling for "Wisdom & Learning" which uses hack content type
          let apiContentType = contentType;
          if (contentType === "Wisdom & Learning") {
            apiContentType = "hack";
            console.log(`Using content type 'hack' for '${contentType}'`);
          }
          
          const response = await API.getCategoriesByContentType(apiContentType);
          
          if (response && Object.keys(response).length > 0) {
            // Use proper MobX action to update the store
            categoriesStore.setCategory(contentType, response);
            console.log(`✅ Successfully refreshed ${contentType} with ${Object.keys(response).length} categories`);
            return response;
          } else {
            console.log(`⚠️ Received empty response for content type: ${contentType}`);
            
            // Keep existing data
            if (originalData) {
              console.log(`🔄 Keeping previous data for ${contentType}`);
              categoriesStore.setCategory(contentType, originalData);
            }
            return null;
          }
        } catch (error) {
          console.error(`❌ Error refreshing content type ${contentType}:`, error);
          
          // Keep existing data on error
          if (originalData) {
            console.log(`⚙️ Preserving previous data for ${contentType} after refresh error`);
            categoriesStore.setCategory(contentType, originalData);
          }
          return null;
        }
      };
      
      // 4. Refresh content for all previously active content types
      // First refresh the currently active content type
      const activeContentType = contentTypeStore.activeContentType;
      console.log(`🔝 First refreshing active content type: ${activeContentType}`);
      await refreshContent(activeContentType);
      
      // Then refresh any other content types that were active before
      const otherContentTypes = activeCategories.filter(type => type !== activeContentType);
      if (otherContentTypes.length > 0) {
        console.log(`🔝 Now refreshing ${otherContentTypes.length} other content types...`);
        for (const contentType of otherContentTypes) {
          await refreshContent(contentType);
        }
      }

      // 5. Calculate post-refresh content counts
      const refreshedCategories = Object.keys(categoriesStore.categories);
      console.log(`📋 After refresh: Found ${refreshedCategories.length} content types in store`);
      
      const postRefreshCounts: Record<string, number> = {};
      
      refreshedCategories.forEach(category => {
        if (!categoriesStore.categories[category]) {
          console.log(`Warning: Content type ${category} not found in store after refresh`);
          postRefreshCounts[category] = 0;
          return;
        }
        
        const categoryContent = categoriesStore.categories[category];
        let total = 0;
        
        if (categoryContent) {
          Object.keys(categoryContent).forEach(subCatId => {
            const content = categoryContent[subCatId]?.content || [];
            total += content.length;
          });
        }
        
        postRefreshCounts[category] = total;
        console.log(`Post-refresh: ${category} has ${total} items`);
      });
      
      // If we're missing any categories that were in the pre-refresh counts,
      // make sure they're included in post-refresh counts with 0 items
      categories.forEach(category => {
        if (postRefreshCounts[category] === undefined) {
          console.log(`Adding missing category ${category} to post-refresh counts with 0 items`);
          postRefreshCounts[category] = 0;
        }
      });

      // 6. Detect content changes by comparing counts
      let hasNewContent = false;
      
      for (const category of categories) {
        const lastKnownCount = savedContentCounts[category] || 0;
        const freshCount = postRefreshCounts[category];
        
        // Content is new if count increased from either pre-refresh or last saved
        if (freshCount > preRefreshCounts[category] || (freshCount > lastKnownCount && freshCount > 0)) {
          hasNewContent = true;
          console.log(`🆕 NEW CONTENT DETECTED in ${category}!`);
          console.log(`Pre-refresh: ${preRefreshCounts[category]}, Post-refresh: ${freshCount}, Last saved: ${lastKnownCount}`);

          // Reset completion status for all subcategories
          const categoryContent = categoriesStore.categories[category];
          if (categoryContent) {
            Object.keys(categoryContent).forEach(async (subCatId, index) => {
              try {
                const subCatNum = parseInt(subCatId.split('-')[1] || index.toString());
                await STORAGE.resetCategoryCompletion(category, subCatNum);
                console.log(`✅ Reset completion status for ${category}.${subCatNum} due to new content`);
              } catch (e) {
                console.error(`Error resetting category ${category}: ${e}`);
              }
            });
          }
        }
      }

      // 7. Save the updated content counts
      try {
        await AsyncStorage.setItem(lastSeenContentKey, JSON.stringify(postRefreshCounts));
        console.log('💾 Saved new content counts to storage for future comparison');
      } catch (error) {
        console.error('Error saving content counts:', error);
      }
      
      // Check for content changes between pre-refresh and post-refresh
      Object.keys(postRefreshCounts).forEach(category => {
        const preCount = preRefreshCounts[category] || 0;
        const postCount = postRefreshCounts[category] || 0;
        
        if (postCount > preCount) {
          console.log(`🔍 NEW CONTENT DETECTED in ${category}: ${preCount} -> ${postCount}`);
        } else if (postCount < preCount) {
          console.log(`⚠️ Content REMOVED from ${category}: ${preCount} -> ${postCount}`);
        }
      });
      
      if (!hasNewContent) {
        console.log('ℹ️ No content changes detected during refresh');
      }
      
      // Update category completion status after refresh
      await updateCategoryDone();
      
      // Log completion of refresh operation
      console.log('✅ Refresh operation completed successfully');
    } catch (error) {
      console.error('❌ Error during refresh:', error);
    } finally {
      // CRITICAL: Always ensure refreshing state is reset
      // This keeps UI from disappearing permanently
      console.log('🔄 Resetting refresh state');
      setRefreshing(false);
    }
  };

  useEffect(() => {
    updateCategoryDone();
  }, [activeTab]);
  
  // When returning from a cards page, refresh to see if any categories were completed
  useEffect(() => {
    if (!cardsPageVisible && selectedCategoryData) {
      console.log('Returning from cards page, checking for completed categories');
      updateCategoryDone();
    }
  }, [cardsPageVisible]);
  

  const getCustomerInfo = async () => {
    console.log("DEBUG: getCustomerInfo called, setting subscribed to true");
    setSubscribed(true);
    return null;
  };

  const checkTrialEligibility = async () => {
    // Placeholder for future IAP implementation
    return false;
  };

  const restorePurchases = async () => {
    // Placeholder for future IAP implementation
    return null;
  };

  const purchasePackage = async () => {
    // Placeholder for future IAP implementation
    return null;
  };

  const handleLimitedTimeOffer = async () => {
    // Placeholder for future IAP implementation
    return null;
  };

  useEffect(() => {
    console.log("DEBUG: Main component mounted");
    
    // Initialize app and check for content changes on startup
    const initializeApp = async () => {
      try {
        // Standard initialization
        handleLimitedTimeOffer();
        getCustomerInfo();
        
        // CRITICAL: Force check for content changes on startup
        console.log('🔍 Checking for content changes on app startup...');
        
        // Check for stored last-seen content counts
        const lastSeenContentKey = 'app:last-seen-content-counts';
        const lastSeenContentStr = await AsyncStorage.getItem(lastSeenContentKey);
        let lastSeenContent: Record<string, number> = {};
        
        if (lastSeenContentStr) {
          try {
            lastSeenContent = JSON.parse(lastSeenContentStr);
            console.log('Found previously saved content counts:', lastSeenContent);
          } catch (e) {
            console.error('Error parsing stored content counts:', e);
          }
        }
        
        // Trigger an immediate content refresh
        if (contentTypeStore.activeContentType) {
          console.log('Fetching initial content for:', contentTypeStore.activeContentType);
          const categoriesData = await API.getCategoriesByContentType(contentTypeStore.activeContentType);
          categoriesStore.update(categoriesData);
          
          // Now check if content has changed since last app run
          const currentContentCounts: Record<string, number> = {};
          let hasContentChanged = false;
          
          // Calculate current content counts
          Object.keys(categoriesStore.categories).forEach(category => {
            const categoryContent = categoriesStore.categories[category];
            let total = 0;
            
            Object.keys(categoryContent || {}).forEach(subCatId => {
              const content = categoryContent[subCatId]?.content || [];
              total += content.length;
            });
            
            currentContentCounts[category] = total;
            console.log(`App startup: ${category} has ${total} content items`);
            
            // Check if this category has new content compared to last run
            if (total > (lastSeenContent[category] || 0)) {
              hasContentChanged = true;
              console.log(`🆕 NEW CONTENT found in ${category}! Previous: ${lastSeenContent[category] || 0}, Current: ${total}`);
              
              // Force reset all subcategories in this category
              Object.keys(categoryContent || {}).forEach(async (subCatId, index) => {
                const subCatIndex = parseInt(subCatId.split('-')[1] || index.toString());
                await STORAGE.resetCategoryCompletion(category, subCatIndex);
                console.log(`Reset status for ${category}.${subCatIndex} due to new content since last app run`);
              });
            }
          });
          
          // Save current content counts for next comparison
          await AsyncStorage.setItem(lastSeenContentKey, JSON.stringify(currentContentCounts));
          
          if (hasContentChanged) {
            console.log('✅ New content detected on app startup! Categories have been reset.');
          } else {
            console.log('ℹ️ No content changes detected since last app run');
          }
          
          // Update status display to reflect any resets
          await updateCategoryDone();
        }
      } catch (error) {
        console.error('Error during app initialization:', error);
      }
    };
    
    initializeApp();
  }, []);

  const purchaseFreeTrial = async () => {
    // Placeholder for future IAP implementation
    return null;
  };

  const purchaseMonthly = async () => {
    // Placeholder for future IAP implementation
    return null;
  };

  const purchaseAnnual = async () => {
    // Placeholder for future IAP implementation
    return null;
  };

  useEffect(() => {
    setChecker(!checker);
  }, [offeringsStore.offerings, subscribed, freeTrialAvailable]);

  if (!subscribed && freeTrialAvailable) {
    return (
      <GestureHandlerRootView>
        <SubscriptionPageWithFreeTrial
          purchase={purchaseFreeTrial}
          pricePerWeek={
            offeringsStore.offerings.all.default.weekly.product
              .pricePerWeekString
          }
          restorePurchases={restorePurchases}
        />
      </GestureHandlerRootView>
    );
  } else if (!subscribed) {
    <GestureHandlerRootView>
      <SubscriptionPageWithoutFreeTrial
        weeklyPricePerWeek={
          offeringsStore.offerings.all.default.weekly?.product
            .pricePerWeekString
        }
        weeklyPricePerYear={
          offeringsStore.offerings.all.default.weekly?.product
            .pricePerYearString
        }
        annualPricePerWeek={
          offeringsStore.offerings.all.default.annual?.product
            .pricePerWeekString
        }
        annualPricePerYear={
          offeringsStore.offerings.all.default.annual?.product
            .pricePerYearString
        }
        purchaseWeekly={purchaseMonthly}
        purchaseAnnual={purchaseAnnual}
        restorePurchases={restorePurchases}
      />
    </GestureHandlerRootView>;
  } else if (subscribed) {
    const categories = Object.keys(categoriesStore.categories);
    
    console.log(`DEBUG: Main - Current categories: ${categories.join(', ')}`);

    const setActiveTabFooter = (value: string) => {
      console.log(`DEBUG: Main - Setting active tab to: ${value}`);
      // We don't need to scroll horizontally anymore, just update the UI
      setActiveTab(value);
    };

    return (
      <GestureHandlerRootView style={styles.container}>
        <Header
          onPressInfo={() => {
            if (settingsBottomSheetVisible === false) {
              setInfoBottomSheetVisible(true);
            }
          }}
          onPressSettings={() => {
            if (infoBottomSheetVisible === false) {
              setSettingsBottomSheetVisible(true);
            }
          }}
        />

        <ProgressBar 
          completedCount={9} // Using default value from logs until we can calculate it properly
          totalCount={12} // Using default value from logs until we can calculate it properly
        />

        <ScrollView
          ref={scrollViewRef}
          style={[styles.contentContainer, refreshing && styles.refreshingContent]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.white}
              colors={[Colors.white]}
              progressBackgroundColor={Colors.black}
            />
          }
        >
          {categories && categories.length > 0 ? (
            <View style={styles.allCategoriesContainer}>
              {/* Display all categories as a flat list */}
              {(() => {
                let allCategoryItems: JSX.Element[] = [];
                let itemIndex = 0;
                
                // Flatten the categories into a single list
                categories.forEach((category, categoryIndex) => {
                  if (!categoriesStore.categories[category]) {
                    return;
                  }
                  
                  const categoryKeys = Object.keys(categoriesStore.categories[category] || {});
                  
                  // Display up to 5 items (or fewer if there aren't that many)
                  categoryKeys.slice(0, 5).forEach((key, i) => {
                    const categoryItem = categoriesStore.categories[category][key];
                    
                    if (!categoryItem || !categoryItem.name) {
                      return;
                    }
                    
                    allCategoryItems.push(
                      <Category
                        key={`item-${itemIndex}`}
                        index={i}
                        categoryName={category}
                        completed={categoryDone[categoryIndex * 5 + i] || "false"}
                        title={categoryItem.name}
                        onPressCategory={() => {
                          setInfoBottomSheetVisible(false);
                          setSettingsBottomSheetVisible(false);
                          setCardsPageVisible(true);
                          console.log(`DEBUG: Selected category: ${category}, item: ${key}, name: ${categoryItem.name}`);
                          
                          // Log detailed information to help debug
                          console.log(`DEBUG: Category details - MongoDB ID: ${key}`);
                          console.log(`DEBUG: Content type: ${contentTypeStore.activeContentType}`);
                          console.log(`DEBUG: Full category data:`, categoryItem);
                          
                          // Make sure we're passing the MongoDB ObjectId as the key instead of the index
                          setCardsPageTitle(key);
                          setSelectedCategoryData({
                            ...categoryItem,
                            id: key, // Ensure the ID is passed correctly
                            categoryName: category
                          });
                        }}
                      />
                    );
                    itemIndex++;
                  });
                });
                
                return allCategoryItems;
              })()}
            </View>
          ) : (
            <View style={styles.pageContainer}>
              <Text style={{ 
                color: Colors.white, 
                textAlign: 'center',
                fontFamily: "SFProMedium",
                fontSize: moderateScale(16),
                padding: horizontalScale(20)
              }}>
                All the content is finished for today, comeback tomorrow!
              </Text>
            </View>
          )}
        </ScrollView>

        <Footer activeTab={activeTab} setActiveTab={setActiveTabFooter} />

        {infoBottomSheetVisible && (
          <InfoPage closeBottomSheet={() => setInfoBottomSheetVisible(false)} />
        )}

        {settingsBottomSheetVisible && (
          <SettingsPage
            closeBottomSheet={() => setSettingsBottomSheetVisible(false)}
          />
        )}

        {cardsPageVisible && selectedCategoryData && (
          <SwipeableCardsPage
            checkCategoryDone={async () => await updateCategoryDone()}
            category={selectedCategoryData.categoryName || activeTab}
            title={selectedCategoryData.id || cardsPageTitle}
            cardsPageVisible={cardsPageVisible}
            close={() => {
              setCardsPageVisible(false);
              setSelectedCategoryData(null);
              console.log("DEBUG: Closed SwipeableCardsPage");
            }}
            contentType={contentTypeStore.activeContentType}
          />
        )}

        {limitedTimeOfferModalVisible && (
          <LimitedTimeOfferModal
            weeklyPricePerWeek={
              offeringsStore.offerings.all.default.weekly?.product
                .pricePerWeekString
            }
            weeklyPricePerYear={
              offeringsStore.offerings.all.default.weekly?.product
                .pricePerYearString
            }
            annualPricePerWeek={
              offeringsStore.offerings.all.sale.annual?.product
                .pricePerWeekString
            }
            annualPricePerYear={
              offeringsStore.offerings.all.sale.annual?.product
                .pricePerYearString
            }
            limitedTimeOfferModalVisible={limitedTimeOfferModalVisible}
            close={async () => setLimitedTimeOfferModalVisible(false)}
          />
        )}
      </GestureHandlerRootView>
    );
  }
}

export default observer(Main);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: Colors.black,
  },

  contentContainer: { 
    backgroundColor: Colors.black,
    flex: 1,
  },
  
  // Style to maintain visibility during refresh
  refreshingContent: {
    backgroundColor: Colors.black,
    opacity: 0.9, // Keep content visible but slightly dimmed during refresh
  },

  pageContainer: {
    padding: horizontalScale(20),
    paddingVertical: verticalScale(20),
  },

  categoryTitle: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(22),
    marginBottom: verticalScale(15),
    marginTop: verticalScale(5),
  },

  allCategoriesContainer: {
    padding: horizontalScale(20),
    paddingBottom: verticalScale(30),
  },

  categorySection: {
    marginBottom: verticalScale(20),
    paddingTop: verticalScale(5),
    paddingBottom: verticalScale(5),
  },
});
