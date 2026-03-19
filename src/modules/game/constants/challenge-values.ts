/**
 * Truco Challenge System Constants
 *
 * Implements Argentine Truco challenge rules:
 * - Truco challenges (Truco, Retruco, Vale Cuatro)
 * - Envido challenges (Envido, Real Envido, Falta Envido)
 */

// Challenge types
export enum ChallengeType {
  // Truco challenges (card strength)
  TRUCO = 'TRUCO',
  RETRUCO = 'RETRUCO',
  VALE_CUATRO = 'VALECUATRO',

  // Envido challenges (card points)
  ENVIDO = 'ENVIDO',
  REAL_ENVIDO = 'REAL_ENVIDO',
  FALTA_ENVIDO = 'FALTA_ENVIDO',
}

// Points awarded for each challenge
export const CHALLENGE_POINTS: Record<ChallengeType, number> = {
  // Truco challenges
  [ChallengeType.TRUCO]: 2,        // Winner gets 2 points
  [ChallengeType.RETRUCO]: 3,      // Winner gets 3 points
  [ChallengeType.VALE_CUATRO]: 4,  // Winner gets 4 points

  // Envido challenges
  [ChallengeType.ENVIDO]: 2,       // Winner gets 2 points
  [ChallengeType.REAL_ENVIDO]: 3,  // Winner gets 3 points
  [ChallengeType.FALTA_ENVIDO]: 0, // Special: remaining points to 30
};

// Valid challenge sequences (what can follow what)
export const VALID_CHALLENGE_SEQUENCES: Record<ChallengeType, ChallengeType[]> = {
  // After TRUCO, you can raise to RETRUCO
  [ChallengeType.TRUCO]: [ChallengeType.RETRUCO],

  // After RETRUCO, you can raise to VALE_CUATRO
  [ChallengeType.RETRUCO]: [ChallengeType.VALE_CUATRO],

  // VALE_CUATRO is maximum, no further raises
  [ChallengeType.VALE_CUATRO]: [],

  // After ENVIDO, you can raise to REAL_ENVIDO or FALTA_ENVIDO
  [ChallengeType.ENVIDO]: [ChallengeType.REAL_ENVIDO, ChallengeType.FALTA_ENVIDO],

  // After REAL_ENVIDO, you can raise to FALTA_ENVIDO
  [ChallengeType.REAL_ENVIDO]: [ChallengeType.FALTA_ENVIDO],

  // FALTA_ENVIDO is maximum, no further raises
  [ChallengeType.FALTA_ENVIDO]: [],
};

// Challenge categories
export enum ChallengeCategory {
  TRUCO = 'TRUCO',
  ENVIDO = 'ENVIDO',
}

// Get category of a challenge type
export function getChallengeCategory(type: ChallengeType): ChallengeCategory {
  if ([ChallengeType.TRUCO, ChallengeType.RETRUCO, ChallengeType.VALE_CUATRO].includes(type)) {
    return ChallengeCategory.TRUCO;
  }
  return ChallengeCategory.ENVIDO;
}

// Check if a challenge raise is valid
export function isValidChallengeRaise(currentType: ChallengeType, newType: ChallengeType): boolean {
  const validRaises = VALID_CHALLENGE_SEQUENCES[currentType];
  return validRaises.includes(newType);
}

// Get points for Falta Envido based on current scores
export function getFaltaEnvidoPoints(challengerScore: number, opponentScore: number): number {
  // Falta Envido: the player who is furthest from 30 points
  const challengerRemaining = 30 - challengerScore;
  const opponentRemaining = 30 - opponentScore;

  return Math.max(challengerRemaining, opponentRemaining);
}

// Calculate total points at stake for all challenges in a trick
export function calculateChallengePoints(
  challenges: Array<{ type: ChallengeType; accepted: boolean | null }>,
  challengerScore: number,
  opponentScore: number
): { trucoPoints: number; envidoPoints: number } {
  let trucoPoints = 1; // Base points for winning a trick
  let envidoPoints = 0;

  for (const challenge of challenges) {
    if (challenge.accepted === false) {
      // If rejected, previous challenge points are awarded
      continue;
    }

    const category = getChallengeCategory(challenge.type);
    const points = CHALLENGE_POINTS[challenge.type];

    if (category === ChallengeCategory.TRUCO) {
      // Truco challenges replace the base trick points
      trucoPoints = points;
    } else if (category === ChallengeCategory.ENVIDO) {
      // Envido challenges add to envido points
      if (challenge.type === ChallengeType.FALTA_ENVIDO) {
        envidoPoints += getFaltaEnvidoPoints(challengerScore, opponentScore);
      } else {
        envidoPoints += points;
      }
    }
  }

  return { trucoPoints, envidoPoints };
}

// Check if challenge can be made at current game state
export function canMakeChallenge(
  type: ChallengeType,
  existingChallenges: Array<{ type: ChallengeType; accepted: boolean | null }>,
  trickNumber: number
): { allowed: boolean; reason?: string } {
  const category = getChallengeCategory(type);

  // Envido can only be called in the first trick
  if (category === ChallengeCategory.ENVIDO && trickNumber > 1) {
    return { allowed: false, reason: 'Envido can only be called in the first trick' };
  }

  // Check if there's a pending challenge
  const pendingChallenge = existingChallenges.find(c => c.accepted === null);
  if (pendingChallenge) {
    // Only allow raises of the same category
    if (getChallengeCategory(pendingChallenge.type) !== category) {
      return { allowed: false, reason: 'Cannot mix challenge categories' };
    }

    // Check if it's a valid raise
    if (!isValidChallengeRaise(pendingChallenge.type, type)) {
      return { allowed: false, reason: `Cannot raise ${pendingChallenge.type} to ${type}` };
    }
  }

  // Check if this type was already made in this trick (same category)
  const sameCategoryAccepted = existingChallenges.filter(c =>
    getChallengeCategory(c.type) === category && c.accepted === true
  );

  if (sameCategoryAccepted.length > 0) {
    const latestAccepted = sameCategoryAccepted[sameCategoryAccepted.length - 1];

    // Check if new challenge is a valid raise
    if (latestAccepted && !isValidChallengeRaise(latestAccepted.type, type)) {
      return { allowed: false, reason: `Cannot raise ${latestAccepted.type} to ${type}` };
    }
  }

  return { allowed: true };
}

// Get human-readable challenge names
export const CHALLENGE_NAMES: Record<ChallengeType, string> = {
  [ChallengeType.TRUCO]: 'Truco',
  [ChallengeType.RETRUCO]: 'Retruco',
  [ChallengeType.VALE_CUATRO]: 'Vale Cuatro',
  [ChallengeType.ENVIDO]: 'Envido',
  [ChallengeType.REAL_ENVIDO]: 'Real Envido',
  [ChallengeType.FALTA_ENVIDO]: 'Falta Envido',
};

// Get response options for a challenge
export function getChallengeResponseOptions(type: ChallengeType): string[] {
  const category = getChallengeCategory(type);

  if (category === ChallengeCategory.TRUCO) {
    const raises = VALID_CHALLENGE_SEQUENCES[type];
    return ['Accept (Quiero)', 'Reject (No quiero)', ...raises.map(r => `Raise to ${CHALLENGE_NAMES[r]}`)];
  } else {
    const raises = VALID_CHALLENGE_SEQUENCES[type];
    return ['Accept (Quiero)', 'Reject (No quiero)', ...raises.map(r => `Raise to ${CHALLENGE_NAMES[r]}`)];
  }
}

export default {
  ChallengeType,
  CHALLENGE_POINTS,
  VALID_CHALLENGE_SEQUENCES,
  getChallengeCategory,
  isValidChallengeRaise,
  getFaltaEnvidoPoints,
  calculateChallengePoints,
  canMakeChallenge,
  CHALLENGE_NAMES,
  getChallengeResponseOptions,
};
