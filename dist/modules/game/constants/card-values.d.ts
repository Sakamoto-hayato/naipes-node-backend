export declare enum CardSuit {
    BASTO = 0,
    COPA = 1,
    ESPADA = 2,
    ORO = 3
}
export declare const SUIT_NAMES: Record<CardSuit, string>;
export declare const CARD_VALUES: Record<string, number>;
export declare const DECK: string[];
export declare function getCardValue(card: string): number;
export declare function compareCards(card1: string, card2: string): number;
export declare function parseCard(card: string): {
    suit: CardSuit;
    value: number;
};
export declare function formatCard(card: string): string;
export declare function isValidCard(card: string): boolean;
export declare function getRandomCard(deck: string[], usedCards?: string[]): string | null;
export declare function dealCards(): {
    hostCards: string[];
    guestCards: string[];
};
export declare function calculateEnvidoScore(cards: string[]): number;
declare const _default: {
    CardSuit: typeof CardSuit;
    SUIT_NAMES: Record<CardSuit, string>;
    CARD_VALUES: Record<string, number>;
    DECK: string[];
    getCardValue: typeof getCardValue;
    compareCards: typeof compareCards;
    parseCard: typeof parseCard;
    formatCard: typeof formatCard;
    isValidCard: typeof isValidCard;
    getRandomCard: typeof getRandomCard;
    dealCards: typeof dealCards;
    calculateEnvidoScore: typeof calculateEnvidoScore;
};
export default _default;
//# sourceMappingURL=card-values.d.ts.map