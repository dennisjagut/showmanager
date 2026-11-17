import { cn } from "@/lib/cn";
import { WebsiteLink } from "@/features/applications/components/Contact";
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
