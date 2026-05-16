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
      return '3-day wait';
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
      return `Hospital visits unlock after a 3-day wait from first payment. About ${hoursLeft} hours left in demo.`;
    default:
      return '';
  }
}
