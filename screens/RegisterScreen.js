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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "../firebaseConfig";

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  //Clear Error
  const resetErrors = () => {
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
  };

  //ตรวจสอบ Error
  const handleRegister = async () => {
    resetErrors();
    if (isSubmitting) return;

    let hasError = false;
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setEmailError("Please enter your email address");
      hasError = true;
    } else if (!cleanEmail.includes("@")) {
      setEmailError("Please enter a valid email address");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Please create a password");
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      hasError = true;
    }

    if (hasError) return;

    //Register
    try {
      setIsSubmitting(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );
      const user = userCredential.user;

      await set(ref(db, "users/" + user.uid), {
        email: user.email,
        createdAt: new Date().toISOString(),
      });

      navigation.replace("Login");
      
    } catch (err) {
      switch (err.code) {
        case "auth/email-already-in-use":
          setEmailError("This email is already registered");
          break;
        case "auth/invalid-email":
          setEmailError("Please enter a valid email address");
          break;
        case "auth/weak-password":
          setPasswordError("Password must be at least 6 characters");
          break;
        default:
          setEmailError("Unable to create account right now. Please try again.");
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
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Register a staff account for this POS.
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
              placeholder="Create password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}

            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            {confirmPasswordError ? (
              <Text style={styles.error}>{confirmPasswordError}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
              Already have an account? <Text style={styles.linkBold}>Sign in</Text>
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
