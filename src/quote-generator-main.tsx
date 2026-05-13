import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { QuoteGeneratorPage } from "./pages/QuoteGeneratorPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QuoteGeneratorPage />
  </StrictMode>,
);
