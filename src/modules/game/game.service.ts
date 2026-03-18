import prisma from '../../config/database';
import { AppError } from '../../shared/middleware/error.middleware';
import { dealCards, compareCards, isValidCard } from './constants/card-values';

export interface CreateGameDto {
  hostUserId: string;
  guestUserId?: string;
  bet: number;
  level: number;
  isBot?: boolean;
}

export interface PlayCardDto {
  gameId: string;
  userId: string;
  card: string;
}

export interface ChallengeDto {
  gameId: string;
  userId: string;
  type: 'truco' | 'retruco' | 'vale4' | 'envido' | 'realenvido' | 'faltaenvido';
}

export class GameService {
  // Create new game
  async createGame(data: CreateGameDto) {
    const { hostUserId, guestUserId, bet, level, isBot } = data;

    // Validate host exists
    const host = await prisma.user.findUnique({ where: { id: hostUserId } });
    if (!host) {
      throw new AppError('Host user not found', 404, 'USER_NOT_FOUND');
    }

    // Check host has enough coins
    if (host.coins < bet) {
      throw new AppError('Insufficient coins', 400, 'INSUFFICIENT_COINS');
    }

    // If guest specified, validate guest
    if (guestUserId && !isBot) {
      const guest = await prisma.user.findUnique({ where: { id: guestUserId } });
      if (!guest) {
        throw new AppError('Guest user not found', 404, 'USER_NOT_FOUND');
      }
      if (guest.coins < bet) {
        throw new AppError('Guest has insufficient coins', 400, 'GUEST_INSUFFICIENT_COINS');
      }
    }

    // Create game
    const game = await prisma.game.create({
      data: {
        hostUserId,
        guestUserId: guestUserId || null,
        stake: bet,
        level,
        status: guestUserId ? 'pending' : 'waiting', // pending = invitation, waiting = lobby
        isBot: isBot || false,
      },
      include: {
        hostUser: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            points: true,
          },
        },
        guestUser: guestUserId
          ? {
              select: {
                id: true,
                username: true,
                profilePicture: true,
                points: true,
              },
            }
          : undefined,
      },
    });

    return game;
  }

  // Start game (both players ready)
  async startGame(gameId: string, _userId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { rounds: true },
    });

    if (!game) {
      throw new AppError('Game not found', 404, 'GAME_NOT_FOUND');
    }

    if (game.status !== 'pending' && game.status !== 'ready') {
      throw new AppError('Game already started or finished', 400, 'INVALID_GAME_STATE');
    }

    if (!game.guestUserId) {
      throw new AppError('Waiting for opponent', 400, 'NO_OPPONENT');
    }

    // Deduct bet from both players
    await prisma.$transaction([
      prisma.user.update({
        where: { id: game.hostUserId },
        data: { coins: { decrement: game.stake } },
      }),
      prisma.user.update({
        where: { id: game.guestUserId },
        data: { coins: { decrement: game.stake } },
      }),
      prisma.transaction.create({
        data: {
          userId: game.hostUserId,
          operation: 2, // BET
          amount: -game.stake,
          gameId: game.id,
          description: `Game bet - ${game.stake} coins`,
        },
      }),
      prisma.transaction.create({
        data: {
          userId: game.guestUserId,
          operation: 2, // BET
          amount: -game.stake,
          gameId: game.id,
          description: `Game bet - ${game.stake} coins`,
        },
      }),
    ]);

    // Create first round
    await this.createRound(gameId, game.hostUserId);

    // Update game status
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'active',
        startedAt: new Date(),
      },
      include: {
        rounds: {
          include: {
            tricks: true,
          },
        },
        hostUser: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        guestUser: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    return updatedGame;
  }

  // Create new round
  async createRound(gameId: string, handUserId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { rounds: { orderBy: { roundNumber: 'desc' }, take: 1 } },
    });

    if (!game) {
      throw new AppError('Game not found', 404, 'GAME_NOT_FOUND');
    }

    // Check if someone already won
    if (game.hostScore >= 30 || game.guestScore >= 30) {
      return null;
    }

    // Determine round number
    const lastRound = game.rounds[0];
    const roundNumber = lastRound ? lastRound.roundNumber + 1 : 1;

    // Deal cards
    const { hostCards, guestCards } = dealCards();

    // Create round
    const round = await prisma.round.create({
      data: {
        gameId,
        roundNumber,
        handUserId,
        hostCards: hostCards,
        guestCards: guestCards,
      },
    });

    // Create 3 tricks for the round
    await prisma.trick.createMany({
      data: [
        { roundId: round.id, trickNumber: 1 },
        { roundId: round.id, trickNumber: 2 },
        { roundId: round.id, trickNumber: 3 },
      ],
    });

    // Update game turn to hand user
    await prisma.game.update({
      where: { id: gameId },
      data: { turnUserId: handUserId },
    });

    return round;
  }

  // Play card
  async playCard(data: PlayCardDto) {
    const { gameId, userId, card } = data;

    // Validate card format
    if (!isValidCard(card)) {
      throw new AppError('Invalid card', 400, 'INVALID_CARD');
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        rounds: {
          where: { finishedAt: null },
          include: {
            tricks: {
              where: { finishedAt: null },
              orderBy: { trickNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!game) {
      throw new AppError('Game not found', 404, 'GAME_NOT_FOUND');
    }

    if (game.status !== 'active') {
      throw new AppError('Game is not active', 400, 'GAME_NOT_ACTIVE');
    }

    if (game.turnUserId !== userId) {
      throw new AppError('Not your turn', 400, 'NOT_YOUR_TURN');
    }

    const currentRound = game.rounds[0];
    if (!currentRound) {
      throw new AppError('No active round', 400, 'NO_ACTIVE_ROUND');
    }

    // Validate card belongs to player
    const isHost = game.hostUserId === userId;
    const playerCards = isHost
      ? (currentRound.hostCards as string[])
      : (currentRound.guestCards as string[]);

    if (!playerCards.includes(card)) {
      throw new AppError('Card not in hand', 400, 'CARD_NOT_IN_HAND');
    }

    // Check if card already played
    const playedCards = currentRound.tricks
      .map(t => [t.handUserCard, t.otherUserCard])
      .flat()
      .filter(Boolean);

    if (playedCards.includes(card)) {
      throw new AppError('Card already played', 400, 'CARD_ALREADY_PLAYED');
    }

    // Get current trick
    const currentTrick = currentRound.tricks[0];
    if (!currentTrick) {
      throw new AppError('No active trick', 400, 'NO_ACTIVE_TRICK');
    }

    // Determine if player is hand user
    const isHandUser = currentRound.handUserId === userId;

    // Play card
    const updatedTrick = await prisma.trick.update({
      where: { id: currentTrick.id },
      data: isHandUser
        ? { handUserCard: card }
        : { otherUserCard: card },
    });

    // Check if trick is complete
    if (updatedTrick.handUserCard && updatedTrick.otherUserCard) {
      await this.completeTrick(currentTrick.id);
    } else {
      // Switch turn to other player
      const nextUserId = game.hostUserId === userId ? game.guestUserId : game.hostUserId;
      await prisma.game.update({
        where: { id: gameId },
        data: { turnUserId: nextUserId },
      });
    }

    // Return updated game state
    return this.getGameState(gameId);
  }

  // Complete trick and determine winner
  async completeTrick(trickId: string) {
    const trick = await prisma.trick.findUnique({
      where: { id: trickId },
      include: {
        round: {
          include: {
            game: true,
            tricks: { orderBy: { trickNumber: 'asc' } },
          },
        },
      },
    });

    if (!trick || !trick.handUserCard || !trick.otherUserCard) {
      return;
    }

    const { round } = trick;
    const { game } = round;

    // Compare cards
    const comparison = compareCards(trick.handUserCard, trick.otherUserCard);

    let winnerId: string | null = null;
    if (comparison > 0) {
      winnerId = round.handUserId; // Hand user wins
    } else if (comparison < 0) {
      winnerId = round.handUserId === game.hostUserId ? game.guestUserId! : game.hostUserId; // Other user wins
    }
    // If comparison === 0, it's a tie (winnerId stays null)

    // Update trick
    await prisma.trick.update({
      where: { id: trickId },
      data: {
        winnerId: winnerId,
        finishedAt: new Date(),
      },
    });

    // Check if round is complete (all 3 tricks done)
    const allTricks = round.tricks;
    const allComplete = allTricks.every(t => t.finishedAt || t.id === trickId);

    if (allComplete) {
      await this.completeRound(round.id);
    } else {
      // Set turn to trick winner (or hand user if tie)
      const nextTurn = winnerId || round.handUserId;
      await prisma.game.update({
        where: { id: game.id },
        data: { turnUserId: nextTurn },
      });
    }
  }

  // Complete round and calculate winner
  async completeRound(roundId: string) {
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        game: true,
        tricks: { orderBy: { trickNumber: 'asc' } },
      },
    });

    if (!round) {
      return;
    }

    const { game, tricks } = round;

    // Count tricks won by each player
    let hostTricks = 0;
    let guestTricks = 0;

    tricks.forEach(trick => {
      if (trick.winnerId === game.hostUserId) {
        hostTricks++;
      } else if (trick.winnerId === game.guestUserId) {
        guestTricks++;
      }
    });

    // Determine round winner
    let roundWinnerId: string | null = null;

    if (hostTricks > guestTricks) {
      roundWinnerId = game.hostUserId;
    } else if (guestTricks > hostTricks) {
      roundWinnerId = game.guestUserId!;
    } else {
      // Tie: hand user wins
      roundWinnerId = round.handUserId;
    }

    // Update scores (default 1 point, will be modified by challenges later)
    const pointsToAdd = 1;

    const newHostScore = roundWinnerId === game.hostUserId ? game.hostScore + pointsToAdd : game.hostScore;
    const newGuestScore = roundWinnerId === game.guestUserId ? game.guestScore + pointsToAdd : game.guestScore;

    // Mark round as finished
    await prisma.round.update({
      where: { id: roundId },
      data: { finishedAt: new Date() },
    });

    // Update game scores
    await prisma.game.update({
      where: { id: game.id },
      data: {
        hostScore: newHostScore,
        guestScore: newGuestScore,
      },
    });

    // Check if game is won (first to 30 points)
    if (newHostScore >= 30 || newGuestScore >= 30) {
      await this.completeGame(game.id);
    } else {
      // Create next round (alternate hand user)
      const nextHandUserId = round.handUserId === game.hostUserId ? game.guestUserId! : game.hostUserId;
      await this.createRound(game.id, nextHandUserId);
    }
  }

  // Complete game and award winner
  async completeGame(gameId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      return;
    }

    const winnerId = game.hostScore >= 30 ? game.hostUserId : game.guestUserId!;
    const loserId = winnerId === game.hostUserId ? game.guestUserId! : game.hostUserId;

    const winnings = game.stake * 2;

    // Award winner and update stats
    await prisma.$transaction([
      // Award coins to winner
      prisma.user.update({
        where: { id: winnerId },
        data: {
          coins: { increment: winnings },
          gamesWon: { increment: 1 },
          gamesPlayed: { increment: 1 },
          points: { increment: 10 },
        },
      }),
      // Update loser stats
      prisma.user.update({
        where: { id: loserId },
        data: {
          gamesPlayed: { increment: 1 },
        },
      }),
      // Create transaction for winner
      prisma.transaction.create({
        data: {
          userId: winnerId,
          operation: 3, // WIN
          amount: winnings,
          gameId: game.id,
          description: `Game win - ${winnings} coins`,
        },
      }),
      // Update game
      prisma.game.update({
        where: { id: gameId },
        data: {
          status: 'finished',
          finishedAt: new Date(),
          userWonId: winnerId,
        },
      }),
    ]);

    return this.getGameState(gameId);
  }

  // Get full game state
  async getGameState(gameId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        hostUser: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            points: true,
          },
        },
        guestUser: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            points: true,
          },
        },
        rounds: {
          include: {
            tricks: { orderBy: { trickNumber: 'asc' } },
          },
          orderBy: { roundNumber: 'desc' },
        },
      },
    });

    if (!game) {
      throw new AppError('Game not found', 404, 'GAME_NOT_FOUND');
    }

    return game;
  }

  // Get user's games
  async getUserGames(userId: string, status?: string) {
    const where: any = {
      OR: [{ hostUserId: userId }, { guestUserId: userId }],
    };

    if (status) {
      where.status = status;
    }

    const games = await prisma.game.findMany({
      where,
      include: {
        hostUser: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        guestUser: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return games;
  }
}

export default new GameService();
