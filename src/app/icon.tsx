import { appIcon } from "@/components/app-icon";

export const contentType = "image/png";

// Generates /icon/192 and /icon/512, the sizes Android needs for installed apps
export function generateImageMetadata() {
  return [192, 512].map((size) => ({ id: String(size), size: { width: size, height: size }, contentType }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  return appIcon(Number(await id));
}
