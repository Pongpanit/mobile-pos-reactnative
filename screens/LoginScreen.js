import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    if (!email) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!email.includes("@")) {
      setEmailError("Invalid email format");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    }

    if (hasError) return;

    //Login
    try {
        await signInWithEmailAndPassword(auth, email, password);
        navigation.replace("Main");
    } catch (err) {
      switch (err.code) {
        case "auth/invalid-email":
          setEmailError("Invalid email format");
          break;
        case "auth/user-not-found":
          setEmailError("No account found with this email");
          break;
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setPasswordError("Incorrect email or password");
          break;
        case "auth/too-many-requests":
          setPasswordError("Too many failed attempts. Please try again later");
          break;
        default:
          setEmailError("Unexpected error: " + err.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {emailError ? <Text style={styles.error}>{emailError}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>LOGIN</Text>
      </TouchableOpacity>

      <Text style={styles.link} onPress={() => navigation.navigate("Register")}>
        Don’t have an account? <Text style={styles.linkBold}>Register</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    color: "#2e7d32",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 5,
    padding: 10,
    borderRadius: 8,
  },
  error: { color: "red", marginBottom: 10, marginLeft: 5 },
  button: {
    backgroundColor: "#2e7d32",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { marginTop: 15, textAlign: "center", color: "#388e3c" },
  linkBold: { fontWeight: "bold" },
});
