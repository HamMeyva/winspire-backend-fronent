import {
  View,
  Text,
  Pressable,
  Dimensions,
  Platform,
  StyleSheet,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

// constants
import {
  moderateScale,
  horizontalScale,
  verticalScale,
} from "@/constants/Metrics";
import { Colors } from "@/constants/Colors";

// context
import { infoStore } from "@/context/store";

// components
import GoAnnualModal from "@/components/GoAnnualModal";

// utils
import { STORAGE } from "@/utils/storage";

const { width, height } = Dimensions.get("window");

// apply stylesheet

export default function InfoPage({
  closeBottomSheet,
}: {
  closeBottomSheet: () => void;
}) {
  const [goAnnualModalVisible, setGoAnnualModalVisible] = useState(false);
  const [infoBottomSheetPage, setInfoBottomSheetPage] = useState<number>(0);

  const decodedInfos = useMemo(() => {
    return infoStore.info.map((info) => decodeURIComponent(String(info)));
  }, [infoStore.info]);

  const [subscriptionType, setSubscriptionType] = useState("");

  const [offerings, setOfferings] = useState<any>({});

  const getOfferings = async () => {
    // Placeholder for future IAP implementation
    return null;
  };

  const getCustomerInfo = async () => {
    // Placeholder for future IAP implementation
    return null;
  };

  useEffect(() => {
    getOfferings();
    getCustomerInfo();
  }, []);

  return (
    <BottomSheet
      handleStyle={{
        backgroundColor: Colors.darkGray,
        borderTopLeftRadius: moderateScale(15),
        borderTopRightRadius: moderateScale(15),
      }}
      snapPoints={["62%"]}
      enablePanDownToClose
      enableDynamicSizing={false}
      onClose={() => closeBottomSheet()}
      handleIndicatorStyle={{ backgroundColor: Colors.white }}
    >
      <BottomSheetView
        style={{
          flex: 1,
          backgroundColor: Colors.darkGray,
          paddingVertical: verticalScale(20),
        }}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ backgroundColor: Colors.darkGray }}
          onMomentumScrollEnd={(event) => {
            const page = Math.round(event.nativeEvent.contentOffset.x / width);

            setInfoBottomSheetPage(page);
          }}
        >
          <View
            style={{
              width: width,
              alignItems: "center",
              gap: verticalScale(20),
            }}
          >
            <Text
              style={{
                color: "white",
                fontFamily: "SFProBold",
                fontSize: moderateScale(18),
              }}
            >
              WINSPIRE: LIFE HACKS FOR WINNERS
            </Text>

            <Text
              style={{
                width: "90%",
                color: "white",
                fontFamily: "SFProMedium",
                fontSize: moderateScale(16),
              }}
            >
              {decodedInfos[0]}
            </Text>
          </View>

          <View
            style={{
              width: width,
              alignItems: "center",
              gap: verticalScale(20),
            }}
          >
            <Text
              style={{
                width: "90%",
                color: "white",
                fontFamily: "SFProMedium",
                fontSize: moderateScale(16),
              }}
            >
              {decodedInfos[1]}
            </Text>
          </View>
        </ScrollView>

        {infoBottomSheetPage === 0 ? (
          <View
            style={{
              width: "100%",
              position: "absolute",
              alignItems: "center",
              bottom:
                Platform.OS === "ios" ? verticalScale(60) : verticalScale(40),
            }}
          >
            <View
              style={{
                flexDirection: "row",
                gap: horizontalScale(8),
              }}
            >
              <View
                style={{
                  width: horizontalScale(10),
                  height: horizontalScale(10),
                  backgroundColor: Colors.white,
                  borderRadius: moderateScale(10),
                }}
              />

              <View
                style={{
                  width: horizontalScale(10),
                  height: horizontalScale(10),
                  backgroundColor: Colors.gray,
                  borderRadius: moderateScale(10),
                }}
              />
            </View>

            <Pressable
              onPress={() => closeBottomSheet()}
              style={{
                width: "85%",
                alignItems: "center",
                justifyContent: "center",
                height: verticalScale(50),
                marginTop: verticalScale(20),
                backgroundColor: Colors.white,
                borderRadius: moderateScale(25),
              }}
            >
              <Text
                style={{
                  color: Colors.black,
                  fontFamily: "SFProBold",
                  fontSize: moderateScale(16),
                }}
              >
                Got It!
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={{
              width: "100%",
              position: "absolute",
              alignItems: "center",
              bottom:
                Platform.OS === "ios" ? verticalScale(60) : verticalScale(40),
            }}
          >
            <View
              style={{
                flexDirection: "row",
                gap: horizontalScale(8),
              }}
            >
              <View
                style={{
                  width: horizontalScale(10),
                  height: horizontalScale(10),
                  backgroundColor: Colors.gray,
                  borderRadius: moderateScale(10),
                }}
              />

              <View
                style={{
                  width: horizontalScale(10),
                  height: horizontalScale(10),
                  backgroundColor: Colors.white,
                  borderRadius: moderateScale(10),
                }}
              />
            </View>

            <View
              style={{
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: horizontalScale(20),
              }}
            >
              <Pressable
                onPress={() => closeBottomSheet()}
                style={{
                  width: "48%",
                  alignItems: "center",
                  justifyContent: "center",
                  height: verticalScale(50),
                  marginTop: verticalScale(20),
                  backgroundColor: Colors.white,
                  borderRadius: moderateScale(25),
                }}
              >
                <Text
                  style={{
                    color: Colors.black,
                    fontFamily: "SFProBold",
                    fontSize: moderateScale(16),
                  }}
                >
                  Got It!
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setGoAnnualModalVisible(true)}
                style={{
                  width: "48%",
                  alignItems: "center",
                  justifyContent: "center",
                  height: verticalScale(50),
                  marginTop: verticalScale(20),
                  backgroundColor: Colors.white,
                  borderRadius: moderateScale(25),
                }}
              >
                <Text
                  style={{
                    color: Colors.black,
                    fontFamily: "SFProBold",
                    fontSize: moderateScale(16),
                  }}
                >
                  Go Annual & Save!
                </Text>
              </Pressable>
            </View>

            {goAnnualModalVisible && (
              <GoAnnualModal
                setSubscriptionType={(value) => {
                  setSubscriptionType(value);
                }}
                offerings={offerings}
                goAnnualModalVisible={goAnnualModalVisible}
                close={async () => setGoAnnualModalVisible(false)}
              />
            )}
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkGray,
  },
});
