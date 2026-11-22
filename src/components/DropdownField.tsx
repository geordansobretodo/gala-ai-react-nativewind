import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

interface DropdownFieldProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export const DropdownField: React.FC<DropdownFieldProps> = ({
  label,
  value,
  options,
  onChange,
  loading = false,
  placeholder = "Select an option",
}) => {
  const [open, setOpen] = useState(false);
  const canOpen = !loading && options.length > 0;
  const displayedPlaceholder = loading
    ? "Loading options..."
    : options.length === 0
      ? "No options available"
      : placeholder;

  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs font-semibold text-slate-700">{label}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open, disabled: !canOpen }}
        disabled={!canOpen}
        onPress={() => setOpen((current) => !current)}
        className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
      >
        <Text
          className={`text-sm ${
            value ? "text-ink" : "text-slate-400"
          } ${canOpen ? "" : "opacity-60"}`}
        >
          {value || displayedPlaceholder}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color="#475569"
        />
      </TouchableOpacity>
      {open && (
        <View className="mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: option === value }}
              onPress={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`px-4 py-3 ${
                option === value ? "bg-auth-surface" : "bg-white"
              }`}
            >
              <Text
                className={`text-sm ${
                  option === value ? "font-semibold text-primary" : "text-ink"
                }`}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};
