/** Slides for the home cover / rules carousel (copy aligns with PRD demo). */
export const HOME_CAROUSEL_SLIDES = [
  {
    id: 'cap',
    title: 'Monthly hospital help',
    body: 'Up to ₦20,000 per 30-day window for partner primary care—malaria, typhoid, consults, and more.',
    foot: 'Resets on your registration cycle.',
  },
  {
    id: 'cooldown',
    title: '72-hour unlock',
    body: 'After your first wallet payment, your full monthly limit opens after 72 hours—fair cover without long dead periods.',
    foot: 'Shown as demo status on Home.',
  },
  {
    id: 'week1',
    title: 'First-week cap',
    body: 'In week one, each claim is capped at ₦5,000 while your cover warms up—then the full monthly limit applies.',
    foot: 'Explained in onboarding and alerts.',
  },
  {
    id: 'covered',
    title: 'What we focus on',
    body: 'Everyday primary-care bills—not surgery, maternity, or long inpatient stays. See Coverage for the full list.',
    foot: 'Tap Coverage in the tab bar.',
  },
] as const;
