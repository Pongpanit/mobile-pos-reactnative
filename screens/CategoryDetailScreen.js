import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
  StatusBar,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { ref, onValue, remove, update } from "firebase/database";
import { db } from "../firebaseConfig";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function CategoryDetailScreen({ route, navigation }) {
  const { category } = route.params;
  const [items, setItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImage, setEditImage] = useState("");

  //Menu from Firebase
  useEffect(() => {
    const itemsRef = ref(db, "items");
    onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const filtered = Object.values(data).filter(
          (i) => i.categoryId === category.id
        );
        setItems(filtered);
      } else {
        setItems([]);
      }
    });
  }, [category.id]);

  //Edit Menu
  const openEditModal = (item) => {
    setEditItem(item);
    setEditName(item.name);
    setEditPrice(item.price.toString());
    setEditDesc(item.description);
    setEditImage(item.image || "");
    setEditModalVisible(true);
  };

  //Update Menu 
  const handleSave = () => {
    if (editItem && editName.trim()) {
      update(ref(db, "items/" + editItem.id), {
        name: editName.trim(),
        price: parseFloat(editPrice),
        description: editDesc.trim(),
        image: editImage,
      });
      setEditModalVisible(false);
    }
  };

  //Delete Menu
  const handleDelete = () => {
    if (editItem) {
      Alert.alert("Delete Menu", `Delete "${editItem.name}"?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            remove(ref(db, "items/" + editItem.id));
            setEditModalVisible(false);
          },
        },
      ]);
    }
  };

  //Images from Phone
  const pickImage = async () => {
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
      setEditImage(result.assets[0].uri);
    }
  };

  //Show Menu
  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.itemImage} />
      ) : (
        <View style={styles.placeholder}>
          <MaterialCommunityIcons name="image-off" size={50} color="gray" />
        </View>
      )}
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemPrice}>฿{item.price}</Text>
      <Text style={styles.itemDesc} numberOfLines={2}>
        {item.description || "No description"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#2e7d32" />
        </TouchableOpacity>

        <Text style={styles.title}>{category.name} Menu</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.topButtons}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#2e7d32" }]}
          onPress={() => navigation.navigate("AddItem", { category })}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.actionText}>Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#388e3c" }]}
          onPress={() => setModalVisible(true)}
        >
          <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <Text style={styles.noData}>No menu yet</Text>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Menu to Edit</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <MaterialCommunityIcons
                      name="close"
                      size={24}
                      color="#000"
                    />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {items.map((i) => (
                    <View key={i.id} style={styles.editRow}>
                      {i.image ? (
                        <Image source={{ uri: i.image }} style={styles.thumb} />
                      ) : (
                        <MaterialCommunityIcons
                          name="image-off"
                          size={28}
                          color="gray"
                          style={{ marginRight: 8 }}
                        />
                      )}

                      <Text style={{ flex: 1, fontSize: 16 }}>{i.name}</Text>

                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => {
                          openEditModal(i);
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

      <Modal visible={editModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Menu</Text>

                {editImage ? (
                  <Image
                    source={{ uri: editImage }}
                    style={styles.previewImage}
                  />
                ) : (
                  <View style={styles.placeholder}>
                    <MaterialCommunityIcons
                      name="image-off"
                      size={40}
                      color="gray"
                    />
                  </View>
                )}
                <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
                  <Text style={styles.imageBtnText}>Select Image</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Name"
                />
                <TextInput
                  style={styles.input}
                  value={editPrice}
                  onChangeText={setEditPrice}
                  placeholder="Price"
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  value={editDesc}
                  onChangeText={setEditDesc}
                  placeholder="Description"
                  multiline
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.btnText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={handleDelete}
                  >
                    <Text style={styles.btnText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.btnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
    color: "#2e7d32",
  },
  noData: { textAlign: "center", color: "gray", marginTop: 20, fontSize: 16 },
  itemCard: {
    flex: 1,
    backgroundColor: "#f1f8e9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    marginHorizontal: 5,
    alignItems: "center",
    elevation: 3,
  },
  itemImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 10,
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  itemName: { fontWeight: "bold", fontSize: 16, textAlign: "center" },
  itemPrice: { color: "#2e7d32", fontWeight: "bold", marginTop: 5 },
  itemDesc: {
    color: "gray",
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
  },
  topButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
    gap: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 5,
    fontSize: 14,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 8,
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
    marginBottom: 10,
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
    backgroundColor: "red",
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
});
