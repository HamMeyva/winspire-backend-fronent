import { Image } from "expo-image";
import { Stack, useRouter, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import { Platform, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

import "react-native-reanimated";

// utils
import { API } from "@/utils/api";

// context
import { categoriesStore, offeringsStore } from "@/context/store";
import { AuthProvider, useAuth } from "@/context/auth";

SplashScreen.preventAutoHideAsync();

// Authentication navigation handler component
function AuthenticationGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [initialRouteChecked, setInitialRouteChecked] = useState(false);

  // Handle navigation based on auth state
  useEffect(() => {
    // Henüz yükleme tamamlanmadıysa işlem yapma
    if (isLoading) return;
    
    // İlk kontrolü yaptık mı kontrol ediyoruz
    if (!initialRouteChecked) {
      // İlk kontrol yapıldı olarak işaretle
      setInitialRouteChecked(true);
      
      // Uygulama başlangıç mantığı:
      // Kullanıcı giriş yapmamışsa veya segments[0] undefined ise login'e yönlendir
      if (!user || segments[0] === undefined) {
        if (segments[0] !== 'login') {
          router.replace('/login');
        }
      } else if (user && segments[0] === 'login') {
        // Kullanıcı giriş yapmış ve login sayfasındaysa ana sayfaya yönlendir
        router.replace('/');
      }
    }
  }, [isLoading, user, segments, router, initialRouteChecked]);
  
  // Sonraki navigasyon kontrolleri için ayrı bir useEffect kullanıyoruz
  useEffect(() => {
    if (isLoading || !initialRouteChecked) return;
    
    // Login olmadan korumalı sayfalara erişim kontrolü
    const isInProtectedRoute = segments[0] !== 'login' && segments[0] !== undefined;
    if (!user && isInProtectedRoute) {
      router.replace('/login');
    }
  }, [user, segments, isLoading, initialRouteChecked]);

  // Yükleme ekranı
  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212'}}>
        <Text style={{color: '#FFFFFF', fontSize: 16}}>Yükleniyor...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayout() {
  const [loaded] = useFonts({
    SFProBold: require("../assets/fonts/SFProBold.otf"),
    SFProMedium: require("../assets/fonts/SFProMedium.otf"),
  });
  
  // Add state to track API initialization
  const [apiInitialized, setApiInitialized] = useState(false);

  const prefetchImages = () => {
    console.log("DEBUG: Prefetch images placeholder called");
    // Only prefetch images if there are actual categories with images
    if (categoriesStore.categories && Object.keys(categoriesStore.categories).length > 0) {
      for (let i of Object.keys(categoriesStore.categories)) {
        for (let j of Object.keys(categoriesStore.categories[i])) {
          if (
            categoriesStore.categories[i][j].images && 
            categoriesStore.categories[i][j].images.default
          ) {
            Image.prefetch(
              [
                categoriesStore.categories[i][j].images.default,
                categoriesStore.categories[i][j].images.completed,
              ],
              "memory-disk"
            );
          }
        }
      }
    }
  };

  const getOfferings = async () => {
    // Placeholder for subscription offerings
    console.log("DEBUG: Initializing placeholder offerings");
    offeringsStore.offerings = { 
      all: { 
        default: {
          weekly: { product: { pricePerWeekString: "$0.00", pricePerYearString: "$0.00" } },
          annual: { product: { pricePerWeekString: "$0.00", pricePerYearString: "$0.00" } }
        },
        sale: {
          annual: { product: { pricePerWeekString: "$0.00", pricePerYearString: "$0.00" } }
        }
      } 
    };
    console.log("DEBUG: Offerings initialized:", JSON.stringify(offeringsStore.offerings));
  };

  // Initialize the new API structure
  const initializeApi = async () => {
    try {
      console.log("DEBUG: Initializing API for new backend");
      
      // Get the correct backend URL - use a dev mode flag to switch between environments
      // For development testing on physical device, use your computer's local IP address
      // For simulator testing, you can use localhost
      const isSimulator = Platform.OS === 'ios' && !Platform.isPad && !Platform.isTV;
      
      // IMPORTANT: Always use your computer's network IP address for development
      // This ensures the app works on both simulators and physical devices
      const baseUrl = 'http://192.168.1.110:5010';
      
      console.log(`DEBUG: Using API base URL: ${baseUrl}`);
      
      // For troubleshooting:
      // - If using a simulator, you could use 'http://localhost:5010'
      // - If on a physical device, you must use your computer's network IP
      // - Emulators might need to use '10.0.2.2:5010' (Android specific)
      
      console.log(`DEBUG: Using API base URL: ${baseUrl}`);
      
      // Initialize API client with backend URL
      await API.initialize(baseUrl);
      
      // Check API endpoints to verify connection and API structure
      console.log("DEBUG: Checking API endpoints");
      const endpointsWorking = await API.checkApiEndpoints();
      
      if (endpointsWorking) {
        console.log("DEBUG: API endpoints check successful");
      } else {
        console.error("DEBUG: API endpoints check failed - check your backend URL and ensure server is running");
        console.error(`DEBUG: Attempted connection to: ${baseUrl}`);
      }
      
      // Call placeholder API methods
      await API.setCategories();
      await API.setInfo();
      await API.setSocial();
      await API.setLimitedTimeSettings();
      
      // Set API as initialized
      setApiInitialized(true);
      console.log("DEBUG: API initialized successfully");
    } catch (error) {
      console.error("DEBUG: Error initializing API:", error);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      console.log("DEBUG: Starting app initialization");
      
      try {
        await getOfferings();
        console.log("DEBUG: getOfferings completed");
        
        await initializeApi();
        console.log("DEBUG: API initialization completed");
        
        // Only prefetch images if needed after API is initialized
        prefetchImages();
        console.log("DEBUG: prefetchImages called");
        
        console.log("DEBUG: App initialization completed");
      } catch (error) {
        console.error("DEBUG: Error during initialization:", error);
      }
    };
    
    initializeApp();
  }, []);

  // Determine when to hide splash screen based on minimal conditions
  if (loaded && apiInitialized) {
    console.log("DEBUG: All conditions met, hiding splash screen");
    console.log("DEBUG: Fonts loaded:", loaded);
    console.log("DEBUG: API initialized:", apiInitialized);
    
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);
  } else {
    console.log("DEBUG: Splash screen conditions not met");
    console.log("DEBUG: Fonts loaded:", loaded);
    console.log("DEBUG: API initialized:", apiInitialized);
    
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Loading app...</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <AuthenticationGuard>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack>

        <StatusBar style="auto" />
      </AuthenticationGuard>
    </AuthProvider>
  );
}

// Make sure the default export is properly recognized by Expo Router
const LayoutRoot = observer(RootLayout);
export default LayoutRoot;
