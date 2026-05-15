export type MockCoverStatus = 'active' | 'awaiting_funding' | 'cooldown';

export const MOCK_DASHBOARD = {
  coverStatus: 'awaiting_funding' as MockCoverStatus,
  coverageRemainingNaira: 14_500,
  coverageCapNaira: 20_000,
  cooldownHoursLeft: 48,
  weekOneCapNaira: 5_000,
  planLabel: 'Standard · ₦750/wk',
  resetHint: 'Your ₦20,000 cap resets every 30 days from registration.',
} as const;

export function mockStatusHeadline(status: MockCoverStatus): string {
  switch (status) {
    case 'active':
      return 'Cover active';
    case 'awaiting_funding':
      return 'Awaiting first payment';
    case 'cooldown':
      return 'Cooldown — full cover soon';
    default:
      return '';
  }
}

export function mockStatusDetail(status: MockCoverStatus, hoursLeft: number): string {
  switch (status) {
    case 'active':
      return 'Hospital help is on within your monthly limit.';
    case 'awaiting_funding':
      return 'Fund your BetaHealth wallet to turn cover on.';
    case 'cooldown':
      return `Full claim limit opens after 72 hours from first payment. About ${hoursLeft} hours left in demo.`;
    default:
      return '';
  }
}
