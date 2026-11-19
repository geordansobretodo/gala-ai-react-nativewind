import React from "react";
import { View } from "react-native";

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 760,
}) => (
  <View style={{ width: "100%", maxWidth, alignSelf: "center" }}>
    {children}
  </View>
);
