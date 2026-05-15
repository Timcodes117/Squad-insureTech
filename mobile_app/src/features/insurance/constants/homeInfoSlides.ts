import { formatNaira } from '@/shared/format/naira';

export type HomeInfoSlide = {
  id: string;
  title: string;
  body: string;
  foot: string;
  variant: 'brand' | 'neutral';
};

/** Manual swipe carousel below wallet/cover pager — neutral slides have no border on Home. */
export function buildHomeInfoSlides(p: {
  coverageRemainingNaira: number;
  coverageCapNaira: number;
  planLabel: string;
}): HomeInfoSlide[] {
  const { coverageRemainingNaira, coverageCapNaira, planLabel } = p;
  return [
    {
      id: 'cover_balance',
      title: 'Cover balance',
      body: `${formatNaira(coverageRemainingNaira)} left of ${formatNaira(coverageCapNaira)} for hospital help this period.`,
      foot: `${planLabel} · Swipe above for wallet vs cover.`,
      variant: 'brand',
    },
    {
      id: 'monthly_cap',
      title: 'Monthly hospital help',
      body: `Up to ${formatNaira(coverageCapNaira)} per 30-day window for partner primary care—malaria, typhoid, consults, and more.`,
      foot: 'Resets on your registration cycle.',
      variant: 'neutral',
    },
    {
      id: 'cooldown',
      title: '72-hour unlock',
      body: 'After your first wallet payment, your full monthly limit opens after 72 hours—fair cover without long dead periods.',
      foot: 'Status on Home reflects demo timing.',
      variant: 'neutral',
    },
    {
      id: 'week_one',
      title: 'First-week cap',
      body: 'In week one, each claim is capped at ₦5,000 while your cover warms up—then the full monthly limit applies.',
      foot: 'Also surfaced in alerts.',
      variant: 'neutral',
    },
    {
      id: 'covered_focus',
      title: 'What we focus on',
      body: 'Everyday primary-care bills—not surgery, maternity, or long inpatient stays. Open Coverage for the full included / excluded list.',
      foot: 'Tap Cover in the tab bar.',
      variant: 'neutral',
    },
  ];
}
