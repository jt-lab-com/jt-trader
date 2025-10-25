import * as path from "path";
import react from "@vitejs/plugin-react-swc";
import dotenv from "dotenv";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

dotenv.config({
  path: "../.env",
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const SITE_HOST = mode === "development" ? "http://localhost:8181" : process.env.SITE_API_HOST;
  const AUTH_LINK = mode === "development" ? "http://localhost:8080/auth" : "/auth";

  return {
    resolve: {
      alias: {
        "@packages": path.resolve(__dirname, "..", "shared"),
        "@": path.resolve(__dirname, "src"),
      },
    },
    plugins: [react(), svgr()],
    define: {
      __SITE_API_HOST__: JSON.stringify(SITE_HOST),
      __DEV__: process.env.NODE_ENV === "development",
      __AUTH_LINK__: JSON.stringify(AUTH_LINK),
    },
  };
});
