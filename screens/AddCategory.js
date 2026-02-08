import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
} from "react-native";
import { ref, push, set } from "firebase/database";
import { db } from "../firebaseConfig";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Icons Category
const ICONS = [
  "silverware-fork-knife",
  "hamburger",
  "pizza",
  "ice-cream",
  "coffee",
  "food",
  "food-apple",
  "noodles",
  "cupcake",
  "beer",
  "bottle-wine",
];

export default function AddCategory({ navigation }) {
  const [name, setName] = useState("");
  const [order, setOrder] = useState("");
  const [icon, setIcon] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  // ✅ error states
  const [nameError, setNameError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [iconError, setIconError] = useState("");

  // Add Category
  const handleAdd = async () => {
    let hasError = false;
    setNameError("");
    setOrderError("");
    setIconError("");

    if (!name.trim()) {
      setNameError("Category name is required");
      hasError = true;
    }
    if (!icon) {
      setIconError("Please select an icon");
      hasError = true;
    }
    if (!order.trim()) {
      setOrderError("Sort order is required");
      hasError = true;
    } else if (isNaN(order) || parseInt(order) <= 0) {
      setOrderError("Sort order must be a number greater than 0");
      hasError = true;
    }

    if (hasError) return;

    try {
      const newRef = push(ref(db, "categories"));
      await set(newRef, {
        id: newRef.key,
        name: name.trim(),
        icon,
        order: parseInt(order),
        createdAt: new Date().toISOString(),
      });
      navigation.goBack();
    } catch (err) {
      console.log("Firebase Error:", err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Add Category</Text>

        <Text style={styles.label}>Category Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Main Dishes"
          value={name}
          onChangeText={setName}
        />
        {nameError ? <Text style={styles.error}>{nameError}</Text> : null}

        <Text style={styles.label}>Choose Icon</Text>
        <TouchableOpacity
          style={styles.iconPicker}
          onPress={() => setModalVisible(true)}
        >
          {icon ? (
            <MaterialCommunityIcons name={icon} size={28} color="#2e7d32" />
          ) : (
            <Text style={{ color: "gray" }}>Select an icon</Text>
          )}
        </TouchableOpacity>
        {iconError ? <Text style={styles.error}>{iconError}</Text> : null}

        <Text style={styles.label}>Sort Order</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 1"
          value={order}
          onChangeText={setOrder}
          keyboardType="numeric"
        />
        {orderError ? <Text style={styles.error}>{orderError}</Text> : null}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal เลือก Icon */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Choose an Icon</Text>
          <FlatList
            data={ICONS}
            numColumns={4}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.iconOption}
                onPress={() => {
                  setIcon(item);
                  setModalVisible(false);
                }}
              >
                <MaterialCommunityIcons name={item} size={32} color="#2e7d32" />
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2e7d32",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginBottom: 5,
    backgroundColor: "#fafafa",
  },
  error: { color: "red", marginBottom: 10, marginLeft: 5 },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 5,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "gray",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 5,
  },
  closeButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  iconPicker: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  modalContainer: { flex: 1, padding: 20, backgroundColor: "#fff" },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2e7d32",
  },
  iconOption: {
    flex: 1,
    margin: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
