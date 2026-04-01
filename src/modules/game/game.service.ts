import prisma from '../../config/database';
import { AppError } from '../../shared/middleware/error.middleware';
import { dealCards, compareCards, isValidCard, calculateEnvidoScore } from './constants/card-values';
import {
  ChallengeType,
  canMakeChallenge,
  calculateChallengePoints,
  getChallengeCategory,
  ChallengeCategory,
} from './constants/challenge-values';

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
        tricks: {
          include: { challenges: true },
          orderBy: { trickNumber: 'asc' },
        },
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

    // Calculate points based on accepted Truco challenges in this round
    const allTrucoChallenges: Array<{ type: ChallengeType; accepted: boolean | null }> = [];
    for (const trick of tricks) {
      for (const c of (trick as any).challenges || []) {
        const cat = getChallengeCategory(c.type as ChallengeType);
        if (cat === ChallengeCategory.TRUCO && c.accepted === true) {
          allTrucoChallenges.push({ type: c.type as ChallengeType, accepted: true });
        }
      }
    }

    // Determine points: if truco challenges were accepted, use the highest accepted level
    let pointsToAdd = 1; // default: no truco challenge
    if (allTrucoChallenges.length > 0) {
      const trucoResult = calculateChallengePoints(allTrucoChallenges, game.hostScore, game.guestScore);
      pointsToAdd = trucoResult.trucoPoints;
    }

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
            tricks: {
              include: {
                challenges: { orderBy: { createdAt: 'asc' } },
              },
              orderBy: { trickNumber: 'asc' },
            },
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

  // ============================================
  // CHALLENGE METHODS
  // ============================================

  // Make a challenge (Truco, Envido, etc.)
  async makeChallenge(data: {
    gameId: string;
    userId: string;
    type: ChallengeType;
  }): Promise<any> {
    const { gameId, userId, type } = data;

    // Get game with current round and tricks
    const game = await this.getGameState(gameId);

    if (!game) {
      throw new AppError('Game not found', 404, 'GAME_NOT_FOUND');
    }

    if (game.status !== 'active') {
      throw new AppError('Game is not active', 400, 'GAME_NOT_ACTIVE');
    }

    // Check if it's the user's turn
    if (game.turnUserId !== userId) {
      throw new AppError('Not your turn', 400, 'NOT_YOUR_TURN');
    }

    // Get current round
    const currentRound = game.rounds[game.rounds.length - 1];
    if (!currentRound) {
      throw new AppError('No active round', 400, 'NO_ACTIVE_ROUND');
    }

    // Get current trick
    const currentTrick = currentRound.tricks.find(t => !t.finishedAt);
    if (!currentTrick) {
      throw new AppError('No active trick', 400, 'NO_ACTIVE_TRICK');
    }

    // Check if challenge can be made
    const existingChallenges = (currentTrick.challenges || []).map(c => ({
      type: c.type as ChallengeType,
      accepted: c.accepted
    }));
    const validation = canMakeChallenge(type, existingChallenges, currentTrick.trickNumber);

    if (!validation.allowed) {
      throw new AppError(validation.reason || 'Challenge not allowed', 400, 'CHALLENGE_NOT_ALLOWED');
    }

    // Create challenge
    const challenge = await prisma.challenge.create({
      data: {
        trickId: currentTrick.id,
        type,
        userId,
        accepted: null, // Pending
      },
    });

    return {
      challenge,
      game: await this.getGameState(gameId),
    };
  }

  // Respond to a challenge (accept or reject)
  async respondToChallenge(data: {
    gameId: string;
    userId: string;
    challengeId: string;
    accepted: boolean;
    raiseType?: ChallengeType; // If raising the challenge
  }): Promise<any> {
    const { gameId, userId, challengeId, accepted, raiseType } = data;

    // Get challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        trick: {
          include: {
            round: {
              include: {
                game: true,
              },
            },
            challenges: true,
          },
        },
      },
    });

    if (!challenge) {
      throw new AppError('Challenge not found', 404, 'CHALLENGE_NOT_FOUND');
    }

    // Verify it's the correct game
    if (challenge.trick.round.game.id !== gameId) {
      throw new AppError('Challenge not in this game', 400, 'INVALID_CHALLENGE');
    }

    // Verify challenge is pending
    if (challenge.accepted !== null) {
      throw new AppError('Challenge already responded to', 400, 'CHALLENGE_ALREADY_RESPONDED');
    }

    // Verify it's the opponent responding (not the challenger)
    if (challenge.userId === userId) {
      throw new AppError('Cannot respond to your own challenge', 400, 'CANNOT_RESPOND_OWN_CHALLENGE');
    }

    const game = challenge.trick.round.game;

    // Verify user is part of the game
    if (game.hostUserId !== userId && game.guestUserId !== userId) {
      throw new AppError('You are not in this game', 403, 'FORBIDDEN');
    }

    // If raising, create new challenge instead
    if (raiseType) {
      // Validate the raise
      const mappedChallenges = challenge.trick.challenges.map(c => ({
        type: c.type as ChallengeType,
        accepted: c.accepted
      }));
      const validation = canMakeChallenge(
        raiseType,
        mappedChallenges,
        challenge.trick.trickNumber
      );

      if (!validation.allowed) {
        throw new AppError(validation.reason || 'Invalid raise', 400, 'INVALID_RAISE');
      }

      // Accept the current challenge
      await prisma.challenge.update({
        where: { id: challengeId },
        data: { accepted: true },
      });

      // Create the raise challenge
      const raiseChallenge = await prisma.challenge.create({
        data: {
          trickId: challenge.trickId,
          type: raiseType,
          userId,
          accepted: null, // Pending
        },
      });

      return {
        challenge: raiseChallenge,
        game: await this.getGameState(gameId),
      };
    }

    // Update challenge with response
    await prisma.challenge.update({
      where: { id: challengeId },
      data: { accepted },
    });

    let envidoResult = null;

    if (!accepted) {
      // If rejected, award points immediately to the challenger
      await this.processRejectedChallenge(challenge.trick.round.id, challenge.type as ChallengeType, challenge.userId);
    } else {
      // If accepted, process accordingly
      const category = getChallengeCategory(challenge.type as ChallengeType);

      if (category === ChallengeCategory.ENVIDO) {
        // Envido accepted: immediately calculate and award envido points
        envidoResult = await this.processAcceptedEnvido(gameId, challenge.trick.round.id, challenge.trickId);
      }
      // Truco accepted: points are applied when the round completes (in completeRound)
      // No immediate action needed — completeRound will read accepted challenges
    }

    return {
      challenge: { ...challenge, accepted },
      envidoResult,
      game: await this.getGameState(gameId),
    };
  }

  // Process a rejected challenge (award points to challenger)
  private async processRejectedChallenge(
    roundId: string,
    challengeType: ChallengeType,
    challengerUserId: string
  ) {
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: { game: true },
    });

    if (!round) {
      return;
    }

    const game = round.game;
    const isHost = game.hostUserId === challengerUserId;
    const category = getChallengeCategory(challengeType);

    // For rejected challenges, challenger gets points minus 1
    const challengePoints = calculateChallengePoints(
      [{ type: challengeType, accepted: false }],
      game.hostScore,
      game.guestScore
    );

    let pointsToAward = 1; // Base rejection points

    if (category === ChallengeCategory.TRUCO) {
      // Truco rejection: previous level points
      if (challengeType === ChallengeType.TRUCO) pointsToAward = 1;
      else if (challengeType === ChallengeType.RETRUCO) pointsToAward = 2;
      else if (challengeType === ChallengeType.VALE_CUATRO) pointsToAward = 3;
    } else if (category === ChallengeCategory.ENVIDO) {
      // Envido rejection: challenger gets envido points
      pointsToAward = challengePoints.envidoPoints;
    }

    // Award points
    const newHostScore = isHost ? game.hostScore + pointsToAward : game.hostScore;
    const newGuestScore = !isHost ? game.guestScore + pointsToAward : game.guestScore;

    await prisma.game.update({
      where: { id: game.id },
      data: {
        hostScore: newHostScore,
        guestScore: newGuestScore,
      },
    });

    // Check if game won
    if (newHostScore >= 30 || newGuestScore >= 30) {
      await this.completeGame(game.id);
    }
  }

  // Process accepted Envido: calculate scores and award points immediately
  private async processAcceptedEnvido(gameId: string, roundId: string, trickId: string) {
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        game: true,
        tricks: {
          include: { challenges: { orderBy: { createdAt: 'asc' } } },
          orderBy: { trickNumber: 'asc' },
        },
      },
    });

    if (!round) return;

    const game = round.game;

    // Get the trick with envido challenges
    const trick = round.tricks.find(t => t.id === trickId);
    if (!trick) return;

    // Get all accepted envido challenges in this trick
    const envidoChallenges = (trick.challenges || []).filter(
      c => getChallengeCategory(c.type as ChallengeType) === ChallengeCategory.ENVIDO && c.accepted === true
    );

    if (envidoChallenges.length === 0) return;

    // Calculate envido scores from each player's cards
    const hostCards = round.hostCards as string[];
    const guestCards = round.guestCards as string[];

    const hostEnvido = calculateEnvidoScore(hostCards);
    const guestEnvido = calculateEnvidoScore(guestCards);

    // Determine winner (tie goes to hand user)
    const envidoWinnerId = hostEnvido > guestEnvido
      ? game.hostUserId
      : guestEnvido > hostEnvido
        ? game.guestUserId
        : round.handUserId;

    const isHost = envidoWinnerId === game.hostUserId;

    // Calculate total envido points at stake
    const challengePoints = calculateChallengePoints(
      envidoChallenges.map(c => ({ type: c.type as ChallengeType, accepted: true })),
      game.hostScore,
      game.guestScore
    );

    // Award points
    const newHostScore = isHost ? game.hostScore + challengePoints.envidoPoints : game.hostScore;
    const newGuestScore = !isHost ? game.guestScore + challengePoints.envidoPoints : game.guestScore;

    await prisma.game.update({
      where: { id: game.id },
      data: {
        hostScore: newHostScore,
        guestScore: newGuestScore,
      },
    });

    // Check if game won after envido
    if (newHostScore >= 30 || newGuestScore >= 30) {
      await this.completeGame(game.id);
    }

    return {
      hostEnvido,
      guestEnvido,
      winnerId: envidoWinnerId,
      pointsAwarded: challengePoints.envidoPoints,
    };
  }

  // Calculate and award Envido points (manual endpoint — kept for backward compatibility)
  async calculateEnvidoWinner(gameId: string): Promise<any> {
    const game = await this.getGameState(gameId);

    if (!game) {
      throw new AppError('Game not found', 404, 'GAME_NOT_FOUND');
    }

    const currentRound = game.rounds[game.rounds.length - 1];
    if (!currentRound) {
      throw new AppError('No active round', 400, 'NO_ACTIVE_ROUND');
    }

    const currentTrick = currentRound.tricks[0]; // Envido is always in first trick
    if (!currentTrick) {
      throw new AppError('No trick found', 400, 'NO_TRICK_FOUND');
    }

    // Get accepted envido challenges
    const envidoChallenges = currentTrick.challenges?.filter(
      c => getChallengeCategory(c.type as ChallengeType) === ChallengeCategory.ENVIDO && c.accepted === true
    ) || [];

    if (envidoChallenges.length === 0) {
      throw new AppError('No accepted envido challenges', 400, 'NO_ENVIDO_CHALLENGES');
    }

    // Calculate envido scores
    const hostCards = currentRound.hostCards as string[];
    const guestCards = currentRound.guestCards as string[];

    const hostEnvido = calculateEnvidoScore(hostCards);
    const guestEnvido = calculateEnvidoScore(guestCards);

    // Determine winner
    const envidoWinnerId = hostEnvido > guestEnvido
      ? game.hostUserId
      : guestEnvido > hostEnvido
      ? game.guestUserId
      : currentRound.handUserId; // Tie goes to hand

    const isHost = envidoWinnerId === game.hostUserId;

    // Calculate points
    const challengePoints = calculateChallengePoints(
      envidoChallenges.map(c => ({ type: c.type as ChallengeType, accepted: true })),
      game.hostScore,
      game.guestScore
    );

    // Award points
    const newHostScore = isHost ? game.hostScore + challengePoints.envidoPoints : game.hostScore;
    const newGuestScore = !isHost ? game.guestScore + challengePoints.envidoPoints : game.guestScore;

    await prisma.game.update({
      where: { id: gameId },
      data: {
        hostScore: newHostScore,
        guestScore: newGuestScore,
      },
    });

    // Check if game won
    if (newHostScore >= 30 || newGuestScore >= 30) {
      await this.completeGame(gameId);
    }

    return {
      hostEnvido,
      guestEnvido,
      winnerId: envidoWinnerId,
      pointsAwarded: challengePoints.envidoPoints,
      game: await this.getGameState(gameId),
    };
  }
}

export default new GameService();
