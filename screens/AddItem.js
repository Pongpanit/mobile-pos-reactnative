import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { ref, push, set } from "firebase/database";
import { db } from "../firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function AddItem({ navigation, route }) {
  const category = route.params?.category;
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

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
        alert("Permission to access gallery is required!");
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

    if (!name.trim()) {
      setNameError("Food name is required");
      hasError = true;
    }

    if (!price.trim()) {
      setPriceError("Price is required");
      hasError = true;
    } else if (isNaN(price) || parseFloat(price) <= 0) {
      setPriceError("Price must be a number greater than 0");
      hasError = true;
    }

    if (hasError) return;

    try {
      const newRef = push(ref(db, "items"));
      await set(newRef, {
        id: newRef.key,
        categoryId: category.id,
        name: name.trim(),
        price: parseFloat(price),
        description: description.trim(),
        image: image,
        createdAt: new Date().toISOString(),
      });
      navigation.goBack();
    } catch (err) {
      console.log("Firebase Error:", err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Menu to {category?.name}</Text>

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
      />

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
          <Text style={styles.buttonText}>Save Item</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, justifyContent: "center" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2e7d32",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: "#fafafa",
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
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 10,
  },
  imageBtn: {
    backgroundColor: "#2e7d32",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  imageBtnText: { color: "#fff", fontWeight: "bold" },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#2e7d32",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 5,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "gray",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 5,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
