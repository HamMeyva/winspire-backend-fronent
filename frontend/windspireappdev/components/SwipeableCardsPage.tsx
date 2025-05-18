import {
  View,
  Text,
  ScrollView,
  Modal,
  StyleSheet,
  Pressable,
  Dimensions,
  Share,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import * as StoreReview from "expo-store-review";
import { categoriesStore } from "@/context/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// components
import CardsContainer from "@/components/CardsContainer";

// constants
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from "@/constants/Metrics";
import { Colors } from "@/constants/Colors";

// utils
import { STORAGE } from "@/utils/storage";
import { API } from "@/utils/api";

const { width } = Dimensions.get("screen");

export default function SwipeableCardsPage({
  title,
  category,
  cardsPageVisible,
  close,
  checkCategoryDone,
  contentType,
}: {
  title: string;
  category: string;
  cardsPageVisible: boolean;
  close: () => void;
  checkCategoryDone: () => void;
  contentType: string;
}) {
  const scrollViewRef = useRef<any>(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [showPageNumberContainer, setShowPageNumberContainer] = useState(false);
  
  // Track card statuses
  const [cardActions, setCardActions] = useState<Record<number, 'like' | 'dislike' | 'maybe'>>({});
  const [filterMode, setFilterMode] = useState<'all' | 'like' | 'dislike' | 'maybe'>('all');
  const [filteredCardIndices, setFilteredCardIndices] = useState<number[]>([]);
  
  // State for backend content
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // State for current category title in header
  const [categoryTitle, setCategoryTitle] = useState<string>("");
  // Track subcategory ID
  const [subCategoryId, setSubCategoryId] = useState<number>(0);
  // State for modals
  const [showRateModal, setShowRateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (showPageNumberContainer === false) {
      setShowPageNumberContainer(true);

      setTimeout(() => {
        setShowPageNumberContainer(false);
      }, 5000);
    }
  }, [pageNumber]);

  // Load card actions on mount
  useEffect(() => {
    const loadCardActions = async () => {
      const actions = await STORAGE.getAllCardActions(category, title);
      setCardActions(actions);
      updateFilteredCards(actions, filterMode);
    };
    
    loadCardActions();
  }, [category, title]);
  
  // Constants for prompt limits and behavior
  const MAX_PROMPTS_PER_CATEGORY = 10; // Show maximum 10 prompts per category
  
  // Fetch content from backend with limit
  useEffect(() => {
    // Parse the subcategory ID from title
    const parsedSubcategoryId = parseInt(title.split('-')[1] || '0');
    setSubCategoryId(parsedSubcategoryId);
    
    const fetchContent = async () => {
      setLoading(true);
      try {
        // First get the MongoDB ObjectId for this category from the categories store
        // This is critical for properly fetching content by category ID
        let categoryId = '';
        let categoryObj = null;
        
        if (categoriesStore.categories && categoriesStore.categories[category]) {
          console.log(`🔍 SwipeableCardsPage - Looking up MongoDB ID for ${category}...`);
          const categoryData = categoriesStore.categories[category];
          
          // Search for MongoDB ObjectId in the category object
          for (const subCatKey in categoryData) {
            if (categoryData[subCatKey] && categoryData[subCatKey]._id) {
              categoryId = categoryData[subCatKey]._id;
              categoryObj = categoryData[subCatKey];
              break;
            }
          }
        }
        
        // Fallback to using the title if we couldn't find a MongoDB ID
        if (!categoryId) {
          console.warn(`⚠️ Warning: Could not find MongoDB _id for category ${category}, using title as fallback`);
          categoryId = title;
        } else {
          console.log(`✅ Found MongoDB _id for category ${category}: ${categoryId}`);
        }
        
        console.log(`📈 Fetching content for category: ${category} (ID: ${categoryId}, subCategoryId: ${parsedSubcategoryId})`);
        
        // Check previously saved content count for detecting new content
        const previousContentString = await STORAGE.getLastCategoryContent(category, title);
        let savedContent = [];
        let previousContentCount = 0;
        
        if (previousContentString) {
          try {
            // Make sure we validate the string before parsing
            if (typeof previousContentString === 'string' && 
                previousContentString.trim().startsWith('[') && 
                previousContentString.trim().endsWith(']')) {
              
              savedContent = JSON.parse(previousContentString);
              if (Array.isArray(savedContent)) {
                previousContentCount = savedContent.length;
                console.log(`📝 Found previously saved content (${previousContentCount} items) for ${category}`);
              } else {
                console.log(`Invalid saved content format for ${category} - expected array`);
                savedContent = [];
              }
            } else {
              console.log(`Invalid saved content string format for ${category}`);
            }
          } catch (e) {
            console.error(`Error parsing saved content: ${e}`);
            // Ensure savedContent is a valid array on parse error
            savedContent = [];
          }
        }
        
        // Call the enhanced API to get current content and auto-detect changes
        // Pass category name and subcategory index for robust content change detection
        const contentData = await API.getContentByCategory(
          categoryId,
          contentType,
          "published",
          category,           // Pass category name for better change detection
          parsedSubcategoryId // Pass subcategory index for better change detection
        );
        console.log(`🔄 API response: ${contentData ? contentData.length : 0} items for ${category}`);
        
        // Content detection now happens inside API.getContentByCategory
        // The API method will automatically reset categories when content changes
        if (contentData && contentData.length > 0) {
          // Still log content stats for transparency
          console.log(`Content stats for ${category}.${parsedSubcategoryId}: ${contentData.length} items, Previously had ${previousContentCount} items`);
          
          // Limit content to MAX_PROMPTS_PER_CATEGORY (10)
          const limitedContentData = contentData.slice(0, MAX_PROMPTS_PER_CATEGORY);
          console.log(`DEBUG: SwipeableCardsPage - Limiting content to ${limitedContentData.length} items out of ${contentData.length} total`);
          
          // Use all content regardless of expiration status
          console.log(`DEBUG: SwipeableCardsPage - Using all ${limitedContentData.length} content items for category ${category}`);
          
          // Mark content as viewed when it's displayed
          for (let i = 0; i < limitedContentData.length; i++) {
            // Store in MobX store for reference - Mark as viewed in the store
            try {
              if (categoriesStore.categories && 
                  categoriesStore.categories[category] && 
                  categoriesStore.categories[category][title] && 
                  categoriesStore.categories[category][title].content && 
                  i < categoriesStore.categories[category][title].content.length) {
                
                // Mark content item as visible but not necessarily read
                // We'll mark it as read after the user actually sees it
                categoriesStore.categories[category][title].content[i].visible = true;
              }
            } catch (error) {
              console.error('Error updating content visibility in store:', error);
            }
            
            // Track that this prompt has been viewed
            STORAGE.setPromptViewed(category, title, i);
            
            // Mark the content item as read using our centralized function
            if (limitedContentData[i]) {
              // This awaits the markContentAsRead operation to ensure completion
              await markContentAsRead(limitedContentData[i]);
            }
          }
          
          // Save the content to local storage for future use
          await STORAGE.saveLastCategoryContent(category, title, limitedContentData);
          
          // Update UI with content
          setContentItems(limitedContentData);
          
          // Force refresh status in parent component to reflect any changes
          if (checkCategoryDone) {
            checkCategoryDone();
          }
        } else {
          console.log(`DEBUG: SwipeableCardsPage - No new content found for category ${category}, trying to load previous content`);
          try {
            // Try to load previously saved content for this category (already loaded above)
            if (savedContent && savedContent.length > 0) {
              console.log(`DEBUG: SwipeableCardsPage - Found saved content (${savedContent.length} items) for ${category}`);
              setContentItems(savedContent);
            } else {
              console.log(`DEBUG: SwipeableCardsPage - No saved content found for category ${category}`);
              // Mark this category as completed
              await STORAGE.setCategoryDone(category, parsedSubcategoryId);
              console.log(`DEBUG: Marking category ${category} with subCategoryId ${parsedSubcategoryId} as done`);
              
              // Instead of closing, set content to show the message
              setContentItems([{
                body: `All content for "${categoryTitle || category}" is finished for today, comeback tomorrow!`,
                summary: "Content Finished",
                title: `No Content Available for ${categoryTitle || category}`,
                read: true // Mark as read so it doesn't affect completion status
              }]);
            }
            
            // Force reload category completion status to refresh the UI
            if (checkCategoryDone) {
              checkCategoryDone();
            }
          } catch (error) {
            console.error('Error handling no content case:', error);
          }
        }
        
        // Run check for expired prompts in the background
        STORAGE.checkAndMarkExpiredPrompts();
        // Kimlik doğrulama hatası olduğu için devre dışı bırakıldı
        // API.reportExpiredPrompts();
      } catch (error: any) {
        console.error(`DEBUG: SwipeableCardsPage - Error fetching content:`, error);
        // Set an error message content item
        setContentItems([{
          body: `İçerik yüklenirken bir hata oluştu. Hata mesajı: ${error.message || "Bilinmeyen hata"}. Lütfen internet bağlantınızı kontrol edip tekrar deneyiniz.\n\nTeknik bilgi: Kategori=${category}, İçerik Türü=${contentType}, ID=${title}`,
          summary: `İçerik yüklenirken hata oluştu.`,
          title: `Hata`
        }]);
      } finally {
        setLoading(false);
      }
    };
    
    if (category && contentType && title) {
      console.log(`DEBUG: SwipeableCardsPage - Required parameters present: category=${category}, contentType=${contentType}, title=${title}`);
      fetchContent();
    } else {
      console.log(`DEBUG: SwipeableCardsPage - Missing required parameter: category=${category}, contentType=${contentType}, title=${title}`);
      setLoading(false);
      setContentItems([{
        body: `Eksik parametreler: ${!category ? 'Kategori, ' : ''}${!contentType ? 'İçerik Türü, ' : ''}${!title ? 'Kategori ID' : ''}`,
        summary: `Eksik parametreler nedeniyle içerik yüklenemedi.`,
        title: `Parametre Hatası`
      }]);
    }
  }, [category, contentType, title]);
  
  // Load category title
  useEffect(() => {
    try {
      if (categoriesStore.categories && 
          categoriesStore.categories[category] && 
          categoriesStore.categories[category][title] && 
          categoriesStore.categories[category][title].name) {
        setCategoryTitle(categoriesStore.categories[category][title].name);
      } else {
        // Try to find the title from category keys
        if (categoriesStore.categories && categoriesStore.categories[category]) {
          const keys = Object.keys(categoriesStore.categories[category]);
          if (keys.length > 0 && parseInt(title) < keys.length) {
            const key = keys[parseInt(title)];
            if (categoriesStore.categories[category][key] && 
                categoriesStore.categories[category][key].name) {
              setCategoryTitle(categoriesStore.categories[category][key].name);
            } else {
              setCategoryTitle("Content");
            }
          } else {
            setCategoryTitle("Content");
          }
        } else {
          setCategoryTitle("Content");
        }
      }
    } catch (error) {
      console.error("Error setting category title:", error);
      setCategoryTitle("Content");
    }
  }, [category, title]);
  
  // Update filtered cards when filter mode changes
  const updateFilteredCards = (actions: Record<number, 'like' | 'dislike' | 'maybe'>, mode: 'all' | 'like' | 'dislike' | 'maybe') => {
    if (mode === 'all') {
      setFilteredCardIndices([]);
      return;
    }
    
    try {
      const indices = Object.entries(actions)
        .filter(([_, action]) => action === mode)
        .map(([index]) => parseInt(index));
        
      setFilteredCardIndices(indices);
    } catch (error) {
      console.error('Error updating filtered cards:', error);
      setFilteredCardIndices([]);
    }
  };
  
  // Helper function to mark content as read - centralized to avoid code duplication
  const markContentAsRead = async (contentItem: any) => {
    if (!contentItem) return;
    
    try {
      const contentId = contentItem._id || contentItem.id;
      if (!contentId) return;
      
      const contentKey = `content:read:${category}:${contentId}`;
      await AsyncStorage.setItem(contentKey, "true");
      console.log(`✅ Marked content ${contentId} as read for category ${category}`);
      
      // Force category check to update UI after marking as read
      if (checkCategoryDone) {
        checkCategoryDone();
      }
    } catch (error) {
      console.error('Error marking content as read:', error);
    }
  };
  
  // Listen for changes to card actions
  useEffect(() => {
    const checkForCardStatusChanges = async () => {
      const actions = await STORAGE.getAllCardActions(category, title);
      if (JSON.stringify(actions) !== JSON.stringify(cardActions)) {
        setCardActions(actions);
        updateFilteredCards(actions, filterMode);
      }
    };
    
    const intervalId = setInterval(checkForCardStatusChanges, 1000);
    return () => clearInterval(intervalId);
  }, [cardActions, filterMode]);

  const getCards = () => {
    // Show loading indicator
    if (loading) {
      return [
        <View key="loading" style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.white} />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      ];
    }
    
    // If we have content items from the backend, use those
    if (contentItems.length > 0) {
      const cards = contentItems.map((item, index) => (
        <CardsContainer
          key={index}
          text={item.body || item.summary || "No content available"}
          category={category}
          title={title}
          cardIndex={index}
          onSwipeComplete={() => {
            // Check if there are more cards to show
            if (pageNumber < contentItems.length) {
              scrollViewRef.current.scrollTo({
                x: width * pageNumber,
                y: 0,
                animated: true,
              });
            }
          }}
        />
      ));
      
      // Apply filtering if needed
      if (filterMode !== 'all' && filteredCardIndices.length > 0) {
        return filteredCardIndices.map(index => {
          const card = cards[index];
          return React.cloneElement(card, {
            onSwipeComplete: () => {
              const currentFilteredIndex = filteredCardIndices.indexOf(index);
              if (currentFilteredIndex < filteredCardIndices.length - 1) {
                scrollViewRef.current.scrollTo({
                  x: width * (currentFilteredIndex + 1),
                  y: 0,
                  animated: true,
                });
              }
            }
          });
        });
      }
      
      return cards;
    }
    
    // Fallback to using stored content if backend content isn't available
    try {
      if (!categoriesStore.categories[category] || !categoriesStore.categories[category][title]) {
        // Return a placeholder card if data is missing
        return [
          <CardsContainer
            key={0}
            text="No content available for this category"
            category={category}
            title={title}
            cardIndex={0}
            onSwipeComplete={() => {}}
          />
        ];
      }
      
      const data = categoriesStore.categories[category][title];
      
      let cards = [];
      
      if (data.manual) {
        const manualCount = data.manualCount;
  
        cards = Object.keys(data.texts[manualCount]).map((_, index) => (
          <CardsContainer
            key={index}
            text={decodeURIComponent(data.texts[manualCount][index.toString()])}
            category={category}
            title={title}
            cardIndex={index}
            onSwipeComplete={() => {
              // Check if there are more cards to show
              const maxPages = Object.keys(data.texts[manualCount]).length;
              if (pageNumber < maxPages) {
                scrollViewRef.current.scrollTo({
                  x: width * pageNumber,
                  y: 0,
                  animated: true,
                });
              }
            }}
          />
        ));
      } else if (data.texts && Array.isArray(data.texts)) {
        cards = data.texts.map((text: string, index: number) => (
          <CardsContainer 
            key={index} 
            text={decodeURIComponent(text)} 
            category={category}
            title={title}
            cardIndex={index}
            onSwipeComplete={() => {
              // Check if there are more cards to show
              const maxPages = data.texts.length;
              if (pageNumber < maxPages) {
                scrollViewRef.current.scrollTo({
                  x: width * pageNumber,
                  y: 0,
                  animated: true,
                });
              }
            }}
          />
        ));
      } else {
        // Return a placeholder card if data is missing or in unexpected format
        return [
          <CardsContainer
            key={0}
            text="No content available for this category"
            category={category}
            title={title}
            cardIndex={0}
            onSwipeComplete={() => {}}
          />
        ];
      }
      
      // Apply filtering if needed
      if (filterMode !== 'all' && filteredCardIndices.length > 0) {
        return filteredCardIndices.map(index => {
          const card = cards[index];
          // We need to clone the element to add the onSwipeComplete prop with the correct index
          return React.cloneElement(card, {
            onSwipeComplete: () => {
              const currentFilteredIndex = filteredCardIndices.indexOf(index);
              if (currentFilteredIndex < filteredCardIndices.length - 1) {
                scrollViewRef.current.scrollTo({
                  x: width * (currentFilteredIndex + 1),
                  y: 0,
                  animated: true,
                });
              }
            }
          });
        });
      }
      
      return cards;
    } catch (error) {
      console.error("Error rendering cards:", error);
      // Return a placeholder card if there's an error
      return [
        <CardsContainer
          key={0}
          text="There was an error loading content"
          category={category}
          title={title}
          cardIndex={0}
          onSwipeComplete={() => {}}
        />
      ];
    }
  };

  const getDots = () => {
    // If we have content items from the backend, use their length
    if (contentItems.length > 0) {
      // Show filtered page count if filtering is active
      if (filterMode !== 'all' && filteredCardIndices.length > 0) {
        return filteredCardIndices.map((_, index) => (
          <View
            key={index}
            style={[
              styles.footerDot,
              {
                backgroundColor:
                  pageNumber === index + 1 ? Colors.lightGray : Colors.white,
              },
            ]}
          />
        ));
      }
      
      return Array.from({ length: contentItems.length }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.footerDot,
            {
              backgroundColor:
                pageNumber === index + 1 ? Colors.lightGray : Colors.white,
            },
          ]}
        />
      ));
    }
    
    // Fallback to using stored content if backend content isn't available
    try {
      if (!categoriesStore.categories[category] || !categoriesStore.categories[category][title]) {
        return [
          <View
            key={0}
            style={[
              styles.footerDot,
              { backgroundColor: Colors.lightGray },
            ]}
          />
        ];
      }
      
      const data = categoriesStore.categories[category][title];
      
      if (filterMode !== 'all' && filteredCardIndices.length > 0) {
        return filteredCardIndices.map((_, index) => (
          <View
            key={index}
            style={[
              styles.footerDot,
              {
                backgroundColor:
                  pageNumber === index + 1 ? Colors.lightGray : Colors.white,
              },
            ]}
          />
        ));
      }
      
      let maxPages = 1;
      
      if (data.manual && data.texts && data.texts[data.manualCount]) {
        maxPages = Object.keys(data.texts[data.manualCount]).length;
      } else if (data.texts && Array.isArray(data.texts)) {
        maxPages = data.texts.length;
      }
      
      return Array.from({ length: maxPages }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.footerDot,
            {
              backgroundColor:
                pageNumber === index + 1 ? Colors.lightGray : Colors.white,
            },
          ]}
        />
      ));
    } catch (error) {
      console.error("Error rendering dots:", error);
      return [
        <View
          key={0}
          style={[
            styles.footerDot,
            { backgroundColor: Colors.lightGray },
          ]}
        />
      ];
    }
  };

  const updateCategoryDone = async () => {
    const value = await STORAGE.getReviewShown();

    if (value === null) {
      const categories = Object.keys(categoriesStore.categories);
      const promises = [];

      for (let category of categories) {
        for (let i = 0; i < 5; i++) {
          promises.push(STORAGE.getCategoryDone(category, i));
        }
      }

      const results = await Promise.all(promises);
      const doneCount = results.filter((val) => val === "true").length;

      const totalItems = categories.length * 5;
      const percentage = (doneCount / totalItems) * 100;

      if (percentage >= 100) {
        if (await StoreReview.hasAction()) {
          const isAvailable = await StoreReview.isAvailableAsync();

          if (isAvailable) {
            StoreReview.requestReview()
              .then(async () => {
                await STORAGE.setReviewShown();

                console.log("Review requested successfully!");
              })
              .catch((error) => {
                console.error("Error requesting review:", error);
              });
          }
        }
      }
    }
  };

  useEffect(() => {
    updateCategoryDone();

    const intervalId = setInterval(() => {
      updateCategoryDone();
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Modal animationType="slide" visible={cardsPageVisible}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Ionicons
            onPress={close}
            name="close-sharp"
            size={moderateScale(32)}
            color={Colors.white}
          />

          <Text 
            style={styles.headerTitle}
            numberOfLines={1}
            ellipsizeMode="tail">
            {categoryTitle}
          </Text>

          <Entypo
            onPress={async () => {
              try {
                let message = "No content to share";
                
                if (contentItems.length > 0 && pageNumber <= contentItems.length) {
                  const item = contentItems[pageNumber - 1];
                  message = item.body || item.summary || "Content from Winspire App";
                } else if (categoriesStore.categories[category] && 
                          categoriesStore.categories[category][title]) {
                  const data = categoriesStore.categories[category][title];
                  
                  if (data.manual && data.texts && data.texts[data.manualCount] && 
                      data.texts[data.manualCount][pageNumber - 1]) {
                    message = decodeURIComponent(
                      data.texts[data.manualCount][pageNumber - 1]
                    );
                  } else if (data.texts && Array.isArray(data.texts) && 
                            data.texts[pageNumber - 1]) {
                    message = decodeURIComponent(data.texts[pageNumber - 1]);
                  }
                }
                
                await Share.share({
                  message: message + "\n\n" + "via Winspire App: www.winspire.app"
                });
              } catch (error) {
                console.error("Error sharing content:", error);
              }
            }}
            name="share"
            size={moderateScale(28)}
            color={Colors.white}
          />
        </View>

        {/* Card Filter Tabs */}
        <View style={styles.filterTabsContainer}>
          <TouchableOpacity
            onPress={() => {
              setFilterMode('all');
              setPageNumber(1);
              
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({
                  x: 0,
                  y: 0,
                  animated: false,
                });
              }
            }}
            style={[
              styles.filterTab,
              filterMode === 'all' ? styles.activeFilterTab : null,
            ]}
          >
            <Text 
              style={[
                styles.filterTabText,
                filterMode === 'all' ? styles.activeFilterTabText : null,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              setFilterMode('like');
              setPageNumber(1);
              
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({
                  x: 0,
                  y: 0,
                  animated: false,
                });
              }
            }}
            style={[
              styles.filterTab,
              filterMode === 'like' ? styles.activeFilterTab : null,
            ]}
          >
            <Text 
              style={[
                styles.filterTabText,
                filterMode === 'like' ? styles.activeFilterTabText : null,
              ]}
            >
              Liked
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              setFilterMode('dislike');
              setPageNumber(1);
              
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({
                  x: 0,
                  y: 0,
                  animated: false,
                });
              }
            }}
            style={[
              styles.filterTab,
              filterMode === 'dislike' ? styles.activeFilterTab : null,
            ]}
          >
            <Text 
              style={[
                styles.filterTabText,
                filterMode === 'dislike' ? styles.activeFilterTabText : null,
              ]}
            >
              Disliked
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              setFilterMode('maybe');
              setPageNumber(1);
              
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({
                  x: 0,
                  y: 0,
                  animated: false,
                });
              }
            }}
            style={[
              styles.filterTab,
              filterMode === 'maybe' ? styles.activeFilterTab : null,
            ]}
          >
            <Text 
              style={[
                styles.filterTabText,
                filterMode === 'maybe' ? styles.activeFilterTabText : null,
              ]}
            >
              Maybe
            </Text>
          </TouchableOpacity>
        </View>

        {showPageNumberContainer && (
          <View style={styles.pageNumberContainer}>
            <Text style={styles.pageNumberText}>
              {pageNumber} /{" "}
              {(() => {
                try {
                  if (filterMode !== 'all' && filteredCardIndices.length > 0) {
                    return filteredCardIndices.length;
                  }
                  
                  if (contentItems.length > 0) {
                    return contentItems.length;
                  }
                  
                  if (!categoriesStore.categories[category] || 
                      !categoriesStore.categories[category][title]) {
                    return 1;
                  }
                  
                  const data = categoriesStore.categories[category][title];
                  
                  if (data.manual && data.texts && data.texts[data.manualCount]) {
                    return Object.keys(data.texts[data.manualCount]).length;
                  } else if (data.texts && Array.isArray(data.texts)) {
                    return data.texts.length;
                  }
                  
                  return 1;
                } catch (error) {
                  console.error("Error calculating total pages:", error);
                  return 1;
                }
              })()}
            </Text>
          </View>
        )}

        <ScrollView
          horizontal
          pagingEnabled
          ref={scrollViewRef}
          showsHorizontalScrollIndicator={false}
          onScroll={async (event) => {
            const currentPage = Math.round(
              event.nativeEvent.contentOffset.x / width
            );

            setPageNumber(currentPage + 1);

            try {
              // Check if we're at the last page
              let isLastPage = false;
              
              if (contentItems.length > 0) {
                isLastPage = currentPage === contentItems.length - 1;
              } else if (categoriesStore.categories[category] && 
                        categoriesStore.categories[category][title]) {
                const data = categoriesStore.categories[category][title];
                
                if (data.manual && data.texts && data.texts[data.manualCount]) {
                  isLastPage = currentPage === Object.keys(data.texts[data.manualCount]).length - 1;
                } else if (data.texts && Array.isArray(data.texts)) {
                  isLastPage = currentPage === data.texts.length - 1;
                }
              }
              
              if (isLastPage) {
                await STORAGE.setCategoryDone(category, parseInt(title));
                checkCategoryDone();
              }
            } catch (error) {
              console.error("Error checking last page:", error);
            }
          }}
        >
          {getCards()}
        </ScrollView>

        <View style={styles.footerContainer}>
          <View style={styles.footerDotsContainer}>{getDots()}</View>

          <View style={styles.footerButtonsContainer}>
            {pageNumber > 1 ? (
              <Pressable
                onPress={() => {
                  scrollViewRef.current.scrollTo({
                    x: width * (pageNumber - 2),
                    y: 0,
                    animated: true,
                  });
                }}
                style={[
                  styles.footerButton,
                  { backgroundColor: Colors.lightGray },
                ]}
              >
                <Text style={styles.footerButtonText}>Back</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  close();
                }}
                style={[
                  styles.footerButton,
                  { backgroundColor: Colors.lightGray },
                ]}
              >
                <Text style={styles.footerButtonText}>Home</Text>
              </Pressable>
            )}

            {(() => {
              try {
                let maxPages = 1;
                
                if (filterMode !== 'all' && filteredCardIndices.length > 0) {
                  maxPages = filteredCardIndices.length;
                } else if (contentItems.length > 0) {
                  maxPages = contentItems.length;
                } else if (categoriesStore.categories[category] && 
                          categoriesStore.categories[category][title]) {
                  const data = categoriesStore.categories[category][title];
                  
                  if (data.manual && data.texts && data.texts[data.manualCount]) {
                    maxPages = Object.keys(data.texts[data.manualCount]).length;
                  } else if (data.texts && Array.isArray(data.texts)) {
                    maxPages = data.texts.length;
                  }
                }
                
                // Check if we're on the last page
                if (pageNumber >= maxPages) {
                  return (
                    <Pressable
                      onPress={() => {
                        if (Platform.OS === "ios") {
                          StoreReview.requestReview();
                        }
                        close();
                      }}
                      style={[
                        styles.footerButton,
                        { backgroundColor: Colors.gray },
                      ]}
                    >
                      <Text style={styles.footerButtonText}>Done</Text>
                    </Pressable>
                  );
                } else {
                  return (
                    <Pressable
                      onPress={() => {
                        scrollViewRef.current.scrollTo({
                          x: width * pageNumber,
                          y: 0,
                          animated: true,
                        });
                      }}
                      style={[
                        styles.footerButton,
                        { backgroundColor: Colors.gray },
                      ]}
                    >
                      <Text style={styles.footerButtonText}>Next</Text>
                    </Pressable>
                  );
                }
              } catch (error) {
                console.error("Error rendering footer button:", error);
                // Return a safe fallback button
                return (
                  <Pressable
                    onPress={close}
                    style={[
                      styles.footerButton,
                      { backgroundColor: Colors.gray },
                    ]}
                  >
                    <Text style={styles.footerButtonText}>Close</Text>
                  </Pressable>
                );
              }
            })()}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },

  headerContainer: {
    width: "100%",
    flexDirection: "row",
    paddingLeft: horizontalScale(20),
    paddingRight: horizontalScale(20),
    paddingTop: verticalScale(
      Platform.OS === "android" ? 20 : 60
    ),
    paddingBottom: verticalScale(20),
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    color: Colors.white,
    fontFamily: "SFProMedium",
    fontSize: moderateScale(22),
    flex: 1,
    textAlign: "center",
    paddingHorizontal: horizontalScale(10),
  },

  filterTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: horizontalScale(20),
    marginBottom: verticalScale(20),
  },
  
  filterTab: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: horizontalScale(12),
    borderRadius: moderateScale(20),
    backgroundColor: 'transparent',
  },
  
  activeFilterTab: {
    backgroundColor: Colors.gray,
  },
  
  filterTabText: {
    color: Colors.lightGray,
    fontFamily: "SFProRegular",
    fontSize: moderateScale(14),
  },
  
  activeFilterTabText: {
    color: Colors.white,
    fontFamily: "SFProMedium",
  },

  pageNumberContainer: {
    position: "absolute",
    top: verticalScale(Platform.OS === "android" ? 70 : 110),
    right: horizontalScale(20),
    paddingHorizontal: horizontalScale(10),
    paddingVertical: verticalScale(5),
    backgroundColor: Colors.gray,
    borderRadius: moderateScale(5),
    zIndex: 1,
  },

  pageNumberText: {
    color: Colors.white,
    fontFamily: "SFProMedium",
    fontSize: moderateScale(12),
  },

  footerContainer: {
    marginBottom: verticalScale(Platform.OS === "android" ? 20 : 50),
    marginHorizontal: horizontalScale(20),
  },

  footerDotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: horizontalScale(5),
    marginBottom: verticalScale(20),
  },

  footerDot: {
    width: horizontalScale(5),
    height: verticalScale(5),
    borderRadius: moderateScale(2.5),
  },

  footerButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  footerButton: {
    width: horizontalScale(130),
    height: verticalScale(50),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: moderateScale(10),
  },

  footerButtonText: {
    color: Colors.white,
    fontFamily: "SFProMedium",
    fontSize: moderateScale(16),
  },

  loadingContainer: {
    width,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: horizontalScale(20),
  },
  
  loadingText: {
    color: Colors.white,
    fontFamily: "SFProMedium",
    fontSize: moderateScale(16),
    marginTop: verticalScale(20),
    textAlign: "center",
  },
}); 