import { observer } from "mobx-react-lite";
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";

// constants
import { Colors } from "@/constants/Colors";
import { moderateScale, verticalScale, horizontalScale } from "@/constants/Metrics";

// context
import { categoriesStore, contentTypeStore } from "@/context/store";

// utils
import { API } from "@/utils/api";

function Footer({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const categories = Object.keys(categoriesStore.categories);
  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  useEffect(() => {
    // Fetch content types when component mounts
    const fetchContentTypes = async () => {
      setLoading(true);
      try {
        const types = await API.getContentTypes();
        // Filter content types to only include allowed ones, removing 'quote'
        const allowedTypes = types.filter(type => 
          ['hack', 'tip', 'hack2', 'tip2'].includes(type.toLowerCase())
        );
        contentTypeStore.update(allowedTypes);
      } catch (error) {
        console.error("Error fetching content types:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContentTypes();
  }, []);

  // Fetch categories when content type changes
  useEffect(() => {
    if (contentTypeStore.activeContentType) {
      const fetchCategoriesForContentType = async () => {
        setCategoryLoading(true);
        try {
          console.log(`DEBUG: Footer - Fetching categories for content type: ${contentTypeStore.activeContentType}`);
          const categoriesData = await API.getCategoriesByContentType(contentTypeStore.activeContentType);
          console.log(`DEBUG: Footer - Received categoriesData:`, Object.keys(categoriesData));
          console.log(`DEBUG: Footer - Number of categories found: ${Object.keys(categoriesData).length}`);
          
          categoriesStore.update(categoriesData);
          
          // If categories are found, set the activeTab to the first category
          const categoryNames = Object.keys(categoriesData);
          if (categoryNames.length > 0) {
            console.log(`DEBUG: Footer - Setting activeTab to first category: ${categoryNames[0]}`);
            setActiveTab(categoryNames[0]);
          } else {
            console.log(`DEBUG: Footer - No categories found for content type: ${contentTypeStore.activeContentType}`);
          }
        } catch (error) {
          console.error(`Error fetching categories for content type ${contentTypeStore.activeContentType}:`, error);
        } finally {
          setCategoryLoading(false);
        }
      };

      fetchCategoriesForContentType();
    }
  }, [contentTypeStore.activeContentType]);

  // Custom display names for content types
  const getDisplayName = (type: string) => {
    switch (type.toLowerCase()) {
      case 'hack': return 'Hacks';
      case 'hack2': return 'Hacks 2';
      case 'tip': return 'Tips';
      case 'tip2': return 'Tips 2';
      default: return type;
    }
  };

  return (
    <View style={styles.container}>
      {/* Content Type buttons */}
      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : contentTypeStore.contentTypes.length > 0 ? (
          contentTypeStore.contentTypes.map((type) => {
            const isActive = contentTypeStore.activeContentType === type;
            return (
              <Pressable
                key={type}
                style={[
                  styles.footerButton,
                  isActive && styles.activeFooterButton
                ]}
                onPress={() => contentTypeStore.setActiveContentType(type)}
              >
                <Text 
                  style={[
                    styles.footerButtonText,
                    isActive && styles.activeFooterButtonText
                  ]}
                >
                  {getDisplayName(type)}
                </Text>
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No content types found</Text>
        )}
      </View>
    </View>
  );
}

export default observer(Footer);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderTopWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(100), // Reduced height since we only have one row now
    borderTopColor: "#333333",
    backgroundColor: Colors.black,
    paddingBottom: Platform.OS === "ios" ? verticalScale(20) : 0,
  },

  footer: {
    width: "90%",
    flexDirection: "row",
    height: verticalScale(45),
    justifyContent: "space-around",
    backgroundColor: Colors.black,
  },

  footerButton: {
    paddingHorizontal: horizontalScale(15),
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  
  activeFooterButton: {
    backgroundColor: "#333333",
    borderRadius: moderateScale(25),
  },

  footerButtonText: {
    color: Colors.white,
    fontFamily: "SFProMedium",
    fontSize: moderateScale(16),
  },
  
  activeFooterButtonText: {
    fontFamily: "SFProBold",
  },
  
  emptyText: {
    color: Colors.white,
    fontFamily: "SFProMedium",
    fontSize: moderateScale(14),
    textAlign: "center",
    flex: 1,
    alignSelf: "center",
  },
});
