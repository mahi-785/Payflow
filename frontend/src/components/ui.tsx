import type { ReactNode } from "react";
import type { AsyncState } from "../services/useAsync";
import type { Risk, Status } from "../types";

export const money = (cents: number, currency = "USD") =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency });
// SQLite returns timestamps without a timezone; treat those as UTC.
export const parseDate = (s: string) => new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + "Z");
export const fmtDate = (s: string) => parseDate(s).toLocaleString();

const pill = "inline-block rounded-full px-2 py-0.5 text-xs font-medium";
export const StatusBadge = ({ s }: { s: Status }) => (
  <span className={`${pill} ${s === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{s}</span>
);
export const RiskBadge = ({ r }: { r: Risk }) => (
  <span className={`${pill} ${{ LOW: "bg-slate-100 text-slate-600", MEDIUM: "bg-amber-100 text-amber-800", HIGH: "bg-red-100 text-red-800" }[r]}`}>{r}</span>
);

export const Card = ({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) => (
  <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
    {title && <h2 className="mb-3 text-sm font-semibold text-slate-700">{title}</h2>}
    {children}
  </section>
);

export const Btn = (p: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) => {
  const { variant = "primary", className = "", ...rest } = p;
  const style = variant === "primary" ? "bg-indigo-600 text-white hover:bg-indigo-700" : "border border-slate-300 bg-white hover:bg-slate-50";
  return <button {...rest} className={`rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${style} ${className}`} />;
};

export const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm";

/** Renders loading, error, empty and data states for an async resource. */
export function Async<T>({ s, isEmpty, empty = "Nothing here yet.", children }: {
  s: AsyncState<T>; isEmpty?: (d: T) => boolean; empty?: string; children: (d: T) => ReactNode;
}) {
  if (s.error) return (
    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
      {s.error} <button className="ml-2 underline" onClick={s.reload}>Retry</button>
    </div>
  );
  if (s.loading && !s.data) return <div className="animate-pulse rounded-lg bg-slate-100 p-6 text-sm text-slate-400">Loading…</div>;
  if (!s.data || isEmpty?.(s.data)) return <p className="py-6 text-center text-sm text-slate-500">{empty}</p>;
  return <>{children(s.data)}</>;
}
