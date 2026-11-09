export type Kind = "program" | "end";
export interface Ev { kind: Kind; icon: string; title: string; lines: string[] }
/** First day shown in the grid (lighting rehearsal). */
export const GRID_START = "2026-11-20";
/** Opening day of the 592nd Striezelmarkt – the countdown runs to this date. */
export const START = "2026-11-25";
export const END = "2026-12-24";
export const KIND_LABEL: Record<Kind, string> = { program: "label_program", end: "label_end" };

// "$key" parts are translated (see i18n.ts); names stay literal.
const E = (kind: Kind, icon: string, title: string, lines: string[]): Ev => ({ kind, icon, title, lines });

export const EVENTS: Record<string, Ev> = {
  "2026-11-20": E("program", "💡", "$t_rehearsal", ["16:45 – $rehearsal"]),
  "2026-11-25": E("program", "🕯️", "$t_open", [
    "15:00 – $service", "15:45 – $procession", "16:00 – $ceremony", "16:30 – $salesStart", "$openHours"]),
  "2026-11-28": E("program", "🗓️", "$t_advcal", ["$adv1"]),
  "2026-11-29": E("program", "⛪", "$t_kreuz", ["$adv1"]),
  "2026-12-05": E("program", "🍞", "$t_stollen", ["$adv2", "$stollenDesc"]),
  "2026-12-06": E("program", "🍪", "$t_pfeffer", ["$adv2"]),
  "2026-12-12": E("program", "🎠", "$t_pyramid", ["$adv3", "$pyramidDesc"]),
  "2026-12-13": E("program", "🧶", "$t_craft", ["$adv3"]),
  "2026-12-19": E("program", "🎩", "$t_toffel", ["$adv4", "$toffelDesc"]),
  "2026-12-20": E("program", "🧸", "$t_kids", ["$adv4"]),
  "2026-12-24": E("end", "🔔", "$t_final", ["$finalDesc", "$endDesc"]),
};

export const isClosed = (_iso: string) => false;
/** Is this grid day before the market has opened (20–24 Nov)? */
export const isPre = (iso: string) => iso < START;
/** Opening hours per organizer (striezelmarkt.dresden.de). Programme subject to change. */
export function hoursFor(iso: string): string {
  if (isPre(iso)) return "$notyet";
  if (iso === "2026-11-25") return "16:00–21:00";
  if (iso === "2026-12-24") return "10:00–14:00";
  return "10:00–21:00";
}
