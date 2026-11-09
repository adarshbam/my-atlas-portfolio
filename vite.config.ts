import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        atlas: fileURLToPath(new URL("./index.html", import.meta.url)),
        pipeline: fileURLToPath(new URL("./projects/ci-cd-engine.html", import.meta.url)),
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "atlas-inline-styles",
      enforce: "post",
      generateBundle(_, bundle) {
        const html = bundle["index.html"];
        if (html?.type !== "asset" || typeof html.source !== "string") return;
        const book = Object.values(bundle).find(
          (item) =>
            item.type === "chunk" &&
            item.facadeModuleId
              ?.replaceAll("\\", "/")
              .endsWith("/components/ui/book-slider.tsx"),
        );
        if (book?.type === "chunk") {
          // Warm the complete static dependency graph of the initial route.
          // Preloading only the leaf leaves shared Motion modules behind a
          // second network round trip. Do not preload dynamic story imports.
          const files = new Set<string>();
          const collect = (file: string) => {
            const chunk = bundle[file];
            if (files.has(file) || chunk?.type !== "chunk") return;
            files.add(file);
            chunk.imports.forEach(collect);
          };
          collect(book.fileName);
          const hrefs = JSON.stringify([...files].map(file => `/${file}`));
          html.source = html.source.replace(
            "</head>",
            `<script>if(location.pathname.replace(/\\/+$/,'')!=='/story'){for(const href of ${hrefs}){const p=document.createElement('link');p.rel='modulepreload';p.href=href;document.head.appendChild(p)}}</script></head>`,
          );
        }
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
});
