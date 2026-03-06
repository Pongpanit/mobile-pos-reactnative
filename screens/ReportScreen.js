import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { ref, onValue, remove } from "firebase/database";
import { db } from "../firebaseConfig";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import useAppAlert from "../hooks/useAppAlert";

export default function ReportScreen() {
  const { showAlert, alertModal } = useAppAlert();
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  // Load Sales from Firebase
  useEffect(() => {
    const salesRef = ref(db, "sales");
    const unsubscribe = onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.values(data).sort(
          (a, b) => b.timestamp - a.timestamp
        );
        setSales(arr);
      } else {
        setSales([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("th-TH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  // Filter Sales
  const filteredSales = useMemo(
    () =>
      sales.filter((sale) => {
        const saleDate = new Date(sale.timestamp);
        const now = new Date();

        if (filter === "Today") {
          return (
            saleDate.getDate() === now.getDate() &&
            saleDate.getMonth() === now.getMonth() &&
            saleDate.getFullYear() === now.getFullYear()
          );
        } else if (filter === "ThisMonth") {
          return (
            saleDate.getMonth() === now.getMonth() &&
            saleDate.getFullYear() === now.getFullYear()
          );
        } else if (filter === "ByDate" && selectedDate) {
          return (
            saleDate.getDate() === selectedDate.getDate() &&
            saleDate.getMonth() === selectedDate.getMonth() &&
            saleDate.getFullYear() === selectedDate.getFullYear()
          );
        }
        return true;
      }),
    [sales, filter, selectedDate]
  );

  // Total Price from Sales
  const totalRevenue = filteredSales.reduce(
    (sum, s) => sum + (s.total ?? s.netTotal ?? 0),
    0
  );
  const totalSubtotal = filteredSales.reduce(
    (sum, s) => sum + (s.subtotal ?? s.total ?? 0),
    0
  );
  const totalDiscount = filteredSales.reduce(
    (sum, s) => sum + (s.discount ?? 0),
    0
  );
  const totalItems = filteredSales.reduce(
    (sum, s) => sum + (s.itemCount || s.items?.reduce((acc, item) => acc + item.qty, 0) || 0),
    0
  );
  const averageBill = filteredSales.length ? totalRevenue / filteredSales.length : 0;

  // Clear Sales
  const clearSales = () => {
    showAlert({
      title: "Clear All Bills",
      message: "Are you sure to delete all sales?",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await remove(ref(db, "sales"));
            } catch (err) {
              console.log("Clear sales error:", err.message);
            }
          },
        },
      ],
    });
  };

  const handleConfirmDate = (date) => {
    setSelectedDate(date);
    setFilter("ByDate");
    setDatePickerVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          },
        ]}
      >
        <Text style={styles.title}>Sales Report</Text>
        <Text style={styles.subtitle}>Track sales, bills and daily totals</Text>
      </View>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {["All", "Today", "ThisMonth"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[styles.filterText, filter === f && { color: "#fff" }]}
            >
              {f === "ThisMonth" ? "This Month" : f}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.filterBtn, filter === "ByDate" && styles.filterBtnActive]}
          onPress={() => setDatePickerVisible(true)}
        >
          <Text
            style={[styles.filterText, filter === "ByDate" && { color: "#fff" }]}
          >
            {selectedDate ? selectedDate.toLocaleDateString() : "Pick a Date"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Summary */}
      <ScrollView
        style={styles.summaryStrip}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.summaryScroll}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Gross</Text>
          <Text style={styles.summaryValue}>฿{formatCurrency(totalSubtotal)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Discount</Text>
          <Text style={styles.summaryValue}>฿{formatCurrency(totalDiscount)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Bills</Text>
          <Text style={styles.summaryValue}>{filteredSales.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Revenue</Text>
          <Text style={styles.summaryValue}>฿{formatCurrency(totalRevenue)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Items Sold</Text>
          <Text style={styles.summaryValue}>{totalItems}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Avg/Bill</Text>
          <Text style={styles.summaryValue}>฿{formatCurrency(averageBill)}</Text>
        </View>
      </ScrollView>

      {/* Sales List */}
      {filteredSales.length === 0 ? (
        <Text style={styles.noData}>No sales recorded</Text>
      ) : (
        <FlatList
          data={filteredSales}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.saleCard}>
              <Text style={styles.saleDate}>{item.date}</Text>
              <Text style={styles.saleMeta}>Table: {item.tableName || "Walk-in"}</Text>
              <Text style={styles.saleItem}>Subtotal: ฿{formatCurrency(item.subtotal ?? item.total)}</Text>
              <Text style={styles.saleItem}>Discount: ฿{formatCurrency(item.discount || 0)}</Text>
              <Text style={styles.saleTotal}>Net Total: ฿{formatCurrency(item.total)}</Text>
              {typeof item.cashReceived === "number" ? (
                <Text style={styles.saleItem}>
                  Cash ฿{formatCurrency(item.cashReceived)} | Change ฿{formatCurrency(item.change || 0)}
                </Text>
              ) : null}
              {item.items.map((i, idx) => (
                <Text key={idx} style={styles.saleItem}>
                  - {i.name} x {i.qty} = ฿{formatCurrency(i.price * i.qty)}
                </Text>
              ))}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 5 }}
        />
      )}

      {/* Clear Button (โชว์เฉพาะตอนมีข้อมูล) */}
      {filteredSales.length > 0 && (
        <TouchableOpacity style={styles.clearBtn} onPress={clearSales}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            Clear All Bills
          </Text>
        </TouchableOpacity>
      )}

      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={() => setDatePickerVisible(false)}
      />
      {alertModal}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f9f7", padding: 15 },
  header: { marginBottom: 10 },
  title: { fontSize: 24, fontWeight: "700", color: "#1f5f2b" },
  subtitle: { marginTop: 2, color: "#6a7b71", fontSize: 13 },

  filterRow: {
    marginBottom: 8,
    paddingRight: 8,
  },
  filterBtn: {
    minWidth: 80,
    height: 40,
    backgroundColor: "#e6f2e9",
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  filterBtnActive: { backgroundColor: "#2e7d32" },
  filterText: { fontWeight: "bold", color: "#2e7d32" },

  summaryScroll: {
    paddingBottom: 8,
    marginBottom: 4,
  },
  summaryStrip: {
    maxHeight: 126,
  },
  summaryCard: {
    width: 150,
    height: 108,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d9e4dd",
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
  },
  summaryLabel: { color: "#6a7b71", fontSize: 12 },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f5f2b",
    marginTop: 4,
  },

  noData: { textAlign: "center", color: "gray", marginTop: 15 },

  saleCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d9e4dd",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  saleDate: { fontWeight: "bold", marginBottom: 4 },
  saleMeta: { color: "#6a7b71", fontSize: 13, marginBottom: 4 },
  saleTotal: { color: "#2e7d32", fontWeight: "bold", marginBottom: 4 },
  saleItem: { fontSize: 14, color: "#555" },

  clearBtn: {
    backgroundColor: "#4f5e56",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 6,
  },
});
