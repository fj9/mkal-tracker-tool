export const SCHEMA_VERSION = 1;

export type Side = "RS" | "WS" | "";

export interface Row {
  row_id: string;
  actual_row: number;
  sec: string;
  rin: number;
  lab: string;
  col: string;
  side: Side;
  phase: string;
  sub?: string | null;
  rep_row?: number | null;
  rep_pass?: number | null;
  stripe?: string | null;
  stripe_row?: number | null;
  sts_start: number;
  sts_worked: number;
  sts_end: number;
  sts_unworked: number;
  running_worked: number;
  net: number;
  inc: number;
  dec: number;
  cast_on: number;
  live: number;
  bo: number;
  marker?: number | null;
  printed?: number | null;
  /** Empty in clue.public.json. */
  instr: string;
}

export interface Section {
  name: string;
  rows: number;
  stitches_worked: number;
  first_actual_row: number;
  last_actual_row: number;
  stitches_on_needle_at_end: number;
}

export interface ClueVariant {
  id: string;
  name: string;
  axes: Record<string, string>;
}

export interface Clue {
  schema_version: number;
  clue_id: string;
  base_clue_id?: string;
  variant?: ClueVariant;
  mkal_id: string;
  mkal: string;
  year: number;
  designer: string;
  clue_number: number;
  title: string;
  data_version: string;
  total: number;
  colours: string[];
  conventions: Record<string, unknown>;
  sections: Section[];
  rows: Row[];
}

export interface CatalogueVariant {
  clue_id: string;
  name: string | null;
  /** Path relative to content/, e.g. "clues/twists_turns_clue1_clue.json". */
  file: string;
  total: number;
  rows: number;
}

export interface CatalogueClue {
  base_clue_id: string;
  clue_number: number;
  title: string;
  variants: CatalogueVariant[];
}

export interface CatalogueMkal {
  mkal_id: string;
  name: string;
  year: number;
  designer: string;
  clues: CatalogueClue[];
}

export interface Catalogue {
  schema_version: number;
  mkals: CatalogueMkal[];
}

export interface Progress {
  clue_id: string;
  data_version: string;
  start_date: string; // YYYY-MM-DD
  days: number;
  done: string[]; // row_id values
  updated_at: string; // ISO timestamp
}
