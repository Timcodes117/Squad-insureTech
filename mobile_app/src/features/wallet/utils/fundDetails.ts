export function buildFundDetailsMessage(params: {
  accountNumber: string;
  bankName: string;
  accountName?: string | null;
}): string {
  const { accountNumber, bankName, accountName } = params;
  const lines = ['Fund your BetaHealth wallet', `Bank: ${bankName}`, `Account number: ${accountNumber}`];
  if (accountName?.trim()) {
    lines.push(`Account name: ${accountName.trim()}`);
  }
  lines.push('Transfers usually arrive within a few minutes.');
  return lines.join('\n');
}

export function fundAccountSubtitle(accountNumber: string | null | undefined, bankName?: string | null): string {
  const num = accountNumber?.trim();
  if (!num || num === '—') {
    return 'Virtual account pending';
  }
  const bank = bankName?.trim();
  return bank ? `${num} · ${bank}` : num;
}
