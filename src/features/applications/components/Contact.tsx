const TOKEN = /(https?:\/\/[^\s]+|www\.[^\s]+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;

// Makes email addresses and URLs in free text clickable
export function Contact({ text }: { text: string | null }) {
  if (!text) return null;
  const parts = text.split(TOKEN);
  return (
    <span className="break-words">
      {parts.map((part, i) => {
        if (i % 2 === 0) return part;
        if (part.includes("@") && !part.startsWith("http")) {
          return (
            <a key={i} href={`mailto:${part}`} className="link">
              {part}
            </a>
          );
        }
        const href = part.startsWith("http") ? part : `https://${part}`;
        return (
          <a key={i} href={href} target="_blank" rel="noreferrer" className="link">
            {shortUrl(part)}
          </a>
        );
      })}
    </span>
  );
}

function shortUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

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
