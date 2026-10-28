import { api } from "../services/api";
import { useAsync } from "../services/useAsync";
import { RISK_EXPLANATIONS } from "../types";
import { Async, Btn, RiskBadge, StatusBadge, fmtDate, money } from "./ui";

export default function DetailModal({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const s = useAsync(() => api.detail(id), [id]);
  const review = async () => { await api.review(id); s.reload(); onChanged(); };
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Transaction details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">✕</button>
        </div>
        <Async s={s}>{(t) => (
          <div className="space-y-4 text-sm">
            <p className="break-all font-mono text-xs text-slate-500">{t.id}</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold">{money(t.amount_cents, t.currency)}</span>
              <StatusBadge s={t.status} /><RiskBadge r={t.risk_level} />
            </div>
            <dl className="grid grid-cols-2 gap-2">
              <dt className="text-slate-500">Merchant</dt><dd>{t.merchant_id}</dd>
              <dt className="text-slate-500">Token</dt><dd className="font-mono">{t.payment_token}</dd>
              <dt className="text-slate-500">Created</dt><dd>{fmtDate(t.created_at)}</dd>
              <dt className="text-slate-500">Decision</dt><dd>{t.decline_reason ?? "Approved"}</dd>
            </dl>
            {t.risk_reasons.length > 0 && (
              <div className="rounded-lg bg-amber-50 p-3">
                <p className="mb-1 font-medium text-amber-900">Why it was flagged</p>
                <ul className="list-disc pl-5 text-amber-900">
                  {t.risk_reasons.map((r) => <li key={r}><b>{r}</b>: {RISK_EXPLANATIONS[r] ?? "Rule triggered."}</li>)}
                </ul>
                {t.reviewed ? <p className="mt-2 text-xs text-emerald-700">Reviewed ✓</p>
                  : <Btn className="mt-2" onClick={review}>Mark as reviewed</Btn>}
              </div>
            )}
            <div>
              <p className="mb-1 font-medium">Audit trail</p>
              <ol className="space-y-1 border-l-2 border-slate-200 pl-3">
                {t.events.map((e, i) => (
                  <li key={i}><b>{e.event_type}</b> <span className="text-slate-500">{e.detail}</span>
                    <div className="text-xs text-slate-400">{fmtDate(e.created_at)}</div></li>
                ))}
              </ol>
            </div>
          </div>
        )}</Async>
      </div>
    </div>
  );
}
