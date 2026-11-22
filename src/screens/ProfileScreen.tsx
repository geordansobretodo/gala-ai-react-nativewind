import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AppHeader } from "../components/AppHeader";
import { DatePickerField } from "../components/DatePickerField";
import { DropdownField } from "../components/DropdownField";
import { PageContainer } from "../components/PageContainer";
import { useAuth } from "../context/AuthContext";
import { placesApi, plannerApi, profileApi } from "../api/endpoints";
import { SavedPlace } from "../types";

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, setUser, signOut, isDemoMode } = useAuth();

  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [savedPlacesError, setSavedPlacesError] = useState<string | null>(null);
  const [genderOptions, setGenderOptions] = useState<string[]>([]);
  const [genderOptionsLoading, setGenderOptionsLoading] = useState(true);
  const [genderOptionsError, setGenderOptionsError] = useState<string | null>(
    null
  );
  const [selectedPlace, setSelectedPlace] = useState<SavedPlace | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Edit Account Modal
  const [editAccVisible, setEditAccVisible] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || "");
  const [editBirthdate, setEditBirthdate] = useState(user?.birthdate || "");
  const [editGender, setEditGender] = useState(user?.gender || "");

  // Portal / Password Modal
  const [portalVisible, setPortalVisible] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  useEffect(() => {
    plannerApi
      .getOptions()
      .then((options) => setGenderOptions(options.genders))
      .catch(() => {
        setGenderOptionsError("Could not load gender options from the server.");
      })
      .finally(() => {
        setGenderOptionsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user) {
      setSavedPlaces([]);
      return;
    }

    setEditUsername(user.username || "");
    setEditBirthdate(user.birthdate || "");
    setEditGender(user.gender || "");

    if (!isDemoMode) {
      placesApi
        .list()
        .then((items) => {
          setSavedPlaces(items);
          setSavedPlacesError(null);
        })
        .catch(() => {
          setSavedPlaces([]);
          setSavedPlacesError("Could not load saved places from the server.");
        });
    } else {
      setSavedPlaces([]);
      setSavedPlacesError(null);
    }
  }, [user, isDemoMode]);

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
        <AppHeader
          onPressAuth={() => navigation.navigate("Login")}
          onPressBack={() => navigation.navigate("Home")}
        />
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="person-circle-outline" size={72} color="#13357B" />
          <Text className="mt-3 text-xl font-bold text-ink">
            Sign in to view your Profile
          </Text>
          <Text className="mt-1 text-center text-sm text-slate-500">
            Access your personal info and saved trip calendar places.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            className="mt-6 rounded-full bg-primary px-8 py-3.5"
          >
            <Text className="text-sm font-bold text-white">Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handlePickAvatar = async () => {
    setAvatarError(null);
    if (Platform.OS !== "web") {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission required",
          "Allow photo access to update avatar."
        );
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]?.uri) return;

    const asset = result.assets[0];
    if (isDemoMode) {
      setUser((prev) =>
        prev ? { ...prev, avatar_url: asset.uri } : prev
      );
      return;
    }

    setAvatarUploading(true);
    try {
      const updated = await profileApi.uploadAvatar(asset);
      setUser(updated);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Could not upload avatar to Laravel API.";
      setAvatarError(message);
      Alert.alert("Upload failed", message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveAccount = async () => {
    if (!editUsername.trim()) return;
    if (isDemoMode) {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              username: editUsername.trim(),
              birthdate: editBirthdate.trim(),
              gender: editGender,
            }
          : prev
      );
      setEditAccVisible(false);
      return;
    }

    try {
      const updated = await profileApi.updateAccount({
        username: editUsername.trim(),
        birthdate: editBirthdate.trim(),
        gender: editGender,
      });
      setUser(updated);
      setEditAccVisible(false);
    } catch {
      Alert.alert("Error", "Could not update account details.");
    }
  };

  const handleUpdatePassword = async () => {
    if (!oldPass || !newPass || newPass !== confirmPass) {
      Alert.alert("Validation", "New passwords must match.");
      return;
    }
    if (isDemoMode) {
      setPortalVisible(false);
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
      Alert.alert("Updated", "Password updated (Demo Mode).");
      return;
    }

    try {
      await profileApi.updatePassword({
        old_password: oldPass,
        password: newPass,
        password_confirmation: confirmPass,
      });
      setPortalVisible(false);
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
      Alert.alert("Success", "Password updated.");
    } catch {
      Alert.alert("Error", "Incorrect old password or server error.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <AppHeader onPressBack={() => navigation.navigate("Home")} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 20,
        }}
      >
        <PageContainer>
        {/* Profile Header Card */}
        <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              <TouchableOpacity
                disabled={avatarUploading}
                onPress={handlePickAvatar}
              >
                <Image
                  source={
                    user.avatar_url
                      ? { uri: user.avatar_url }
                      : require("../../assets/images/default.jpg")
                  }
                  className="h-16 w-16 rounded-full border-2 border-primary"
                />
                <View className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1">
                  {avatarUploading ? (
                    <Ionicons
                      name="hourglass-outline"
                      size={12}
                      color="#FFFFFF"
                    />
                  ) : (
                    <Ionicons name="camera" size={12} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
              <View>
                <Text className="text-lg font-bold text-ink">
                  {user.username}
                </Text>
                <Text className="text-xs text-slate-500">{user.email}</Text>
                <View className="mt-1 self-start rounded-full bg-emerald-100 px-2.5 py-0.5">
                  <Text className="text-[11px] font-bold text-emerald-800">
                    {user.account_status || "Active"}
                  </Text>
                </View>
                {avatarError && (
                  <Text className="mt-3 text-xs text-red-700">{avatarError}</Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              onPress={signOut}
              className="rounded-xl bg-red-50 px-3 py-2"
            >
              <Text className="text-xs font-bold text-red-600">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Personal Information */}
        <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="mb-3 text-base font-bold text-ink">
            Personal Information
          </Text>

          <View className="gap-2.5">
            <InfoRow label="Name" value={user.username} />
            <InfoRow label="Gender" value={user.gender || "Not set"} />
            <InfoRow label="Address" value={user.address || "Philippines"} />
            <InfoRow label="Age" value={user.age ? String(user.age) : "—"} />
            <InfoRow
              label="Date of Birth"
              value={user.birthdate || "Not set"}
            />
          </View>

          <View className="mt-4 flex-row gap-2.5">
            <TouchableOpacity
              onPress={() => setEditAccVisible(true)}
              className="flex-1 items-center rounded-xl bg-primary py-3"
            >
              <Text className="text-xs font-bold text-white">
                Edit Account Info
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPortalVisible(true)}
              className="flex-1 items-center rounded-xl bg-emerald-600 py-3"
            >
              <Text className="text-xs font-bold text-white">
                Portal & Password
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Saved Places Calendar List */}
        <View className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="mb-3 text-base font-bold text-ink">
            Saved Places Calendar
          </Text>

          {savedPlaces.length === 0 ? (
            <Text className="text-xs text-slate-500">
              {savedPlacesError ||
                "No saved places yet. Plan a trip to save spots to your calendar!"}
            </Text>
          ) : (
            <View className="gap-3">
              {savedPlaces.map((item, idx) => (
                <TouchableOpacity
                  key={`${item.title}_${idx}`}
                  onPress={() => setSelectedPlace(item)}
                  className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-surface p-3.5"
                >
                  <View className="flex-1 pr-2">
                    <Text className="text-sm font-bold text-ink">
                      {item.title}
                    </Text>
                    <Text className="mt-0.5 text-xs text-slate-500">
                      {item.start} • {item.location}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#13357B" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        </PageContainer>
      </ScrollView>

      {/* Place Details Modal */}
      <Modal
        visible={!!selectedPlace}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPlace(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-5">
          <View
            className="w-full rounded-2xl bg-white p-5"
            style={{ maxWidth: 560 }}
          >
            <Text className="mb-3 text-lg font-bold text-ink">
              Place Details
            </Text>
            {selectedPlace && (
              <View className="gap-2">
                <InfoRow label="Title" value={selectedPlace.title} />
                <InfoRow label="Type" value={selectedPlace.type} />
                <InfoRow label="Date" value={selectedPlace.start} />
                <InfoRow label="Location" value={selectedPlace.location} />
                <InfoRow
                  label="Description"
                  value={selectedPlace.description}
                />
              </View>
            )}
            <View className="mt-5 flex-row gap-3">
              {selectedPlace?.id && (
                <TouchableOpacity
                  onPress={async () => {
                    const id = selectedPlace.id!;
                    if (!isDemoMode) {
                      try {
                        await placesApi.remove(id);
                      } catch {
                        Alert.alert("Error", "Could not remove saved place.");
                        return;
                      }
                    }
                    setSavedPlaces((prev) => prev.filter((p) => p.id !== id));
                    setSelectedPlace(null);
                  }}
                  className="flex-1 items-center rounded-xl bg-red-50 py-3"
                >
                  <Text className="text-xs font-bold text-red-600">Remove</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setSelectedPlace(null)}
                className="flex-1 items-center rounded-xl bg-primary py-3"
              >
                <Text className="text-xs font-bold text-white">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Account Modal */}
      <Modal
        visible={editAccVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditAccVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-5">
          <View
            className="w-full rounded-2xl bg-white p-5"
            style={{ maxWidth: 560 }}
          >
            <Text className="mb-4 text-lg font-bold text-ink">
              Personal Account Information
            </Text>

            <Text className="mb-1 text-xs font-semibold text-slate-700">
              Full Name
            </Text>
            <TextInput
              value={editUsername}
              onChangeText={setEditUsername}
              className="mb-3 rounded-xl border border-slate-200 bg-surface px-4 py-2.5 text-sm text-ink"
            />

            <DatePickerField
              label="Birth Date"
              value={editBirthdate}
              onChange={setEditBirthdate}
              maximumDate={new Date()}
            />

            {genderOptionsError && (
              <Text className="mb-2 text-xs text-red-700">
                {genderOptionsError}
              </Text>
            )}
            <DropdownField
              label="Gender"
              value={editGender}
              options={genderOptions}
              loading={genderOptionsLoading}
              onChange={setEditGender}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setEditAccVisible(false)}
                className="flex-1 items-center rounded-xl border border-slate-300 py-3"
              >
                <Text className="text-xs font-bold text-slate-700">Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveAccount}
                className="flex-1 items-center rounded-xl bg-primary py-3"
              >
                <Text className="text-xs font-bold text-white">Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Portal / Change Password Modal */}
      <Modal
        visible={portalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPortalVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-5">
          <View
            className="w-full rounded-2xl bg-white p-5"
            style={{ maxWidth: 560 }}
          >
            <Text className="mb-4 text-lg font-bold text-ink">
              Portal Account Information
            </Text>

            <Text className="mb-1 text-xs font-semibold text-slate-700">
              Old Password
            </Text>
            <TextInput
              value={oldPass}
              onChangeText={setOldPass}
              secureTextEntry
              className="mb-3 rounded-xl border border-slate-200 bg-surface px-4 py-2.5 text-sm text-ink"
            />

            <Text className="mb-1 text-xs font-semibold text-slate-700">
              New Password
            </Text>
            <TextInput
              value={newPass}
              onChangeText={setNewPass}
              secureTextEntry
              className="mb-3 rounded-xl border border-slate-200 bg-surface px-4 py-2.5 text-sm text-ink"
            />

            <Text className="mb-1 text-xs font-semibold text-slate-700">
              Confirm New Password
            </Text>
            <TextInput
              value={confirmPass}
              onChangeText={setConfirmPass}
              secureTextEntry
              className="mb-5 rounded-xl border border-slate-200 bg-surface px-4 py-2.5 text-sm text-ink"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setPortalVisible(false)}
                className="flex-1 items-center rounded-xl border border-slate-300 py-3"
              >
                <Text className="text-xs font-bold text-slate-700">Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdatePassword}
                className="flex-1 items-center rounded-xl bg-primary py-3"
              >
                <Text className="text-xs font-bold text-white">Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View className="flex-row justify-between border-b border-slate-100 pb-2">
    <Text className="text-xs font-semibold text-slate-500">{label}</Text>
    <Text className="max-w-[65%] text-right text-xs font-medium text-ink">
      {value}
    </Text>
  </View>
);
