import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useIdTokenAuthRequest } from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { AppHeader } from "../components/AppHeader";
import { PageContainer } from "../components/PageContainer";
import { useAuth } from "../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { signIn, signInWithGoogle, signInDemo } = useAuth();
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("MainTabs");
    }
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const googleClientIds = {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "not-configured",
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "not-configured",
    androidClientId:
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "not-configured",
  };
  const isGoogleConfigured =
    Platform.OS === "web"
      ? process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
      : Platform.OS === "ios"
        ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
        : process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const [googleRequest, , promptGoogleAuth] = useIdTokenAuthRequest(
    googleClientIds,
    { scheme: "gala-ai", path: "oauthredirect" }
  );

  const handleLogin = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await signIn({ email: email.trim(), password });
      navigation.navigate("MainTabs");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Invalid email or password (or Laravel API is not reachable yet).";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = () => {
    signInDemo();
    navigation.navigate("MainTabs");
  };

  const handleGoogleLogin = async () => {
    if (!isGoogleConfigured) {
      setError(
        `Google sign-in is not configured for ${Platform.OS}. Add the matching EXPO_PUBLIC_GOOGLE_*_CLIENT_ID to frontend/.env and restart Expo.`
      );
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const response = await promptGoogleAuth();
      if (response.type !== "success") {
        if (response.type === "error") {
          setError(response.error?.message || "Google sign-in could not start.");
        }
        return;
      }

      const idToken = response.params.id_token;
      if (!idToken) {
        setError("Google did not return an ID token. Please try again.");
        return;
      }

      await signInWithGoogle(idToken);
      navigation.navigate("MainTabs");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Google sign-in failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <AppHeader onPressBack={handleBack} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          className="px-5 py-6"
        >
          <PageContainer maxWidth={560}>
          <View className="mb-6 items-center">
            <Image
              source={require("../../assets/images/logo1.png")}
              className="h-24 w-48"
              resizeMode="contain"
            />
          </View>

          <View className="rounded-3xl bg-auth-surface p-6 shadow-sm">
            <Text className="mb-5 text-center text-2xl font-bold tracking-wide text-ink">
              WELCOME
            </Text>

            {error && (
              <View className="mb-4 rounded-xl bg-red-100 px-4 py-3">
                <Text className="text-center text-xs font-medium text-red-700">
                  {error}
                </Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="mb-1.5 text-xs font-semibold text-slate-700">
                Email address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@example.com"
                className="rounded-xl bg-white px-4 py-3 text-sm text-ink"
              />
            </View>

            <View className="mb-4">
              <Text className="mb-1.5 text-xs font-semibold text-slate-700">
                Password
              </Text>
              <View className="flex-row items-center rounded-xl bg-white px-4">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Enter your password"
                  className="flex-1 py-3 text-sm text-ink"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#475569"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setRememberMe((prev) => !prev)}
              className="mb-5 flex-row items-center gap-2"
            >
              <Ionicons
                name={rememberMe ? "checkbox" : "square-outline"}
                size={20}
                color="#13357B"
              />
              <Text className="text-sm text-slate-700">Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={submitting}
              onPress={handleLogin}
              className="items-center rounded-xl bg-primary py-3.5"
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-sm font-bold text-white">Sign in</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDemoLogin}
              className="mt-3 items-center rounded-xl border border-primary bg-white/80 py-3"
            >
              <Text className="text-xs font-bold text-primary">
                Continue in Offline Demo Mode
              </Text>
            </TouchableOpacity>

            {/* Social Login Buttons */}
            <View className="mt-6 items-center">
              <Text className="mb-3 text-xs text-slate-600">
                Or sign in with
              </Text>
              <View className="flex-row gap-4">
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Sign in with Google"
                  disabled={submitting || !googleRequest}
                  onPress={handleGoogleLogin}
                  className="h-12 w-12 items-center justify-center rounded-full bg-[#DB4437]"
                >
                  <Ionicons name="logo-google" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="mt-6 flex-row justify-center gap-1">
              <Text className="text-sm text-slate-700">
                Don't have an account?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text className="text-sm font-bold text-primary">Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
          </PageContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
