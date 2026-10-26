import { createRoot } from "react-dom/client";
import Book from "@/components/ui/book-slider";
import "@/styles/tokens.css";
import "@/styles/book.css";

createRoot(document.getElementById("root")!).render(<Book />);
