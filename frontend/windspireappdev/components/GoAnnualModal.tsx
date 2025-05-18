import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import BouncyCheckbox from "react-native-bouncy-checkbox";

// constants
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from "@/constants/Metrics";
import { Colors } from "@/constants/Colors";

// utils
import { STORAGE } from "@/utils/storage";

const { width, height } = Dimensions.get("window");

export default function GoAnnualModal({
  goAnnualModalVisible,
  close,
  offerings: initialOfferings,
  setSubscriptionType,
}: {
  goAnnualModalVisible: boolean;
  close: () => void;
  setSubscriptionType: (value: any) => void;
  offerings: any;
}) {
  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "yearly">(
    "yearly"
  );
  const [remainingTime, setRemainingTime] = useState(59);
  const [offerings, setOfferings] = useState(initialOfferings || {});

  const handlePurchase = async () => {
    // Placeholder for future IAP implementation
    console.log('Handling purchase for plan:', selectedPlan);
    return null;
  };
  
  // Set default values for offerings if they don't exist
  useEffect(() => {
    if (!offerings || !offerings.all || !offerings.all.default) {
      console.log('Setting up default offerings data');
      // We'll use placeholder data for now
      setOfferings({
        all: {
          default: {
            weekly: {
              product: {
                pricePerWeekString: "$6,49",
                pricePerYearString: "$363"
              }
            },
            annual: {
              product: {
                pricePerYearString: "$99,99",
                pricePerWeekString: "$1.92"
              }
            }
          }
        }
      });
    }
  }, [offerings]);

  // Set up a timer for the countdown
  useEffect(() => {
    if (goAnnualModalVisible) {
      setRemainingTime(59);
      
      // Update the timer every second
      const interval = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 0) return 0;
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [goAnnualModalVisible]);

  return (
    <Modal animationType="slide" visible={goAnnualModalVisible}>
      <LinearGradient
        colors={["#111c61", Colors.black]}
        style={styles.modalBackground}
      />

      <Ionicons
        onPress={close}
        name="close-sharp"
        size={moderateScale(40)}
        color={Colors.white}
        style={styles.closeIcon}
      />

      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.limitedTimeText}>LIMITED TIME</Text>
          <Text style={styles.offerText}>OFFER!</Text>
          
          <View style={styles.timerContainer}>
            <Text style={styles.onlyText}>ONLY</Text>
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>{String(Math.floor(remainingTime / 60)).padStart(2, '0')}:{String(remainingTime % 60).padStart(2, '0')}</Text>
            </View>
            <Text style={styles.leftText}>LEFT</Text>
          </View>
          
          <Text style={styles.upgradeText}>Upgrade Now &</Text>
          <Text style={styles.saveText}>Save 70%!</Text>
        </View>

        <View style={styles.promotionTextsContainer}>
          <View style={styles.promotionTextContainer}>
            <Image
              style={styles.promotionTextContainerImage}
              source={require("@/assets/images/icons/check-icon.png")}
            />

            <Text style={styles.promotionText}>
              Unlock all life hacks & tips
            </Text>
          </View>

          <View style={styles.promotionTextContainer}>
            <Image
              style={styles.promotionTextContainerImage}
              source={require("@/assets/images/icons/check-icon.png")}
            />

            <Text style={styles.promotionText}>New life hacks every day</Text>
          </View>

          <View style={styles.promotionTextContainer}>
            <Image
              style={styles.promotionTextContainerImage}
              source={require("@/assets/images/icons/check-icon.png")}
            />

            <Text style={styles.promotionText}>Proven tactics to win</Text>
          </View>

          <View style={styles.promotionTextContainer}>
            <Image
              style={styles.promotionTextContainerImage}
              source={require("@/assets/images/icons/check-icon.png")}
            />

            <Text style={styles.promotionText}>Gain an unfair advantage</Text>
          </View>
        </View>

        <View style={styles.plansRowContainer}>
          <View style={styles.planButtonContainer}>
            <Pressable
              style={[
                styles.planButton,
                {
                  borderColor:
                    selectedPlan === "weekly" ? Colors.green : Colors.lightGray,
                },
              ]}
            >
              <LinearGradient
                style={styles.planButtonBackground1}
                colors={["#111c61", Colors.black]}
              />

              <View style={styles.planButtonTextContainer}>
                <Text style={styles.planButton1Text1}>A WEEK</Text>
                <Text style={styles.planButton1Text2}>
                  {offerings?.all?.default?.weekly?.product?.pricePerWeekString || "$6,49"}
                </Text>
                <Text style={styles.planButton1Text3}>
                  (${offerings?.all?.default?.weekly?.product?.pricePerYearString || "$363"}/year)
                </Text>
              </View>
            </Pressable>

            <BouncyCheckbox
              disabled={selectedPlan === "weekly"}
              disableText
              size={moderateScale(40)}
              fillColor={Colors.white}
              style={{
                marginLeft: horizontalScale(45),
              }}
              innerIconStyle={{
                borderColor:
                  selectedPlan === "weekly" ? Colors.darkGray : Colors.white,
                borderWidth: moderateScale(3),
              }}
              isChecked={selectedPlan === "weekly"}
              onPress={() => {
                setSelectedPlan("weekly");
              }}
            />
          </View>

          <View style={styles.planButtonContainer}>
            <Pressable
              style={[
                styles.planButton,
                {
                  borderColor:
                    selectedPlan === "yearly" ? Colors.green : Colors.lightGray,
                },
              ]}
            >
              <LinearGradient
                style={styles.planButtonBackground2}
                colors={["#110000", "#ab003e"]}
              />

              <View style={styles.planButtonBackgroundContainer2}>
                <View style={styles.planButtonBackgroundContainerHeader}>
                  <Text style={styles.planButtonBackgroundContainerHeaderText}>
                    SAVE %70
                  </Text>
                </View>

                <View style={styles.planButtonTextContainer2}>
                  <Text style={styles.planButton2Text1}>A YEAR</Text>
                  <Text style={styles.planButton2Text2}>
                    {offerings?.all?.default?.annual?.product?.pricePerYearString || "$99,99"}
                  </Text>
                  <Text style={styles.planButton2Text3}>
                    ONLY{" "}
                    {offerings?.all?.default?.annual?.product?.pricePerWeekString || "$1.92"} /{" "}
                    WEEK
                  </Text>
                </View>
              </View>
            </Pressable>

            <BouncyCheckbox
              disabled={selectedPlan === "yearly"}
              disableText
              size={moderateScale(40)}
              fillColor={Colors.white}
              style={{
                marginLeft: horizontalScale(45),
              }}
              innerIconStyle={{
                borderColor:
                  selectedPlan === "yearly" ? Colors.darkGray : Colors.white,
                borderWidth: moderateScale(3),
              }}
              isChecked={selectedPlan === "yearly"}
              onPress={(isChecked: boolean) => {
                setSelectedPlan("yearly");
              }}
            />
          </View>
        </View>

        <Text style={styles.infoText}>✓ Cancel any time, no hidden fees</Text>

        <TouchableOpacity
          style={styles.upgradeButton}
          activeOpacity={0.8}
          onPress={async () => {
            if (selectedPlan === "weekly") {
              close();
            } else {
              try {
                // Placeholder for future IAP implementation
                await handlePurchase();
                await STORAGE.setSubscriptionType("annual");
                setSubscriptionType("annual");
                close();
              } catch (e) {
                console.error(e);
              }
            }
          }}
        >
          <Text style={styles.upgradeButtonText}>Upgrade & Save %70</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(40),
  },
  
  headerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  
  limitedTimeText: {
    color: '#ff3b30',
    fontSize: moderateScale(24),
    fontFamily: 'SFProBold',
    textAlign: 'center',
  },
  
  offerText: {
    color: Colors.white,
    fontSize: moderateScale(28),
    fontFamily: 'SFProBold',
    marginBottom: verticalScale(20),
  },
  
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(20),
  },
  
  onlyText: {
    color: Colors.white,
    fontSize: moderateScale(24),
    fontFamily: 'SFProBold',
    marginRight: horizontalScale(10),
  },
  
  countdownContainer: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: horizontalScale(10),
    borderRadius: moderateScale(8),
  },
  
  countdownText: {
    color: Colors.white,
    fontSize: moderateScale(40),
    fontFamily: 'SFProBold',
    textAlign: 'center',
  },
  
  leftText: {
    color: Colors.white,
    fontSize: moderateScale(24),
    fontFamily: 'SFProBold',
    marginLeft: horizontalScale(10),
  },
  
  upgradeText: {
    color: Colors.white,
    fontSize: moderateScale(24),
    fontFamily: 'SFProBold',
    textAlign: 'center',
  },
  
  saveText: {
    color: Colors.white,
    fontSize: moderateScale(24),
    fontFamily: 'SFProBold',
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },

  modalBackground: {
    flex: 1,
    top: 0,
    left: 0,
    right: 0,
    width: width,
    height: height,
    position: "absolute",
  },

  closeIcon: {
    position: "absolute",
    top: verticalScale(68),
    right: horizontalScale(20),
  },

  logo: {
    height: verticalScale(60),
    width: horizontalScale(200),
  },

  logoAlt: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(20),
  },

  promotionTextsContainer: {
    gap: verticalScale(12),
    marginTop: verticalScale(60),
  },

  promotionTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: horizontalScale(16),
  },

  promotionTextContainerImage: {
    tintColor: Colors.white,
    width: horizontalScale(30),
    height: horizontalScale(30),
  },

  promotionText: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(19),
  },

  plansRowContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: horizontalScale(32),
    marginTop: verticalScale(24),
  },

  planButtonContainer: {
    gap: verticalScale(20),
    marginTop: verticalScale(12),
  },

  planButton: {
    borderWidth: moderateScale(5),
    borderRadius: moderateScale(10),
  },

  planButtonBackground1: {
    height: verticalScale(120),
    width: horizontalScale(120),
    borderRadius: moderateScale(5),
  },

  planButtonTextContainer: {
    width: "100%",
    alignItems: "center",
    position: "absolute",
    gap: verticalScale(4),
    paddingVertical: verticalScale(8),
  },

  planButton1Text1: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(28),
  },

  planButton1Text2: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(32),
  },

  planButton1Text3: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(16),
  },

  planButtonBackground2: {
    height: verticalScale(160),
    width: horizontalScale(120),
    borderRadius: moderateScale(5),
  },

  planButtonBackgroundContainer2: { position: "absolute" },

  planButtonBackgroundContainerHeader: {
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(32),
    width: horizontalScale(120),
    backgroundColor: Colors.black,
    borderTopLeftRadius: moderateScale(5),
    borderTopRightRadius: moderateScale(5),
  },

  planButtonBackgroundContainerHeaderText: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(17),
  },

  planButtonTextContainer2: {
    width: "100%",
    alignItems: "center",
    gap: verticalScale(8),
    paddingVertical: verticalScale(8),
  },

  planButton2Text1: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(28),
  },

  planButton2Text2: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(28),
  },

  planButton2Text3: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(12),
  },

  infoText: {
    color: Colors.lightGray,
    fontFamily: "SFProMedium",
    fontSize: moderateScale(16),
    marginTop: verticalScale(28),
  },

  upgradeButton: {
    height: verticalScale(60),
    width: horizontalScale(300),
    backgroundColor: Colors.green,
    borderRadius: moderateScale(36),
    alignItems: "center",
    justifyContent: "center",
  },

  upgradeButtonText: {
    fontFamily: "SFProBold",
    color: Colors.black,
    fontSize: moderateScale(20),
  },
});
