export interface UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    gender?: string;
    age?: number;
    profilePicture?: string;
}
export interface UpdateSettingsDto {
    alternateCards?: boolean;
    alternateMode?: boolean;
    chatEnabled?: boolean;
    soundEnabled?: boolean;
}
export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
declare class UserService {
    getUserProfile(userId: string): Promise<{
        winRate: number;
        id: string;
        email: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
        gender: string | null;
        age: number | null;
        profilePicture: string | null;
        coins: number;
        gamesPlayed: number;
        gamesWon: number;
        gamesAbandoned: number;
        points: number;
        position: number | null;
        tournamentsWon: number;
        alternateCards: boolean;
        alternateMode: boolean;
        chatEnabled: boolean;
        soundEnabled: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getUserByUsername(username: string): Promise<{
        winRate: number;
        id: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
        profilePicture: string | null;
        gamesPlayed: number;
        gamesWon: number;
        points: number;
        position: number | null;
        tournamentsWon: number;
        createdAt: Date;
    }>;
    updateProfile(userId: string, data: UpdateProfileDto): Promise<{
        id: string;
        email: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
        gender: string | null;
        age: number | null;
        profilePicture: string | null;
        coins: number;
        gamesPlayed: number;
        gamesWon: number;
        points: number;
        position: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateSettings(userId: string, data: UpdateSettingsDto): Promise<{
        id: string;
        alternateCards: boolean;
        alternateMode: boolean;
        chatEnabled: boolean;
        soundEnabled: boolean;
    }>;
    changePassword(userId: string, data: ChangePasswordDto): Promise<{
        message: string;
    }>;
    getUserStats(userId: string): Promise<{
        gamesLost: number;
        winRate: number;
        id: string;
        username: string;
        coins: number;
        gamesPlayed: number;
        gamesWon: number;
        gamesAbandoned: number;
        points: number;
        position: number | null;
        tournamentsWon: number;
    }>;
    getUserGameHistory(userId: string, limit?: number, offset?: number): Promise<{
        id: string;
        opponent: {
            id: string;
            username: string;
            profilePicture: string | null;
        } | null;
        myScore: number;
        opponentScore: number;
        stake: number;
        level: number;
        isBot: boolean;
        won: boolean;
        createdAt: Date;
        finishedAt: Date | null;
    }[]>;
    deleteAccount(userId: string, password: string): Promise<{
        message: string;
    }>;
}
declare const _default: UserService;
export default _default;
//# sourceMappingURL=user.service.d.ts.map