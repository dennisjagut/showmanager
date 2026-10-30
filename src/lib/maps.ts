// Links to Google Maps, they open the app on the phone

export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function mapsRouteUrl(destination: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
