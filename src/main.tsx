import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "@fontsource/inter/latin-100.css";
import "@fontsource/inter/latin-200.css";
import "@fontsource/inter/latin-300.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-800.css";
import "@fontsource/inter/latin-900.css";
import App from "./App";
import "./app/globals.css";
import messages from "./messages/en.json";
import Providers from "./app/providers";
import { LanguagePreviewProvider } from "./providers/LanguagePreviewProvider";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <LanguagePreviewProvider>
    <BrowserRouter>
      <Providers locale="en" messages={messages}>
        <App />
      </Providers>
    </BrowserRouter>
  </LanguagePreviewProvider>,
);
