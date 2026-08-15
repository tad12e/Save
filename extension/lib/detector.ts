// ─── Opportunity detection via multi-keyword matching ───

export interface DetectionResult {
  detected: boolean;
  type: string | null;
}

/**
 * Detects whether a block of text contains opportunity signals.
 * Requires at least 2 keyword matches within a single category to trigger.
 */
export function detectOpportunity(text: string): DetectionResult {
  if (!text) return { detected: false, type: null };
  const lower = text.toLowerCase();

  const signals: Record<string, string[]> = {
    job: [
      'hiring',
      'apply now',
      'job opening',
      'we are looking',
      'open position',
      'salary',
      'remote role',
      'internship',
      "we're hiring",
      'join our team',
    ],
    event: [
      'hackathon',
      'register now',
      'webinar',
      'deadline',
      'limited spots',
      'conference',
      'early bird',
      'rsvp',
    ],
    scholarship: [
      'scholarship',
      'grant',
      'fellowship',
      'fully funded',
      'applications open',
      'eligibility',
      'stipend',
    ],
    music: [
      'out now',
      'new single',
      'stream now',
      'new album',
      'listen now',
      'new release',
    ],
    deal: [
      '% off',
      'limited time',
      'promo code',
      'sale ends',
      'discount',
      'free for',
    ],
    course: [
      'enroll',
      'bootcamp',
      'certification',
      'cohort',
      'free course',
      'applications open',
    ],
  };

  for (const [type, keywords] of Object.entries(signals)) {
    const matches = keywords.filter((kw) => lower.includes(kw));
    if (matches.length >= 1) {
      return { detected: true, type };
    }
  }

  // Fallback for social feed posts (every post can be clipped)
  return { detected: true, type: 'post' };
}
