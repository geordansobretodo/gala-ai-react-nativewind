import React, { useEffect, useState } from "react";
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
import { AppHeader } from "../components/AppHeader";
import { DatePickerField } from "../components/DatePickerField";
import { DropdownField } from "../components/DropdownField";
import { PageContainer } from "../components/PageContainer";
import { plannerApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { signUp } = useAuth();
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("MainTabs");
    }
  };

  const [genderOptions, setGenderOptions] = useState<string[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    plannerApi
      .getOptions()
      .then((options) => {
        setGenderOptions(options.genders);
      })
      .catch(() => {
        setOptionsError("Could not load registration options from the server.");
      })
      .finally(() => {
        setOptionsLoading(false);
      });
  }, []);

  const handleRegister = async () => {
    setError(null);

    if (
      !username.trim() ||
      !gender ||
      !birthdate.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!/^9\d{9}$/.test(phone.trim())) {
      setError("Enter a valid 10-digit PH mobile number starting with 9.");
      return;
    }

    setSubmitting(true);
    try {
      await signUp({
        username: username.trim(),
        gender,
        birthdate: birthdate.trim(),
        email: email.trim(),
        phone: `+63${phone.trim()}`,
        password,
      });
      navigation.navigate("MainTabs");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Account creation failed. Check your Laravel Sanctum endpoint.";
      setError(msg);
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
        <ScrollView className="px-5 py-6" showsVerticalScrollIndicator={false}>
          <PageContainer maxWidth={560}>
          <View className="mb-5 items-center">
            <Image
              source={require("../../assets/images/logo1.png")}
              className="h-20 w-44"
              resizeMode="contain"
            />
            <Text className="mt-1 text-sm font-medium text-slate-500">
              Explore more, Stress less
            </Text>
          </View>

          <View className="mb-8 rounded-3xl bg-auth-surface p-6 shadow-sm">
            <Text className="text-center text-2xl font-bold text-ink">
              REGISTER
            </Text>
            <Text className="mb-5 mt-1 text-center text-xs text-slate-600">
              Fill in the form to register your account.
            </Text>

            {error && (
              <View className="mb-4 rounded-xl bg-red-100 px-4 py-3">
                <Text className="text-center text-xs font-medium text-red-700">
                  {error}
                </Text>
              </View>
            )}
            {optionsError && (
              <View className="mb-4 rounded-xl bg-red-100 px-4 py-3">
                <Text className="text-center text-xs font-medium text-red-700">
                  {optionsError}
                </Text>
              </View>
            )}

            {/* Full Name */}
            <View className="mb-3">
              <Text className="mb-1 text-xs font-semibold text-slate-700">
                Full Name
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Your full name"
                className="rounded-xl bg-white px-4 py-3 text-sm text-ink"
              />
            </View>

            <DropdownField
              label="Gender"
              value={gender}
              options={genderOptions}
              loading={optionsLoading}
              onChange={setGender}
            />

            {/* Birthdate */}
            <DatePickerField
              label="Birthdate"
              value={birthdate}
              onChange={setBirthdate}
              maximumDate={new Date()}
            />

            {/* Email */}
            <View className="mb-3">
              <Text className="mb-1 text-xs font-semibold text-slate-700">
                Email Address
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

            {/* Phone */}
            <View className="mb-3">
              <Text className="mb-1 text-xs font-semibold text-slate-700">
                Mobile Number
              </Text>
              <View className="flex-row items-center overflow-hidden rounded-xl bg-white">
                <View className="bg-slate-100 px-3 py-3">
                  <Text className="text-sm font-semibold text-slate-700">
                    +63
                  </Text>
                </View>
                <TextInput
                  value={phone}
                  onChangeText={(val) =>
                    setPhone(val.replace(/[^0-9]/g, "").slice(0, 10))
                  }
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholder="9123456789"
                  className="flex-1 px-3 py-3 text-sm text-ink"
                />
              </View>
              <Text className="mt-1 text-[11px] text-slate-500">
                Enter a 10-digit mobile number (e.g., 9123456789).
              </Text>
            </View>

            {/* Password */}
            <View className="mb-5">
              <Text className="mb-1 text-xs font-semibold text-slate-700">
                Password
              </Text>
              <View className="flex-row items-center rounded-xl bg-white px-4">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Create a password"
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
              disabled={submitting}
              onPress={handleRegister}
              className="items-center rounded-xl bg-primary py-3.5"
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-sm font-bold text-white">Sign up</Text>
              )}
            </TouchableOpacity>

            <View className="mt-5 flex-row justify-center gap-1">
              <Text className="text-sm text-slate-700">
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text className="text-sm font-bold text-primary">Sign in.</Text>
              </TouchableOpacity>
            </View>
          </View>
          </PageContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
