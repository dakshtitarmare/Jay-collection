import { google } from "googleapis";
import type { Customer, MeasurementHistoryRecord } from "./customerTypes.js";

const customerHeaders = [
  "customerId", "mobile", "name", "email", "age", "status",
  "height", "weight", "measurementUnit", "measurements", "notes",
  "createdAt", "updatedAt", "backupStatus",
];
const historyHeaders = [
  "measurementId", "customerId", "mobile", "garmentType", "unit",
  "height", "weight", "measurements", "reason", "createdAt", "createdBy",
];

function getSheetsClient() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error("Google Sheets backup is not configured.");
  const credentials = {
    client_email: process.env.FIREBASE_CLIENT_EMAIL ?? "",
    private_key: process.env.FIREBASE_PRIVATE_KEY ?? "",
  };
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error("Google Sheets service-account credentials are not configured.");
  }
  const auth = new google.auth.JWT(
    credentials.client_email,
    undefined,
    credentials.private_key.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/spreadsheets"],
  );
  return { sheets: google.sheets({ version: "v4", auth }), spreadsheetId };
}

async function ensureSheetTab(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string, title: string) {
  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties.title" });
    if (spreadsheet.data.sheets?.some((sheet) => sheet.properties?.title === title)) return;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title } } }] },
    });
  } catch (error) {
    if (isGoogleNotFound(error)) {
      throw new Error(`Google Sheet was not found or the service account has no access. Check GOOGLE_SHEETS_SPREADSHEET_ID and share the sheet with FIREBASE_CLIENT_EMAIL.`);
    }
    throw error;
  }
}

function isGoogleNotFound(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === 404;
}

function asSheetRow(customer: Customer) {
  const measurements = customer.currentMeasurements;
  return [
    customer.customerId, customer.mobile, customer.name, customer.email ?? "",
    customer.age ?? "", customer.status, measurements?.height ?? "",
    measurements?.weight ?? "", measurements?.unit ?? "",
    JSON.stringify(measurements?.values ?? {}), customer.notes ?? "",
    new Date(customer.createdAt).toISOString(), new Date(customer.updatedAt).toISOString(),
    "synced",
  ];
}

export async function upsertCustomer(customer: Customer) {
  const { sheets, spreadsheetId } = getSheetsClient();
  await ensureSheetTab(sheets, spreadsheetId, "Customers");
  const range = "Customers!A:N";
  const current = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = current.data.values ?? [];
  const existingRow = rows.findIndex((row) => row[0] === customer.customerId);
  const rowNumber = existingRow >= 0 ? existingRow + 1 : rows.length + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Customers!A${rowNumber}:N${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [asSheetRow(customer)] },
  });
}

export async function appendMeasurement(customer: Customer, history: MeasurementHistoryRecord) {
  const { sheets, spreadsheetId } = getSheetsClient();
  await ensureSheetTab(sheets, spreadsheetId, "MeasurementHistory");
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "MeasurementHistory!A:K",
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        history.measurementId, history.customerId, customer.mobile, history.garmentType,
        history.unit, history.height ?? "", history.weight ?? "",
        JSON.stringify(history.values), history.reason ?? "",
        new Date(history.createdAt).toISOString(), history.createdBy,
      ]],
    },
  });
}

export { customerHeaders, historyHeaders };
