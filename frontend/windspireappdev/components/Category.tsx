import { useEffect, useState, useRef } from "react";
import { Image } from "expo-image";
import { Text, StyleSheet, Pressable, View, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";

// constants
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from "@/constants/Metrics";
import { Colors } from "@/constants/Colors";

// context
import { categoriesStore } from "@/context/store";
import { observer } from "mobx-react-lite";

// utils
import { STORAGE } from "@/utils/storage";

const { width } = Dimensions.get("window");

// Icon map with TypeScript typing
const categoryIcons: { [key: string]: any } = {
  "tinder_default": require("@/assets/images/icons/Tinder Hacks Default.png"),
  "tinder_completed": require("@/assets/images/icons/Tinder Hacks Completed.png"),
  "travel_default": require("@/assets/images/icons/Travel Hacks Default.png"),
  "travel_completed": require("@/assets/images/icons/Travel Hacks Completed.png"),
  "mind_default": require("@/assets/images/icons/Mind Hacks Default.png"),
  "mind_completed": require("@/assets/images/icons/Mind Hacks Completed.png"),
  "loophole_default": require("@/assets/images/icons/Loophole Hacks Default.png"),
  "loophole_completed": require("@/assets/images/icons/Loophole Hacks Green.png"),
  "money_default": require("@/assets/images/icons/Money Hacks Default.png"),
  "money_completed": require("@/assets/images/icons/Money Hacks Completed.png"),
  "power_default": require("@/assets/images/icons/Power Hacks Default.png"),
  "power_completed": require("@/assets/images/icons/Power Hacks Completed.png"),
  "survival_default": require("@/assets/images/icons/Survival Hacks Default.png"),
  "survival_completed": require("@/assets/images/icons/Survival Hacks Completed.png"),
  "dating_hacks_default": require("@/assets/images/icons/Dating Hacks Default.png"),
  "dating_hacks_completed": require("@/assets/images/icons/Dating Hacks Completed.png"),
  "dating_tips_default": require("@/assets/images/icons/Dating Tips Default.png"),
  "dating_tips_completed": require("@/assets/images/icons/Dating Tips Completed.png"),
  "finance_default": require("@/assets/images/icons/Finance Tips Default.png"),
  "finance_completed": require("@/assets/images/icons/Finance Tips Completed.png"),
  "fitness_default": require("@/assets/images/icons/Fitness Tips Default.png"),
  "fitness_completed": require("@/assets/images/icons/Fitness Tips Completed.png"),
  "mindset_default": require("@/assets/images/icons/Mindset Tips Default.png"),
  "mindset_completed": require("@/assets/images/icons/Mindset Tips Completed.png"),
  "social_default": require("@/assets/images/icons/Social Tips Default.png"),
  "social_completed": require("@/assets/images/icons/Social Tips Completed.png"),
  "wisdom_default": require("@/assets/images/icons/Mind Hacks Default.png"),
  "wisdom_completed": require("@/assets/images/icons/Mind Hacks Completed.png"),
};

function Category({
  title,
  completed: initialCompleted,
  onPressCategory,
  categoryName,
  index,
}: {
  title: string;
  completed: string;
  onPressCategory: () => void;
  categoryName: string;
  index: number;
}) {
  // State to track completion status, initialize with the prop value
  const [completed, setCompleted] = useState<string>(initialCompleted);
  const [hasNewContent, setHasNewContent] = useState<boolean>(false);
  const previousContentCountRef = useRef<number>(0);
  const previousPublishedContentCountRef = useRef<number>(0);

  // Format the title for display
  const formatTitle = (title: string) => {
    if (title.length <= 18) return title;

    // For longer titles, use newlines to break into two lines
    const words = title.split(" ");
    
    // If there are only 2 or fewer words, just return the title
    if (words.length <= 2) return title;
    
    // Find a good breakpoint to split the title into two lines
    const midPoint = Math.floor(words.length / 2);
    
    // Insert a newline after a good break point
    words.splice(midPoint, 0, "\n");
    return words.join(" ");
  };

  // Get category data from the store
  const categoryData = categoriesStore.categories[categoryName] ? 
    categoriesStore.categories[categoryName][Object.keys(categoriesStore.categories[categoryName])[index]] : null;
  
  // This function returns the correct icon based on the category and completion status
  const getIconSource = () => {
    // Log completion state for debugging
    console.log(`Category ${title}: Completion status=${completed}, hasNewContent=${hasNewContent}`);
    
    // For completed categories, use green icons unless there's new content
    const useCompletedIcon = completed === "true" && !hasNewContent;
    console.log(`Category ${title}: Will use ${useCompletedIcon ? 'GREEN' : 'DEFAULT'} icon`);
    
    // Determine which category this is by matching title text
    let categoryKey = "";
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes("tinder")) {
      categoryKey = "tinder";
    } else if (titleLower.includes("travel")) {
      categoryKey = "travel";
    } else if (titleLower.includes("mind hack")) {
      categoryKey = "mind";
    } else if (titleLower.includes("wisdom") || titleLower.includes("learning")) {
      categoryKey = "wisdom";
    } else if (titleLower.includes("loophole")) {
      categoryKey = "loophole";
    } else if (titleLower.includes("money")) {
      categoryKey = "money";
    } else if (titleLower.includes("power")) {
      categoryKey = "power";
    } else if (titleLower.includes("survival")) {
      categoryKey = "survival";
    } else if (titleLower.includes("business")) {
      categoryKey = "money"; // Use money hacks icon as fallback
    } else if (titleLower.includes("dating hack")) {
      categoryKey = "dating_hacks";
    } else if (titleLower.includes("dating tip")) {
      categoryKey = "dating_tips";
    } else if (titleLower.includes("finance") || titleLower.includes("wealth")) {
      categoryKey = "finance";
    } else if (titleLower.includes("fitness") || titleLower.includes("nutrition")) {
      categoryKey = "fitness";
    } else if (titleLower.includes("mindset") || titleLower.includes("motivation")) {
      categoryKey = "mindset";
    } else if (titleLower.includes("social")) {
      categoryKey = "social";
    } else {
      // Default if no match found
      categoryKey = "mind";
    }
    
    // Create the full key by combining category with completion status
    const fullKey = `${categoryKey}_${useCompletedIcon ? "completed" : "default"}`;
    console.log(`Selected icon key: ${fullKey} for category "${title}"`);
    
    // Return the appropriate icon or a default if not found
    return categoryIcons[fullKey] || categoryIcons["mind_default"];
  };
  
  // Check for new content when the component mounts or updates
  useEffect(() => {
    if (!categoryData) return;
    
    const currentContentCount = categoryData.content?.length || 0;
    const currentPublishedContentCount = categoryData.content?.filter(
      (item: { status: string }) => item.status === 'published'
    )?.length || 0;
    
    console.log(`Category ${title}: Current published count: ${currentPublishedContentCount}, Previous: ${previousPublishedContentCountRef.current}`);
    
    // Check if there's new content by comparing with previous count
    if (previousPublishedContentCountRef.current > 0 && 
        currentPublishedContentCount > previousPublishedContentCountRef.current) {
      console.log(`Category ${title}: New published content detected!`);
      // Force the icon to be white by setting hasNewContent true
      setHasNewContent(true);
      
      // Store this category's new content state in AsyncStorage
      const key = `category_${categoryName}_${index}_hasNewContent`;
      AsyncStorage.setItem(key, 'true');
    }
    
    // Update the reference counts
    previousContentCountRef.current = currentContentCount;
    previousPublishedContentCountRef.current = currentPublishedContentCount;
  }, [categoryData?.content?.length, categoryData?.content, categoryName, index, title]);
  
  // Check for saved new content status and reset flag when all content is viewed
  useEffect(() => {
    // First check if we have a stored value for this category's new content state
    const checkStoredNewContentStatus = async () => {
      try {
        const key = `category_${categoryName}_${index}_hasNewContent`;
        const storedValue = await AsyncStorage.getItem(key);
        if (storedValue === 'true') {
          setHasNewContent(true);
        }
      } catch (error) {
        console.error('Error reading hasNewContent from storage:', error);
      }
    };
    
    checkStoredNewContentStatus();
    
    // Reset new content flag when all content is viewed
    if (completed === "true" && categoryData?.content) {
      const currentPublishedCount = categoryData.content.filter((item: { status: string }) => item.status === 'published').length;
      
      if (previousPublishedContentCountRef.current === currentPublishedCount) {
        // If there is no difference in content count and all content is read, it's safe to reset new content flag
        const hasAllContentRead = categoryData.content.every((item: any) => item.read === true);
        
        if (hasAllContentRead) {
          console.log(`Category ${title}: All content is read, clearing new content flag`);
          setHasNewContent(false);
          const key = `category_${categoryName}_${index}_hasNewContent`;
          AsyncStorage.setItem(key, 'false');
        }
      }
    }
  }, [completed, categoryData?.content, categoryName, index, title]);

  // Force a refresh of stored category completion state on component mount AND when content changes
  useEffect(() => {
    const checkCategoryDone = async () => {
      // Skip if there's no content or no category name
      if (!hasContent || !categoryName) return;

      try {
        // Get the previously stored completion status
        const storedStatus = await STORAGE.getCategoryDone(categoryName, index);
        setCompleted(storedStatus);

        // Get the previously saved content for comparison
        const previousContentString = await STORAGE.getLastCategoryContent(categoryName, title || '');
        let previousContentCount = 0;
        let parsedContent = [];
        
        // Parse previous content if it exists with proper error handling
        if (previousContentString) {
          try {
            // Validate JSON string format before parsing
            if (typeof previousContentString === 'string' && 
                previousContentString.trim().startsWith('[') && 
                previousContentString.trim().endsWith(']')) {
              
              parsedContent = JSON.parse(previousContentString);
              if (Array.isArray(parsedContent)) {
                previousContentCount = parsedContent.length;
                console.log(`📊 Valid saved content found for ${categoryName} (${previousContentCount} items)`);
              } else {
                console.log(`Invalid saved content format for ${categoryName} - expected array but got ${typeof parsedContent}`);
                parsedContent = [];
              }
            } else {
              console.log(`Invalid saved content string format for ${categoryName}`);
            }
          } catch (e) {
            console.error(`Error parsing previous content: ${e}`);
            parsedContent = [];
          }
        }
        
        // Now check if content has changed, by comparing the content we have now with the saved content
        const currentContent = categoryData?.content || [];
        const currentContentCount = currentContent.length;
        
        // Compare current with previous content count
        console.log(`Comparing content: Current ${currentContentCount} vs Previous ${previousContentCount}`);
        
        if (currentContentCount > 0 && currentContentCount !== previousContentCount) {
          console.log(`✨ Content count has changed for ${categoryName} (${previousContentCount} -> ${currentContentCount})`);
          
          // If there is more content now than before, it's new content!
          if (currentContentCount > previousContentCount) {
            console.log(`⚡ NEW CONTENT DETECTED for ${categoryName}!`);
            
            // If the category was previously marked as completed, but now has new content,
            // we need to reset it to not completed (unless all the new content is also already read)
            if (storedStatus === "true") {
              console.log(`🔁 Checking if all new content is already read...`);
              const allContentRead = currentContent.every((item: any) => item.read === true);
              
              if (!allContentRead) {
                console.log(`⚠️ Category ${categoryName} needs resetting - not all content is read, despite category being marked complete`);
                await STORAGE.resetCategoryCompletion(categoryName, index);
                setCompleted("false"); // Update UI immediately
              } else {
                console.log(`✅ All content is already read in ${categoryName}, maintaining completed status`);
              }
            }
          }
          
          // Save the current content for future comparisons
          try {
            await STORAGE.saveLastCategoryContent(categoryName, title || '', JSON.stringify(currentContent));
            console.log(`📦 Saved updated content for ${categoryName}`);
          } catch (e) {
            console.error(`Error saving current content: ${e}`);
          }
        }
        
        // Check if all content is read
        const allContentRead = hasContent && currentContent.every((item: any) => item.read === true);
        
        // Force category to completed if all content is read
        if (hasContent && allContentRead) {
          if (completed !== "true") {
            console.log(`✅ COMPLETION REQUIRED: Category ${categoryName}, index ${index} has all read content but wasn't marked complete`);  
            await STORAGE.setCategoryDone(categoryName, index);
            setCompleted("true"); // Update UI immediately
          } else {
            console.log(`ℹ️ Category ${categoryName}, index ${index} has all read content - already marked as complete`);
          }
        }
        
        // Clean up any leftover 'new content' flags
        await STORAGE.clearCategoryHasNewContent(categoryName, index);
        
        // Force UI refresh to show the correct icons and borders
        if (completed === "true") {
          console.log(`💡 UI Refresh: Category ${categoryName}, index ${index} should show GREEN icon and border`);
        } else {
          console.log(`💡 UI Refresh: Category ${categoryName}, index ${index} should show DEFAULT icon and border`);
        }
      } catch (error) {
        console.error(`Error checking category completion: ${error}`);
      }
    };
    
    // Check if content exists at all for this category
    const hasContent = categoryData && categoryData.content && categoryData.content.length > 0;
    
    // Call the function immediately
    checkCategoryDone();
  }, [categoryData?.content?.length, categoryName, index, title, completed]);
    
  return (
    <Pressable 
      style={[styles.container, completed === "true" ? styles.completedContainer : null]} 
      onPress={onPressCategory}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{formatTitle(title)}</Text>
      </View>

      <View style={styles.iconWrapper}>
        <Image
          source={getIconSource()}
          style={styles.image}
          contentFit="contain"
        />
      </View>

      {completed === "true" ? (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>Done. Updates in 24h.</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: verticalScale(90),
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.black,
    borderColor: Colors.white,
    borderRadius: moderateScale(16),
    justifyContent: "space-between",
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(16),
    marginBottom: verticalScale(16),
    position: "relative",
    // Add shadow properties for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    // Add elevation for Android
    elevation: 5,
  },
  
  // Add a style for completed categories
  completedContainer: {
    borderColor: "#4CAF50", // Green border for completed categories
  },

  titleContainer: {
    width: width * 0.7,
    flexDirection: "column",
    justifyContent: "center",
  },

  title: {
    fontWeight: "bold",
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(22),
    lineHeight: moderateScale(28),
  },

  iconWrapper: {
    height: verticalScale(48),
    width: horizontalScale(48),
    justifyContent: "center",
    alignItems: "center",
  },
  
  iconContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  
  dollarSign: {
    position: "absolute",
    fontSize: moderateScale(20),
    fontWeight: "bold",
  },

  image: {
    height: verticalScale(48),
    width: horizontalScale(48),
  },

  completedBadge: {
    alignItems: "center",
    position: "absolute",
    justifyContent: "center",
    left: horizontalScale(16),
    height: verticalScale(22),
    bottom: verticalScale(-11),
    width: horizontalScale(140),
    backgroundColor: "#4CAF50", // Green for completed badge
    borderRadius: moderateScale(6),
  },

  completedText: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(11),
  },
});

export default observer(Category);
