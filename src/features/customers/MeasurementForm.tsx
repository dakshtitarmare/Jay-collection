import { useEffect, useState, type FormEvent } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../lib/apiClient";
import type { Customer } from "./customerTypes";

export default function MeasurementForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    garmentType: "shirt",
    unit: "inches",
    height: "",
    weight: "",
    reason: "",
    chest: "",
    waist: "",
    shoulder: "",
    shirtLength: "",
    sleeveLength: "",
    bicep: "",
    elbow: "",
    cuff: "",
    neck: "",
    armhole: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    void apiRequest<{ customer: Customer }>(`/api/customers/${id}`)
      .then(({ customer }) => {
        const measurements = customer.currentMeasurements;
        if (!measurements) return;
        setForm((current) => ({
          ...current,
          garmentType: measurements.garmentType,
          unit: measurements.unit,
          height: measurements.height?.toString() ?? "",
          weight: measurements.weight?.toString() ?? "",
          ...Object.fromEntries(
            Object.entries(measurements.values).map(([key, value]) => [key, value.toString()]),
          ),
        }));
      })
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Could not load measurements."))
      .finally(() => setLoading(false));
  }, [id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const measurementKeys = ["chest", "waist", "shoulder", "shirtLength", "sleeveLength", "bicep", "elbow", "cuff", "neck", "armhole"] as const;
      const values = Object.fromEntries(
        measurementKeys
          .filter((key) => form[key])
          .map((key) => [key, Number(form[key])]),
      );
      await apiRequest(`/api/customers/${id}/measurements`, {
        method: "POST",
        body: JSON.stringify({
          garmentType: form.garmentType,
          unit: form.unit,
          values,
          height: form.height ? Number(form.height) : undefined,
          weight: form.weight ? Number(form.weight) : undefined,
          reason: form.reason || "Updated measurements",
        }),
      });
      navigate(`/customers/${id}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save measurements.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="empty-state">Loading measurements...</div>;

  return (
    <form className="card space-y-4" onSubmit={submit}>
      <NavLink className="text-sm text-navy" to={`/customers/${id}`}>← Back to profile</NavLink>
      <h2 className="text-xl font-semibold text-ink">Update measurements</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className="label">Garment type</span><input className="input" value={form.garmentType} onChange={(e) => setForm({ ...form, garmentType: e.target.value })} /></label>
        <label><span className="label">Unit</span><input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></label>
        <label><span className="label">Height</span><input className="input" inputMode="decimal" min="0" step="0.1" type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} /></label>
        <label><span className="label">Weight</span><input className="input" inputMode="decimal" min="0" step="0.1" type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /></label>
      </div>
      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-lg font-semibold text-ink">Shirt measurements</legend>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {([
            ["chest", "Chest"], ["waist", "Waist / stomach"], ["shoulder", "Shoulder"], ["shirtLength", "Shirt length"],
            ["sleeveLength", "Sleeve / hand length"], ["bicep", "Bicep"], ["elbow", "Elbow"], ["cuff", "Cuff"], ["neck", "Neck"], ["armhole", "Armhole"],
          ] as const).map(([key, label]) => (
            <label key={key}><span className="label">{label}</span><input className="input" inputMode="decimal" min="0" step="0.1" type="number" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>
          ))}
        </div>
      </fieldset>
      <label><span className="label">Note</span><textarea className="input" placeholder="Why are these measurements being updated?" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></label>
      {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
      <button className="button-primary disabled:opacity-60" disabled={saving} type="submit">{saving ? "Saving..." : "Save measurements"}</button>
    </form>
  );
}
