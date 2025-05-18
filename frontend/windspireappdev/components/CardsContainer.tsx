import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  Animated,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { PanGestureHandler } from "react-native-gesture-handler";
import Ionicons from "@expo/vector-icons/Ionicons";

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

// context
import { categoriesStore } from "@/context/store";

// Define a constant for the maximum number of prompts per category
const MAX_PROMPTS_PER_CATEGORY = 10;

const { width, height } = Dimensions.get("window");

export default function CardsContainer({ 
  text, 
  category, 
  title, 
  cardIndex,
  onSwipeComplete
}: { 
  text: string;
  category: string; // This is the main category like "business hack"
  title: string; // This is the specific content item ID
  cardIndex: number;
  onSwipeComplete?: () => void;
}) {
  const [canScroll, setCanScroll] = useState(false);
  const [swipeStatus, setSwipeStatus] = useState<'none' | 'like' | 'dislike' | 'maybe'>('none');
  
  // Animated values for swipe gestures
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  
  // Calculate rotation based on horizontal movement
  const rotate = translateX.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  // Load saved swipe action and track card view
  useEffect(() => {
    const loadSavedActionAndTrackView = async () => {
      // Load saved swipe action if exists
      const savedAction = await STORAGE.getCardAction(category, title, cardIndex);
      if (savedAction) {
        setSwipeStatus(savedAction);
      }
      
      // Check if this prompt has already been viewed
      const viewedTimestamp = await STORAGE.getPromptViewedTimestamp(category, title, cardIndex);
      const isExpired = await STORAGE.getPromptExpired(category, title, cardIndex);
      
      // If it's already expired, we don't need to track it again
      if (isExpired) {
        console.log(`Card already expired: ${category}, ${title}, ${cardIndex}`);
        return;
      }
      
      // If it's not viewed yet, mark it as viewed
      if (!viewedTimestamp) {
        console.log(`Marking card as viewed for first time: ${category}, ${title}, ${cardIndex}`);
        await STORAGE.setPromptViewed(category, title, cardIndex);
        
        // Also mark the individual content item as "read"
        try {
          // Find this content in the store and mark as read
          if (categoriesStore.categories[category] && 
              categoriesStore.categories[category][title] && 
              categoriesStore.categories[category][title].content && 
              categoriesStore.categories[category][title].content[cardIndex]) {
            
            // Mark this specific content item as read
            categoriesStore.categories[category][title].content[cardIndex].read = true;
            console.log(`Marked ${category} - ${title} content #${cardIndex} as read in store`);
          }
        } catch (error) {
          console.error('Error marking content as read in store:', error);
        }
        
        // Yalnızca yerel olarak işaretleme yapıyoruz, backend bildirimi yapılmıyor
        // Authentication sorunu giderilene kadar backend isteğini devre dışı bırakıyoruz
        console.log('Skipping backend notification due to authentication issues');
        // try {
        //   // Report the view to the backend
        //   await API.markPromptViewed(category, title, cardIndex);
        // } catch (error) {
        //   console.error('Error reporting prompt view to backend:', error);
        // }
      } else {
        // If it was viewed more than 24 hours ago, mark as expired
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        if (now - viewedTimestamp >= oneDayMs) {
          console.log(`Marking card as expired (>24h): ${category}, ${title}, ${cardIndex}`);
          await STORAGE.setPromptExpired(category, title, cardIndex);
          
          // Yalnızca yerel olarak işaretleme yapıyoruz, backend bildirimi yapılmıyor
          // Authentication sorunu giderilene kadar backend isteğini devre dışı bırakıyoruz
          console.log('Skipping backend expiration notification due to authentication issues');
          // try {
          //   // Report the expiration to the backend
          //   await API.markPromptExpired(category, title, cardIndex);
          // } catch (error) {
          //   console.error('Error reporting prompt expiration to backend:', error);
          // }
        }
      }
    };
    
    loadSavedActionAndTrackView();
    
    // Run a check for all expired prompts
    const checkExpiredPrompts = async () => {
      // Bu fonksiyon artık Backend tarafında otomatik olarak gece 00:00'da yapılıyor
      // Expired prompts kontrolü kaldırıldı - backend'de cron job olarak çalışıyor
      console.log('Expired prompt check is now handled by backend cron job at midnight');
    };
    
    checkExpiredPrompts();
  }, [category, title, cardIndex]);

  // Function to handle swipe gestures
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  // Function to save swipe action to storage and send to backend
  const saveSwipeAction = async (action: 'like' | 'dislike' | 'maybe') => {
    // Save action locally
    await STORAGE.setCardAction(category, title, cardIndex, action);
    setSwipeStatus(action);
    console.log(`Card ${action}d:`, { category, title, cardIndex });
    
    // Send action to backend admin panel (using public endpoint without auth)
    try {
      console.log(`Sending ${action} action to backend admin panel`);
      const success = await API.sendCardAction(category, title, cardIndex, action);
      if (success) {
        console.log(`Successfully sent ${action} action to backend admin panel`);
      } else {
        console.error(`Failed to send ${action} action to backend admin panel`);
      }
    } catch (error) {
      console.error('Error sending action to backend:', error);
    }
    
    // Mark category as completed when any action is taken
    try {
      // Always use the card index (0-MAX_PROMPTS_PER_CATEGORY) for category completion
      // The 'cardIndex' prop contains the actual index of the card in the category
      // This ensures the correct index is used for marking completion
      await STORAGE.setCategoryDone(category, cardIndex);
      console.log(`Category marked as completed: ${category}.${cardIndex}`);
      
      // Set all cards in this category as completed (0-MAX_PROMPTS_PER_CATEGORY index range)
      for (let i = 0; i < MAX_PROMPTS_PER_CATEGORY; i++) {
        await STORAGE.setCategoryDone(category, i);
      }
    } catch (error) {
      console.error('Error marking category as completed:', error);
    }
    
    // After saving the swipe action, notify parent to move to the next card
    if (onSwipeComplete) {
      onSwipeComplete();
    }
  };

  // Function to handle when user releases the card
  const onHandlerStateChange = (event: any) => {
    // Swipe threshold
    const swipeThreshold = 120;
    
    if (event.nativeEvent.oldState === 4) {
      const { translationX, translationY } = event.nativeEvent;
      
      // Determine if it's a right swipe (like)
      if (translationX > swipeThreshold) {
        Animated.timing(translateX, {
          toValue: width + 100,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          saveSwipeAction('like');
        });
      } 
      // Determine if it's a left swipe (dislike)
      else if (translationX < -swipeThreshold) {
        Animated.timing(translateX, {
          toValue: -width - 100,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          saveSwipeAction('dislike');
        });
      } 
      // Determine if it's an up swipe (maybe)
      else if (translationY < -swipeThreshold) {
        Animated.timing(translateY, {
          toValue: -height - 100,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          saveSwipeAction('maybe');
        });
      } 
      // Reset position if no valid swipe
      else {
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  };

  // Determine the overlay based on the swipe direction
  const likeOpacity = translateX.interpolate({
    inputRange: [0, width / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  
  const dislikeOpacity = translateX.interpolate({
    inputRange: [-width / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  
  const maybeOpacity = translateY.interpolate({
    inputRange: [-width / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.cardsContainer}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { translateX },
                { translateY },
                { rotate },
              ],
              opacity: cardOpacity,
            },
          ]}
        >
          {/* Like Overlay */}
          <Animated.View
            style={[
              styles.overlayContainer,
              styles.likeOverlay,
              { opacity: likeOpacity },
            ]}
          >
            <Ionicons name="heart" size={moderateScale(80)} color="green" />
            <Text style={styles.overlayText}>LIKE</Text>
          </Animated.View>

          {/* Dislike Overlay */}
          <Animated.View
            style={[
              styles.overlayContainer,
              styles.dislikeOverlay,
              { opacity: dislikeOpacity },
            ]}
          >
            <Ionicons name="close" size={moderateScale(80)} color="red" />
            <Text style={styles.overlayText}>DISLIKE</Text>
          </Animated.View>

          {/* Maybe Overlay */}
          <Animated.View
            style={[
              styles.overlayContainer,
              styles.maybeOverlay,
              { opacity: maybeOpacity },
            ]}
          >
            <Ionicons name="help" size={moderateScale(80)} color="blue" />
            <Text style={styles.overlayText}>MAYBE</Text>
          </Animated.View>

          <ScrollView
            indicatorStyle="black"
            showsVerticalScrollIndicator
            onScroll={() => setCanScroll(true)}
            contentContainerStyle={styles.scrollContainer}
          >
            <Text style={styles.cardText}>{text}</Text>

            {canScroll && <View style={{ height: verticalScale(40) }} />}
          </ScrollView>

          <View style={styles.cardFooter}>
            <Image
              resizeMode="contain"
              style={styles.cardFooterImage}
              source={require("@/assets/images/logo.png")}
            />
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  cardsContainer: {
    width: width,
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(532),
    backgroundColor: Colors.cardBackground,
  },

  container: {
    width: "84%",
    alignItems: "center",
    borderColor: Colors.black,
    height: verticalScale(440),
    maxHeight: verticalScale(440),
    borderWidth: moderateScale(4),
    backgroundColor: Colors.white,
    borderRadius: moderateScale(12),
    overflow: "hidden",
  },
  
  completedContainer: {
    borderColor: "#4CAF50", // Green border for completed content
  },

  scrollContainer: {
    justifyContent: "center",
    minHeight: verticalScale(420),
  },
  
  cardText: {
    color: Colors.black,
    textAlign: "center",
    fontFamily: "SFProMedium",
    fontSize: moderateScale(18),
    paddingVertical: verticalScale(20),
    paddingHorizontal: horizontalScale(20),
  },

  cardFooter: {
    width: "101%",
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    bottom: verticalScale(-5),
    height: verticalScale(50),
    backgroundColor: Colors.black,
    borderBottomLeftRadius: moderateScale(12),
    borderBottomRightRadius: moderateScale(12),
  },

  cardFooterImage: {
    height: verticalScale(50),
    width: horizontalScale(100),
  },
  
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  
  overlayText: {
    fontSize: moderateScale(32),
    fontWeight: "bold",
    marginTop: verticalScale(10),
  },
  
  likeOverlay: {
    borderColor: "green",
    borderWidth: moderateScale(4),
    borderRadius: moderateScale(12),
  },
  
  dislikeOverlay: {
    borderColor: "red",
    borderWidth: moderateScale(4),
    borderRadius: moderateScale(12),
  },
  
  maybeOverlay: {
    borderColor: "blue",
    borderWidth: moderateScale(4),
    borderRadius: moderateScale(12),
  },
});
