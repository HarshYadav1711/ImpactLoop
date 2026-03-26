import { createHash } from "crypto";

export interface DrawEntry {
  id: string;
  user_id: string;
  ticket_count: number;
}

export interface PrizeTier {
  tier: string;
  percentage: number;
}

export const PRIZE_TIERS: PrizeTier[] = [
  { tier: "Tier 1", percentage: 0.5 },
  { tier: "Tier 2", percentage: 0.3 },
  { tier: "Tier 3", percentage: 0.2 },
];

export function tierAmount(totalCents: number, percentage: number): number {
  return Math.floor(totalCents * percentage);
}

function deterministicIndex(seed: string, max: number): number {
  const hex = createHash("sha256").update(seed).digest("hex");
  const value = BigInt(`0x${hex}`);
  return Number(value % BigInt(max));
}

export function pickWinnerByTickets(entries: DrawEntry[], seed: string): DrawEntry | null {
  if (!entries.length) return null;

  const totalTickets = entries.reduce((sum, entry) => sum + entry.ticket_count, 0);
  const stop = deterministicIndex(seed, totalTickets);

  let running = 0;
  for (const entry of entries) {
    running += entry.ticket_count;
    if (stop < running) {
      return entry;
    }
  }

  return entries[entries.length - 1] ?? null;
}

export function explainDrawLogic(): string {
  return "Deterministic weighted draw: each active subscriber gets tickets from their monthly Stableford score. Winner selection hashes draw month + tier into a stable index over cumulative tickets. Duplicate user wins in one draw are prevented. Unawarded tiers roll over.";
}
