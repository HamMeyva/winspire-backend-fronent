import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  FlatList,
  Image,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Colors } from '@/constants/Colors';
import { horizontalScale, moderateScale, verticalScale } from '@/constants/Metrics';
import GoAnnualModal from './GoAnnualModal';

const { width } = Dimensions.get('window');

// Main titles data
const headerData = [
  {
    id: '1',
    title: 'GENIUS LIFE HACKS',
    subtitle: 'refreshed every 24 hours',
  },
  {
    id: '2',
    title: 'TOP MONEY HACKS',
    subtitle: 'designed to make you rich',
  },
  {
    id: '3',
    title: 'PRO DATING HACKS',
    subtitle: 'proven to get more girls',
  }
];

// Sample data for categories card
const categoriesData = [
  { id: '1-1', title: 'Dating Hacks', icon: '👼' },
  { id: '1-2', title: 'Money Hacks', icon: '💰' },
  { id: '1-3', title: 'Power Hacks', icon: '♟️' },
  { id: '1-4', title: 'Survival Hacks', icon: '☠️' },
];

// Sample data for content cards
const contentCards = [
  {
    id: '1',
    content: `Want to impress people in an important meeting?

Set your phone to make a sound as if you're receiving a call by pressing the side button. Then, pick up the phone and say, 'Hello Mr. X, yes, 7 million dollars works for us. I'm in a meeting right now, I'll call you back once I'm out.' The people in the meeting will think you're dealing with millions of dollars, and they'll be more inclined to make a deal with you.`
  },
  {
    id: '2',
    content: `You like a girl in a café, but she's with her 2 friends. Do this:

Go to their table with 4 drinks and a tray, acting like a waiter. Say, "The owner of the place sent these drinks as a treat for you." The girls will be surprised. Then, leave 3 drinks in front of them and place the fourth one on the table for yourself, sitting down in the fourth chair. Apologize and say, "I forgot to mention, I'm actually the owner of this place." They'll start laughing. Then you can introduce yourself and join the conversation`
  }
];

export default function HacksPreviewScreen({
  visible,
  close,
  onPurchasePress
}: {
  visible: boolean;
  close: () => void;
  onPurchasePress: () => void;
}) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentHeaderIndex, setCurrentHeaderIndex] = useState(0);
  const cardsRef = useRef<FlatList>(null);
  
  // Category items renderer
  const renderCategoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.categoryButton}>
      <Text style={styles.categoryText}>{item.title}</Text>
      <Text style={styles.categoryIcon}>{item.icon}</Text>
    </TouchableOpacity>
  );
  
  // Card content renderer
  const renderCard = ({ item, index }: { item: any; index: number }) => {
    if (index === 0) {
      // Categories card
      return (
        <View style={styles.cardContainer}>
          <View style={styles.categoriesContainer}>
            <FlatList
              data={categoriesData}
              renderItem={renderCategoryItem}
              keyExtractor={category => category.id}
              scrollEnabled={false}
            />
          </View>
        </View>
      );
    } else {
      // Content cards (Money hack or Dating hack)
      return (
        <View style={styles.cardContainer}>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>{contentCards[index-1].content}</Text>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>winspire</Text>
            </View>
          </View>
        </View>
      );
    }
  };
  
  // Handle card swipe
  const handleCardScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    const index = Math.round(contentOffset.x / width);
    
    // Set both card index and header index
    setCurrentCardIndex(index);
    
    // Update header based on card position
    // Categories card shows first header, content cards show respective headers
    if (index === 0) {
      setCurrentHeaderIndex(0);
    } else {
      setCurrentHeaderIndex(index);
    }
  };

  if (!visible) return null;
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={close}
      >
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
      
      {/* Fixed Header Area */}
      <View style={styles.headerArea}>
        <Text style={styles.title}>{headerData[currentHeaderIndex].title}</Text>
        <Text style={styles.subtitle}>{headerData[currentHeaderIndex].subtitle}</Text>
      </View>
      
      {/* Scrollable Card Area */}
      <FlatList
        ref={cardsRef}
        data={[{ id: 'categories' }, ...contentCards]} // Categories card + content cards
        renderItem={renderCard}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleCardScroll}
        style={styles.cardsContainer}
      />
      
      {/* Dots Indicator */}
      <View style={styles.dotContainer}>
        {[0, 1, 2].map((i) => (
          <View 
            key={i} 
            style={[
              styles.dot, 
              { backgroundColor: currentHeaderIndex === i ? Colors.white : 'rgba(255, 255, 255, 0.5)' }
            ]} 
          />
        ))}
      </View>
      
      {/* Footer Area */}
      <View style={styles.footerArea}>
        {currentCardIndex === 0 ? (
          <Text style={styles.legalText}>
            By tapping "Try For Free" you agree to our{' '}
            <Text style={styles.link}>terms of use</Text> and{' '}
            <Text style={styles.link}>privacy policy</Text>
          </Text>
        ) : (
          <View style={styles.noPaymentRow}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.noPaymentText}>No payment due now</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.tryButton}
          onPress={onPurchasePress}
        >
          <Text style={styles.tryButtonText}>Try For Free</Text>
          <Text style={styles.tryButtonIcon}>›</Text>
        </TouchableOpacity>
        
        <Text style={styles.freeTrialText}>
          3 days free, than $6,49 per week
        </Text>
        
        {currentCardIndex === 0 ? (
          <TouchableOpacity>
            <Text style={styles.restoreText}>Restore purchase</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.legalLinks}>
            <TouchableOpacity>
              <Text style={styles.smallLink}>Terms of use</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.smallLink}>Restore purchase</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.smallLink}>Privacy policy</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111c61',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: verticalScale(40),
    left: horizontalScale(20),
    zIndex: 10,
    width: horizontalScale(40),
    height: horizontalScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: Colors.white,
    fontSize: moderateScale(28),
    fontWeight: 'bold',
  },
  headerArea: {
    width: '100%',
    alignItems: 'center',
    paddingTop: verticalScale(60),
    marginBottom: verticalScale(20),
  },
  title: {
    color: Colors.white,
    fontSize: moderateScale(32),
    fontFamily: 'SFProBold',
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(16),
    textAlign: 'center',
  },
  cardsContainer: {
    flex: 1,
    marginBottom: verticalScale(10),
    width: width,
  },
  cardContainer: {
    width,
    paddingHorizontal: horizontalScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    width: '100%',
    backgroundColor: '#111',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
  },
  categoryButton: {
    width: '100%',
    height: verticalScale(60),
    backgroundColor: '#000',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: verticalScale(10),
    paddingHorizontal: horizontalScale(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryText: {
    color: Colors.white,
    fontSize: moderateScale(18),
    fontFamily: 'SFProMedium',
  },
  categoryIcon: {
    fontSize: moderateScale(24),
  },
  contentCard: {
    width: width - horizontalScale(40),
    backgroundColor: '#f5f5f5',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    minHeight: verticalScale(300),
    justifyContent: 'space-between',
  },
  contentText: {
    color: '#000',
    fontSize: moderateScale(16),
    lineHeight: moderateScale(22),
    fontFamily: 'SFProRegular',
  },
  logoContainer: {
    alignItems: 'flex-end',
    marginTop: verticalScale(10),
  },
  logoText: {
    color: '#000',
    fontSize: moderateScale(16),
    fontFamily: 'SFProBold',
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: verticalScale(10),
  },
  dot: {
    width: horizontalScale(8),
    height: horizontalScale(8),
    borderRadius: horizontalScale(4),
    marginHorizontal: horizontalScale(4),
  },
  footerArea: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: verticalScale(30),
  },
  legalText: {
    color: Colors.white,
    fontSize: moderateScale(14),
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  link: {
    color: '#3498db',
    textDecorationLine: 'underline',
  },
  tryButton: {
    width: '100%',
    height: verticalScale(56),
    backgroundColor: '#1a73e8',
    borderRadius: moderateScale(28),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(10),
  },
  tryButtonText: {
    color: Colors.white,
    fontSize: moderateScale(18),
    fontFamily: 'SFProBold',
  },
  tryButtonIcon: {
    color: Colors.white,
    fontSize: moderateScale(24),
    marginLeft: horizontalScale(8),
  },
  freeTrialText: {
    color: Colors.white,
    fontSize: moderateScale(14),
    marginBottom: verticalScale(10),
  },
  restoreText: {
    color: Colors.white,
    fontSize: moderateScale(14),
    textDecorationLine: 'underline',
  },
  noPaymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(16),
  },
  checkmark: {
    color: Colors.white,
    fontSize: moderateScale(16),
    marginRight: horizontalScale(8),
  },
  noPaymentText: {
    color: Colors.white,
    fontSize: moderateScale(14),
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: verticalScale(10),
  },
  smallLink: {
    color: Colors.white,
    fontSize: moderateScale(12),
    textDecorationLine: 'underline',
  },
});
