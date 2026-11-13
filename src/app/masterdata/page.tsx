import { redirect } from "next/navigation";
import { MASTERDATA_TABS } from "@/features/masterdata/tabs";

// The module opens on its first tab
export default function Masterdata() {
  redirect(MASTERDATA_TABS[0].href);
}
