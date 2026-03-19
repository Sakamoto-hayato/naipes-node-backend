import { Server } from 'socket.io';
export declare class GameGateway {
    private io;
    constructor(io: Server);
    private initialize;
    private handleJoinGame;
    private handleLeaveGame;
    private handlePlayCard;
    private handleStartGame;
    private handleGetGameState;
    private handleChallenge;
    private handleChallengeResponse;
    private notifyGameRoom;
    private handleError;
}
export default GameGateway;
//# sourceMappingURL=game.gateway.d.ts.map