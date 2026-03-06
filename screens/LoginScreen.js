import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  //Clear Error
  const resetErrors = () => {
    setEmailError("");
    setPasswordError("");
  };

  //ตรวจสอบ Error
  const handleLogin = async () => {
    resetErrors();
    let hasError = false;

    if (isSubmitting) return;

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setEmailError("Please enter your email address");
      hasError = true;
    } else if (!cleanEmail.includes("@")) {
      setEmailError("Please enter a valid email address");
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError("Please enter your password");
      hasError = true;
    }

    if (hasError) return;

    //Login
    try {
      setIsSubmitting(true);
      await signInWithEmailAndPassword(auth, cleanEmail, password);
      navigation.replace("Main");
    } catch (err) {
      switch (err.code) {
        case "auth/invalid-email":
          setEmailError("Please enter a valid email address");
          break;
        case "auth/user-not-found":
          setEmailError("No account found for this email");
          break;
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setPasswordError("Incorrect email or password");
          break;
        case "auth/too-many-requests":
          setPasswordError("Too many failed attempts. Please try again later");
          break;
        default:
            setEmailError("Unable to sign in right now. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formCard}>
            <Text style={styles.badge}>Restaurant POS</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to manage orders and sales.
            </Text>

            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="name@restaurant.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
            {emailError ? <Text style={styles.error}>{emailError}</Text> : null}

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
            
            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.link} onPress={() => navigation.navigate("Register")}>
              New here? <Text style={styles.linkBold}>Create an account</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f6f9f7" },
  keyboardView: { flex: 1 },
  container: {
    justifyContent: "flex-start",
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 20,
  },
  formCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d9e4dd",
    borderRadius: 20,
    padding: 20,
  },
  badge: {
    alignSelf: "center",
    color: "#2e7d32",
    backgroundColor: "#edf6f0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    textAlign: "center",
    color: "#1f5f2b",
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#6a7b71",
    marginTop: 4,
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    color: "#567063",
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1.2,
    borderColor: "#cfdbd3",
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  error: { color: "red", marginBottom: 10, marginLeft: 5 },
  button: {
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { marginTop: 18, textAlign: "center", color: "#388e3c", fontSize: 14 },
  linkBold: { fontWeight: "bold" },
});
