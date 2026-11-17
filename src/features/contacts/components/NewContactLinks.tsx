"use client";

import { useState } from "react";
import { linksBody, type LinkDraft } from "@/features/contacts/draft";
import type { ContactKind } from "@/features/contacts/kinds";
import type { ContactRef } from "@/lib/api/types";
import { ContactLinksEditor } from "./ContactLinksEditor";

// The links of a new contact in its form: edited like in the editor, sent as JSON in the hidden field "links"
export function NewContactLinks({ kind, candidates }: { kind: ContactKind; candidates: ContactRef[] }) {
  const [links, setLinks] = useState<LinkDraft[]>([]);

  return (
    <>
      <input type="hidden" name="links" value={JSON.stringify(linksBody(links))} />
      <ContactLinksEditor kind={kind} links={links} onChange={setLinks} candidates={candidates} linkNames={false} />
    </>
  );
}
