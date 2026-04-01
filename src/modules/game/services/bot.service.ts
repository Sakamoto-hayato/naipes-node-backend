/**
 * Bot Service — AI opponent for single-player Truco games
 *
 * Strategy based on the legacy PHP GameLogic bot:
 * - Classifies cards as low (≤5), mid (6-10), high (≥11)
 * - Adapts strategy per trick number
 * - Makes envido/truco decisions based on hand strength
 */

import { getCardValue, calculateEnvidoScore } from '../constants/card-values';
import {
  ChallengeType,
  ChallengeCategory,
  getChallengeCategory,
} from '../constants/challenge-values';
import gameService from '../game.service';
import logger from '../../../config/logger';

// Card strength classification
function classifyCard(card: string): 'low' | 'mid' | 'high' {
  const value = getCardValue(card);
  if (value <= 5) return 'low';
  if (value <= 10) return 'mid';
  return 'high';
}

function countByClass(cards: string[]): { low: number; mid: number; high: number } {
  let low = 0, mid = 0, high = 0;
  for (const c of cards) {
    const cl = classifyCard(c);
    if (cl === 'low') low++;
    else if (cl === 'mid') mid++;
    else high++;
  }
  return { low, mid, high };
}

// Sort cards by value ascending
function sortCardsAsc(cards: string[]): string[] {
  return [...cards].sort((a, b) => getCardValue(a) - getCardValue(b));
}

// Pick best card to beat opponent's card, or weakest if can't win
function pickCardToPlay(myCards: string[], opponentCard: string | null, trickNumber: number): string {
  const sorted = sortCardsAsc(myCards);
  const { high } = countByClass(myCards);

  if (!opponentCard) {
    // I play first
    if (trickNumber === 1) {
      // First trick: lead with high card if we have 2+ high cards
      if (high >= 2) return sorted[sorted.length - 1]!; // strongest
      return sorted[Math.floor(sorted.length / 2)]!; // middle strength
    } else if (trickNumber === 2) {
      // Second trick: if we have advantage, play strong; otherwise play weak to save
      return sorted[sorted.length - 1]!; // play strongest available
    } else {
      // Third trick: play whatever we have
      return sorted[sorted.length - 1]!;
    }
  }

  // Opponent already played — try to win with minimum card
  const oppValue = getCardValue(opponentCard);

  // Find the weakest card that beats opponent
  for (const card of sorted) {
    if (getCardValue(card) > oppValue) {
      return card; // Win with minimum card
    }
  }

  // Can't win — play weakest card to save better cards
  return sorted[0]!;
}

// Decide whether bot should challenge
function shouldChallenge(
  myCards: string[],
  trickNumber: number,
  myScore: number,
  oppScore: number,
): { should: boolean; type: ChallengeType | null } {
  const { high } = countByClass(myCards);

  // Envido decision (only trick 1)
  if (trickNumber === 1) {
    const envidoScore = calculateEnvidoScore(myCards);
    if (envidoScore >= 28) {
      return { should: true, type: ChallengeType.REAL_ENVIDO };
    }
    if (envidoScore >= 25) {
      return { should: true, type: ChallengeType.ENVIDO };
    }
  }

  // Truco decision
  if (high >= 2) {
    return { should: true, type: ChallengeType.TRUCO };
  }

  // Bluff with bad cards when losing badly
  if (oppScore - myScore >= 10 && Math.random() < 0.2) {
    return { should: true, type: ChallengeType.TRUCO };
  }

  return { should: false, type: null };
}

// Decide whether bot should accept a challenge
function shouldAcceptChallenge(
  challengeType: ChallengeType,
  myCards: string[],
  _myScore: number,
  _oppScore: number,
): boolean {
  const category = getChallengeCategory(challengeType);
  const { high, mid } = countByClass(myCards);

  if (category === ChallengeCategory.ENVIDO) {
    const envidoScore = calculateEnvidoScore(myCards);
    // Accept envido if score is decent
    if (challengeType === ChallengeType.FALTA_ENVIDO) {
      return envidoScore >= 30; // Only accept falta with very strong hand
    }
    if (challengeType === ChallengeType.REAL_ENVIDO) {
      return envidoScore >= 27;
    }
    return envidoScore >= 23; // Regular envido
  }

  if (category === ChallengeCategory.TRUCO) {
    // Accept truco with strong cards
    if (challengeType === ChallengeType.VALE_CUATRO) {
      return high >= 2 && mid >= 1;
    }
    if (challengeType === ChallengeType.RETRUCO) {
      return high >= 2;
    }
    return high >= 1 && mid >= 1; // Regular truco
  }

  return false;
}

export class BotService {
  /**
   * Execute bot's turn for a game
   * Called after each player action when the game is a bot game
   */
  async executeBotTurn(gameId: string, botUserId: string): Promise<void> {
    // Small delay to feel more natural
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    try {
      const game = await gameService.getGameState(gameId);

      if (!game || game.status !== 'active' || game.turnUserId !== botUserId) {
        return; // Not bot's turn
      }

      const isHost = game.hostUserId === botUserId;
      const activeRound = game.rounds.find((r: any) => !r.finishedAt);
      if (!activeRound) return;

      const myCards = (isHost ? activeRound.hostCards : activeRound.guestCards) as string[];
      const activeTrick = activeRound.tricks.find((t: any) => !t.finishedAt);
      if (!activeTrick) return;

      // Check for pending challenge that bot needs to respond to
      const pendingChallenge = activeTrick.challenges?.find((c: any) => c.accepted === null && c.userId !== botUserId);
      if (pendingChallenge) {
        const accept = shouldAcceptChallenge(
          pendingChallenge.type as ChallengeType,
          myCards,
          isHost ? game.hostScore : game.guestScore,
          isHost ? game.guestScore : game.hostScore,
        );

        await gameService.respondToChallenge({
          gameId,
          userId: botUserId,
          challengeId: pendingChallenge.id,
          accepted: accept,
        });

        logger.info(`Bot ${accept ? 'accepted' : 'rejected'} ${pendingChallenge.type} in game ${gameId}`);
        return;
      }

      // Figure out which cards are already played in this round
      const playedCards = new Set<string>();
      for (const trick of activeRound.tricks) {
        const adjustedField = activeRound.handUserId === botUserId ? 'handUserCard' : 'otherUserCard';
        if ((trick as any)[adjustedField]) playedCards.add((trick as any)[adjustedField]);
      }
      const availableCards = myCards.filter((c: string) => !playedCards.has(c));

      if (availableCards.length === 0) return;

      // Consider making a challenge
      const challengeDecision = shouldChallenge(
        availableCards,
        activeTrick.trickNumber,
        isHost ? game.hostScore : game.guestScore,
        isHost ? game.guestScore : game.hostScore,
      );

      if (challengeDecision.should && challengeDecision.type) {
        try {
          await gameService.makeChallenge({
            gameId,
            userId: botUserId,
            type: challengeDecision.type,
          });
          logger.info(`Bot challenged ${challengeDecision.type} in game ${gameId}`);
          return; // Wait for opponent's response
        } catch {
          // Challenge not allowed — fall through to play card
        }
      }

      // Pick and play a card
      const isHandUser = activeRound.handUserId === botUserId;
      const opponentCard = isHandUser ? activeTrick.otherUserCard : activeTrick.handUserCard;

      const cardToPlay = pickCardToPlay(availableCards, opponentCard, activeTrick.trickNumber);

      await gameService.playCard({
        gameId,
        userId: botUserId,
        card: cardToPlay,
      });

      logger.info(`Bot played ${cardToPlay} in game ${gameId}`);
    } catch (error) {
      logger.error(`Bot error in game ${gameId}:`, error);
    }
  }
}

export default new BotService();
