export interface RegisterDto {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
}
export interface LoginDto {
    email: string;
    password: string;
}
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
        profilePicture: string | null;
        coins: number;
        gamesPlayed: number;
        gamesWon: number;
        points: number;
        position: number | null;
    };
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    register(data: RegisterDto): Promise<AuthResponse>;
    login(data: LoginDto): Promise<AuthResponse>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    getMe(userId: string): Promise<AuthResponse['user']>;
    requestPasswordRecovery(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    confirmEmail(token: string): Promise<{
        message: string;
    }>;
    resendConfirmation(email: string): Promise<{
        message: string;
    }>;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=auth.service.d.ts.map