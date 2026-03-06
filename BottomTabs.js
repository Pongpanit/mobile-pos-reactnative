import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import HomeScreen from "./screens/HomeScreen";
import SellScreen from "./screens/SellScreen";
import ReportScreen from "./screens/ReportScreen.js";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2e7d32",
        tabBarInactiveTintColor: "#7c8a83",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
        tabBarStyle: {
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 12,
          borderRadius: 18,
          height: 68,
          paddingTop: 6,
          paddingBottom: 8,
          borderTopColor: "#d9e4dd",
          borderTopWidth: 1,
          backgroundColor: "#ffffff",
          elevation: 0,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = "home";
          else if (route.name === "Sell") iconName = "cash-register";
          else if (route.name === "Report") iconName = "chart-box";
          return (
            <MaterialCommunityIcons name={iconName} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Menu" }} />
      <Tab.Screen name="Sell" component={SellScreen} options={{ title: "POS" }} />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{ title: "Reports" }}
      />
    </Tab.Navigator>
  );
}
