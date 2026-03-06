import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ref, onValue, remove, update } from "firebase/database";
import { db, auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import useAppAlert from "../hooks/useAppAlert";

// Icon list
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

export default function HomeScreen({ navigation }) {
  const { showAlert, alertModal } = useAppAlert();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [iconModalVisible, setIconModalVisible] = useState(false);

  const [editName, setEditName] = useState("");
  const [editOrder, setEditOrder] = useState("");
  const [editIcon, setEditIcon] = useState("food");
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Load categories
  useEffect(() => {
    const categoriesRef = ref(db, "categories");
    const unsubscribe = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const sorted = Object.values(data).sort(
          (a, b) => (a.order || 9999) - (b.order || 9999)
        );
        setCategories(sorted);
      } else {
        setCategories([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const configuredCount = useMemo(
    () => categories.filter((category) => category.icon && category.order).length,
    [categories]
  );

  // Open edit modal
  const openEditModal = (category) => {
    setSelectedCategory(category);
    setEditName(category.name);
    setEditOrder(String(category.order || ""));
    setEditIcon(category.icon || "food");
    setEditModalVisible(true);
  };

  // Save category
  const handleSave = () => {
    if (!selectedCategory) return;

    if (!editName.trim()) {
      showAlert({ title: "Validation", message: "Category name is required" });
      return;
    }

    const parsedOrder = parseInt(editOrder, 10);
    if (!editOrder.trim() || isNaN(parsedOrder) || parsedOrder <= 0) {
      showAlert({
        title: "Validation",
        message: "Sort order must be a number greater than 0",
      });
      return;
    }

    if (selectedCategory && editName.trim()) {
      update(ref(db, "categories/" + selectedCategory.id), {
        name: editName.trim(),
        icon: editIcon,
        order: parsedOrder,
      });
      setEditModalVisible(false);
    }
  };

  // Delete category
  const handleDelete = () => {
    if (selectedCategory) {
      showAlert({
        title: "Delete Category",
        message: `Are you sure you want to delete "${selectedCategory.name}"?`,
        buttons: [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              remove(ref(db, "categories/" + selectedCategory.id));
              setEditModalVisible(false);
            },
          },
        ],
      });
    }
  };

  // Logout
  const handleLogout = () => {
    showAlert({
      title: "Logout",
      message: "Are you sure you want to log out?",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.replace("Login");
            } catch (error) {
              console.log("Logout Error:", error.message);
            }
          },
        },
      ],
    });
  };

  // Render category card
  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => navigation.navigate("CategoryDetail", { category: item })}
    >
      <View style={styles.orderBadge}>
        <Text style={styles.orderText}>#{item.order || "-"}</Text>
      </View>
      <MaterialCommunityIcons
        name={item.icon || "food"}
        size={36}
        color="#2e7d32"
        style={{ marginBottom: 10 }}
      />
      <Text style={styles.categoryText}>{item.name}</Text>
      <Text style={styles.categoryHint}>Tap to manage menu</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topPanel}>
        <View
          style={[
            styles.header,
            { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
          ]}
        >
          <View>
            <Text style={styles.title}>Restaurant POS</Text>
            <Text style={styles.subtitle}>Menu categories and setup</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <MaterialCommunityIcons name="logout" size={24} color="#2e7d32" />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryBox}>
          <View>
            <Text style={styles.summaryLabel}>Total Categories</Text>
            <Text style={styles.summaryValue}>{categories.length}</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Configured</Text>
            <Text style={styles.summaryValue}>{configuredCount}</Text>
          </View>
        </View>
      </View>

      {/* Categories Section */}
      <View style={styles.sectionRow}>
        <Text style={styles.section}>Categories</Text>

        <View style={styles.rightButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#2e7d32" }]}
            onPress={() => navigation.navigate("AddCategory")}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={styles.actionText}>Category</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#388e3c" }]}
            onPress={() => setModalVisible(true)}
          >
            <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category List */}
      {isLoading ? (
        <Text style={styles.noData}>Loading categories...</Text>
      ) : categories.length === 0 ? (
        <Text style={styles.noData}>No categories yet</Text>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* Modal: Select Category */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Category to Edit</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <MaterialCommunityIcons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>

                <ScrollView>
                  {categories.map((cat) => (
                    <View key={cat.id} style={styles.editRow}>
                      <MaterialCommunityIcons
                        name={cat.icon || "food"}
                        size={24}
                        color="#2e7d32"
                        style={{ marginRight: 10 }}
                      />
                      <Text style={{ flex: 1, fontSize: 16 }}>{cat.name}</Text>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => {
                          openEditModal(cat);
                          setModalVisible(false);
                        }}
                      >
                        <MaterialCommunityIcons
                          name="pencil"
                          size={20}
                          color="#388e3c"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal: Edit Category */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                style={styles.modalKeyboard}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
              >
                <View style={styles.modalContent}>
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.modalForm}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Edit Category</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Category name"
                    />
                    <TextInput
                      style={styles.input}
                      value={editOrder}
                      onChangeText={setEditOrder}
                      placeholder="Sort order"
                      keyboardType="numeric"
                    />
                    <View style={{ marginBottom: 15 }}>
                      <Text style={{ fontWeight: "600", marginBottom: 6 }}>Icon</Text>
                      <TouchableOpacity
                        style={styles.iconPicker}
                        onPress={() => setIconModalVisible(true)}
                      >
                        <MaterialCommunityIcons
                          name={editIcon}
                          size={28}
                          color="#2e7d32"
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.modalButtons}>
                      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={styles.btnText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                        <Text style={styles.btnText}>Delete</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => setEditModalVisible(false)}
                      >
                        <Text style={styles.btnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal: Icon Picker */}
      <Modal visible={iconModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Choose an Icon</Text>
          <ScrollView
            contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap" }}
          >
            {ICONS.map((i) => (
              <TouchableOpacity
                key={i}
                style={styles.iconOption}
                onPress={() => {
                  setEditIcon(i);
                  setIconModalVisible(false);
                }}
              >
                <MaterialCommunityIcons name={i} size={32} color="#2e7d32" />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIconModalVisible(false)}
          >
            <Text style={styles.btnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      {alertModal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f9f7" },
  topPanel: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderColor: "#d9e4dd",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 8,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#1f5f2b" },
  subtitle: { fontSize: 13, color: "#5f7265", marginTop: 2 },
  logoutBtn: { padding: 6 },
  summaryBox: {
    marginHorizontal: 15,
    marginBottom: 14,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#d9e4dd",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: { color: "#6c7d72", fontSize: 12 },
  summaryValue: { color: "#1f5f2b", fontSize: 22, fontWeight: "700", marginTop: 2 },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 15,
  },
  section: { fontSize: 20, fontWeight: "bold", color: "#2e7d32" },
  rightButtons: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 5,
    fontSize: 14,
  },
  noData: {
    fontSize: 15,
    color: "#6c7d72",
    textAlign: "center",
    marginVertical: 10,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingVertical: 22,
    borderRadius: 15,
    marginBottom: 12,
    marginHorizontal: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d9e4dd",
    minHeight: 150,
  },
  orderBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#e6f2e9",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  orderText: { color: "#2e7d32", fontSize: 12, fontWeight: "700" },
  categoryText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2e7d32",
    textAlign: "center",
  },
  categoryHint: { marginTop: 4, color: "#6c7d72", fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalKeyboard: {
    width: "85%",
    maxHeight: "80%",
  },
  modalContent: {
    width: "100%",
    maxHeight: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalForm: {
    paddingBottom: 6,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 6,
  },
  iconBtn: {
    padding: 6,
    backgroundColor: "#f1f8e9",
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  saveBtn: {
    flex: 1,
    backgroundColor: "#2e7d32",
    padding: 10,
    borderRadius: 8,
    marginRight: 5,
    alignItems: "center",
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#b3261e",
    padding: 10,
    borderRadius: 8,
    marginLeft: 5,
    alignItems: "center",
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "gray",
    padding: 10,
    borderRadius: 8,
    marginLeft: 5,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold" },
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
  iconOption: {
    width: "25%",
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    backgroundColor: "#2e7d32",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
});
