import { useTranslations } from "next-intl";
import { PhoneLink } from "@/features/contacts/components/ContactChannels";
import type { Show, ShowContact } from "@/lib/api/types";
import { SHOW_CONTACT_ROLES, contactsOf, logisticsBlocks, positionAt } from "@/features/shows/infos";

export function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="section-title">{title}</h3>
      <div className="mt-1 text-sm whitespace-pre-line">{children}</div>
    </div>
  );
}

// Promoters and people to talk to with phone and email, for the daysheet
export function ContactsInfo({ contacts }: { contacts: ShowContact[] }) {
  const t = useTranslations("showContacts");
  const promoterIds = contactsOf(contacts, "promoter").map((d) => d.contact.id);
  return (
    <>
      {SHOW_CONTACT_ROLES.map((role) => {
        const list = contactsOf(contacts, role);
        if (list.length === 0) return null;
        return (
          <InfoBlock key={role} title={t(`roles.${role}`)}>
            <ul className="space-y-2 whitespace-normal">
              {list.map((d) => {
                const position = positionAt(d, promoterIds);
                return (
                  <li key={d.contact.id}>
                    <div className="font-medium">{d.contact.name}</div>
                    {position && <div className="text-zinc-500">{position}</div>}
                    {d.contact.phone && <PhoneLink phone={d.contact.phone} className="block" />}
                    {d.contact.email && (
                      <a href={`mailto:${d.contact.email}`} className="block link">
                        {d.contact.email}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </InfoBlock>
        );
      })}
    </>
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
