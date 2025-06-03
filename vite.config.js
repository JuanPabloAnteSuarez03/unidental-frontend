import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
    // Cargar variables de entorno según el modo
    const env = loadEnv(mode, process.cwd());

    // URL del backend desde la variable de entorno o usar valor por defecto
    const apiUrl =
        env.VITE_API_URL ||
        "https://unidental-backend-production.up.railway.app";

    return {
        plugins: [react()],
        server: {
            proxy: {
                // Redirigir todas las peticiones que empiecen con /api
                "/api": {
                    target: apiUrl.replace("/api", ""), // Quitar /api si está presente en la URL
                    changeOrigin: true,
                    secure: true,
                    rewrite: (path) => path.replace(/^\/api/, "/api"),
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
