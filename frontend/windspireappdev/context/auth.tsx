import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiClient, apiClient } from '@/utils/apiClient';
import { STORAGE } from '@/utils/storage';

// Register for native Google auth callback
WebBrowser.maybeCompleteAuthSession();

// Define auth context types
type User = {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  accessToken?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithTestAccount: () => Promise<void>;
  signOut: () => Promise<void>;
};

// Create authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Constants
const USER_STORAGE_KEY = '@windspire_user';

// Authentication provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Setup Google authentication - sadece gerekli yapılandırmayı kullan
  const [request, response, promptAsync] = Google.useAuthRequest({
    // iOS ve Android için client ID'ler
    iosClientId: "956150973470-e7e1ej44f404nmst4pg1fvfr8gi7n834.apps.googleusercontent.com",
    androidClientId: "880637816242-07rlti7o61680gd5eemnv1vn1gbitm0n.apps.googleusercontent.com",
    // Expo Go uygulamasında test etmek için web client ID
    webClientId: "880637816242-tr77a1vff78ic1vvtocvkr84sbvuijb1.apps.googleusercontent.com",
    // Yönlendirme URI'ları açıkça belirlenir
    redirectUri: 'com.winspire:/oauth2redirect/google',
    // Kesinlikle ihtiyaç duyulan izinleri belirtle
    scopes: ['profile', 'email']
  });

  // Load user from storage on startup
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // Handle Google authentication response
  useEffect(() => {
    console.log('Auth response received:', response);
    if (response?.type === 'success') {
      console.log('Auth successful, token:', response.authentication);
      const { authentication } = response;
      if (authentication?.accessToken) {
        console.log('Access token received, fetching user info');
        fetchUserInfo(authentication.accessToken);
      } else {
        console.warn('Authentication successful but no access token received');
        setIsLoading(false);
      }
    } else if (response?.type === 'error') {
      console.error('Auth error:', response.error);
      setIsLoading(false);
    } else if (response) {
      console.log('Unknown response type:', response.type);
      setIsLoading(false);
    }
  }, [response]);

  // Fetch user information with Google access token
  const fetchUserInfo = async (accessToken: string) => {
    try {
      console.log('Fetching user info from Google API');
      const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google API error: ${response.status} ${errorText}`);
      }
      
      const userInfo = await response.json();
      console.log('User info received:', { id: userInfo.id, email: userInfo.email });
      
      // Create user object
      const newUser: User = {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        accessToken
      };

      // Register/login user with our backend
      await registerOrLoginWithBackend(newUser);
      
      // Store user in state and AsyncStorage
      setUser(newUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      console.log('User logged in successfully');
    } catch (error) {
      console.error('Error fetching user info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Register or login with our backend
  const registerOrLoginWithBackend = async (user: User) => {
    try {
      // Get the current API base URL from axios instance
      const currentBaseUrl = apiClient.defaults.baseURL || '';
      
      // Type for expected response from backend
      type AuthResponse = {
        status: string;
        data: {
          token?: string;
          user?: {
            id: string;
            email: string;
          }
        }
      };
      
      const response = await ApiClient.post<AuthResponse>('/api/auth/google', {
        googleId: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture
      });
      
      console.log('Backend auth response:', response);
      
      // Update auth header with token if it's returned
      if (response && response.data && response.data.token) {
        ApiClient.initialize(currentBaseUrl, {
          headers: {
            Authorization: `Bearer ${response.data.token}`
          }
        });
      }
    } catch (error) {
      console.error('Error authenticating with backend:', error);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google Sign-in');
      setIsLoading(true);
      
      // Reset all category completion statuses for account change
      await STORAGE.clearAllCategoryStatuses();
      
      // Expo Go'da daha güvenilir çalışması için opsiyonlar
      // Proxy parametresi sürüme göre adaptif şekilde kullanılır
      const result = await promptAsync({ showInRecents: true });
      console.log('Google Sign-in prompt result:', result);
      
      // promptAsync sonucu başarısız ise, yükleme durumunu hemen kapat
      if (result.type !== 'success') {
        console.log('Auth prompt was not successful:', result.type);
        setIsLoading(false);
      }
      // success durumunda, yukarıdaki useEffect response'u yakalayacak
    } catch (error) {
      console.error('Google sign-in error:', error);
      setIsLoading(false);
    }
  };

  // Test giriş metodu
  const signInWithTestAccount = async () => {
    try {
      setIsLoading(true);
      
      // Reset all category completion statuses for account change
      await STORAGE.clearAllCategoryStatuses();
      
      // Test kullanıcısı oluştur
      const testUser: User = {
        id: "test-user-id",
        email: "test@example.com",
        name: "Test Kullanıcı",
        picture: "https://ui-avatars.com/api/?name=Test+User&background=random",
      };
      
      // Kullanıcıyı kaydet
      setUser(testUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(testUser));
      
      console.log("Test kullanıcı ile giriş yapıldı", testUser);
    } catch (error) {
      console.error("Test giriş hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setIsLoading(true);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      
      // Reset all category completion statuses for account change
      await STORAGE.clearAllCategoryStatuses();
      
      // Reset API client auth headers using current base URL
      const currentBaseUrl = apiClient.defaults.baseURL || '';
      ApiClient.initialize(currentBaseUrl);
      
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithGoogle,
        signInWithTestAccount,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
