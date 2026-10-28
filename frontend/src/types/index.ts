export type Status = "APPROVED" | "DECLINED";
export type Risk = "LOW" | "MEDIUM" | "HIGH";
export interface Transaction {
  id: string; amount_cents: number; currency: string; merchant_id: string; payment_token: string;
  status: Status; decline_reason: string | null; risk_level: Risk; risk_reasons: string[];
  reviewed: boolean; created_at: string;
}
export interface TxEvent { event_type: string; detail: string; created_at: string }
export interface TransactionDetail extends Transaction { events: TxEvent[] }
export interface TxPage { items: Transaction[]; total: number; limit: number; offset: number }
export interface Overview {
  total_transactions: number; approved: number; declined: number; approval_rate: number;
  decline_rate: number; approved_volume_cents: number; flagged_count: number; unreviewed_alerts: number;
}
export interface ListParams {
  status?: string; merchant_id?: string; date_from?: string; date_to?: string; limit?: number; offset?: number;
}
export const MERCHANTS = [
  { id: "demo-merchant-001", name: "Demo Coffee Co." },
  { id: "demo-merchant-002", name: "Demo Electronics" },
  { id: "demo-merchant-003", name: "Demo Travel" },
];
export const RISK_EXPLANATIONS: Record<string, string> = {
  LARGE_AMOUNT: "Amount is at or above the large-transaction threshold ($1,000).",
  VELOCITY: "Several payments with the same token arrived within a short window (60 seconds).",
};
