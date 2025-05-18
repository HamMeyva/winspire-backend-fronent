import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from '@/context/auth';

function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, signInWithTestAccount, isLoading } = useAuth();

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
    // Navigation will be handled by the auth context effect that checks user state
  };
  
  const handleTestLogin = async () => {
    await signInWithTestAccount();
    // Navigation will be handled by the auth context effect that checks user state
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['#121212', '#1E1E1E']}
        style={styles.background}
      />
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>Windspire</Text>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.welcomeText}>Yaşamınızı Değiştirecek</Text>
        <Text style={styles.subtitleText}>Hayat Taktikleri</Text>
        
        <View style={styles.loginButtonsContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
          ) : (
            <>
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleLogin}
                activeOpacity={0.8}
              >
                {/* Use an expo vector icon instead of an image file that might not be resolved correctly */}
                <View style={styles.googleIcon}>
                  <Ionicons name="logo-google" size={20} color="#4285F4" />
                </View>
                <Text style={styles.googleButtonText}>Google ile devam et</Text>
              </TouchableOpacity>
              
              {/* Test Giriş Butonu */}
              <TouchableOpacity
                style={[styles.googleButton, styles.testButton]}
                onPress={handleTestLogin}
                activeOpacity={0.8}
              >
                <View style={styles.googleIcon}>
                  <Ionicons name="person" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.googleButtonText}>Test Hesabı ile Giriş</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      
      <Text style={styles.termsText}>
        Giriş yaparak, Gizlilik Politikası ve Hizmet Şartlarını kabul etmiş olursunuz.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  logo: {
    width: 80,
    height: 80,
  },
  appName: {
    fontFamily: 'SFProBold',
    fontSize: 28,
    color: '#FFFFFF',
    marginTop: 16,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  welcomeText: {
    fontFamily: 'SFProBold',
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitleText: {
    fontFamily: 'SFProMedium',
    fontSize: 18,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 48,
  },
  loginButtonsContainer: {
    width: '100%',
    marginTop: 24,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: '#3498db', 
    marginTop: 8,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontFamily: 'SFProMedium',
    fontSize: 16,
    color: '#121212',
  },
  loader: {
    marginVertical: 20,
  },
  termsText: {
    fontFamily: 'SFProMedium',
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 24,
  },
});

// Ensure a properly formatted default export
export default LoginScreen;
