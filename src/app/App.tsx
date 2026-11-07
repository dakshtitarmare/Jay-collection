import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import SignInPage from "../features/auth/SignInPage";
import CustomerDirectory from "../features/customers/CustomerDirectory";
import CustomerForm from "../features/customers/CustomerForm";
import CustomerProfile from "../features/customers/CustomerProfile";
import MeasurementForm from "../features/customers/MeasurementForm";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/authContext";
import { apiRequest } from "../lib/apiClient";

const navigation = [
  { label: "Dashboard", path: "/" },
  { label: "Customers", path: "/customers" },
  { label: "Settings", path: "/settings" },
];

function Dashboard() {
  const [totalCustomers, setTotalCustomers] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    void apiRequest<{ totalCount: number }>("/api/customers?limit=1")
      .then(({ totalCount }) => setTotalCustomers(totalCount))
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Could not load customer count."));
  }, []);

  return (
    <Page title={greeting}>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="text-sm text-slate-500">Total customers</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{totalCustomers === null ? <Loader label="Loading customers" /> : totalCustomers}</p>
          <p className="mt-2 text-sm text-slate-500">{error ?? "All saved customers in your book."}</p>
        </div>
        <div className="card flex flex-col justify-between">
          <div>
            <p className="text-sm text-slate-500">Quick action</p>
            <p className="mt-2 text-lg font-semibold text-ink">Add a customer</p>
          </div>
          <NavLink className="button-primary mt-5 w-fit" to="/customers/new">
            + Add customer
          </NavLink>
        </div>
      </section>
    </Page>
  );
}

function Customers() {
  return (
    <Page title="Customers">
      <CustomerDirectory />
    </Page>
  );
}

function AddCustomer() {
  const navigate = useNavigate();
  return <Page title="Add customer"><CustomerForm onSaved={(customer) => navigate(`/customers/${customer.customerId}`)} /></Page>;
}

function Settings() {
  const [message, setMessage] = useState<string | null>(null);
  async function exportData() {
    setMessage(null);
    try {
      const data = await apiRequest<unknown>("/api/export?format=json");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `j-collection-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Export downloaded successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export failed.");
    }
  }
  return <Page title="Settings"><div className="card"><h2 className="text-lg font-semibold text-ink">Data export</h2><p className="mt-1 text-sm text-slate-500">Download an owner-authorized JSON backup of customers and measurement history.</p><button className="button-primary mt-5" onClick={() => void exportData()} type="button">Export customer data</button>{message ? <p className="mt-4 text-sm text-slate-600" role="status">{message}</p> : null}</div></Page>;
}

function Page({ title, children }: { title: string; children: ReactNode }) {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-navy">J Collection</p>
            <p className="text-sm text-slate-500">Customer & measurement book</p>
          </div>
          <button className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200" onClick={() => void signOut()} type="button">Sign out</button>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:py-10">
        <aside className="lg:w-56">
          <nav aria-label="Primary navigation" className="flex gap-2 overflow-x-auto lg:block lg:space-y-2">
            {navigation.map((item) => (
              <NavLink
                className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
                end={item.path === "/"}
                key={item.path}
                to={item.path}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
          {children}
        </main>
      </div>
      <footer className="mx-auto max-w-6xl px-4 pb-8 text-center text-xs text-slate-500 sm:px-6">
        <details className="mx-auto mb-4 max-w-md rounded-xl bg-white p-3 text-left shadow-sm">
          <summary className="cursor-pointer font-semibold text-navy">Help center</summary>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Check your internet connection.</li>
            <li>Refresh the page or restart the browser.</li>
            <li>Turn airplane mode on and off, then try again.</li>
            <li>If data does not load, restart the device and contact the owner/admin.</li>
          </ul>
        </details>
        Developed by <a className="text-navy underline" href="https://dakshtitarmare.vercel.app" rel="noreferrer" target="_blank">Daksh Titarmare</a>
      </footer>
    </div>
  );
}

export function Loader({ label = "Loading" }: { label?: string }) {
  return <span aria-label={label} className="inline-flex items-center gap-2 text-sm text-slate-500" role="status"><span className="loader" />{label}</span>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<SignInPage />} path="/sign-in" />
      <Route element={<ProtectedRoute><Dashboard /></ProtectedRoute>} path="/" />
      <Route element={<ProtectedRoute><Customers /></ProtectedRoute>} path="/customers" />
      <Route element={<ProtectedRoute><AddCustomer /></ProtectedRoute>} path="/customers/new" />
      <Route element={<ProtectedRoute><Page title="Customer profile"><CustomerProfile /></Page></ProtectedRoute>} path="/customers/:id" />
      <Route element={<ProtectedRoute><Page title="Update measurements"><MeasurementForm /></Page></ProtectedRoute>} path="/customers/:id/measurements" />
      <Route element={<ProtectedRoute><Settings /></ProtectedRoute>} path="/settings" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
