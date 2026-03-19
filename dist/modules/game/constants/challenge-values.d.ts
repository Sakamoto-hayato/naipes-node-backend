export declare enum ChallengeType {
    TRUCO = "TRUCO",
    RETRUCO = "RETRUCO",
    VALE_CUATRO = "VALECUATRO",
    ENVIDO = "ENVIDO",
    REAL_ENVIDO = "REAL_ENVIDO",
    FALTA_ENVIDO = "FALTA_ENVIDO"
}
export declare const CHALLENGE_POINTS: Record<ChallengeType, number>;
export declare const VALID_CHALLENGE_SEQUENCES: Record<ChallengeType, ChallengeType[]>;
export declare enum ChallengeCategory {
    TRUCO = "TRUCO",
    ENVIDO = "ENVIDO"
}
export declare function getChallengeCategory(type: ChallengeType): ChallengeCategory;
export declare function isValidChallengeRaise(currentType: ChallengeType, newType: ChallengeType): boolean;
export declare function getFaltaEnvidoPoints(challengerScore: number, opponentScore: number): number;
export declare function calculateChallengePoints(challenges: Array<{
    type: ChallengeType;
    accepted: boolean | null;
}>, challengerScore: number, opponentScore: number): {
    trucoPoints: number;
    envidoPoints: number;
};
export declare function canMakeChallenge(type: ChallengeType, existingChallenges: Array<{
    type: ChallengeType;
    accepted: boolean | null;
}>, trickNumber: number): {
    allowed: boolean;
    reason?: string;
};
export declare const CHALLENGE_NAMES: Record<ChallengeType, string>;
export declare function getChallengeResponseOptions(type: ChallengeType): string[];
declare const _default: {
    ChallengeType: typeof ChallengeType;
    CHALLENGE_POINTS: Record<ChallengeType, number>;
    VALID_CHALLENGE_SEQUENCES: Record<ChallengeType, ChallengeType[]>;
    getChallengeCategory: typeof getChallengeCategory;
    isValidChallengeRaise: typeof isValidChallengeRaise;
    getFaltaEnvidoPoints: typeof getFaltaEnvidoPoints;
    calculateChallengePoints: typeof calculateChallengePoints;
    canMakeChallenge: typeof canMakeChallenge;
    CHALLENGE_NAMES: Record<ChallengeType, string>;
    getChallengeResponseOptions: typeof getChallengeResponseOptions;
};
export default _default;
//# sourceMappingURL=challenge-values.d.ts.map