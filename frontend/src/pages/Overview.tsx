import { Async, Card, RiskBadge, fmtDate, money, parseDate } from "../components/ui";
import { api } from "../services/api";
import { useAsync } from "../services/useAsync";
import type { Transaction } from "../types";

const Metric = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <Card><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-semibold">{value}</p>{sub && <p className="text-xs text-slate-400">{sub}</p>}</Card>
);

function Activity({ items }: { items: Transaction[] }) {
  const buckets = new Map<string, { a: number; d: number }>();
  for (const t of [...items].reverse()) {
    const dt = parseDate(t.created_at);
    const k = `${dt.getMonth() + 1}/${dt.getDate()} ${String(dt.getHours()).padStart(2, "0")}:00`;
    const b = buckets.get(k) ?? { a: 0, d: 0 };
    if (t.status === "APPROVED") b.a++; else b.d++;
    buckets.set(k, b);
  }
  const rows = [...buckets.entries()].slice(-12);
  const max = Math.max(1, ...rows.map(([, b]) => b.a + b.d));
  return (
    <div>
      <div className="flex h-36 items-end gap-2">
        {rows.map(([k, b]) => (
          <div key={k} className="flex h-full flex-1 flex-col justify-end" title={`${k}: ${b.a} approved, ${b.d} declined`}>
            <div className="bg-red-400" style={{ height: `${(b.d / max) * 100}%` }} />
            <div className="bg-emerald-500" style={{ height: `${(b.a / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-2 text-[10px] text-slate-400">{rows.map(([k]) => <span key={k} className="flex-1 truncate text-center">{k.split(" ")[1]}</span>)}</div>
      <p className="mt-2 text-xs text-slate-500"><span className="text-emerald-600">■</span> Approved <span className="ml-2 text-red-500">■</span> Declined (latest 100 transactions, by hour)</p>
    </div>
  );
}

export default function Overview({ onOpen }: { onOpen: (id: string) => void }) {
  const m = useAsync(api.overview, []);
  const recent = useAsync(() => api.list({ limit: 100 }), []);
  const alerts = useAsync(() => api.alerts(false), []);
  return (
    <div className="space-y-6">
      <Async s={m}>{(d) => (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Metric label="Transactions" value={d.total_transactions.toLocaleString()} />
          <Metric label="Approved volume" value={money(d.approved_volume_cents)} />
          <Metric label="Approval rate" value={`${(d.approval_rate * 100).toFixed(1)}%`} sub={`${d.approved} approved`} />
          <Metric label="Decline rate" value={`${(d.decline_rate * 100).toFixed(1)}%`} sub={`${d.declined} declined`} />
          <Metric label="Open alerts" value={String(d.unreviewed_alerts)} sub={`${d.flagged_count} flagged total`} />
        </div>
      )}</Async>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Transaction activity">
          <Async s={recent} isEmpty={(p) => p.items.length === 0} empty="No transactions yet. Use Simulate to create some.">
            {(p) => <Activity items={p.items} />}
          </Async>
        </Card>
        <Card title="Recent risk alerts">
          <Async s={alerts} isEmpty={(a) => a.length === 0} empty="No open alerts">
            {(a) => <ul className="divide-y divide-slate-100">{a.slice(0, 5).map((t) => (
              <li key={t.id}><button onClick={() => onOpen(t.id)} className="flex w-full items-center justify-between py-2 text-left text-sm hover:bg-slate-50">
                <span><b>{money(t.amount_cents, t.currency)}</b> <span className="text-slate-500">· {t.risk_reasons.join(", ")}</span>
                  <span className="block text-xs text-slate-400">{fmtDate(t.created_at)}</span></span>
                <RiskBadge r={t.risk_level} /></button></li>
            ))}</ul>}
          </Async>
        </Card>
      </div>
    </div>
  );
}
