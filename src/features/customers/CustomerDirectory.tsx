import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { apiRequest, formatDate } from "../../lib/apiClient";
import type { Customer } from "./customerTypes";

export default function CustomerDirectory() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(path = "/api/customers?limit=50") {
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<{ customers: Customer[] }>(path);
      setCustomers(result.customers);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load customers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function search(value: string) {
    setQuery(value);
    if (!value.trim()) return load();
    try {
      const result = await apiRequest<{ customers: Customer[] }>(`/api/customers/search?q=${encodeURIComponent(value)}`);
      setCustomers(result.customers);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Search failed.");
    }
  }

  return (
    <div className="card">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h2 className="text-lg font-semibold text-ink">Customer directory</h2><p className="mt-1 text-sm text-slate-500">Search by name or mobile number.</p></div>
        <NavLink className="button-primary w-fit" to="/customers/new">+ Add customer</NavLink>
      </div>
      <label className="mt-6 block"><span className="label">Search</span><input className="input" onChange={(e) => void search(e.target.value)} placeholder="Search name or mobile..." value={query} /></label>
      {error ? <p className="mt-4 text-sm text-red-700" role="alert">{error}</p> : null}
      {loading ? <div className="empty-state mt-6">Loading customers...</div> : customers.length === 0 ? <div className="empty-state mt-6">No matching customers.</div> : (
        <div className="mt-6 divide-y divide-slate-100">{customers.map((customer) => <NavLink className="block py-4 first:pt-0 last:pb-0 hover:bg-slate-50" key={customer.customerId} to={`/customers/${customer.customerId}`}><div className="flex items-center justify-between gap-4"><div><p className="font-semibold text-ink">{customer.name}</p><p className="text-sm text-slate-500">{customer.mobile}</p></div><p className="text-right text-xs text-slate-500">Updated<br />{formatDate(customer.updatedAt)}</p></div></NavLink>)}</div>
      )}
    </div>
  );
}
