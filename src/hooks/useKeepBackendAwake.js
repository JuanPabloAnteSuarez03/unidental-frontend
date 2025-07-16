import { useEffect } from "react";

export default function useKeepBackendAwake() {
  useEffect(() => {
    const ping = () => {
      fetch("https://unidental-backend.onrender.com/api/health/check/")
        .then(() => console.log("🔄 Backend pinged"))
        .catch(() => {});
    };
    // Llama una vez al montar
    ping();
    // Llama cada 5 minutos (300000 ms)
    const interval = setInterval(ping, 300000);
    return () => clearInterval(interval);
  }, []);
} 