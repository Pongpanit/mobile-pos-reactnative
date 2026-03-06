import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ref, push, set } from "firebase/database";
import { db } from "../firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import useAppAlert from "../hooks/useAppAlert";

export default function AddItem({ navigation, route }) {
  const { showAlert, alertModal } = useAppAlert();
  const category = route.params?.category;
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Error states
  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");

  // Reset errors
  const resetErrors = () => {
    setNameError("");
    setPriceError("");
  };

  // Image from Phone
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert({
          title: "Permission required",
          message: "Please allow gallery access to select image.",
        });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (err) {
      console.log("ImagePicker Error:", err.message);
    }
  };

  // Add Menu
  const handleAdd = async () => {
    resetErrors();
    let hasError = false;

    if (!category?.id) {
      showAlert({
        title: "Missing category",
        message: "Please open this screen from a category page.",
      });
      return;
    }

    if (isSubmitting) return;

    if (!name.trim()) {
      setNameError("Food name is required");
      hasError = true;
    }

    const parsedPrice = parseFloat(price);

    if (!price.trim()) {
      setPriceError("Price is required");
      hasError = true;
    } else if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setPriceError("Price must be a number greater than 0");
      hasError = true;
    }

    if (hasError) return;

    try {
      setIsSubmitting(true);
      const newRef = push(ref(db, "items"));
      await set(newRef, {
        id: newRef.key,
        categoryId: category.id,
        name: name.trim(),
        price: parsedPrice,
        description: description.trim(),
        image: image,
        createdAt: new Date().toISOString(),
      });
      navigation.goBack();
    } catch (err) {
      console.log("Firebase Error:", err.message);
      showAlert({
        title: "Save failed",
        message: "Unable to add menu item. Please try again.",
      });
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
          <View style={styles.card}>
            <Text style={styles.title}>Add Menu to {category?.name || "Category"}</Text>
            <Text style={styles.subtitle}>Create menu details for POS selling</Text>

            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholder}>
                <MaterialCommunityIcons name="image-off" size={40} color="gray" />
              </View>
            )}

            <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
              <Text style={styles.imageBtnText}>Select Image</Text>
            </TouchableOpacity>

      {/* Name Input */}
            <TextInput
              style={styles.input}
              placeholder="Food Name"
              value={name}
              onChangeText={setName}
            />
            {nameError ? <Text style={styles.error}>{nameError}</Text> : null}

      {/* Price Input */}
            <TextInput
              style={styles.input}
              placeholder="Price"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
            {priceError ? <Text style={styles.error}>{priceError}</Text> : null}

      {/* Description Input */}
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

      {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, isSubmitting && styles.buttonDisabled]}
                onPress={handleAdd}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Save Item</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {alertModal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f6f9f7" },
  keyboardView: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "flex-start",
    backgroundColor: "#f6f9f7",
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d9e4dd",
    borderRadius: 18,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
    color: "#1f5f2b",
  },
  subtitle: {
    textAlign: "center",
    color: "#6a7b71",
    marginBottom: 18,
    fontSize: 13,
  },
  input: {
    borderWidth: 1.2,
    borderColor: "#d9e4dd",
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: "#fff",
  },
  error: {
    color: "red",
    marginBottom: 10,
    marginLeft: 5,
    fontSize: 13,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: 10,
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#e6ebe8",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 10,
  },
  imageBtn: {
    backgroundColor: "#2e7d32",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  imageBtnText: { color: "#fff", fontWeight: "bold" },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#2e7d32",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 5,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "gray",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 5,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
