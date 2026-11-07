import { useState, type FormEvent } from "react";
import { apiRequest } from "../../lib/apiClient";
import type { Customer } from "./customerTypes";

export default function CustomerForm({ onSaved }: { onSaved: (customer: Customer) => void }) {
  const [form, setForm] = useState({
    name: "", mobile: "", email: "", age: "", notes: "",
    height: "", weight: "", measurementReason: "",
    chest: "", waist: "", shoulder: "", shirtLength: "",
    sleeveLength: "", bicep: "", elbow: "", cuff: "", neck: "", armhole: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await apiRequest<{ customer: Customer; backupStatus: string }>("/api/customers", {
        method: "POST",
        body: JSON.stringify({ ...form, age: form.age ? Number(form.age) : undefined }),
      });
      const values = Object.fromEntries(
        ["chest", "waist", "shoulder", "shirtLength", "sleeveLength", "bicep", "elbow", "cuff", "neck", "armhole"]
          .filter((key) => form[key as keyof typeof form])
          .map((key) => [key, Number(form[key as keyof typeof form])]),
      );
      if (Object.keys(values).length > 0) {
        await apiRequest(`/api/customers/${result.customer.customerId}/measurements`, {
          method: "POST",
          body: JSON.stringify({
            garmentType: "shirt",
            unit: "inches",
            values,
            height: form.height ? Number(form.height) : undefined,
            weight: form.weight ? Number(form.weight) : undefined,
            reason: form.measurementReason || "Initial measurements",
          }),
        });
      }
      onSaved(result.customer);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save customer.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card space-y-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className="label">Name *</span><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label><span className="label">Mobile number *</span><input className="input" inputMode="tel" required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></label>
        <label><span className="label">Email (optional)</span><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label><span className="label">Age (optional)</span><input className="input" inputMode="numeric" min="0" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></label>
      </div>
      <label><span className="label">Notes</span><textarea className="input min-h-24" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-lg font-semibold text-ink">Initial shirt measurements (optional)</legend>
        <p className="mb-4 text-sm text-slate-500">Enter measurements in inches. You can add or update them later.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {([
            ["chest", "Chest"], ["waist", "Waist / stomach"], ["shoulder", "Shoulder"], ["shirtLength", "Shirt length"],
            ["sleeveLength", "Sleeve / hand length"], ["bicep", "Bicep"], ["elbow", "Elbow"], ["cuff", "Cuff"], ["neck", "Neck"], ["armhole", "Armhole"],
          ] as const).map(([key, label]) => (
            <label key={key}><span className="label">{label}</span><input className="input" inputMode="decimal" min="0" step="0.1" type="number" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>
          ))}
          <label><span className="label">Height</span><input className="input" inputMode="decimal" min="0" step="0.1" type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} /></label>
          <label><span className="label">Weight</span><input className="input" inputMode="decimal" min="0" step="0.1" type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /></label>
        </div>
        <label className="mt-4 block"><span className="label">Measurement note / reason</span><input className="input" placeholder="Initial shirt measurements" value={form.measurementReason} onChange={(e) => setForm({ ...form, measurementReason: e.target.value })} /></label>
      </fieldset>
      {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
      <button className="button-primary disabled:opacity-60" disabled={saving} type="submit">{saving ? "Saving..." : "Save customer"}</button>
    </form>
  );
}
