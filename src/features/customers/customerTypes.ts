export type MeasurementSet = {
  garmentType: string;
  unit: string;
  values: Record<string, number>;
  notes?: string;
  height?: number;
  weight?: number;
  updatedAt: number;
};

export type Customer = {
  customerId: string;
  mobile: string;
  name: string;
  email?: string;
  age?: number;
  notes?: string;
  status: "active" | "archived";
  createdAt: number;
  updatedAt: number;
  currentMeasurements?: MeasurementSet;
};

export type MeasurementHistory = MeasurementSet & {
  measurementId: string;
  customerId: string;
  reason?: string;
  createdAt: number;
  createdBy: string;
};
