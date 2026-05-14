export const REGISTRATION_STEPS = [
  {
    id: 'full_name',
    progressLabel: 'Name',
    title: 'What is your name?',
    subtitle: 'Enter your first name, middle name if you have one, and last name.',
    voiceLine: 'What is your name? Enter your first name, your middle name if you have one, and your last name.',
  },
  {
    id: 'phone',
    progressLabel: 'Phone',
    title: 'Your phone number',
    subtitle: 'We use it to sign you in, verify hospitals, and help you recover your account. You will also use a password and a text code when you sign in.',
    voiceLine: 'Enter the phone number you use.',
  },
  {
    id: 'otp',
    progressLabel: 'Code',
    title: 'Enter your code',
    subtitle: 'We sent a 6-digit code by SMS. It may take a minute.',
    voiceLine: 'Enter the six digit code we sent to your phone.',
  },
  {
    id: 'password',
    progressLabel: 'Password',
    title: 'Create a password',
    subtitle: 'Use at least 8 characters. You will sign in with your phone number, this password, and a code we text you.',
    voiceLine: 'Choose a password with at least eight characters, then type it again to confirm.',
  },
  {
    id: 'face_intro',
    progressLabel: 'Face',
    title: 'Confirm your face',
    subtitle:
      'We want to protect your health account. Let’s confirm it’s really you—this is quick and simple. Your picture is safe and only used to protect your account.',
    voiceLine: 'We need to confirm your face to protect your account. Tap continue when you are ready.',
  },
  {
    id: 'face_scan',
    progressLabel: 'Face',
    title: 'Take a clear face picture',
    subtitle: 'Look at the camera clearly.',
    voiceLine: 'Look straight at the camera. Move a little closer if needed. Good lighting helps.',
  },
  {
    id: 'nin',
    progressLabel: 'NIN',
    title: 'National ID (NIN)',
    subtitle: 'Your eleven-digit National Identification Number helps us keep your account safe.',
    voiceLine: 'Please enter your NIN, the eleven digit number on your national ID.',
  },
  {
    id: 'age_range',
    progressLabel: 'Age',
    title: 'Your age range',
    subtitle: 'Pick the range that fits you best.',
    voiceLine: 'Which age range are you in?',
  },
  {
    id: 'gender',
    progressLabel: 'Gender',
    title: 'How should we refer to you?',
    subtitle: 'Pick one option below.',
    voiceLine: 'How should we refer to you?',
  },
  {
    id: 'state',
    progressLabel: 'Location',
    title: 'State / market area',
    subtitle: 'Choose your state or main market area. You can add more detail later.',
    voiceLine: 'Which state or market area are you in?',
  },
  {
    id: 'payment_frequency',
    progressLabel: 'Payments',
    title: 'How do you want to pay?',
    subtitle: 'A small weekly payment, or a monthly payment—pick what feels easier.',
    voiceLine: 'Do you want to pay weekly or monthly?',
  },
  {
    id: 'occupation',
    progressLabel: 'Work',
    title: 'What kind of work do you do?',
    subtitle: 'This helps us assign the right weekly amount for your cover tier—same hospital help for everyone.',
    voiceLine: 'Pick the option that best matches your main work.',
  },
  {
    id: 'plan',
    progressLabel: 'Plan',
    title: 'Your BetaHealth plan',
    subtitle: 'Three tiers, same ₦20,000 monthly hospital help. Your job type sets which weekly amount applies.',
    voiceLine: 'Here is the health cover plan for your work type.',
  },
  {
    id: 'review',
    progressLabel: 'Review',
    title: 'Review your details',
    subtitle: 'Check that everything looks right before we create your account.',
    voiceLine: 'Please review your details before we continue.',
  },
  {
    id: 'creating',
    progressLabel: 'Creating',
    title: 'Creating your account',
    subtitle: 'Please wait a moment while we set up your BetaHealth wallet.',
    voiceLine: 'Please wait while we create your account and wallet.',
  },
  {
    id: 'wallet',
    progressLabel: 'Wallet',
    title: 'Your BetaHealth wallet is ready',
    subtitle: 'Save these details somewhere safe.',
    voiceLine: 'Your health wallet is ready. Note your account number.',
  },
  {
    id: 'success',
    progressLabel: 'Done',
    title: 'You are all set',
    subtitle: 'Welcome to BetaHealth—weekly micro-cover for everyday hospital bills.',
    voiceLine: 'You are all set. Welcome.',
  },
] as const;

export type RegistrationStepId = (typeof REGISTRATION_STEPS)[number]['id'];

export const REGISTRATION_TOTAL_STEPS = REGISTRATION_STEPS.length;

export function registrationStepIndex(id: RegistrationStepId): number {
  const i = REGISTRATION_STEPS.findIndex((s) => s.id === id);
  return i >= 0 ? i : 0;
}

export const AGE_RANGE_OPTIONS = [
  { id: '18-25', label: '18–25' },
  { id: '26-40', label: '26–40' },
  { id: '41-60', label: '41–60' },
  { id: '60+', label: '60+' },
] as const;

export const GENDER_OPTIONS = [
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
  { id: 'prefer_not', label: 'Prefer not to say' },
] as const;

export const PAYMENT_OPTIONS = [
  {
    id: 'weekly' as const,
    label: 'Weekly',
    hint: 'Smaller amounts, more often',
  },
  {
    id: 'monthly' as const,
    label: 'Monthly',
    hint: 'One payment each month',
  },
];

export type RiskTier = 'low' | 'medium' | 'high';

export const BETAHEALTH_PLANS = [
  {
    id: 'plan_basic',
    tier: 'low' as const,
    name: 'Basic',
    weeklyNaira: 500,
    monthlyCapNaira: 20_000,
    audience: 'Office workers, students, teachers, traders',
    bullets: [
      '₦20,000/month cap for partner-hospital primary care',
      'Malaria, typhoid, consults, minor injuries—see coverage tab',
      'Premium burns weekly from your wallet when funded',
    ],
  },
  {
    id: 'plan_standard',
    tier: 'medium' as const,
    name: 'Standard',
    weeklyNaira: 750,
    monthlyCapNaira: 20_000,
    audience: 'Vendors, tailors, hairdressers, cooks, farmers',
    bullets: [
      'Same ₦20,000 monthly cap as Basic and High-Risk',
      'Higher weekly amount matches medium-risk occupations',
      'Instant settlement story at partner hospitals',
    ],
  },
  {
    id: 'plan_high_risk',
    tier: 'high' as const,
    name: 'High-Risk',
    weeklyNaira: 1000,
    monthlyCapNaira: 20_000,
    audience: 'Bricklayers, welders, drivers, mechanics, security',
    bullets: [
      'Same ₦20,000 monthly cap—fair cover for higher-risk jobs',
      'Pay-to-activate: cover starts after your first wallet funding',
      'First week has a lower cap until your cover fully opens',
    ],
  },
] as const;

export type BetaHealthPlan = (typeof BETAHEALTH_PLANS)[number];

/** @deprecated Legacy id from single-plan registration; maps to Basic. */
export const LEGACY_STARTER_PLAN_ID = 'starter_shield';

export const DEFAULT_PLAN_ID: BetaHealthPlan['id'] = 'plan_basic';

export function planForTier(tier: RiskTier): BetaHealthPlan {
  const p = BETAHEALTH_PLANS.find((x) => x.tier === tier);
  return p ?? BETAHEALTH_PLANS[0];
}

export function planById(id: string | null | undefined): BetaHealthPlan | null {
  if (!id) {
    return null;
  }
  return BETAHEALTH_PLANS.find((p) => p.id === id) ?? null;
}

export { formatNaira } from '@/shared/format/naira';

export const OCCUPATION_OPTIONS = [
  { id: 'office', label: 'Office / desk work', tier: 'low' as const, hint: 'Low risk' },
  { id: 'student', label: 'Student', tier: 'low' as const, hint: 'Low risk' },
  { id: 'teacher', label: 'Teacher', tier: 'low' as const, hint: 'Low risk' },
  { id: 'trader', label: 'Trader / shop owner', tier: 'low' as const, hint: 'Low risk' },
  { id: 'vendor', label: 'Market vendor', tier: 'medium' as const, hint: 'Medium risk' },
  { id: 'tailor', label: 'Tailor / fashion', tier: 'medium' as const, hint: 'Medium risk' },
  { id: 'hairdresser', label: 'Hairdresser / barber', tier: 'medium' as const, hint: 'Medium risk' },
  { id: 'cook', label: 'Cook / caterer', tier: 'medium' as const, hint: 'Medium risk' },
  { id: 'farmer', label: 'Farmer', tier: 'medium' as const, hint: 'Medium risk' },
  { id: 'bricklayer', label: 'Bricklayer / construction', tier: 'high' as const, hint: 'High risk' },
  { id: 'welder', label: 'Welder / metal work', tier: 'high' as const, hint: 'High risk' },
  { id: 'driver', label: 'Driver / rider', tier: 'high' as const, hint: 'High risk' },
  { id: 'mechanic', label: 'Mechanic', tier: 'high' as const, hint: 'High risk' },
  { id: 'security', label: 'Security', tier: 'high' as const, hint: 'High risk' },
] as const;

export type OccupationOption = (typeof OCCUPATION_OPTIONS)[number];

export function tierForOccupationId(occupationId: string | null): RiskTier | null {
  if (!occupationId) {
    return null;
  }
  const o = OCCUPATION_OPTIONS.find((x) => x.id === occupationId);
  return o?.tier ?? null;
}

export const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
] as const;
