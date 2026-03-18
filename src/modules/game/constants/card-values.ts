// Truco Card Values and Rankings
// Based on Argentine Truco rules

export enum CardSuit {
  BASTO = 0,    // Clubs
  COPA = 1,     // Cups
  ESPADA = 2,   // Swords
  ORO = 3,      // Coins
}

export const SUIT_NAMES: Record<CardSuit, string> = {
  [CardSuit.BASTO]: 'Basto',
  [CardSuit.COPA]: 'Copa',
  [CardSuit.ESPADA]: 'Espada',
  [CardSuit.ORO]: 'Oro',
};

// Card format: "suit_value" (e.g., "0_01" = Basto 1, "2_07" = Espada 7)
export const CARD_VALUES: Record<string, number> = {
  // Highest cards (Truco ranking)
  '2_01': 15, // Espada 1 (Ancho de Espadas) - HIGHEST
  '0_01': 14, // Basto 1 (Ancho de Bastos)
  '2_07': 13, // Espada 7 (Siete de Espadas)
  '3_07': 12, // Oro 7 (Siete de Oro)

  // Threes (Perica)
  '0_03': 11,
  '1_03': 11,
  '2_03': 11,
  '3_03': 11,

  // Twos (Dos)
  '0_02': 10,
  '1_02': 10,
  '2_02': 10,
  '3_02': 10,

  // Aces (low value in Truco)
  '1_01': 9,  // Copa 1
  '3_01': 9,  // Oro 1

  // Figures (Figuras)
  '0_12': 8,  // Kings (Rey)
  '1_12': 8,
  '2_12': 8,
  '3_12': 8,

  '0_11': 7,  // Knights (Caballo)
  '1_11': 7,
  '2_11': 7,
  '3_11': 7,

  '0_10': 6,  // Jacks (Sota)
  '1_10': 6,
  '2_10': 6,
  '3_10': 6,

  // Sevens (low value)
  '0_07': 5,
  '1_07': 5,

  // Sixes
  '0_06': 4,
  '1_06': 4,
  '2_06': 4,
  '3_06': 4,

  // Fives
  '0_05': 3,
  '1_05': 3,
  '2_05': 3,
  '3_05': 3,

  // Fours
  '0_04': 2,
  '1_04': 2,
  '2_04': 2,
  '3_04': 2,
};

// All 40 cards in Truco deck (no 8s, 9s)
export const DECK: string[] = [
  // Basto (Clubs)
  '0_01', '0_02', '0_03', '0_04', '0_05', '0_06', '0_07', '0_10', '0_11', '0_12',

  // Copa (Cups)
  '1_01', '1_02', '1_03', '1_04', '1_05', '1_06', '1_07', '1_10', '1_11', '1_12',

  // Espada (Swords)
  '2_01', '2_02', '2_03', '2_04', '2_05', '2_06', '2_07', '2_10', '2_11', '2_12',

  // Oro (Coins)
  '3_01', '3_02', '3_03', '3_04', '3_05', '3_06', '3_07', '3_10', '3_11', '3_12',
];

// Get card value for comparison
export function getCardValue(card: string): number {
  return CARD_VALUES[card] || 0;
}

// Compare two cards (returns positive if card1 wins, negative if card2 wins, 0 if tie)
export function compareCards(card1: string, card2: string): number {
  return getCardValue(card1) - getCardValue(card2);
}

// Parse card string to get suit and value
export function parseCard(card: string): { suit: CardSuit; value: number } {
  const [suitStr, valueStr] = card.split('_');
  return {
    suit: parseInt(suitStr) as CardSuit,
    value: parseInt(valueStr),
  };
}

// Format card for display
export function formatCard(card: string): string {
  const { suit, value } = parseCard(card);
  const suitName = SUIT_NAMES[suit];

  const valueNames: Record<number, string> = {
    1: 'Ace',
    2: 'Two',
    3: 'Three',
    4: 'Four',
    5: 'Five',
    6: 'Six',
    7: 'Seven',
    10: 'Jack',
    11: 'Knight',
    12: 'King',
  };

  return `${valueNames[value] || value} of ${suitName}`;
}

// Validate card format
export function isValidCard(card: string): boolean {
  return DECK.includes(card);
}

// Get unique card from deck (for shuffling)
export function getRandomCard(deck: string[], usedCards: string[] = []): string | null {
  const availableCards = deck.filter(card => !usedCards.includes(card));

  if (availableCards.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * availableCards.length);
  return availableCards[randomIndex];
}

// Shuffle and deal cards (returns 6 cards: 3 for each player)
export function dealCards(): { hostCards: string[]; guestCards: string[] } {
  const usedCards: string[] = [];
  const allCards: string[] = [];

  // Deal 6 cards
  for (let i = 0; i < 6; i++) {
    const card = getRandomCard(DECK, usedCards);
    if (card) {
      allCards.push(card);
      usedCards.push(card);
    }
  }

  return {
    hostCards: [allCards[0], allCards[1], allCards[2]],
    guestCards: [allCards[3], allCards[4], allCards[5]],
  };
}

// Calculate Envido score for a hand
export function calculateEnvidoScore(cards: string[]): number {
  const cardsBySuit: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [] };

  // Group cards by suit
  cards.forEach(card => {
    const { suit, value } = parseCard(card);
    // Envido values: figures = 0, others = face value
    const envidoValue = value >= 10 ? 0 : value;
    cardsBySuit[suit].push(envidoValue);
  });

  let maxScore = 0;

  // Check each suit
  Object.values(cardsBySuit).forEach(suitCards => {
    if (suitCards.length >= 2) {
      // Sort descending
      suitCards.sort((a, b) => b - a);
      // Best two cards + 20
      const score = suitCards[0] + suitCards[1] + 20;
      maxScore = Math.max(maxScore, score);
    } else if (suitCards.length === 1) {
      // Single card (no suit bonus)
      maxScore = Math.max(maxScore, suitCards[0]);
    }
  });

  return maxScore;
}

export default {
  CardSuit,
  SUIT_NAMES,
  CARD_VALUES,
  DECK,
  getCardValue,
  compareCards,
  parseCard,
  formatCard,
  isValidCard,
  getRandomCard,
  dealCards,
  calculateEnvidoScore,
};
