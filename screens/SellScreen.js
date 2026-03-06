import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  StatusBar,
  TextInput,
} from "react-native";
import { push, ref, set, onValue, remove } from "firebase/database";
import { db } from "../firebaseConfig";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import useAppAlert from "../hooks/useAppAlert";

export default function SellScreen() {
  const { showAlert, alertModal } = useAppAlert();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [holdOrders, setHoldOrders] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [isCartVisible, setCartVisible] = useState(false);
  const [isHoldVisible, setHoldVisible] = useState(false);
  const [tableName, setTableName] = useState("");
  const [discountInput, setDiscountInput] = useState("0");
  const [cashInput, setCashInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  //Load Categories
  useEffect(() => {
    const catRef = ref(db, "categories");
    const unsubscribe = onValue(catRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const sorted = Object.values(data).sort(
          (a, b) => (a.order || 9999) - (b.order || 9999)
        );
        setCategories(sorted);
      } else {
        setCategories([]);
      }
    });

    return () => unsubscribe();
  }, []);

  //Load Menu
  useEffect(() => {
    const itemsRef = ref(db, "items");
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setItems(Object.values(data));
      else setItems([]);
    });

    return () => unsubscribe();
  }, []);

  // Load Hold Orders
  useEffect(() => {
    const holdRef = ref(db, "holdOrders");
    const unsubscribe = onValue(holdRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const sorted = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
        setHoldOrders(sorted);
      } else {
        setHoldOrders([]);
      }
    });

    return () => unsubscribe();
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
  const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
  const parsedDiscount = Math.max(0, Number(discountInput) || 0);
  const discountValue = Math.min(total, parsedDiscount);
  const netTotal = Math.max(0, total - discountValue);
  const hasCashInput = cashInput.trim() !== "";
  const cashReceived = Math.max(0, Number(cashInput) || 0);
  const effectiveCashReceived = hasCashInput ? cashReceived : netTotal;
  const change = Math.max(0, effectiveCashReceived - netTotal);

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("th-TH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const resetSaleFields = () => {
    setCart([]);
    setTableName("");
    setDiscountInput("0");
    setCashInput("");
  };

  //Save Sales 
  const handleCheckout = async () => {
    if (cart.length === 0) {
      showAlert({
        title: "No items selected",
        message: "Add at least 1 menu before checkout.",
      });
      return;
    }

    if (isSaving) {
      return;
    }

    if (hasCashInput && cashReceived < netTotal) {
      showAlert({
        title: "Insufficient cash",
        message: "Cash received must be equal or greater than net total.",
      });
      return;
    }

    setIsSaving(true);

    const now = new Date();

    const sale = {
      id: Date.now().toString(),
      tableName: tableName.trim() || "Walk-in",
      items: cart,
      subtotal: total,
      discount: discountValue,
      total: netTotal,
      paymentMethod: "cash",
      cashReceived: effectiveCashReceived,
      change,
      date: now.toLocaleString("th-TH"),
      timestamp: Date.now(),
      createdAt: now.toISOString(),
      itemCount: totalQty,
    };

    try {
      const newRef = push(ref(db, "sales"));
      await set(newRef, sale);

      showAlert({
        title: "Sale completed",
        message: `Net total ฿${formatCurrency(netTotal)}`,
        buttons: [{ text: "OK", onPress: resetSaleFields }],
      });
      setCartVisible(false);
    } catch (err) {
      console.log("Save sale error:", err.message);
      showAlert({
        title: "Checkout failed",
        message: "Unable to save sale. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const clearCart = () => {
    showAlert({
      title: "Clear cart",
      message: "Remove all items in this cart?",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: resetSaleFields,
        },
      ],
    });
  };

  const handleHoldOrder = async () => {
    if (cart.length === 0) {
      showAlert({
        title: "No items selected",
        message: "Add items before holding order.",
      });
      return;
    }

    const now = new Date();
    const hold = {
      id: Date.now().toString(),
      tableName: tableName.trim() || "Walk-in",
      items: cart,
      subtotal: total,
      discount: discountValue,
      total: netTotal,
      itemCount: totalQty,
      date: now.toLocaleString("th-TH"),
      timestamp: Date.now(),
      createdAt: now.toISOString(),
    };

    try {
      const newRef = push(ref(db, "holdOrders"));
      await set(newRef, { ...hold, id: newRef.key });
      showAlert({
        title: "Order held",
        message: `Saved for ${hold.tableName}`,
      });
      resetSaleFields();
      setCartVisible(false);
    } catch (error) {
      console.log("Hold order error:", error.message);
      showAlert({
        title: "Hold failed",
        message: "Unable to save hold order.",
      });
    }
  };

  const restoreHoldOrder = (order) => {
    showAlert({
      title: "Recall order",
      message: `Load order for ${order.tableName}?`,
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Load",
          onPress: () => {
            setCart(order.items || []);
            setTableName(order.tableName || "");
            setDiscountInput(String(order.discount || 0));
            setCashInput("");
            setHoldVisible(false);
            setCartVisible(true);
          },
        },
      ],
    });
  };

  const deleteHoldOrder = async (orderId) => {
    try {
      await remove(ref(db, `holdOrders/${orderId}`));
    } catch (error) {
      console.log("Delete hold error:", error.message);
      showAlert({
        title: "Delete failed",
        message: "Unable to remove hold order.",
      });
    }
  };

  //Show Menu from Category
  const filteredItems = useMemo(() => {
    if (!selectedCategory) return [];

    return items.filter((item) => {
      const inCategory = item.categoryId === selectedCategory.id;
      if (!inCategory) return false;

      if (!keyword.trim()) return true;
      return item.name?.toLowerCase().includes(keyword.trim().toLowerCase());
    });
  }, [items, selectedCategory, keyword]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
        ]}
      >
        <Text style={styles.title}>POS Sales</Text>
        <Text style={styles.subtitle}>Tap menu to add item to cart</Text>
      </View>

      <ScrollView
        horizontal
        style={styles.catScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catContainer}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.catCard,
              selectedCategory?.id === cat.id && styles.catCardActive,
            ]}
            onPress={() => {
              setSelectedCategory(cat);
              setKeyword("");
            }}
          >
            <MaterialCommunityIcons
              name={cat.icon || "food"}
              size={24}
              color={selectedCategory?.id === cat.id ? "#fff" : "#2e7d32"}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.catText,
                selectedCategory?.id === cat.id && { color: "#fff" },
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedCategory ? (
        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          placeholder={`Search in ${selectedCategory.name}`}
          placeholderTextColor="#7f8d84"
          style={styles.searchInput}
        />
      ) : null}

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
                  <Text style={styles.itemPrice}>฿{formatCurrency(item.price)}</Text>
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
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setHoldVisible(true)}
          >
            <Text style={styles.secondaryText}>Hold ({holdOrders.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewCartBtn}
            onPress={() => setCartVisible(true)}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              View Cart ({totalQty}) • ฿{formatCurrency(netTotal)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {cart.length === 0 && holdOrders.length > 0 ? (
        <TouchableOpacity style={styles.restoreBtn} onPress={() => setHoldVisible(true)}>
          <Text style={styles.restoreText}>Recall Hold Orders ({holdOrders.length})</Text>
        </TouchableOpacity>
      ) : null}

      <Modal
        isVisible={isCartVisible}
        style={styles.modal}
        avoidKeyboard
        onBackdropPress={() => setCartVisible(false)}
      >
        <View style={styles.cartBox}>
          <View style={styles.cartHeaderRow}>
            <Text style={styles.cartTitle}>Cart ({totalQty} items)</Text>
            <TouchableOpacity onPress={clearCart}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 250 }} keyboardShouldPersistTaps="handled">
            {cart.map((c, idx) => (
              <View key={idx} style={styles.cartRow}>
                <Text style={styles.cartItem}>
                  {c.name} x {c.qty} - ฿{formatCurrency(c.price * c.qty)}
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

          <TextInput
            style={styles.formInput}
            value={tableName}
            onChangeText={setTableName}
            placeholder="Table name (e.g. T1)"
            placeholderTextColor="#7f8d84"
          />
          <TextInput
            style={styles.formInput}
            value={discountInput}
            onChangeText={setDiscountInput}
            keyboardType="numeric"
            placeholder="Discount amount"
            placeholderTextColor="#7f8d84"
          />
          <TextInput
            style={styles.formInput}
            value={cashInput}
            onChangeText={setCashInput}
            keyboardType="numeric"
            placeholder="Cash received"
            placeholderTextColor="#7f8d84"
          />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>฿{formatCurrency(total)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={styles.summaryValue}>฿{formatCurrency(discountValue)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelStrong}>Net Total</Text>
            <Text style={styles.summaryValueStrong}>฿{formatCurrency(netTotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Change</Text>
            <Text style={styles.summaryValue}>฿{formatCurrency(change)}</Text>
          </View>

          <View style={styles.footerButtons}>
            <TouchableOpacity style={styles.holdBtn} onPress={handleHoldOrder}>
              <Text style={styles.footerBtnText}>Hold</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
              <Text style={styles.footerBtnText}>
                {isSaving ? "Saving..." : "Checkout"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        isVisible={isHoldVisible}
        style={styles.modal}
        avoidKeyboard
        onBackdropPress={() => setHoldVisible(false)}
      >
        <View style={styles.cartBox}>
          <Text style={styles.cartTitle}>Hold Orders ({holdOrders.length})</Text>
          {holdOrders.length === 0 ? (
            <Text style={styles.noData}>No held orders</Text>
          ) : (
            <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
              {holdOrders.map((order) => (
                <View key={order.id} style={styles.holdRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.holdTitle}>{order.tableName || "Walk-in"}</Text>
                    <Text style={styles.holdMeta}>
                      {order.itemCount || 0} items • ฿{formatCurrency(order.total)}
                    </Text>
                    <Text style={styles.holdMeta}>{order.date}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.holdActionBtn}
                    onPress={() => restoreHoldOrder(order)}
                  >
                    <Text style={styles.holdActionText}>Load</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.holdActionBtn, styles.deleteAction]}
                    onPress={() => deleteHoldOrder(order.id)}
                  >
                    <Text style={styles.holdActionText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
      {alertModal}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f9f7", padding: 15 },
  header: { marginBottom: 10 },
  title: { fontSize: 24, fontWeight: "700", color: "#1f5f2b" },
  subtitle: { marginTop: 2, color: "#6a7b71", fontSize: 13 },

  catScroll: {
    maxHeight: 104,
  },

  catContainer: {
    paddingRight: 8,
    marginBottom: 15,
    alignItems: "center",
  },
  catCard: {
    width: 130,
    height: 92,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d9e4dd",
    padding: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  catCardActive: { backgroundColor: "#2e7d32" },
  catText: { marginTop: 5, fontWeight: "700", color: "#2e7d32" },

  searchInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d9e4dd",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    color: "#2b3a32",
  },

  noData: { textAlign: "center", marginTop: 20, color: "gray" },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d9e4dd",
    marginBottom: 10,
    borderRadius: 14,
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
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  secondaryBtn: {
    backgroundColor: "#4f5e56",
    paddingVertical: 15,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  secondaryText: { color: "#fff", fontWeight: "700" },
  restoreBtn: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#4f5e56",
  },
  restoreText: { color: "#fff", fontWeight: "700" },
  formInput: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#d9e4dd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: "#2b3a32",
    backgroundColor: "#fff",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  summaryLabel: { color: "#5d6e64" },
  summaryValue: { color: "#25352d", fontWeight: "600" },
  summaryLabelStrong: { color: "#1f5f2b", fontWeight: "700" },
  summaryValueStrong: { color: "#1f5f2b", fontWeight: "700", fontSize: 16 },
  footerButtons: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  holdBtn: {
    flex: 1,
    backgroundColor: "#4f5e56",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  modal: { justifyContent: "flex-end", margin: 0 },
  cartBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  cartHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  clearText: { color: "#b3261e", fontWeight: "700" },
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
    flex: 1,
    backgroundColor: "#2e7d32",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  footerBtnText: { color: "#fff", fontWeight: "700" },
  holdRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ecf1ed",
    paddingVertical: 12,
    gap: 6,
  },
  holdTitle: { fontSize: 15, fontWeight: "700", color: "#25352d" },
  holdMeta: { fontSize: 12, color: "#6b7b73", marginTop: 2 },
  holdActionBtn: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteAction: { backgroundColor: "#b3261e" },
  holdActionText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
