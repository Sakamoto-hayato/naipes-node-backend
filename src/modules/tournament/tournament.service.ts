/**
 * Tournament Service
 * 5-round single-elimination bracket tournament system
 * Based on legacy PHP Tournament entity logic
 */

import prisma from '../../config/database';
import { AppError } from '../../shared/middleware/error.middleware';
import logger from '../../config/logger';

// Round names for display
const ROUND_NAMES = ['', 'Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Final'];

export class TournamentService {
  /**
   * Create or join a tournament
   * Finds an existing tournament waiting for opponents at the same stake,
   * or creates a new one
   */
  async joinTournament(userId: string, stake: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    if (user.coins < stake) throw new AppError('Insufficient coins', 400, 'INSUFFICIENT_COINS');

    // Check if user already has an active tournament
    const existing = await prisma.tournament.findFirst({
      where: {
        userId,
        isWinner: false,
        isSecondPlace: false,
        finishedAt: null,
      },
    });

    if (existing) {
      throw new AppError('Already in a tournament', 400, 'ALREADY_IN_TOURNAMENT');
    }

    // Create tournament entry for user
    const tournament = await prisma.tournament.create({
      data: {
        userId,
        stake,
      },
    });

    // Deduct entry fee
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { coins: { decrement: stake } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          operation: 7, // BET_TOURNAMENT
          amount: -stake,
          description: `Tournament entry fee - ${stake} coins`,
        },
      }),
    ]);

    return tournament;
  }

  /**
   * Find next opponent for current round
   * Matches with another tournament player at the same stake and round
   */
  async findMatch(userId: string) {
    const myTournament = await prisma.tournament.findFirst({
      where: {
        userId,
        finishedAt: null,
      },
    });

    if (!myTournament) {
      throw new AppError('Not in a tournament', 400, 'NOT_IN_TOURNAMENT');
    }

    const currentRound = myTournament.currentRound;

    // Check if already has an opponent for this round
    const currentOpponentId = this.getOpponentForRound(myTournament, currentRound);
    if (currentOpponentId) {
      throw new AppError('Already have an opponent for this round', 400, 'ALREADY_MATCHED');
    }

    // Find another tournament player at the same stake and round, without an opponent
    const opponent = await prisma.tournament.findFirst({
      where: {
        stake: myTournament.stake,
        currentRound,
        finishedAt: null,
        userId: { not: userId },
        // Must not already have an opponent for this round
        ...this.noOpponentForRoundFilter(currentRound),
      },
      include: { user: { select: { id: true, username: true, profilePicture: true } } },
    });

    if (!opponent) {
      return { matched: false, message: 'Waiting for opponent...' };
    }

    // Match the two players
    await this.setOpponents(myTournament.id, opponent.id, currentRound, userId, opponent.userId);

    // Create a tournament game
    const game = await prisma.game.create({
      data: {
        hostUserId: userId,
        guestUserId: opponent.userId,
        stake: myTournament.stake,
        status: 'pending',
        isTournament: true,
      },
    });

    return {
      matched: true,
      gameId: game.id,
      opponent: opponent.user,
    };
  }

  /**
   * Record round result and advance bracket
   */
  async recordRoundResult(gameId: string, winnerId: string) {
    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game || !game.isTournament) return;

    const loserId = game.hostUserId === winnerId ? game.guestUserId! : game.hostUserId;

    // Get both tournament entries
    const winnerTournament = await prisma.tournament.findFirst({
      where: { userId: winnerId, finishedAt: null },
    });
    const loserTournament = await prisma.tournament.findFirst({
      where: { userId: loserId, finishedAt: null },
    });

    if (!winnerTournament || !loserTournament) return;

    const round = winnerTournament.currentRound;

    // Mark winner for this round
    await prisma.tournament.update({
      where: { id: winnerTournament.id },
      data: this.setWinnerForRound(round, true),
    });

    // Mark loser as finished (eliminated)
    await prisma.tournament.update({
      where: { id: loserTournament.id },
      data: {
        ...this.setWinnerForRound(round, false),
        finishedAt: new Date(),
      },
    });

    // Advance winner to next round
    if (round < 5) {
      await prisma.tournament.update({
        where: { id: winnerTournament.id },
        data: { currentRound: round + 1 },
      });
    } else {
      // Round 5 (Final) — tournament champion
      await prisma.tournament.update({
        where: { id: winnerTournament.id },
        data: {
          isWinner: true,
          finishedAt: new Date(),
        },
      });

      // Mark loser as second place
      await prisma.tournament.update({
        where: { id: loserTournament.id },
        data: { isSecondPlace: true },
      });

      // Award prizes
      await this.awardTournamentPrizes(winnerTournament, loserTournament);
    }

    logger.info(`Tournament round ${round} result: winner=${winnerId}, loser=${loserId}`);
  }

  /**
   * Award tournament prizes
   */
  private async awardTournamentPrizes(
    winner: { id: string; userId: string; stake: number },
    runnerUp: { id: string; userId: string; stake: number },
  ) {
    const totalPool = winner.stake * 32; // All entrants' stakes (approximate)
    const winnerPrize = Math.floor(totalPool * 0.6);
    const runnerUpPrize = Math.floor(totalPool * 0.3);

    await prisma.$transaction([
      // Winner reward
      prisma.user.update({
        where: { id: winner.userId },
        data: {
          coins: { increment: winnerPrize },
          tournamentsWon: { increment: 1 },
        },
      }),
      prisma.transaction.create({
        data: {
          userId: winner.userId,
          operation: 6, // REWARD_TOURNAMENT
          amount: winnerPrize,
          description: `Tournament champion prize - ${winnerPrize} coins`,
        },
      }),
      // Runner-up reward
      prisma.user.update({
        where: { id: runnerUp.userId },
        data: { coins: { increment: runnerUpPrize } },
      }),
      prisma.transaction.create({
        data: {
          userId: runnerUp.userId,
          operation: 6,
          amount: runnerUpPrize,
          description: `Tournament runner-up prize - ${runnerUpPrize} coins`,
        },
      }),
    ]);
  }

  /**
   * Get tournament status/stats for user
   */
  async getTournamentStatus(userId: string) {
    const tournament = await prisma.tournament.findFirst({
      where: { userId, finishedAt: null },
    });

    if (!tournament) return null;

    return {
      id: tournament.id,
      currentRound: tournament.currentRound,
      roundName: ROUND_NAMES[tournament.currentRound] || `Round ${tournament.currentRound}`,
      stake: tournament.stake,
      wins: this.countWins(tournament),
      isWinner: tournament.isWinner,
      isSecondPlace: tournament.isSecondPlace,
      opponents: {
        round1: tournament.round1OpponentId,
        round2: tournament.round2OpponentId,
        round3: tournament.round3OpponentId,
        round4: tournament.round4OpponentId,
        round5: tournament.round5OpponentId,
      },
    };
  }

  /**
   * Get tournament global ranking
   */
  async getTournamentRanking(limit = 20) {
    const winners = await prisma.tournament.findMany({
      where: { isWinner: true },
      include: {
        user: { select: { id: true, username: true, profilePicture: true, tournamentsWon: true } },
      },
      orderBy: { finishedAt: 'desc' },
      take: limit,
    });

    return winners.map(t => ({
      userId: t.userId,
      username: t.user.username,
      profilePicture: t.user.profilePicture,
      tournamentsWon: t.user.tournamentsWon,
      stake: t.stake,
      finishedAt: t.finishedAt,
    }));
  }

  // ========================================
  // Helper methods
  // ========================================

  private getOpponentForRound(tournament: any, round: number): string | null {
    const fields: Record<number, string> = {
      1: 'round1OpponentId',
      2: 'round2OpponentId',
      3: 'round3OpponentId',
      4: 'round4OpponentId',
      5: 'round5OpponentId',
    };
    return tournament[fields[round] || ''] || null;
  }

  private noOpponentForRoundFilter(round: number): any {
    const fields: Record<number, string> = {
      1: 'round1OpponentId',
      2: 'round2OpponentId',
      3: 'round3OpponentId',
      4: 'round4OpponentId',
      5: 'round5OpponentId',
    };
    return { [fields[round] || 'round1OpponentId']: null };
  }

  private async setOpponents(
    tournamentId1: string,
    tournamentId2: string,
    round: number,
    userId1: string,
    userId2: string,
  ) {
    const opponentField: Record<number, string> = {
      1: 'round1OpponentId',
      2: 'round2OpponentId',
      3: 'round3OpponentId',
      4: 'round4OpponentId',
      5: 'round5OpponentId',
    };
    const field = opponentField[round] || 'round1OpponentId';

    await prisma.$transaction([
      prisma.tournament.update({
        where: { id: tournamentId1 },
        data: { [field]: userId2 },
      }),
      prisma.tournament.update({
        where: { id: tournamentId2 },
        data: { [field]: userId1 },
      }),
    ]);
  }

  private setWinnerForRound(round: number, isWinner: boolean): any {
    const fields: Record<number, string> = {
      1: 'isWinnerRound1',
      2: 'isWinnerRound2',
      3: 'isWinnerRound3',
      4: 'isWinnerRound4',
      5: 'isWinnerRound5',
    };
    return { [fields[round] || 'isWinnerRound1']: isWinner };
  }

  private countWins(tournament: any): number {
    let count = 0;
    if (tournament.isWinnerRound1) count++;
    if (tournament.isWinnerRound2) count++;
    if (tournament.isWinnerRound3) count++;
    if (tournament.isWinnerRound4) count++;
    if (tournament.isWinnerRound5) count++;
    return count;
  }
}

export default new TournamentService();
