import type { CoverJourneyPhase } from '@/features/insurance/mappers/dashboardMapper';
import { WEEK_ONE_CAP_NAIRA } from '@/features/insurance/mappers/dashboardMapper';

export type HomeInfoSlide = {
  id: string;
  title: string;
  body: string;
};

/** Short updates for the Home carousel — balances live on the wallet/cover cards above. */
export function buildHomeInfoSlides(p: {
  coverJourneyPhase?: CoverJourneyPhase;
  weekOneEndsLabel?: string | null;
  monthlyCapNaira?: number;
}): HomeInfoSlide[] {
  const { coverJourneyPhase, weekOneEndsLabel, monthlyCapNaira = 20_000 } = p;

  const slides: HomeInfoSlide[] = [];

  if (coverJourneyPhase === 'awaiting_funding') {
    slides.push({
      id: 'start',
      title: 'Activate your cover',
      body: 'Fund your wallet and pay your first weekly premium. Cover starts once payment is received.',
    });
  } else if (coverJourneyPhase === 'cooldown') {
    slides.push({
      id: 'activation',
      title: '3-day activation',
      body: 'Your account is activating. Wait 3 days after first premium before any hospital visit.',
    });
  } else if (coverJourneyPhase === 'week_one') {
    slides.push({
      id: 'first_week',
      title: 'First-week limit',
      body: weekOneEndsLabel
        ? `You can visit hospitals now. ₦${WEEK_ONE_CAP_NAIRA.toLocaleString('en-NG')} in total for all visits until ${weekOneEndsLabel}, then ₦${monthlyCapNaira.toLocaleString('en-NG')} monthly.`
        : `You can visit hospitals now. ₦${WEEK_ONE_CAP_NAIRA.toLocaleString('en-NG')} in total for your first week, then ₦${monthlyCapNaira.toLocaleString('en-NG')} monthly.`,
    });
  }

  slides.push(
    {
      id: 'how_it_works',
      title: 'How it works',
      body: 'Pay your weekly premium from your wallet. Use your cover at partner hospitals for eligible primary-care bills.',
    },
    {
      id: 'whats_covered',
      title: 'What’s covered',
      body: 'Everyday primary care—consultations, malaria, typhoid, and similar. Surgery and long hospital stays are not included.',
    },
    {
      id: 'partner_hospitals',
      title: 'Partner hospitals',
      body: 'Only verified partner hospitals can bill BetaHealth. Check the list before you go and bring your member QR.',
    },
  );

  return slides;
}
