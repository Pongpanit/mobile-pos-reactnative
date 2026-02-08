import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { push, ref, set, onValue } from "firebase/database";
import { db } from "../firebaseConfig";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Modal from "react-native-modal";

export default function SellScreen() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartVisible, setCartVisible] = useState(false);

  //Load Categories
  useEffect(() => {
    const catRef = ref(db, "categories");
    onValue(catRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setCategories(Object.values(data));
      else setCategories([]);
    });
  }, []);

  //Load Menu
  useEffect(() => {
    const itemsRef = ref(db, "items");
    onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setItems(Object.values(data));
      else setItems([]);
    });
  }, []);

  //Add Menu to Cart 
  const addToCart = (item) => {
    setCart((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, qty: p.qty + 1 } : p
        );
      } else {
        return [...prev, { ...item, qty: 1 }];
      }
    });
  };

  //Remove Menu from Cart
  const removeFromCart = (item) => {
    setCart((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (!found) return prev;
      if (found.qty > 1) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, qty: p.qty - 1 } : p
        );
      } else {
        return prev.filter((p) => p.id !== item.id);
      }
    });
  };

  //Total Price
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  //Save Sales 
  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert("No items selected");
      return;
    }

    const sale = {
      id: Date.now().toString(),
      items: cart,
      total: total,
      date: new Date().toLocaleString(), 
      timestamp: Date.now(),
    };

    try {
      const newRef = push(ref(db, "sales"));
      await set(newRef, sale);

      Alert.alert("Sale completed", `Total ฿${total}`, [
        { text: "OK", onPress: () => setCart([]) },
      ]);
      setCartVisible(false);
    } catch (err) {
      console.log("Save sale error:", err.message);
    }
  };

  //Show Menu from Category
  const filteredItems = selectedCategory
    ? items.filter((i) => i.categoryId === selectedCategory.id)
    : [];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
        ]}
      >
        <Text style={styles.title}>Sell</Text>
      </View>

      <View style={styles.catContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.catCard,
              selectedCategory?.id === cat.id && styles.catCardActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <MaterialCommunityIcons
              name={cat.icon || "food"}
              size={28}
              color={selectedCategory?.id === cat.id ? "#fff" : "#2e7d32"}
            />
            <Text
              style={[
                styles.catText,
                selectedCategory?.id === cat.id && { color: "#fff" },
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }}>
        {selectedCategory ? (
          filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() => addToCart(item)}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                ) : (
                  <MaterialCommunityIcons name="food" size={40} color="gray" />
                )}
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>฿{item.price}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noData}>No items in this category</Text>
          )
        ) : (
          <Text style={styles.noData}>Select a category first</Text>
        )}
      </ScrollView>

      {cart.length > 0 && (
        <TouchableOpacity
          style={styles.viewCartBtn}
          onPress={() => setCartVisible(true)}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            View Cart ({cart.length})
          </Text>
        </TouchableOpacity>
      )}

      <Modal
        isVisible={isCartVisible}
        style={styles.modal}
        onBackdropPress={() => setCartVisible(false)}
      >
        <View style={styles.cartBox}>
          <Text style={styles.cartTitle}>Cart ({cart.length} items)</Text>
          <ScrollView style={{ maxHeight: 250 }}>
            {cart.map((c, idx) => (
              <View key={idx} style={styles.cartRow}>
                <Text style={styles.cartItem}>
                  {c.name} x {c.qty} - ฿{c.price * c.qty}
                </Text>
                <View style={styles.cartActions}>
                  <TouchableOpacity onPress={() => removeFromCart(c)}>
                    <MaterialCommunityIcons
                      name="minus-circle"
                      size={24}
                      color="gray"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => addToCart(c)}>
                    <MaterialCommunityIcons
                      name="plus-circle"
                      size={24}
                      color="#2e7d32"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          <Text style={styles.total}>Total: ฿{total}</Text>

          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Checkout</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },
  header: { marginBottom: 10 },
  title: { fontSize: 22, fontWeight: "bold", color: "#2e7d32" },

  catContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  catCard: {
    width: "48%",
    backgroundColor: "#c8e6c9",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  catCardActive: { backgroundColor: "#2e7d32" },
  catText: { marginTop: 5, fontWeight: "bold", color: "#2e7d32" },

  noData: { textAlign: "center", marginTop: 20, color: "gray" },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f1f8e9",
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  itemImage: { width: 50, height: 50, borderRadius: 8 },
  itemName: { fontWeight: "bold", fontSize: 16 },
  itemPrice: { color: "#2e7d32", marginTop: 4 },

  viewCartBtn: {
    backgroundColor: "#2e7d32",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },

  modal: { justifyContent: "flex-end", margin: 0 },
  cartBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cartTitle: { fontWeight: "bold", marginBottom: 5, fontSize: 16 },
  cartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  cartItem: { fontSize: 14, color: "#555", flex: 1 },
  cartActions: { flexDirection: "row", gap: 10, marginLeft: 10 },
  total: { fontWeight: "bold", fontSize: 16, marginTop: 10 },
  checkoutBtn: {
    backgroundColor: "#2e7d32",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
});
