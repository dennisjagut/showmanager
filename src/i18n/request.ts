import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, TIME_ZONE } from "./config";

// The locale is not part of the URL. There is only one language so far, so every request uses the default.
export default getRequestConfig(async () => {
  const locale = DEFAULT_LOCALE;
  return {
    locale,
    timeZone: TIME_ZONE,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
