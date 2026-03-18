"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DECK = exports.CARD_VALUES = exports.SUIT_NAMES = exports.CardSuit = void 0;
exports.getCardValue = getCardValue;
exports.compareCards = compareCards;
exports.parseCard = parseCard;
exports.formatCard = formatCard;
exports.isValidCard = isValidCard;
exports.getRandomCard = getRandomCard;
exports.dealCards = dealCards;
exports.calculateEnvidoScore = calculateEnvidoScore;
var CardSuit;
(function (CardSuit) {
    CardSuit[CardSuit["BASTO"] = 0] = "BASTO";
    CardSuit[CardSuit["COPA"] = 1] = "COPA";
    CardSuit[CardSuit["ESPADA"] = 2] = "ESPADA";
    CardSuit[CardSuit["ORO"] = 3] = "ORO";
})(CardSuit || (exports.CardSuit = CardSuit = {}));
exports.SUIT_NAMES = {
    [CardSuit.BASTO]: 'Basto',
    [CardSuit.COPA]: 'Copa',
    [CardSuit.ESPADA]: 'Espada',
    [CardSuit.ORO]: 'Oro',
};
exports.CARD_VALUES = {
    '2_01': 15,
    '0_01': 14,
    '2_07': 13,
    '3_07': 12,
    '0_03': 11,
    '1_03': 11,
    '2_03': 11,
    '3_03': 11,
    '0_02': 10,
    '1_02': 10,
    '2_02': 10,
    '3_02': 10,
    '1_01': 9,
    '3_01': 9,
    '0_12': 8,
    '1_12': 8,
    '2_12': 8,
    '3_12': 8,
    '0_11': 7,
    '1_11': 7,
    '2_11': 7,
    '3_11': 7,
    '0_10': 6,
    '1_10': 6,
    '2_10': 6,
    '3_10': 6,
    '0_07': 5,
    '1_07': 5,
    '0_06': 4,
    '1_06': 4,
    '2_06': 4,
    '3_06': 4,
    '0_05': 3,
    '1_05': 3,
    '2_05': 3,
    '3_05': 3,
    '0_04': 2,
    '1_04': 2,
    '2_04': 2,
    '3_04': 2,
};
exports.DECK = [
    '0_01', '0_02', '0_03', '0_04', '0_05', '0_06', '0_07', '0_10', '0_11', '0_12',
    '1_01', '1_02', '1_03', '1_04', '1_05', '1_06', '1_07', '1_10', '1_11', '1_12',
    '2_01', '2_02', '2_03', '2_04', '2_05', '2_06', '2_07', '2_10', '2_11', '2_12',
    '3_01', '3_02', '3_03', '3_04', '3_05', '3_06', '3_07', '3_10', '3_11', '3_12',
];
function getCardValue(card) {
    return exports.CARD_VALUES[card] || 0;
}
function compareCards(card1, card2) {
    return getCardValue(card1) - getCardValue(card2);
}
function parseCard(card) {
    const parts = card.split('_');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new Error(`Invalid card format: ${card}`);
    }
    return {
        suit: parseInt(parts[0]),
        value: parseInt(parts[1]),
    };
}
function formatCard(card) {
    const { suit, value } = parseCard(card);
    const suitName = exports.SUIT_NAMES[suit];
    const valueNames = {
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
function isValidCard(card) {
    return exports.DECK.includes(card);
}
function getRandomCard(deck, usedCards = []) {
    const availableCards = deck.filter(card => !usedCards.includes(card));
    if (availableCards.length === 0) {
        return null;
    }
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    return availableCards[randomIndex] ?? null;
}
function dealCards() {
    const usedCards = [];
    const allCards = [];
    for (let i = 0; i < 6; i++) {
        const card = getRandomCard(exports.DECK, usedCards);
        if (card) {
            allCards.push(card);
            usedCards.push(card);
        }
    }
    if (allCards.length < 6) {
        throw new Error('Unable to deal enough cards');
    }
    return {
        hostCards: [allCards[0], allCards[1], allCards[2]],
        guestCards: [allCards[3], allCards[4], allCards[5]],
    };
}
function calculateEnvidoScore(cards) {
    const cardsBySuit = { 0: [], 1: [], 2: [], 3: [] };
    cards.forEach(card => {
        const { suit, value } = parseCard(card);
        const envidoValue = value >= 10 ? 0 : value;
        if (cardsBySuit[suit]) {
            cardsBySuit[suit].push(envidoValue);
        }
    });
    let maxScore = 0;
    Object.values(cardsBySuit).forEach(suitCards => {
        if (suitCards.length >= 2) {
            suitCards.sort((a, b) => b - a);
            const score = (suitCards[0] ?? 0) + (suitCards[1] ?? 0) + 20;
            maxScore = Math.max(maxScore, score);
        }
        else if (suitCards.length === 1) {
            maxScore = Math.max(maxScore, suitCards[0] ?? 0);
        }
    });
    return maxScore;
}
exports.default = {
    CardSuit,
    SUIT_NAMES: exports.SUIT_NAMES,
    CARD_VALUES: exports.CARD_VALUES,
    DECK: exports.DECK,
    getCardValue,
    compareCards,
    parseCard,
    formatCard,
    isValidCard,
    getRandomCard,
    dealCards,
    calculateEnvidoScore,
};
//# sourceMappingURL=card-values.js.map