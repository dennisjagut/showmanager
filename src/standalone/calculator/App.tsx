import { useTranslations } from "use-intl";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Card } from "@/components/ui/Card";
import { Calculator } from "@/features/calculator/components/Calculator";
import type { CalculatorStore } from "@/features/calculator/store";
import type { CalculatorData } from "@/lib/api/types";
import { backupFilename, fromBackup, toBackup } from "./backup";
import * as local from "./local-store";

// The page of the standalone file: the calculator of the app, saving in the browser, plus backup and restore
export function App() {
  const t = useTranslations("calculator");
  // null while a backup is being loaded, see restore()
  const [data, setData] = useState<CalculatorData | null>(local.load);

  const store: CalculatorStore = {
    saveInquiry: local.saveInquiry,
    saveItem: local.saveItem,
    addItem: (category) => local.addItem(category, t(`newItem.${category}`)),
    deleteItem: local.deleteItem,
    resetInquiry: local.resetInquiry,
  };

  // The calculator only takes its data when it starts. So it is removed first: it then sends what is still pending,
  // which the backup overwrites afterwards, and starts again with the backup.
  function restore(loaded: CalculatorData) {
    flushSync(() => setData(null));
    try {
      local.replace(loaded);
    } finally {
      setData(local.load());
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <span aria-hidden>🎸</span>
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-500">{t("intro")}</p>
      </div>
      <DataCard restore={restore} />
      {data && <Calculator inquiry={data.inquiry} items={data.items} store={store} />}
    </main>
  );
}

function DataCard({ restore }: { restore: (data: CalculatorData) => void }) {
  const t = useTranslations("standalone.data");
  const file = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  function download() {
    const json = JSON.stringify(toBackup(local.load()), null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: backupFilename() });
    link.click();
    URL.revokeObjectURL(url);
  }

  async function load(selected: File | undefined) {
    if (file.current) file.current.value = "";
    if (!selected) return;
    let json: unknown = null;
    try {
      json = JSON.parse(await selected.text());
    } catch {
      // not JSON, handled below
    }
    const data = fromBackup(json);
    if (!data) return setMessage(t("importError"));
    if (!window.confirm(t("importConfirm"))) return setMessage(null);
    try {
      restore(data);
      setMessage(t("imported"));
    } catch {
      setMessage(t("saveError"));
    }
  }

  return (
    <Card title={t("title")}>
      <p className="text-sm text-zinc-500">{t("intro")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={download} className="btn-secondary">
          {t("export")}
        </button>
        <button type="button" onClick={() => file.current?.click()} className="btn-secondary">
          {t("import")}
        </button>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(ev) => void load(ev.target.files?.[0])}
        />
        {message && <span className="text-sm text-zinc-500">{message}</span>}
      </div>
    </Card>
  );
}
