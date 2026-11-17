function shortUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

// Link to a website in a new tab, shown as its short host name
export function WebsiteLink({ url }: { url: string | null }) {
  if (!url) return null;
  const href = url.startsWith("http") ? url : `https://${url}`;
  let host = shortUrl(url);
  try {
    host = new URL(href).hostname.replace(/^www\./, "");
  } catch {}
  return (
    <a href={href} target="_blank" rel="noreferrer" className="link" title={url}>
      {host} ↗
    </a>
  );
}
