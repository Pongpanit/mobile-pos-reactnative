import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import BottomTabs from "./BottomTabs";

import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import AddCategory from "./screens/AddCategory";
import CategoryDetailScreen from "./screens/CategoryDetailScreen";
import AddItem from "./screens/AddItem";

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  //ตรวจสอบ Login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setInitialRoute(user ? "Main" : "Login");
    });
    return unsubscribe;
  }, []);

  if (!initialRoute) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        <Stack.Screen name="Main" component={BottomTabs} />

        <Stack.Screen name="AddCategory" component={AddCategory} />
        <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
        <Stack.Screen name="AddItem" component={AddItem} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
