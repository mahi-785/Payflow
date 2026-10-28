import { useState } from "react";
import { Async, Btn, Card, RiskBadge, StatusBadge, fmtDate, inputCls, money } from "../components/ui";
import { api } from "../services/api";
import { useAsync } from "../services/useAsync";
import { MERCHANTS } from "../types";

const PAGE = 10;

export default function Transactions({ onOpen }: { onOpen: (id: string) => void }) {
  const [status, setStatus] = useState(""); const [merchant, setMerchant] = useState("");
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [offset, setOffset] = useState(0); const [search, setSearch] = useState("");
  const s = useAsync(() => api.list({
    status, merchant_id: merchant, limit: PAGE, offset,
    date_from: from ? new Date(from + "T00:00:00").toISOString() : undefined,
    date_to: to ? new Date(to + "T23:59:59").toISOString() : undefined,
  }), [status, merchant, from, to, offset]);
  const f = (set: (v: string) => void) => (e: { target: { value: string } }) => { set(e.target.value); setOffset(0); };
  return (
    <Card>
      <form className="mb-4 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); if (search.trim()) onOpen(search.trim()); }}>
        <label className="text-xs text-slate-500">Find by ID
          <input className={`${inputCls} mt-1 w-64`} placeholder="Transaction ID" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        <Btn variant="ghost" type="submit">Open</Btn>
        <label className="text-xs text-slate-500">Status
          <select className={`${inputCls} mt-1`} value={status} onChange={f(setStatus)}>
            <option value="">All</option><option>APPROVED</option><option>DECLINED</option></select></label>
        <label className="text-xs text-slate-500">Merchant
          <select className={`${inputCls} mt-1`} value={merchant} onChange={f(setMerchant)}>
            <option value="">All</option>{MERCHANTS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
        <label className="text-xs text-slate-500">From<input type="date" className={`${inputCls} mt-1`} value={from} onChange={f(setFrom)} /></label>
        <label className="text-xs text-slate-500">To<input type="date" className={`${inputCls} mt-1`} value={to} onChange={f(setTo)} /></label>
      </form>
      <Async s={s} isEmpty={(p) => p.items.length === 0} empty="No transactions match these filters.">{(p) => (
        <>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr>
              <th className="py-2">Time</th><th>Merchant</th><th>Amount</th><th>Status</th><th>Risk</th><th>Reason</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{p.items.map((t) => (
              <tr key={t.id} onClick={() => onOpen(t.id)} className="cursor-pointer hover:bg-slate-50">
                <td className="py-2">{fmtDate(t.created_at)}</td><td>{t.merchant_id}</td>
                <td className="font-medium">{money(t.amount_cents, t.currency)}</td>
                <td><StatusBadge s={t.status} /></td><td><RiskBadge r={t.risk_level} /></td>
                <td className="text-slate-500">{t.decline_reason ?? "—"}</td></tr>
            ))}</tbody></table></div>
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>{p.offset + 1}–{p.offset + p.items.length} of {p.total}</span>
            <span className="space-x-2">
              <Btn variant="ghost" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Previous</Btn>
              <Btn variant="ghost" disabled={offset + PAGE >= p.total} onClick={() => setOffset(offset + PAGE)}>Next</Btn></span>
          </div>
        </>
      )}</Async>
    </Card>
  );
}
