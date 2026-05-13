// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Test1223XxeErfassung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    titel?: string;
    beschreibung?: string;
    datum?: string; // Format: YYYY-MM-DD oder ISO String
    bemerkung?: string;
  };
}

export const APP_IDS = {
  TEST_1223_XXE_ERFASSUNG: '6a044ccc8e5ab963989d840e',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'test_1223_xxe_erfassung': {
    'titel': 'string/text',
    'beschreibung': 'string/textarea',
    'datum': 'date/date',
    'bemerkung': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateTest1223XxeErfassung = StripLookup<Test1223XxeErfassung['fields']>;