import { useEffect, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { apiRequest, formatDate } from "../../lib/apiClient";
import type { Customer, MeasurementHistory } from "./customerTypes";

export default function CustomerProfile() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [history, setHistory] = useState<MeasurementHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void apiRequest<{ customer: Customer }>(`/api/customers/${id}`)
      .then((profile) => setCustomer(profile.customer))
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Could not load customer profile."))
      .finally(() => setLoading(false));
    void apiRequest<{ history: MeasurementHistory[] }>(`/api/customers/${id}/measurements`)
      .then((records) => setHistory(records.history))
      .catch((requestError: unknown) => setHistoryError(requestError instanceof Error ? requestError.message : "Could not load measurement history."));
  }, [id]);
  if (error) return <div className="card text-sm text-red-700">{error}</div>;
  if (loading || !customer) return <div className="empty-state"><span className="loader loader-dark" /> Loading customer profile...</div>;
  const measurements = customer.currentMeasurements;
  return <div className="space-y-4">
    <div className="card"><div className="flex flex-wrap justify-between gap-4"><div><p className="text-2xl font-semibold text-ink">{customer.name}</p><p className="mt-1 text-slate-500">{customer.mobile}{customer.email ? ` · ${customer.email}` : ""}</p></div><NavLink className="button-primary" to={`/customers/${id}/measurements`}>Update measurements</NavLink></div><p className="mt-4 text-sm text-slate-500">Customer since {formatDate(customer.createdAt)} · Last updated {formatDate(customer.updatedAt)}</p>{customer.notes ? <p className="mt-4 text-sm text-slate-700">{customer.notes}</p> : null}</div>
    <div className="card"><h2 className="text-lg font-semibold text-ink">Current measurements</h2>{measurements ? <><p className="mt-1 text-sm text-slate-500">{measurements.garmentType} · {measurements.unit}{measurements.height ? ` · Height ${measurements.height}` : ""}{measurements.weight ? ` · Weight ${measurements.weight}` : ""}</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{Object.entries(measurements.values).map(([key, value]) => <div className="rounded-xl bg-slate-50 p-3" key={key}><p className="text-xs capitalize text-slate-500">{key}</p><p className="mt-1 font-semibold text-ink">{value}</p></div>)}</div></> : <div className="empty-state mt-4">No measurements recorded yet.</div>}</div>
    <div className="card"><h2 className="text-lg font-semibold text-ink">Measurement history</h2>{historyError ? <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{historyError}</p> : history.length ? <div className="mt-4 space-y-3">{history.map((record) => <div className="rounded-xl border border-slate-200 p-4" key={record.measurementId}><div className="flex justify-between gap-4"><p className="font-medium text-ink">{formatDate(record.createdAt)}</p><p className="text-sm text-slate-500">{record.garmentType} · {record.unit}</p></div><p className="mt-2 text-sm text-slate-600">{Object.entries(record.values).map(([key, value]) => `${key}: ${value}`).join(" · ")}</p>{record.reason ? <p className="mt-2 text-sm text-slate-500">{record.reason}</p> : null}</div>)}</div> : <div className="empty-state mt-4">No history yet.</div>}</div>
  </div>;
}
