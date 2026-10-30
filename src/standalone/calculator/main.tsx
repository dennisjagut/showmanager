import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { IntlProvider } from "use-intl";
import { DEFAULT_LOCALE, TIME_ZONE } from "@/i18n/config";
import messages from "../../../messages/de.json";
import { App } from "./App";
import "./styles.css";

// The calculator's texts with the ones for the standalone file on top: there it saves in the browser, not for the band
const { standalone, calculator } = messages;
const merged = {
  ...messages,
  calculator: {
    ...calculator,
    ...standalone.calculator,
    saveStatus: { ...calculator.saveStatus, ...standalone.calculator.saveStatus },
  },
};

// Asks the browser not to clear the data when space runs low; it may decide on its own or ask the user
void navigator.storage?.persist?.();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <IntlProvider locale={DEFAULT_LOCALE} timeZone={TIME_ZONE} messages={merged}>
      <App />
    </IntlProvider>
  </StrictMode>,
);
