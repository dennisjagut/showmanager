import { useTranslations } from "next-intl";
import type { Show } from "@/lib/api/types";
import { logisticsBlocks } from "@/features/shows/infos";

export function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="section-title">{title}</h3>
      <div className="mt-1 text-sm whitespace-pre-line">{children}</div>
    </div>
  );
}

export function ContactInfo({ show }: { show: Show }) {
  const t = useTranslations("showInfo");
  if (!show.contactName && !show.contactPhone && !show.contactEmail) return null;
  return (
    <InfoBlock title={t("contact")}>
      {show.contactName && <div>{show.contactName}</div>}
      {show.contactPhone && (
        <a href={`tel:${show.contactPhone.replace(/[^\d+]/g, "")}`} className="block link">
          {show.contactPhone}
        </a>
      )}
      {show.contactEmail && (
        <a href={`mailto:${show.contactEmail}`} className="block link">
          {show.contactEmail}
        </a>
      )}
    </InfoBlock>
  );
}

export function LogisticsInfo({ show }: { show: Show }) {
  const t = useTranslations("showInfo");
  return (
    <>
      {logisticsBlocks(show).map(([field, text]) => (
        <InfoBlock key={field} title={t(field)}>
          {text}
        </InfoBlock>
      ))}
    </>
  );
}
