import { initializeApp } from "firebase/app";
import { 
  initializeAuth, 
  getReactNativePersistence 
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBwy4hmnb2GFCaeRJ5reG6zcbo2VmuTChw",
  authDomain: "pos-app-2e164.firebaseapp.com",
  databaseURL: "https://pos-app-2e164-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pos-app-2e164",
  storageBucket: "pos-app-2e164.appspot.com",
  messagingSenderId: "1013550439402",
  appId: "1:1013550439402:web:2967896366f3c7cf2ab093",
  measurementId: "G-L7ZP796P0E"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getDatabase(app);