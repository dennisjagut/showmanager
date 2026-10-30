"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import { formatNumber, parseNumber } from "@/lib/format";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number | null;
  // null = the field is empty
  onValue: (value: number | null) => void;
  integer?: boolean;
};

// Number field with the locale's decimal separator. While typing, the text stays as typed (e.g. "0,"), otherwise it
// shows the value.
export function NumberInput({ value, onValue, integer, className, onFocus, onBlur, ...props }: Props) {
  const locale = useLocale();
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);

  return (
    <input
      {...props}
      type="text"
      inputMode={integer ? "numeric" : "decimal"}
      autoComplete="off"
      className={`input py-1.5 tabular-nums ${className ?? ""}`}
      value={focused ? text : formatNumber(value, locale)}
      onFocus={(e) => {
        setText(formatNumber(value, locale));
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      onChange={(e) => {
        setText(e.target.value);
        if (e.target.value.trim() === "") return onValue(null);
        const n = parseNumber(e.target.value);
        if (n !== null && (!integer || Number.isInteger(n))) onValue(n);
      }}
    />
  );
}
