import { ImageResponse } from "next/og";
import { GUITAR_SVG } from "./guitar-svg";

// Background like the header in dark mode (zinc-900)
export const ICON_BACKGROUND = "#18181b";

// App icon for the home screen and the manifest: the guitar from the header on a dark background.
// The guitar stays within the inner circle, so Android does not cut it off when masking (maskable).
export function appIcon(size: number) {
  const guitar = Math.round(size * 0.6);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: ICON_BACKGROUND,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse only renders <img>, not next/image */}
      <img src={`data:image/svg+xml,${encodeURIComponent(GUITAR_SVG)}`} width={guitar} height={guitar} alt="" />
    </div>,
    { width: size, height: size },
  );
}
