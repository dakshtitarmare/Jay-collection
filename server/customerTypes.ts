export type CustomerStatus = "active" | "archived";

export type MeasurementSet = {
  garmentType: string;
  unit: string;
  values: Record<string, number>;
  notes?: string;
  height?: number;
  weight?: number;
};

export type Customer = {
  customerId: string;
  mobile: string;
  name: string;
  nameLower: string;
  email?: string;
  age?: number;
  notes?: string;
  status: CustomerStatus;
  createdAt: number;
  updatedAt: number;
  archivedAt?: number;
  currentMeasurementId?: string;
  currentMeasurements?: MeasurementSet & { updatedAt: number };
};

export type MeasurementHistoryRecord = MeasurementSet & {
  measurementId: string;
  customerId: string;
  reason?: string;
  createdAt: number;
  createdBy: string;
};
