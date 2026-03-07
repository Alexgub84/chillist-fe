export interface ParticipantBalance {
  participantId: string;
  paid: number;
  fairShare: number;
  balance: number;
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export interface Settlement {
  fairShare: number;
  balances: ParticipantBalance[];
  transfers: Transfer[];
}

const EPSILON = 0.01;

export function computeSettlement(
  participantIds: string[],
  summaryMap: Map<string, number>,
  grandTotal: number
): Settlement {
  if (participantIds.length === 0 || grandTotal === 0) {
    return { fairShare: 0, balances: [], transfers: [] };
  }

  const fairShare = grandTotal / participantIds.length;

  const balances: ParticipantBalance[] = participantIds.map((id) => {
    const paid = summaryMap.get(id) ?? 0;
    return {
      participantId: id,
      paid,
      fairShare,
      balance: paid - fairShare,
    };
  });

  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  for (const b of balances) {
    if (b.balance < -EPSILON) {
      debtors.push({ id: b.participantId, amount: -b.balance });
    } else if (b.balance > EPSILON) {
      creditors.push({ id: b.participantId, amount: b.balance });
    }
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let di = 0;
  let ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const transferAmount = Math.min(debtors[di].amount, creditors[ci].amount);
    if (transferAmount > EPSILON) {
      transfers.push({
        from: debtors[di].id,
        to: creditors[ci].id,
        amount: Math.round(transferAmount * 100) / 100,
      });
    }
    debtors[di].amount -= transferAmount;
    creditors[ci].amount -= transferAmount;
    if (debtors[di].amount < EPSILON) di++;
    if (creditors[ci].amount < EPSILON) ci++;
  }

  return { fairShare, balances, transfers };
}
