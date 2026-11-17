"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Field } from "@/components/ui/Field";
import { useFestivalOptions } from "@/features/applications/options";

function daysIn(month: number): number {
  // 2000 is a leap year, so February has 29 days
  return new Date(Date.UTC(2000, month, 0)).getUTCDate();
}

function monthDay(day: number, month: number): string {
  return day && month ? `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
}

/**
 * The application deadline as day and month without a year (MM-DD), as it repeats every year. The value stays empty
 * until both are picked. With `name`, it is also sent in a hidden field of that name.
 */
export function DeadlineInput({
  label,
  name,
  value = "",
  onChange,
  changed,
}: {
  label: React.ReactNode;
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  changed?: boolean;
}) {
  const t = useTranslations("festivalForm");
  const { months } = useFestivalOptions();
  const [day, setDay] = useState(value ? Number(value.slice(3)) : 0);
  const [month, setMonth] = useState(value ? Number(value.slice(0, 2)) : 0);

  function pick(nextDay: number, nextMonth: number) {
    // e.g. 31 stays 31 for October but becomes 30 for September
    const fitting = nextMonth ? Math.min(nextDay, daysIn(nextMonth)) : nextDay;
    setDay(fitting);
    setMonth(nextMonth);
    onChange?.(monthDay(fitting, nextMonth));
  }

  return (
    <Field as="div" label={label} changed={changed}>
      <div className="grid grid-cols-[4.5rem_1fr] gap-2">
        <select
          aria-label={t("deadlineDay")}
          className="input"
          value={day || ""}
          onChange={(e) => pick(Number(e.target.value), month)}
        >
          <option value="">{t("none")}</option>
          {Array.from({ length: month ? daysIn(month) : 31 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}.
            </option>
          ))}
        </select>
        <select
          aria-label={t("deadlineMonth")}
          className="input"
          value={month || ""}
          onChange={(e) => pick(day, Number(e.target.value))}
        >
          <option value="">{t("none")}</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      {name && <input type="hidden" name={name} value={monthDay(day, month)} />}
    </Field>
  );
}
