import { getFirebaseAdminDatabase } from "./firebaseAdmin";
import type { Customer, MeasurementHistoryRecord } from "./customerTypes";

const customersPath = "customers";

export async function findCustomerById(customerId: string) {
  const snapshot = await getFirebaseAdminDatabase().ref(`${customersPath}/${customerId}`).get();
  return snapshot.exists() ? snapshot.val() as Customer : null;
}

export async function findCustomerByMobile(mobile: string) {
  const indexed = await getFirebaseAdminDatabase().ref(`customerByMobile/${mobileKey(mobile)}`).get();
  if (indexed.exists()) {
    return findCustomerById(String(indexed.val()));
  }
  return null;
}

function mobileKey(mobile: string) {
  return mobile.replace(/^\+/, "");
}

export async function searchCustomersByName(name: string, limit: number) {
  const normalized = name.toLowerCase();
  const snapshot = await getFirebaseAdminDatabase()
    .ref(customersPath)
    .orderByChild("nameLower")
    .startAt(normalized)
    .endAt(`${normalized}\uf8ff`)
    .limitToFirst(limit)
    .get();
  const values = snapshot.val() as Record<string, Customer> | null;
  return Object.values(values ?? {}).filter((customer) => customer.status !== "archived");
}

export async function listCustomers(limit: number, cursor?: string) {
  const snapshot = await getFirebaseAdminDatabase().ref(customersPath).get();
  const values = snapshot.val() as Record<string, Customer> | null;
  const customers = Object.values(values ?? {}).filter((customer) => customer.status !== "archived");
  return {
    customers: customers.slice(0, limit),
    totalCount: customers.length,
    nextCursor: customers.length > limit ? customers[limit - 1].customerId : null,
    cursor,
  };
}

export async function writeCustomer(customer: Customer) {
  await getFirebaseAdminDatabase().ref().update({
    [`${customersPath}/${customer.customerId}`]: customer,
    [`customerByMobile/${mobileKey(customer.mobile)}`]: customer.customerId,
  });
}

export async function updateCustomer(customerId: string, update: Partial<Customer>, previousMobile?: string) {
  const updates: Record<string, unknown> = {
    [`${customersPath}/${customerId}`]: update,
  };
  if (update.mobile) {
    updates[`customerByMobile/${mobileKey(update.mobile)}`] = customerId;
  }
  if (previousMobile && previousMobile !== update.mobile) {
    updates[`customerByMobile/${mobileKey(previousMobile)}`] = null;
  }
  await getFirebaseAdminDatabase().ref().update(updates);
}

export async function writeMeasurement(customer: Customer, history: MeasurementHistoryRecord) {
  const database = getFirebaseAdminDatabase();
  await database.ref().update({
    [`customers/${customer.customerId}/currentMeasurements`]: customer.currentMeasurements,
    [`customers/${customer.customerId}/currentMeasurementId`]: history.measurementId,
    [`customers/${customer.customerId}/updatedAt`]: customer.updatedAt,
    [`measurementHistory/${customer.customerId}/${history.measurementId}`]: history,
  });
}

export async function listMeasurementHistory(customerId: string) {
  const snapshot = await getFirebaseAdminDatabase().ref(`measurementHistory/${customerId}`).get();
  const values = snapshot.val() as Record<string, MeasurementHistoryRecord> | null;
  return Object.values(values ?? {}).sort((a, b) => b.createdAt - a.createdAt);
}
