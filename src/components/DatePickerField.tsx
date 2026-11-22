import React, { useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minimumDate?: Date | string;
  maximumDate?: Date;
}

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date();
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
}) => {
  const [visible, setVisible] = useState(false);
  const resolvedMinimumDate =
    typeof minimumDate === "string" ? parseDate(minimumDate) : minimumDate;

  const handleNativeChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    setVisible(false);
    if (event.type === "set" && selectedDate) {
      onChange(formatDate(selectedDate));
    }
  };

  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs font-semibold text-slate-700">{label}</Text>
      {Platform.OS === "web" ? (
        React.createElement("input", {
          type: "date",
          value,
          min: resolvedMinimumDate
            ? formatDate(resolvedMinimumDate)
            : undefined,
          max: maximumDate ? formatDate(maximumDate) : undefined,
          onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
            onChange(event.target.value),
          "aria-label": label,
          style: {
            boxSizing: "border-box",
            width: "100%",
            height: 44,
            padding: "0 16px",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            backgroundColor: "#FFFFFF",
            color: "#14141F",
            fontSize: 14,
          },
        })
      ) : (
        <>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() => setVisible(true)}
            className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <Text className="text-sm text-ink">
              {value || "Select a date"}
            </Text>
            <Text className="text-sm text-primary">Choose date</Text>
          </TouchableOpacity>
          {visible && (
            <DateTimePicker
              value={parseDate(value)}
              mode="date"
              display={Platform.OS === "ios" ? "compact" : "calendar"}
              minimumDate={resolvedMinimumDate}
              maximumDate={maximumDate}
              onChange={handleNativeChange}
            />
          )}
        </>
      )}
    </View>
  );
};
