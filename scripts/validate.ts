import type { Clue } from "../src/data/schema";

/** The build-time checks from the spec. Returns one message per failure; empty means valid. */
export function validateClue(clue: Clue, label = clue.clue_id): string[] {
  const errors: string[] = [];
  const fail = (msg: string) => errors.push(`${label}: ${msg}`);
  const { rows } = clue;

  // 1. actual_row runs 1..n with no gaps; row_id unique
  const seen = new Set<string>();
  rows.forEach((r, i) => {
    if (r.actual_row !== i + 1)
      fail(`row at index ${i} has actual_row ${r.actual_row}, expected ${i + 1}`);
    if (seen.has(r.row_id)) fail(`duplicate row_id "${r.row_id}" (actual_row ${r.actual_row})`);
    seen.add(r.row_id);
  });

  // 2. sum of sts_worked = total = last running_worked
  const sum = rows.reduce((a, r) => a + r.sts_worked, 0);
  if (sum !== clue.total) fail(`sum of sts_worked is ${sum} but total is ${clue.total}`);
  const last = rows[rows.length - 1]?.running_worked;
  if (last !== clue.total) fail(`last running_worked is ${last} but total is ${clue.total}`);
  let running = 0;
  for (const r of rows) {
    running += r.sts_worked;
    if (r.running_worked !== running) {
      fail(`running_worked is ${r.running_worked} at actual_row ${r.actual_row}, expected ${running}`);
      break;
    }
  }

  rows.forEach((r, i) => {
    // 3. within a section, sts_start = previous row's sts_end
    const prev = rows[i - 1];
    if (prev && prev.sec === r.sec && r.sts_start !== prev.sts_end)
      fail(`actual_row ${r.actual_row}: sts_start ${r.sts_start} does not match previous sts_end ${prev.sts_end}`);
    // 4. end - start = net = cast_on + live + inc - dec - bo
    if (r.sts_end - r.sts_start !== r.net)
      fail(`actual_row ${r.actual_row}: sts_end - sts_start is ${r.sts_end - r.sts_start} but net is ${r.net}`);
    const shaped = r.cast_on + r.live + r.inc - r.dec - r.bo;
    if (r.net !== shaped)
      fail(`actual_row ${r.actual_row}: net ${r.net} but cast_on + live + inc - dec - bo is ${shaped}`);
    // 5. printed = sts_end
    if (r.printed != null && r.printed !== r.sts_end)
      fail(`actual_row ${r.actual_row}: printed ${r.printed} but sts_end is ${r.sts_end}`);
  });

  return errors;
}

/** Public data must carry no instruction text. */
export function findInstructionText(clue: Clue, label = clue.clue_id): string[] {
  return clue.rows
    .filter((r) => r.instr !== "")
    .map((r) => `${label}: actual_row ${r.actual_row} has instruction text in a public file`);
}
