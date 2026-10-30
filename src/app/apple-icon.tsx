import { appIcon } from "@/components/app-icon";

// Icon for "Add to Home Screen" on the iPhone
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return appIcon(size.width);
}
