import type messages from "../../messages/de.json";
import type { Locale } from "./config";

// Type-checks translation keys against the German messages, which are the reference for all languages
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
