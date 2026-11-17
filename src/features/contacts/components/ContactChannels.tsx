import Link from "next/link";
import { cn } from "@/lib/cn";
import { WebsiteLink } from "@/features/applications/components/WebsiteLink";
import type { Contact } from "@/lib/api/types";

// Email and phone as links, e.g. in a row of the list; empty ones are left out
export function ContactChannels({ contact, website = false }: { contact: Contact; website?: boolean }) {
  return (
    <>
      {contact.email && (
        <a href={`mailto:${contact.email}`} className="block truncate link">
          {contact.email}
        </a>
      )}
      {contact.phone && <PhoneLink phone={contact.phone} className="block" />}
      {website && contact.website && (
        <div className="truncate">
          <WebsiteLink url={contact.website} />
        </div>
      )}
    </>
  );
}

export function PhoneLink({ phone, className }: { phone: string; className?: string }) {
  return (
    <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={cn("link", className)}>
      {phone}
    </a>
  );
}

// Contacts linked from somewhere else (e.g. a festival), each with its name as a link and email and phone below
export function LinkedContacts({ contacts, className }: { contacts: Contact[]; className?: string }) {
  if (contacts.length === 0) return null;
  return (
    <ul className={cn("space-y-1.5", className)}>
      {contacts.map((c) => (
        <li key={c.id} className="min-w-0">
          <Link href={`/contacts/${c.id}`} className="font-medium hover:underline">
            {c.name}
          </Link>
          <ContactChannels contact={c} />
        </li>
      ))}
    </ul>
  );
}
