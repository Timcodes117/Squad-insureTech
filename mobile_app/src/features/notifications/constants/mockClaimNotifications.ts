export type MockNotification = {
  id: string;
  title: string;
  body: string;
  timeLabel: string;
  tone: 'info' | 'success' | 'warning';
};

export const MOCK_CLAIM_NOTIFICATIONS: MockNotification[] = [
  {
    id: 'n1',
    title: 'Claim submitted',
    body: 'Island Clinic sent a malaria visit for ₦12,000. We are reviewing now.',
    timeLabel: '12 min ago',
    tone: 'info',
  },
  {
    id: 'n2',
    title: 'Claim approved',
    body: '₦12,000 approved toward your monthly cap. Hospital payout queued (demo).',
    timeLabel: '8 min ago',
    tone: 'success',
  },
  {
    id: 'n3',
    title: 'Week-one cap reminder',
    body: 'First week after activation: up to ₦5,000 per claim until your cover fully opens.',
    timeLabel: 'Yesterday',
    tone: 'warning',
  },
];
