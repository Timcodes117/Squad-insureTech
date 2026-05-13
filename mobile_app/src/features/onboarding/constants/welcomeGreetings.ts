/** Greetings for the welcome step; keyed by the same ids as language selection. */
export type WelcomeGreeting = {
  id: string;
  /** Short label for accessibility / optional UI hint */
  languageLabel: string;
  /** Short headline when `paragraphs` is not used */
  text: string;
  /** Long-form welcome copy (scrollable) */
  paragraphs?: string[];
  /** Shown above the first paragraph only (e.g. Pidgin intro) */
  introLabel?: string;
  /** Best-effort BCP-47 tag for device TTS */
  speechLanguage?: string;
};

export const WELCOME_GREETINGS: WelcomeGreeting[] = [
  { id: 'ha', languageLabel: 'Hausa', text: 'Barka da zuwa', speechLanguage: 'ha-NG' },
  {
    id: 'yo',
    languageLabel: 'Yorùbá',
    text: 'Kaabo',
    speechLanguage: 'yo-NG',
    paragraphs: [
      "Ẹ kú àmójútó iṣẹ́ o. A mọ̀ pé akitiyan yín pọ̀ láti tọ́jú ẹbí, ṣùgbọ́n tí àìsàn bá dé, owó lè tán ní pami-pami. A gbàgbọ́ pé ọ̀rọ̀ ilé-ìwòsàn kò yẹ kí ó jẹ́ tàwọn 'olówó nìkan.' Ìtọ́jú tó dára yẹ kí ó kàn gbogbo wa.",
      "Pẹ̀lú MyBodyCover, ẹrù owó ìwòsàn ti kúrò lórí yín. Ẹ kò nílò àràádọ́ta-pọun láti rí dókítà gidi. Ẹ má fòyà mọ́ pé 'báwo ni mo ṣe fẹ́ ṣe é?' bí ara kò bá yá. A ti yanjú apá yẹn fún yín.",
      'Inú rẹ̀ rọrùn gan-an. Kò nílò owó ńlá lẹ́ẹ̀kan náà. Ẹ máa san díẹ̀-díẹ̀ gẹ́gẹ́ bí agbára yín ṣe mọ, ẹ ó sì rí ìtọ́jú gbà. Yálà ẹ wà lọ́jà ni tàbí nínú ṣọ́ọ̀pù, ẹ fọkàn balẹ̀ pé àlèpò ń bẹ. Kò sí ohun tó lè mì yín.',
      'Àfojúsùn wa ni kí ọmọ orílẹ̀-èdè Nàìjíríà kọ̀ọ̀kan lè wọnú ilé-ìwòsàn pẹ̀lú ìgboyà, láìsí ìdààmú owó. Ẹ jẹ́ kí ara yín le, kí ẹ lè máa bá iṣẹ́ yín lọ pẹ̀lú agbára kíkún.',
      'MyBodyCover. Ìlera tó dunjú fún gbogbo wa. Ẹ jẹ́ kí á bẹ̀rẹ̀!',
    ],
  },
  { id: 'ig', languageLabel: 'Igbo', text: 'Nnọọ', speechLanguage: 'ig-NG' },
  {
    id: 'pcm',
    languageLabel: 'Pidgin',
    text: 'You dey welcome!',
    speechLanguage: 'en-NG',
    introLabel: 'Intro',
    paragraphs: [
      "Welcome to MyBodyCover. You be hustler, you dey work hard. But when sickness come, money fit fly commot. We believe say hospital no be for only 'big man.' Beta treatment for everybody.",
      'With us, hospital bill no be your load again. You no need millions to see better doctor. No more fear for your health; we don settle that side for you.',
      'E simple. No be big money once. Just dey drop small-small change, and you get cover. Anywhere you dey, rest heart say back-up dey. Nothing go shake you.',
      'Make every Nigerian enter hospital with pride, no stress. No more skipping doctor because money no dey. Stay strong, make you fit hustle with full ginger.',
      'MyBodyCover. Beta health for Naija. Oya, make we start!',
    ],
  },
  { id: 'en', languageLabel: 'English', text: 'Welcome', speechLanguage: 'en-GB' },
];

const welcomeById = Object.fromEntries(WELCOME_GREETINGS.map((g) => [g.id, g])) as Record<string, WelcomeGreeting>;

/** Greeting line for onboarding welcome step; unknown codes fall back to English. */
export function getWelcomeGreetingForLanguage(languageCode: string | null): WelcomeGreeting {
  const fallback = welcomeById.en;
  if (!languageCode) {
    return fallback;
  }
  return welcomeById[languageCode] ?? fallback;
}
