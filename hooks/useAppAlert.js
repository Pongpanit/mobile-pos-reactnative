import { useMemo, useState } from "react";
import AppAlertModal from "../components/AppAlertModal";

export default function useAppAlert() {
  const [alertState, setAlertState] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  const showAlert = ({ title, message, buttons }) => {
    setAlertState({
      visible: true,
      title: title || "Notice",
      message: message || "",
      buttons: buttons || [{ text: "OK" }],
    });
  };

  const hideAlert = () => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  };

  const alertModal = useMemo(
    () => (
      <AppAlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    ),
    [alertState]
  );

  return { showAlert, alertModal };
}
