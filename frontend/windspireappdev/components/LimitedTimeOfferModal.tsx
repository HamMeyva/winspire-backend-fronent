import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  Dimensions,
  TouchableOpacity,
  Platform,
  Animated,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { Ionicons } from "@expo/vector-icons";

// constants
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from "@/constants/Metrics";
import { Colors } from "@/constants/Colors";

// utils
import { STORAGE } from "@/utils/storage";

// context
import { limitedTimeOfferStore } from "@/context/store";

const { width, height } = Dimensions.get("window");

export default function LimitedTimeOfferModal({
  limitedTimeOfferModalVisible,
  close,
  weeklyPricePerWeek,
  weeklyPricePerYear,
  annualPricePerWeek,
  annualPricePerYear,
}: {
  limitedTimeOfferModalVisible: boolean;
  close: () => {};
  weeklyPricePerWeek: string;
  weeklyPricePerYear: string;
  annualPricePerWeek: string;
  annualPricePerYear: string;
}) {
  const [plan1Checked, setPlan1Checked] = useState(false);
  const [plan2Checked, setPlan2Checked] = useState(true);

  /* animation start */
  const animation = new Animated.Value(0);

  const inputRange = [0, 1];
  const outputRange = [1, 1.1];

  const scale = animation.interpolate({ inputRange, outputRange });

  const scaleLoop = Animated.loop(
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ])
  );

  scaleLoop.start();
  /* animation end */

  /* countdown start */
  const [countdown, setCountdown] = useState(
    limitedTimeOfferStore.limitedTimeOffer.limitedTimeCountdown
  );

  const timerRef = useRef(countdown);

  useEffect(() => {
    const timerId = setInterval(() => {
      timerRef.current -= 1;

      if (timerRef.current < 0) {
        clearInterval(timerId);

        close();
      } else {
        setCountdown(timerRef.current);
      }
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);
  /* countdown end */

  const handlePurchase = async () => {
    // Placeholder for future IAP implementation
    return null;
  };

  return (
    <Modal animationType="slide" visible={limitedTimeOfferModalVisible}>
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
        <Text style={styles.header}>
          LIMITED TIME{"\n"}
          <Text style={{ color: Colors.white }}>OFFER!</Text>
        </Text>

        <Text style={styles.countdownTextHelper}>
          ONLY{" "}
          <Text style={styles.countdownText}>
            {countdown >= 60 ? "0" + (countdown / 60).toString() + ":" : "00:"}

            {countdown >= 60
              ? countdown - Math.floor(countdown / 60) * 60 >= 10
                ? (countdown - Math.floor(countdown / 60) * 60).toString()
                : countdown - Math.floor(countdown / 60) * 60 + "0"
              : countdown < 10
              ? "0" + countdown
              : countdown}
          </Text>{" "}
          LEFT
        </Text>

        <Text style={styles.promotionText}>Upgrade Now &{"\n"}Save 70%!</Text>

        <View style={styles.plansRowContainer}>
          <View style={styles.planButtonContainer}>
            <Pressable
              style={[
                styles.planButton,
                { borderColor: plan1Checked ? Colors.green : Colors.lightGray },
              ]}
            >
              <LinearGradient
                style={styles.planButtonBackground1}
                colors={["#111c61", Colors.black]}
              />

              <View style={styles.planButtonTextContainer}>
                <Text style={styles.planButton1Text1}>A WEEK</Text>
                <Text style={styles.planButton1Text2}>
                  {weeklyPricePerWeek}
                </Text>
                <Text style={styles.planButton1Text3}>
                  ({weeklyPricePerYear}/year)
                </Text>
              </View>
            </Pressable>

            <BouncyCheckbox
              disabled={plan1Checked}
              disableText
              size={moderateScale(40)}
              fillColor={Colors.white}
              style={{
                marginLeft: horizontalScale(45),
              }}
              innerIconStyle={{
                borderColor: plan1Checked ? Colors.darkGray : Colors.white,
                borderWidth: moderateScale(3),
              }}
              isChecked={plan1Checked}
              onPress={(isChecked: boolean) => {
                setPlan1Checked(isChecked);

                if (plan2Checked) {
                  setPlan2Checked(false);
                }
              }}
            />
          </View>

          <View style={styles.planButtonContainer}>
            <Pressable
              style={[
                styles.planButton,
                { borderColor: plan2Checked ? Colors.green : Colors.lightGray },
              ]}
            >
              <LinearGradient
                style={styles.planButtonBackground2}
                colors={["#f0784a", "#b51240"]}
              />

              <View style={styles.planButtonBackgroundContainer2}>
                <View style={styles.planButtonBackgroundContainerHeader}>
                  <Text style={styles.planButtonBackgroundContainerHeaderText}>
                    SAVE %70 🔥
                  </Text>
                </View>

                <View style={styles.planButtonTextContainer2}>
                  <Text style={styles.planButton2Text1}>A YEAR</Text>
                  <Text style={styles.planButton2Text2}>
                    {annualPricePerYear}
                  </Text>
                  <Text style={styles.planButton2Text3}>
                    ONLY {annualPricePerWeek} / WEEK
                  </Text>
                </View>
              </View>
            </Pressable>

            <BouncyCheckbox
              disabled={plan2Checked}
              disableText
              size={moderateScale(40)}
              fillColor={Colors.white}
              style={{
                marginLeft: horizontalScale(45),
              }}
              innerIconStyle={{
                borderColor: plan2Checked ? Colors.darkGray : Colors.white,
                borderWidth: moderateScale(3),
              }}
              isChecked={plan2Checked}
              onPress={(isChecked: boolean) => {
                setPlan2Checked(isChecked);

                if (plan1Checked) {
                  setPlan1Checked(false);
                }
              }}
            />
          </View>
        </View>

        <Text style={styles.infoText}>✓ Cancel any time, no hidden fees</Text>

        <Animated.View
          style={[
            styles.unlockButton,
            { transform: [plan2Checked ? { scale } : { scale: 1 }] },
          ]}
        >
          <TouchableOpacity
            onPress={async () => {
              if (plan1Checked) {
                close();
              } else {
                try {
                  // Placeholder for future IAP implementation
                  await handlePurchase();
                  await STORAGE.setSubscriptionType("annual");
                  close();
                } catch (e) {
                  console.error(e);
                }
              }
            }}
          >
            <Text style={styles.unlockButtonText}>
              {plan1Checked
                ? "Continue Without Saving"
                : "Upgrade & Save %70 🚀"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? verticalScale(60) : verticalScale(20),
  },

  modalBackground: {
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
    left: horizontalScale(20),
  },

  header: {
    color: Colors.red2,
    textAlign: "center",
    fontFamily: "SFProBold",
    fontSize: moderateScale(40),
  },

  countdownText: {
    color: Colors.red2,
    textAlign: "center",
    fontFamily: "SFProBold",
    fontSize: moderateScale(44),
  },

  countdownTextHelper: {
    color: Colors.white,
    textAlign: "center",
    fontFamily: "SFProBold",
    fontSize: moderateScale(28),
    marginTop: verticalScale(40),
  },

  promotionText: {
    color: Colors.white,
    textAlign: "center",
    fontFamily: "SFProBold",
    fontSize: moderateScale(32),
    marginTop: verticalScale(40),
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

  unlockButton: {
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(72),
    marginTop: verticalScale(12),
    backgroundColor: Colors.blue2,
    borderRadius: moderateScale(36),
  },

  unlockButtonText: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(24),
  },

  footer: {
    width: "80%",
    flexDirection: "row",
    alignSelf: "center",
    marginTop: verticalScale(24),
    justifyContent: "space-between",
  },

  footerTexts: {
    color: Colors.lightGray,
    fontSize: moderateScale(14),
  },
});
