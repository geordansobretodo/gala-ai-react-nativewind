import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

interface AppHeaderProps {
  onPressAuth?: () => void;
  onPressBack?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onPressAuth,
  onPressBack,
}) => {
  const { user, isDemoMode } = useAuth();

  return (
    <View className="bg-primary">
      <View
        className="flex-row items-center justify-between bg-primary px-4 py-3"
        style={{ width: "100%", maxWidth: 960, alignSelf: "center" }}
      >
        <View className="flex-row items-center gap-2">
          {onPressBack && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={onPressBack}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/15"
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <View className="flex-row items-center gap-2">
            <Image
              source={require("../../assets/images/logo.png")}
              style={{ width: 48, height: 48 }}
              resizeMode="contain"
            />
            <Text className="text-lg font-bold tracking-widest text-white">
              GALA.ai
            </Text>
          </View>
        </View>

        {user ? (
          <View className="flex-row items-center gap-2 rounded-full bg-white/15 px-3 py-1.5">
            <Ionicons name="person-circle-outline" size={18} color="#FFFFFF" />
            <Text
              className="text-xs font-semibold text-white"
              numberOfLines={1}
            >
              {user.username}
              {isDemoMode ? " (Demo)" : ""}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={onPressAuth}
            className="flex-row items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5"
          >
            <Ionicons name="log-in-outline" size={16} color="#13357B" />
            <Text className="text-xs font-bold text-primary">Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
