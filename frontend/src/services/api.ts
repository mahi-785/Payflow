import type { ListParams, Overview, Transaction, TransactionDetail, TxPage } from "../types";

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const d = body?.detail;
    const msg = Array.isArray(d) ? d.map((x: { msg: string }) => x.msg).join("; ")
      : d?.message ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  overview: () => fetch("/api/v1/metrics/overview").then(parse<Overview>),
  list: (p: ListParams) => {
    const q = new URLSearchParams();
    Object.entries(p).forEach(([k, v]) => v !== undefined && v !== "" && q.set(k, String(v)));
    return fetch(`/api/v1/transactions?${q}`).then(parse<TxPage>);
  },
  detail: (id: string) => fetch(`/api/v1/transactions/${encodeURIComponent(id)}`).then(parse<TransactionDetail>),
  alerts: (reviewed?: boolean) =>
    fetch(`/api/v1/alerts${reviewed === undefined ? "" : `?reviewed=${reviewed}`}`).then(parse<Transaction[]>),
  review: (id: string) => fetch(`/api/v1/alerts/${id}/review`, { method: "POST" }).then(parse<Transaction>),
  async pay(body: object, key: string) {
    const res = await fetch("/api/v1/transactions", {
      method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify(body),
    });
    return { tx: await parse<Transaction>(res), replay: res.status === 200 };
  },
  health: () => fetch("/health").then((r) => r.ok),
};
