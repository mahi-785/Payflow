import { useState } from "react";
import { Async, Btn, Card, RiskBadge, fmtDate, money } from "../components/ui";
import { api } from "../services/api";
import { useAsync } from "../services/useAsync";
import { RISK_EXPLANATIONS } from "../types";

export default function Alerts({ onOpen }: { onOpen: (id: string) => void }) {
  const [openOnly, setOpenOnly] = useState(true);
  const s = useAsync(() => api.alerts(openOnly ? false : undefined), [openOnly]);
  return (
    <Card>
      <div className="mb-4 flex gap-2">
        <Btn variant={openOnly ? "primary" : "ghost"} onClick={() => setOpenOnly(true)}>Needs review</Btn>
        <Btn variant={openOnly ? "ghost" : "primary"} onClick={() => setOpenOnly(false)}>All flagged</Btn>
      </div>
      <Async s={s} isEmpty={(a) => a.length === 0} empty="No alerts in this view.">{(alerts) => (
        <ul className="divide-y divide-slate-100">{alerts.map((t) => (
          <li key={t.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
            <button className="text-left" onClick={() => onOpen(t.id)}>
              <div className="flex items-center gap-2"><b>{money(t.amount_cents, t.currency)}</b><RiskBadge r={t.risk_level} />
                <span className="text-xs text-slate-400">{t.merchant_id} · {fmtDate(t.created_at)}</span></div>
              <ul className="mt-1 list-disc pl-5 text-sm text-slate-600">
                {t.risk_reasons.map((r) => <li key={r}><b>{r}</b>: {RISK_EXPLANATIONS[r] ?? "Rule triggered."}</li>)}</ul>
            </button>
            {t.reviewed ? <span className="text-xs text-emerald-700">Reviewed ✓</span>
              : <Btn onClick={async () => { await api.review(t.id); s.reload(); }}>Mark reviewed</Btn>}
          </li>
        ))}</ul>
      )}</Async>
    </Card>
  );
}
