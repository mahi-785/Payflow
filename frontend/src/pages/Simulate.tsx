import { useState } from "react";
import { Btn, Card, RiskBadge, StatusBadge, inputCls, money } from "../components/ui";
import { api } from "../services/api";
import { MERCHANTS, type Transaction } from "../types";

const SCENARIOS = [
  { label: "Approved", token: "tok_demo_123", amount: "25.99" },
  { label: "Insufficient funds", token: "tok_demo_insufficient", amount: "80.00" },
  { label: "Card blocked", token: "tok_demo_blocked", amount: "12.50" },
  { label: "Large amount (risk)", token: "tok_demo_big", amount: "1500.00" },
  { label: "Over limit", token: "tok_demo_over", amount: "5000.01" },
  { label: "Processing error", token: "tok_demo_error", amount: "10.00" },
];
const newKey = () => `pf-${crypto.randomUUID()}`;

/** "25.99" -> 2599 without floating point. Returns null if invalid or not positive. */
function toCents(s: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(s.trim())) return null;
  const [d, c = ""] = s.trim().split(".");
  const cents = parseInt(d, 10) * 100 + parseInt(c.padEnd(2, "0") || "0", 10);
  return cents > 0 ? cents : null;
}

export default function Simulate() {
  const [amount, setAmount] = useState("25.99");
  const [merchant, setMerchant] = useState(MERCHANTS[0].id);
  const [token, setToken] = useState("tok_demo_123");
  const [key, setKey] = useState(newKey);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tx?: Transaction; replay?: boolean; error?: string; note?: string } | null>(null);

  const submit = async () => {
    const cents = toCents(amount);
    if (cents === null) return setResult({ error: "Enter a positive amount like 25.99." });
    setBusy(true);
    try {
      const r = await api.pay({ amount_cents: cents, currency: "USD", merchant_id: merchant, payment_token: token }, key);
      setResult({ tx: r.tx, replay: r.replay });
    } catch (e) { setResult({ error: (e as Error).message }); }
    setBusy(false);
  };
  const burst = async () => {
    setBusy(true);
    try {
      for (let i = 0; i < 5; i++)
        await api.pay({ amount_cents: 1500, currency: "USD", merchant_id: merchant, payment_token: "tok_burst" }, newKey());
      setResult({ note: "Sent 5 payments with the same token. Check Risk alerts for a VELOCITY flag." });
    } catch (e) { setResult({ error: (e as Error).message }); }
    setBusy(false);
  };
  const pick = (s: (typeof SCENARIOS)[number]) => { setToken(s.token); setAmount(s.amount); setKey(newKey()); setResult(null); };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Simulate a payment (fictional tokens only)">
        <div className="mb-4 flex flex-wrap gap-2">
          {SCENARIOS.map((s) => <Btn key={s.label} variant="ghost" onClick={() => pick(s)}>{s.label}</Btn>)}
          <Btn variant="ghost" disabled={busy} onClick={burst}>Velocity burst ×5</Btn>
        </div>
        <div className="space-y-3 text-sm">
          <label className="block text-xs text-slate-500">Amount (USD)<input className={`${inputCls} mt-1`} value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <label className="block text-xs text-slate-500">Merchant<select className={`${inputCls} mt-1`} value={merchant} onChange={(e) => setMerchant(e.target.value)}>
            {MERCHANTS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
          <label className="block text-xs text-slate-500">Payment token<input className={`${inputCls} mt-1 font-mono`} value={token} onChange={(e) => setToken(e.target.value)} /></label>
          <label className="block text-xs text-slate-500">Idempotency key
            <div className="mt-1 flex gap-2"><input className={`${inputCls} font-mono`} value={key} onChange={(e) => setKey(e.target.value)} />
              <Btn variant="ghost" onClick={() => setKey(newKey())}>New</Btn></div></label>
          <Btn disabled={busy} onClick={submit}>{busy ? "Processing…" : "Submit payment"}</Btn>
        </div>
      </Card>
      <Card title="Result">
        {!result && <p className="text-sm text-slate-500">Submit a payment, then submit again with the same key to see idempotency in action.</p>}
        {result?.note && <p className="text-sm text-slate-700">{result.note}</p>}
        {result?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{result.error}<br /><span className="text-xs">Processing errors are not declines; retrying with the same key is safe.</span></p>}
        {result?.tx && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><b className="text-xl">{money(result.tx.amount_cents)}</b>
              <StatusBadge s={result.tx.status} /><RiskBadge r={result.tx.risk_level} /></div>
            {result.tx.decline_reason && <p>Decline reason: <b>{result.tx.decline_reason}</b></p>}
            {result.tx.risk_reasons.length > 0 && <p>Risk flags: <b>{result.tx.risk_reasons.join(", ")}</b></p>}
            <p className="break-all font-mono text-xs text-slate-500">{result.tx.id}</p>
            <p className={`rounded-lg p-3 ${result.replay ? "bg-indigo-50 text-indigo-900" : "bg-slate-50 text-slate-600"}`}>
              {result.replay ? "Idempotent replay: the original transaction was returned and no new payment was created."
                : "New transaction created. Submit again with the same key to test idempotency."}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
