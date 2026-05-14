/** PRD §3.4 — primary care scope (MVP messaging). */
export const COVERAGE_INCLUDED = [
  'Malaria treatment',
  'Typhoid treatment',
  'Routine consultations',
  'Minor injuries and wound care',
  'Basic prescribed drugs',
] as const;

export const COVERAGE_EXCLUDED = [
  'Surgeries and inpatient procedures',
  'Chronic pre-existing conditions',
  'Maternity',
  'Dental and cosmetic procedures',
  'Specialist tertiary care',
] as const;
