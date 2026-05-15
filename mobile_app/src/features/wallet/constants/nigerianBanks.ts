export type NigerianBank = {
  code: string;
  name: string;
};

/** Demo bank list — replace with Paystack / Squad bank list API. */
export const NIGERIAN_BANKS: readonly NigerianBank[] = [
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '044', name: 'Access Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '035', name: 'Wema Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '214', name: 'First City Monument Bank' },
] as const;

export function getBankByCode(code: string): NigerianBank | undefined {
  return NIGERIAN_BANKS.find((b) => b.code === code);
}
