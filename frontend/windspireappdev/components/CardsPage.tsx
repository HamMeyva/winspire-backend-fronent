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
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import * as StoreReview from "expo-store-review";
import { categoriesStore } from "@/context/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import React from "react";

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

const { width } = Dimensions.get("screen");

export default function CardsPage({
  title,
  category,
  cardsPageVisible,
  close,
  checkCategoryDone,
}: {
  title: string;
  category: string;
  cardsPageVisible: boolean;
  close: () => void;
  checkCategoryDone: () => void;
}) {
  const scrollViewRef = useRef<any>(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [showPageNumberContainer, setShowPageNumberContainer] = useState(false);

  // Track card statuses
  const [cardActions, setCardActions] = useState<Record<number, 'like' | 'dislike' | 'maybe'>>({});
  const [filterMode, setFilterMode] = useState<'all' | 'like' | 'dislike' | 'maybe'>('all');
  const [filteredCardIndices, setFilteredCardIndices] = useState<number[]>([]);

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
  
  // Update filtered cards when filter mode changes
  const updateFilteredCards = (actions: Record<number, 'like' | 'dislike' | 'maybe'>, mode: 'all' | 'like' | 'dislike' | 'maybe') => {
    if (mode === 'all') {
      setFilteredCardIndices([]);
      return;
    }
    
    const indices = Object.entries(actions)
      .filter(([_, action]) => action === mode)
      .map(([index]) => parseInt(index));
      
    setFilteredCardIndices(indices);
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
    } else {
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
  };

  const getDots = () => {
    const data = categoriesStore.categories[category][title];

    const isFinal = pageNumber >= 9;
    const isStart = pageNumber <= 4;

    let dots;

    if (isStart) {
      dots = [1, 2, 3, 4];
    } else if (
      isFinal &&
      (data.texts.length === 9 ||
        (data.manualCount &&
          Object.keys(data.texts[data.manualCount]).length === 9))
    ) {
      dots = [9];
    } else if (isFinal && data.texts.length === 10) {
      dots = [9, 10];
    } else if (
      isFinal &&
      Object.keys(data.texts[data.manualCount]).length === 9
    ) {
      dots = [9];
    } else if (
      isFinal &&
      Object.keys(data.texts[data.manualCount]).length === 10
    ) {
      dots = [9, 10];
    } else if (
      data.texts.length === 5 ||
      (data.manualCount &&
        Object.keys(data.texts[data.manualCount]).length === 5)
    ) {
      dots = [5];
    } else if (
      data.texts.length === 6 ||
      (data.manualCount &&
        Object.keys(data.texts[data.manualCount]).length === 6)
    ) {
      dots = [5, 6];
    } else if (
      data.texts.length === 7 ||
      (data.manualCount &&
        Object.keys(data.texts[data.manualCount]).length === 7)
    ) {
      dots = [5, 6, 7];
    } else if (
      data.texts.length === 8 ||
      data.texts.length === 9 ||
      data.texts.length === 10 ||
      (data.manualCount &&
        Object.keys(data.texts[data.manualCount]).length === 8) ||
      Object.keys(data.texts[data.manualCount]).length === 9 ||
      Object.keys(data.texts[data.manualCount]).length === 10
    ) {
      dots = [5, 6, 7, 8];
    }

    return dots!.map((number) => (
      <View
        key={number}
        style={[
          styles.footerDot,
          {
            backgroundColor:
              pageNumber === number ? Colors.lightGray : Colors.white,
          },
        ]}
      />
    ));
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

          <Text style={styles.headerTitle}>
            {
              categoriesStore.categories[category][
                Object.keys(categoriesStore.categories[category])[
                  parseInt(title)
                ]
              ].name
            }
          </Text>

          <Entypo
            onPress={async () => {
              if (categoriesStore.categories[category][title].manual) {
                await Share.share({
                  message: decodeURIComponent(
                    categoriesStore.categories[category][title].texts[
                      categoriesStore.categories[category][title].manualCount
                    ][pageNumber - 1] +
                      "\n\n" +
                      "via Winspire App: www.winspire.app"
                  ),
                });
              } else {
                await Share.share({
                  message: decodeURIComponent(
                    categoriesStore.categories[category][title].texts[
                      pageNumber - 1
                    ] +
                      "\n\n" +
                      "via Winspire App: www.winspire.app"
                  ),
                });
              }
            }}
            name="share"
            size={moderateScale(28)}
            color={Colors.white}
          />
        </View>

        {showPageNumberContainer && (
          <View style={styles.pageNumberContainer}>
            <Text style={styles.pageNumberText}>
              {pageNumber} /{" "}
              {categoriesStore.categories[category][title].manualCount !==
              undefined
                ? Object.keys(
                    categoriesStore.categories[category][title].texts[
                      categoriesStore.categories[category][title].manualCount
                    ]
                  ).length
                : categoriesStore.categories[category][title].texts.length}
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

            if (
              currentPage ===
                categoriesStore.categories[category][title].texts.length - 1 ||
              currentPage ===
                Object.keys(
                  categoriesStore.categories[category][title].texts[
                    categoriesStore.categories[category][title].manualCount
                  ]
                ).length -
                  1
            ) {
              await STORAGE.setCategoryDone(category, parseInt(title));

              checkCategoryDone();
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

            {pageNumber <
              categoriesStore.categories[category][title].texts.length ||
            (categoriesStore.categories[category][title].manualCount !==
              undefined &&
              pageNumber <
                Object.keys(
                  categoriesStore.categories[category][title].texts[
                    categoriesStore.categories[category][title].manualCount
                  ]
                ).length) ? (
              <Pressable
                onPress={() => {
                  scrollViewRef.current.scrollTo({
                    x: width * pageNumber,
                    y: 0,
                    animated: true,
                  });
                }}
                style={[styles.footerButton, { backgroundColor: Colors.red }]}
              >
                <Text style={styles.footerButtonText}>Next</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  close();
                }}
                style={[styles.footerButton, { backgroundColor: Colors.red }]}
              >
                <Text style={styles.footerButtonText}>Done</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.footerSeperator} />
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
    alignItems: "center",
    flexDirection: "row",
    borderBottomWidth: 2,
    height: verticalScale(120),
    backgroundColor: Colors.black,
    borderBottomColor: Colors.gray,
    justifyContent: "space-between",
    paddingHorizontal: horizontalScale(20),
    paddingTop: Platform.OS === "ios" ? verticalScale(40) : 0,
  },

  headerTitle: {
    width: "70%",
    textAlign: "center",
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(24),
  },

  pageNumberContainer: {
    zIndex: 99,
    position: "absolute",
    alignItems: "center",
    top: verticalScale(130),
    justifyContent: "center",
    height: verticalScale(22),
    right: horizontalScale(10),
    width: horizontalScale(52),
    borderRadius: moderateScale(10),
    backgroundColor: Colors.lightGray2,
  },

  pageNumberText: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(14),
  },

  cardsContainer: {
    width: width,
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(532),
    backgroundColor: Colors.cardBackground,
  },

  footerContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: verticalScale(20),
    paddingHorizontal: horizontalScale(20),
    height: Platform.OS === "ios" ? verticalScale(220) : verticalScale(200),
  },

  footerDotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: horizontalScale(6),
    justifyContent: "center",
  },

  footerDot: {
    height: verticalScale(8),
    width: horizontalScale(8),
    borderRadius: moderateScale(8),
  },

  footerButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: horizontalScale(40),
    justifyContent: "space-between",
    marginBottom: Platform.OS === "ios" ? verticalScale(88) : verticalScale(78),
  },

  footerButton: {
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(52),
    width: horizontalScale(120),
    borderRadius: moderateScale(30),
  },

  footerButtonText: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(32),
  },

  footerSeperator: {
    bottom: 0,
    width: width,
    position: "absolute",
    height: verticalScale(80),
    backgroundColor: Colors.cardSeperator,
  },
});
