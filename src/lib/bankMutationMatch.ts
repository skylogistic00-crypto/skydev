export type BankMutationMatchCandidate = {
  id: string;
  date: string | null;
  description: string | null;
  debit: number | null;
  credit: number | null;
};

export function normalizeText(input: string) {
  return (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function amountOf(row: Pick<BankMutationMatchCandidate, "debit" | "credit">) {
  return Number(row.debit ?? row.credit ?? 0);
}

export function scoreCandidate(params: {
  row: BankMutationMatchCandidate;
  targetDate?: string | null;
  targetAmount?: number | null;
  targetDescription?: string | null;
}) {
  const { row, targetDate, targetAmount, targetDescription } = params;

  let score = 0;

  // Amount match is most important
  if (typeof targetAmount === "number") {
    const a = amountOf(row);
    const diff = Math.abs(a - targetAmount);
    if (diff === 0) score += 60;
    else if (diff <= 1000) score += 45;
    else if (diff <= 5000) score += 30;
  }

  // Date match (same day)
  if (targetDate && row.date) {
    const d1 = new Date(targetDate);
    const d2 = new Date(row.date);
    const sameDay =
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
    if (sameDay) score += 25;
  }

  // Description overlap
  if (targetDescription && row.description) {
    const q = new Set(normalizeText(targetDescription).split(" ").filter(Boolean));
    const r = new Set(normalizeText(row.description).split(" ").filter(Boolean));
    let overlap = 0;
    q.forEach((w) => {
      if (r.has(w)) overlap += 1;
    });
    score += Math.min(15, overlap * 3);
  }

  return score;
}

export function pickTopCandidates(params: {
  candidates: BankMutationMatchCandidate[];
  targetDate?: string | null;
  targetAmount?: number | null;
  targetDescription?: string | null;
  limit?: number;
}) {
  const { candidates, targetAmount, targetDate, targetDescription, limit = 5 } = params;

  return candidates
    .map((row) => ({
      row,
      score: scoreCandidate({ row, targetAmount, targetDate, targetDescription }),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
