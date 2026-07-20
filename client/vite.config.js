import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
    plugins: [react()],
    // Strip console.* and debugger statements from production builds only.
    esbuild: command === "build" ? { drop: ["console", "debugger"] } : undefined,
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules")) {
                        // NOTE: recharts/d3 must stay in the main vendor chunk.
                        // Splitting them causes a circular-import TDZ crash
                        // ("Cannot access 'S' before initialization").
                        if (id.includes("lucide-react")) {
                            return "lucide";
                        }
                        if (id.includes("framer-motion")) {
                            return "framer";
                        }
                        if (id.includes("date-fns")) {
                            return "date-fns";
                        }
                        return "vendor";
                    }
                },
            },
        },
    },
}));