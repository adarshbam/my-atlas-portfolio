import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "atlas-inline-styles",
      enforce: "post",
      generateBundle(_, bundle) {
        const html = bundle["index.html"];
        if (html?.type !== "asset" || typeof html.source !== "string") return;
        // This small static portfolio has one stylesheet. Deliver its exact
        // built bytes with the document to remove the render-blocking roundtrip.
        html.source = html.source.replace(
          /<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
          (link, href: string) => {
            const css = bundle[href.replace(/^\//, "")];
            return css?.type === "asset" && typeof css.source === "string"
              ? `<style>${css.source.replace(/<\/style/gi, "<\\/style")}</style>`
              : link;
          },
        );
      },
    },
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            /node_modules\/(?:page-flip|motion|framer-motion|motion-dom|motion-utils)\//.test(
              id.replaceAll("\\", "/"),
            )
          )
            return "animation";
        },
      },
    },
  },
});
