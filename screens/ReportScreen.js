import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { ref, onValue, remove } from "firebase/database";
import { db } from "../firebaseConfig";
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function ReportScreen() {
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  // Load Sales from Firebase
  useEffect(() => {
    const salesRef = ref(db, "sales");
    onValue(salesRef, (snapshot) => {
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
  }, []);

  // Filter Sales
  const filteredSales = sales.filter((sale) => {
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
  });

  // Total Price from Sales
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);

  // Clear Sales
  const clearSales = () => {
    Alert.alert("Clear All Bills", "Are you sure to delete all sales?", [
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
    ]);
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
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterRow}>
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
      </View>

      {/* Summary */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>Orders: {filteredSales.length}</Text>
        <Text style={styles.summaryText}>Total Revenue: ฿{totalRevenue}</Text>
      </View>

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
              <Text style={styles.saleTotal}>Total: ฿{item.total}</Text>
              {item.items.map((i, idx) => (
                <Text key={idx} style={styles.saleItem}>
                  - {i.name} x {i.qty} = ฿{i.price * i.qty}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },
  header: { marginBottom: 10 },
  title: { fontSize: 22, fontWeight: "bold", color: "#2e7d32" },

  filterRow: {
    flexDirection: "row",
    marginBottom: 6,
    flexWrap: "wrap",
  },
  filterBtn: {
    minWidth: 80,
    height: 40,
    backgroundColor: "#c8e6c9",
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  filterBtnActive: { backgroundColor: "#2e7d32" },
  filterText: { fontWeight: "bold", color: "#2e7d32" },

  summaryBox: {
    backgroundColor: "#c8e6c9",
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryText: { fontSize: 16, fontWeight: "bold", color: "#2e7d32" },

  noData: { textAlign: "center", color: "gray", marginTop: 15 },

  saleCard: {
    backgroundColor: "#f1f8e9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    elevation: 1,
  },
  saleDate: { fontWeight: "bold", marginBottom: 4 },
  saleTotal: { color: "#2e7d32", fontWeight: "bold", marginBottom: 4 },
  saleItem: { fontSize: 14, color: "#555" },

  clearBtn: {
    backgroundColor: "gray",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 6,
  },
});
