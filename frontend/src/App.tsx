import { useState } from "react";
import DetailModal from "./components/DetailModal";
import { api } from "./services/api";
import { useAsync } from "./services/useAsync";
import Alerts from "./pages/Alerts";
import Overview from "./pages/Overview";
import Simulate from "./pages/Simulate";
import Transactions from "./pages/Transactions";

const TABS = ["Overview", "Transactions", "Risk alerts", "Simulate"] as const;

export default function App() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [selected, setSelected] = useState<string | null>(null);
  const [version, setVersion] = useState(0); // bump to refetch pages after changes
  const health = useAsync(() => api.health().catch(() => false), []);
  const bump = () => setVersion((v) => v + 1);
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-bold">PayFlow</h1><p className="text-xs text-slate-500">Fictional payment monitoring demo</p></div>
        <nav className="flex gap-1 rounded-lg bg-slate-200 p-1">
          {TABS.map((t) => <button key={t} onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1 text-sm ${tab === t ? "bg-white font-medium shadow-sm" : "text-slate-600"}`}>{t}</button>)}
        </nav>
        <span className="text-xs text-slate-500"><span className={health.data ? "text-emerald-500" : "text-red-500"}>●</span> API {health.data ? "online" : "offline"}</span>
      </header>
      <main key={`${tab}-${version}`}>
        {tab === "Overview" && <Overview onOpen={setSelected} />}
        {tab === "Transactions" && <Transactions onOpen={setSelected} />}
        {tab === "Risk alerts" && <Alerts onOpen={setSelected} />}
        {tab === "Simulate" && <Simulate />}
      </main>
      {selected && <DetailModal id={selected} onClose={() => setSelected(null)} onChanged={bump} />}
    </div>
  );
}
