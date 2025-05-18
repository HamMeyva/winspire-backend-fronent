import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Share,
  Image,
  Dimensions,
  Platform,
  ScrollView,
  Pressable,
  Modal,
} from "react-native";
import { useEffect, useState } from "react";
import * as StoreReview from "expo-store-review";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import ActionManagerScreen from "./ActionManagerScreen";

// constants
import {
  moderateScale,
  horizontalScale,
  verticalScale,
} from "@/constants/Metrics";
import { Colors } from "@/constants/Colors";

// components
import GoAnnualModal from "@/components/GoAnnualModal";
import HacksPreviewScreen from "@/components/HacksPreviewScreen";

// context
import { socialStore } from "@/context/store";

// utils
import { STORAGE } from "@/utils/storage";

const { height } = Dimensions.get("screen");

export default function SettingsPage({
  closeBottomSheet,
}: {
  closeBottomSheet: () => void;
}) {
  const [messageSheetVisible, setMessageSheetVisible] = useState(false);
  const [goAnnualModalVisible, setGoAnnualModalVisible] = useState(false);
  const [actionManagerVisible, setActionManagerVisible] = useState(false);
  const [hacksPreviewVisible, setHacksPreviewVisible] = useState(false);

  const [subscriptionType, setSubscriptionType] = useState("");

  const [offerings, setOfferings] = useState<any>({});

  const getOfferings = async () => {
    // Placeholder for future IAP implementation
    setOfferings({ all: { default: {} } });
  };

  const getCustomerInfo = async () => {
    // Placeholder for future IAP implementation
    const type = await STORAGE.getSubscriptionType();

    if (type !== null) {
      setSubscriptionType(type);
    } else {
      setSubscriptionType("weekly");
    }
  };

  useEffect(() => {
    getOfferings();
    getCustomerInfo();
  }, []);

  return (
    <BottomSheet
      snapPoints={["62%"]}
      enablePanDownToClose
      enableDynamicSizing={false}
      handleStyle={styles.handleStyle}
      onClose={() => closeBottomSheet()}
      handleIndicatorStyle={styles.handleIndicatorStyle}
    >
      <View style={styles.bottomSheetView}>
        <BottomSheetView style={styles.bottomSheetView}>
          <Text style={styles.title}>Settings</Text>
          <TouchableOpacity
            onPress={() => setHacksPreviewVisible(true)}
            style={styles.settingsButton}
          >
            <View style={styles.settingsButtonTextContainer}>
              <Text style={styles.settingsButtonText}>
                Go annual & Save %70
              </Text>

              <Text style={styles.settingsButtonIcon}>💰</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              await Share.share({
                title: "Winspire",
                message:
                  Platform.OS === "android" ? "https://winspire.app" : "",
                url: "https://winspire.app",
              });
            }}
            style={styles.settingsButton}
          >
            <View style={styles.settingsButtonTextContainer}>
              <Text style={styles.settingsButtonText}>Share the app</Text>

              <Text style={styles.settingsButtonIcon}>🔗</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMessageSheetVisible(true)}
            style={styles.settingsButton}
          >
            <View style={styles.settingsButtonTextContainer}>
              <Text style={styles.settingsButtonText}>Send us a message</Text>

              <Text style={styles.settingsButtonIcon}>💬</Text>
            </View>
          </TouchableOpacity>
          
          {/* Aksiyon Yöneticisi Butonu */}
          <TouchableOpacity
            onPress={() => setActionManagerVisible(true)}
            style={styles.settingsButton}
          >
            <View style={styles.settingsButtonTextContainer}>
              <Text style={styles.settingsButtonText}>Kullanıcı Aksiyonları (Admin)</Text>

              <Text style={styles.settingsButtonIcon}>👍</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              if (await StoreReview.hasAction()) {
                const isAvailable = await StoreReview.isAvailableAsync();

                if (isAvailable) {
                  StoreReview.requestReview()
                    .then(() => {
                      console.log("Review requested successfully!");
                    })
                    .catch((error) => {
                      console.error("Error requesting review:", error);
                    });
                }
              }
            }}
            style={styles.settingsButton}
          >
            <View style={styles.settingsButtonTextContainer}>
              <Text style={styles.settingsButtonText}>Rate us</Text>

              <Text style={styles.settingsButtonIcon}>💌</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              onPress={() => {
                Linking.openURL(socialStore.social["instagram"]);
              }}
              style={styles.socialButton}
            >
              <AntDesign
                color="white"
                name="instagram"
                size={moderateScale(28)}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Linking.openURL(socialStore.social["twitter"]);
              }}
              style={styles.socialButton}
            >
              <FontAwesome6
                color="white"
                name="x-twitter"
                size={moderateScale(24)}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Linking.openURL(socialStore.social["tiktok"]);
              }}
              style={styles.socialButton}
            >
              <FontAwesome6
                color="white"
                name="tiktok"
                size={moderateScale(24)}
              />
            </TouchableOpacity>
          </View>
        </BottomSheetView>

        {messageSheetVisible && (
          <BottomSheet
            snapPoints={[height * 0.5]}
            enablePanDownToClose
            enableDynamicSizing={false}
            handleStyle={styles.handleStyle}
            onClose={() => setMessageSheetVisible(false)}
            handleIndicatorStyle={styles.handleIndicatorStyle}
          >
            <BottomSheetView style={styles.messageSheetView}>
              <Text style={styles.messageSheetTitle}>Send us a message</Text>

              <View style={styles.messageSheetContainer}>
                {/*
                <View style={styles.messageSheetButtonContainer}>
                  <TouchableOpacity
                    onPress={() => {
                      Linking.openURL("sms:1-408-555-1212");
                    }}
                    style={styles.messageSheetButton}
                  >
                    <Image
                      style={styles.messageSheetButtonImage}
                      resizeMode="cover"
                      source={require("@/assets/images/icons/messages.png")}
                    />
                  </TouchableOpacity>

                  <Text style={styles.messageSheetButtonTitle}>Messages</Text>
                </View>                
                */}

                <View style={styles.messageSheetButtonContainer}>
                  <TouchableOpacity
                    onPress={() => {
                      Linking.openURL("mailto:winspireapp@gmail.com");
                    }}
                    style={styles.messageSheetButton}
                  >
                    <Image
                      style={styles.messageSheetButtonImage}
                      resizeMode="cover"
                      source={require("@/assets/images/icons/mail.png")}
                    />
                  </TouchableOpacity>

                  <Text style={styles.messageSheetButtonTitle}>Mail</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setMessageSheetVisible(false)}
                style={styles.messageSheetCloseButton}
              >
                <Text style={styles.messageSheetCloseButtonText}>Go back</Text>
              </TouchableOpacity>
            </BottomSheetView>
          </BottomSheet>
        )}

        {goAnnualModalVisible && (
          <GoAnnualModal
            setSubscriptionType={(value) => {
              setSubscriptionType(value);
            }}
            offerings={offerings}
            goAnnualModalVisible={goAnnualModalVisible}
            close={() => setGoAnnualModalVisible(false)}
          />
        )}
        
        {/* Hacks Preview Modal */}
        <Modal
          visible={hacksPreviewVisible}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <HacksPreviewScreen
            visible={hacksPreviewVisible}
            close={() => setHacksPreviewVisible(false)}
            onPurchasePress={() => {
              setHacksPreviewVisible(false);
              setGoAnnualModalVisible(true);
            }}
          />
        </Modal>

        {/* Aksiyon Yöneticisi Ekranı */}
        <ActionManagerScreen 
          visible={actionManagerVisible}
          onClose={() => setActionManagerVisible(false)}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  handleStyle: {
    backgroundColor: Colors.darkGray,
    borderTopLeftRadius: moderateScale(15),
    borderTopRightRadius: moderateScale(15),
  },

  handleIndicatorStyle: { backgroundColor: Colors.white },

  bottomSheetView: {
    flex: 1,
    backgroundColor: Colors.darkGray,
    paddingVertical: verticalScale(20),
  },

  title: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(26),
    marginLeft: horizontalScale(24),
  },

  settingsContainer: {
    width: "90%",
    alignSelf: "center",
    alignItems: "center",
    height: verticalScale(210),
    backgroundColor: Colors.gray,
    marginTop: verticalScale(20),
    borderRadius: moderateScale(15),
  },

  settingsButton: {
    width: "90%",
    alignSelf: "center",
    height: verticalScale(70),
    marginTop: verticalScale(12),
    backgroundColor: Colors.gray,
    borderRadius: moderateScale(15),
  },

  settingsButtonTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: verticalScale(70),
    justifyContent: "space-between",
    paddingHorizontal: horizontalScale(20),
  },

  settingsButtonText: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(20),
  },

  settingsButtonIcon: {
    fontSize: moderateScale(28),
  },

  messageButton: {
    width: "90%",
    alignSelf: "center",
    height: verticalScale(70),
    marginTop: verticalScale(20),
    backgroundColor: Colors.gray,
    borderRadius: moderateScale(15),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },

  messageButtonTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: verticalScale(70),
    justifyContent: "space-between",
    paddingHorizontal: horizontalScale(20),
  },

  messageButtonText: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(20),
  },

  messageButtonIcon: { fontSize: moderateScale(14), color: Colors.black },

  socialButtonsContainer: {
    flexDirection: "row",
    position: "absolute",
    alignSelf: "center",
    justifyContent: "center",
    gap: horizontalScale(12),
    bottom: verticalScale(16),
  },

  socialButton: {
    alignItems: "center",
    justifyContent: "center",
    width: horizontalScale(60),
    height: horizontalScale(60),
    backgroundColor: Colors.gray,
    borderRadius: moderateScale(30),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },

  messageSheetView: {
    flex: 1,
    alignItems: "center",
    gap: verticalScale(40),
    backgroundColor: Colors.darkGray,
    paddingVertical: verticalScale(20),
  },

  messageSheetTitle: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(26),
  },

  messageSheetContainer: {
    flexDirection: "row",
    gap: horizontalScale(32),
  },

  messageSheetButtonContainer: { alignItems: "center", gap: verticalScale(8) },

  messageSheetButton: {
    width: verticalScale(80),
    height: verticalScale(80),
    borderRadius: moderateScale(40),
  },

  messageSheetButtonImage: {
    width: verticalScale(80),
    height: verticalScale(80),
    borderRadius: moderateScale(40),
  },

  messageSheetButtonTitle: {
    color: Colors.white,
    fontFamily: "SFProMedium",
    fontSize: moderateScale(18),
  },

  messageSheetCloseButton: {
    width: "90%",
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(60),
    borderColor: Colors.white,
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(30),
  },

  messageSheetCloseButtonText: {
    color: Colors.white,
    fontFamily: "SFMedium",
    fontSize: moderateScale(20),
  },
});
