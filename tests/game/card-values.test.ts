/**
 * Card Values & Game Logic Unit Tests
 */

import {
  getCardValue,
  compareCards,
  dealCards,
  calculateEnvidoScore,
  isValidCard,
  DECK,
} from '../../src/modules/game/constants/card-values';

import {
  ChallengeType,
  ChallengeCategory,
  getChallengeCategory,
  calculateChallengePoints,
  canMakeChallenge,
  isValidChallengeRaise,
  getFaltaEnvidoPoints,
} from '../../src/modules/game/constants/challenge-values';

// ========================================
// Card Values
// ========================================

describe('Card Values', () => {
  test('Espada 1 is the highest card', () => {
    expect(getCardValue('2_01')).toBe(15);
  });

  test('Basto 1 is second highest', () => {
    expect(getCardValue('0_01')).toBe(14);
  });

  test('Espada 7 is third highest', () => {
    expect(getCardValue('2_07')).toBe(13);
  });

  test('Oro 7 is fourth highest', () => {
    expect(getCardValue('3_07')).toBe(12);
  });

  test('All threes have value 11', () => {
    expect(getCardValue('0_03')).toBe(11);
    expect(getCardValue('1_03')).toBe(11);
    expect(getCardValue('2_03')).toBe(11);
    expect(getCardValue('3_03')).toBe(11);
  });

  test('Fours are the lowest', () => {
    expect(getCardValue('0_04')).toBe(2);
    expect(getCardValue('3_04')).toBe(2);
  });

  test('Deck has exactly 40 cards', () => {
    expect(DECK.length).toBe(40);
  });

  test('Invalid card returns 0', () => {
    expect(getCardValue('9_99')).toBe(0);
  });
});

// ========================================
// Card Comparison
// ========================================

describe('Card Comparison', () => {
  test('Espada 1 beats Basto 1', () => {
    expect(compareCards('2_01', '0_01')).toBeGreaterThan(0);
  });

  test('Three beats Two', () => {
    expect(compareCards('0_03', '0_02')).toBeGreaterThan(0);
  });

  test('Same rank cards tie', () => {
    expect(compareCards('0_03', '1_03')).toBe(0);
  });

  test('King beats Knight', () => {
    expect(compareCards('0_12', '0_11')).toBeGreaterThan(0);
  });

  test('Four loses to everything above it', () => {
    expect(compareCards('0_04', '0_05')).toBeLessThan(0);
    expect(compareCards('0_04', '2_01')).toBeLessThan(0);
  });
});

// ========================================
// Card Dealing
// ========================================

describe('Card Dealing', () => {
  test('deals 3 cards to each player', () => {
    const { hostCards, guestCards } = dealCards();
    expect(hostCards.length).toBe(3);
    expect(guestCards.length).toBe(3);
  });

  test('no duplicate cards', () => {
    const { hostCards, guestCards } = dealCards();
    const allCards = [...hostCards, ...guestCards];
    const unique = new Set(allCards);
    expect(unique.size).toBe(6);
  });

  test('all cards are valid', () => {
    const { hostCards, guestCards } = dealCards();
    [...hostCards, ...guestCards].forEach(card => {
      expect(isValidCard(card)).toBe(true);
    });
  });
});

// ========================================
// Envido Score Calculation
// ========================================

describe('Envido Score', () => {
  test('two cards same suit: sum + 20', () => {
    // Espada 1 (envido=1) + Espada 5 (envido=5) = 1+5+20 = 26
    const score = calculateEnvidoScore(['2_01', '2_05', '0_03']);
    expect(score).toBe(26);
  });

  test('three cards same suit: best two + 20', () => {
    // All Basto: 7(=7) + 6(=6) + 4(=4) => best two: 7+6+20 = 33
    const score = calculateEnvidoScore(['0_07', '0_06', '0_04']);
    expect(score).toBe(33);
  });

  test('figures count as 0 for envido', () => {
    // Espada King (=0) + Espada 3 (=3) = 0+3+20 = 23
    const score = calculateEnvidoScore(['2_12', '2_03', '1_04']);
    expect(score).toBe(23);
  });

  test('no same suit: highest single card', () => {
    // All different suits, single cards
    const score = calculateEnvidoScore(['0_07', '1_06', '2_05']);
    expect(score).toBe(7);
  });

  test('two figures same suit give 20', () => {
    // King + Knight of same suit = 0+0+20 = 20
    const score = calculateEnvidoScore(['0_12', '0_11', '1_03']);
    expect(score).toBe(20);
  });
});

// ========================================
// Challenge System
// ========================================

describe('Challenge System', () => {
  test('getChallengeCategory correctly categorizes', () => {
    expect(getChallengeCategory(ChallengeType.TRUCO)).toBe(ChallengeCategory.TRUCO);
    expect(getChallengeCategory(ChallengeType.RETRUCO)).toBe(ChallengeCategory.TRUCO);
    expect(getChallengeCategory(ChallengeType.VALE_CUATRO)).toBe(ChallengeCategory.TRUCO);
    expect(getChallengeCategory(ChallengeType.ENVIDO)).toBe(ChallengeCategory.ENVIDO);
    expect(getChallengeCategory(ChallengeType.REAL_ENVIDO)).toBe(ChallengeCategory.ENVIDO);
    expect(getChallengeCategory(ChallengeType.FALTA_ENVIDO)).toBe(ChallengeCategory.ENVIDO);
  });

  test('valid challenge raises', () => {
    expect(isValidChallengeRaise(ChallengeType.TRUCO, ChallengeType.RETRUCO)).toBe(true);
    expect(isValidChallengeRaise(ChallengeType.RETRUCO, ChallengeType.VALE_CUATRO)).toBe(true);
    expect(isValidChallengeRaise(ChallengeType.ENVIDO, ChallengeType.REAL_ENVIDO)).toBe(true);
    expect(isValidChallengeRaise(ChallengeType.REAL_ENVIDO, ChallengeType.FALTA_ENVIDO)).toBe(true);
  });

  test('invalid challenge raises', () => {
    expect(isValidChallengeRaise(ChallengeType.TRUCO, ChallengeType.VALE_CUATRO)).toBe(false);
    expect(isValidChallengeRaise(ChallengeType.VALE_CUATRO, ChallengeType.TRUCO)).toBe(false);
    expect(isValidChallengeRaise(ChallengeType.ENVIDO, ChallengeType.VALE_CUATRO)).toBe(false);
  });

  test('envido only allowed in first trick', () => {
    const result = canMakeChallenge(ChallengeType.ENVIDO, [], 2);
    expect(result.allowed).toBe(false);
  });

  test('envido allowed in first trick', () => {
    const result = canMakeChallenge(ChallengeType.ENVIDO, [], 1);
    expect(result.allowed).toBe(true);
  });

  test('cannot mix categories with pending challenge', () => {
    const result = canMakeChallenge(
      ChallengeType.ENVIDO,
      [{ type: ChallengeType.TRUCO, accepted: null }],
      1,
    );
    expect(result.allowed).toBe(false);
  });
});

// ========================================
// Challenge Points
// ========================================

describe('Challenge Points', () => {
  test('accepted truco gives 2 points', () => {
    const points = calculateChallengePoints(
      [{ type: ChallengeType.TRUCO, accepted: true }],
      10, 15,
    );
    expect(points.trucoPoints).toBe(2);
  });

  test('accepted retruco gives 3 points', () => {
    const points = calculateChallengePoints(
      [
        { type: ChallengeType.TRUCO, accepted: true },
        { type: ChallengeType.RETRUCO, accepted: true },
      ],
      10, 15,
    );
    expect(points.trucoPoints).toBe(3);
  });

  test('accepted vale cuatro gives 4 points', () => {
    const points = calculateChallengePoints(
      [
        { type: ChallengeType.TRUCO, accepted: true },
        { type: ChallengeType.RETRUCO, accepted: true },
        { type: ChallengeType.VALE_CUATRO, accepted: true },
      ],
      10, 15,
    );
    expect(points.trucoPoints).toBe(4);
  });

  test('envido gives 2 points', () => {
    const points = calculateChallengePoints(
      [{ type: ChallengeType.ENVIDO, accepted: true }],
      10, 15,
    );
    expect(points.envidoPoints).toBe(2);
  });

  test('envido + real envido stacks to 5 points', () => {
    const points = calculateChallengePoints(
      [
        { type: ChallengeType.ENVIDO, accepted: true },
        { type: ChallengeType.REAL_ENVIDO, accepted: true },
      ],
      10, 15,
    );
    expect(points.envidoPoints).toBe(5);
  });

  test('falta envido gives remaining points to 30', () => {
    const points = getFaltaEnvidoPoints(10, 15);
    expect(points).toBe(20); // max(30-10, 30-15) = 20
  });

  test('falta envido when close to winning', () => {
    const points = getFaltaEnvidoPoints(28, 25);
    expect(points).toBe(5); // max(30-28, 30-25) = 5
  });
});
