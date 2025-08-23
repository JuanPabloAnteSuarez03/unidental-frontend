import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
    // Cargar variables de entorno según el modo
    const env = loadEnv(mode, process.cwd());

    // URL del backend desde la variable de entorno o usar valor por defecto
    // Usar backend en producción (Render)
    const apiUrl = env.VITE_API_URL || "https://unidental-backend.onrender.com";

    return {
        plugins: [react()],
        optimizeDeps: {
            include: [
                "react-icons/fa",
                "react-icons/ai",
                "react-icons/bi",
                "react-icons/bs",
                "react-icons/ci",
                "react-icons/di",
                "react-icons/fc",
                "react-icons/fi",
                "react-icons/gi",
                "react-icons/go",
                "react-icons/gr",
                "react-icons/hi",
                "react-icons/im",
                "react-icons/io",
                "react-icons/io5",
                "react-icons/lia",
                "react-icons/lu",
                "react-icons/md",
                "react-icons/pi",
                "react-icons/ri",
                "react-icons/rx",
                "react-icons/si",
                "react-icons/sl",
                "react-icons/tb",
                "react-icons/tfi",
                "react-icons/ti",
                "react-icons/vsc",
                "react-icons/wi",
            ],
        },
        server: {
            port: 3000,
            host: true,
            proxy: {
                // Redirigir todas las peticiones que empiecen con /api
                "/api": {
                    target: apiUrl, // Backend en producción
                    changeOrigin: true,
                    secure: true, // true para HTTPS del backend en producción
                    // No necesitamos rewrite, mantener la ruta /api tal como está
                    configure: (proxy, options) => {
                        proxy.on("error", (err, req, res) => {
                            console.log("proxy error", err);
                        });
                        proxy.on("proxyReq", (proxyReq, req, res) => {
                            console.log(
                                "Sending Request to the Target:",
                                req.method,
                                req.url
                            );
                        });
                        proxy.on("proxyRes", (proxyRes, req, res) => {
                            console.log(
                                "Received Response from the Target:",
                                proxyRes.statusCode,
                                req.url
                            );
                        });
                    },
                },
            },
        },
    };
});
