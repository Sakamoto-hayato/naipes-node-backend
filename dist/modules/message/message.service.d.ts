export interface SendMessageDto {
    userId: string;
    gameId: string;
    message: string;
}
declare class MessageService {
    sendMessage(data: SendMessageDto): Promise<{
        user: {
            id: string;
            username: string;
            profilePicture: string | null;
        };
    } & {
        text: string;
        id: string;
        createdAt: Date;
        gameId: string;
        userId: string;
    }>;
    getGameMessages(gameId: string, userId: string, limit?: number, offset?: number): Promise<({
        user: {
            id: string;
            username: string;
            profilePicture: string | null;
        };
    } & {
        text: string;
        id: string;
        createdAt: Date;
        gameId: string;
        userId: string;
    })[]>;
    deleteMessage(messageId: string, userId: string): Promise<{
        message: string;
    }>;
    clearGameMessages(gameId: string): Promise<{
        message: string;
    }>;
    getUserRecentMessages(userId: string, limit?: number): Promise<({
        user: {
            id: string;
            username: string;
            profilePicture: string | null;
        };
        game: {
            id: string;
            status: string;
        };
    } & {
        text: string;
        id: string;
        createdAt: Date;
        gameId: string;
        userId: string;
    })[]>;
}
declare const _default: MessageService;
export default _default;
//# sourceMappingURL=message.service.d.ts.map