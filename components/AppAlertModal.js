import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const getButtonStyle = (style) => {
  if (style === "destructive") return styles.buttonDestructive;
  if (style === "cancel") return styles.buttonCancel;
  return styles.buttonPrimary;
};

const getButtonTextStyle = (style) => {
  if (style === "destructive") return styles.buttonTextLight;
  if (style === "cancel") return styles.buttonTextDark;
  return styles.buttonTextLight;
};

export default function AppAlertModal({
  visible,
  title,
  message,
  buttons,
  onClose,
}) {
  const safeButtons = buttons?.length
    ? buttons
    : [{ text: "OK", style: "default" }];

  const handlePress = (button) => {
    onClose();
    if (button.onPress) {
      setTimeout(() => button.onPress(), 0);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title || "Notice"}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.buttonRow}>
            {safeButtons.map((button, index) => (
              <TouchableOpacity
                key={`${button.text}-${index}`}
                style={[styles.buttonBase, getButtonStyle(button.style)]}
                onPress={() => handlePress(button)}
              >
                <Text style={[styles.buttonTextBase, getButtonTextStyle(button.style)]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#d9e4dd",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f5f2b",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#46544d",
    lineHeight: 20,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap",
  },
  buttonBase: {
    minWidth: 90,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonPrimary: {
    backgroundColor: "#2e7d32",
  },
  buttonCancel: {
    backgroundColor: "#eef3ef",
  },
  buttonDestructive: {
    backgroundColor: "#b3261e",
  },
  buttonTextBase: {
    fontWeight: "700",
    fontSize: 14,
  },
  buttonTextLight: {
    color: "#fff",
  },
  buttonTextDark: {
    color: "#36433c",
  },
});
