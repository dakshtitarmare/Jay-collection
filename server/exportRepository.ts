import { getFirebaseAdminDatabase } from "./firebaseAdmin";
import type { Customer, MeasurementHistoryRecord } from "./customerTypes";

export async function exportCustomers() {
  const database = getFirebaseAdminDatabase();
  const [customersSnapshot, historySnapshot] = await Promise.all([
    database.ref("customers").get(),
    database.ref("measurementHistory").get(),
  ]);
  const customers = Object.values((customersSnapshot.val() ?? {}) as Record<string, Customer>);
  const historyByCustomer = (historySnapshot.val() ?? {}) as Record<string, Record<string, MeasurementHistoryRecord>>;
  return {
    exportedAt: Date.now(),
    customers,
    measurementHistory: Object.fromEntries(
      Object.entries(historyByCustomer).map(([customerId, records]) => [customerId, Object.values(records)]),
    ),
  };
}
