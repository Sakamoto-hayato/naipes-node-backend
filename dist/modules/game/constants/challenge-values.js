"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHALLENGE_NAMES = exports.ChallengeCategory = exports.VALID_CHALLENGE_SEQUENCES = exports.CHALLENGE_POINTS = exports.ChallengeType = void 0;
exports.getChallengeCategory = getChallengeCategory;
exports.isValidChallengeRaise = isValidChallengeRaise;
exports.getFaltaEnvidoPoints = getFaltaEnvidoPoints;
exports.calculateChallengePoints = calculateChallengePoints;
exports.canMakeChallenge = canMakeChallenge;
exports.getChallengeResponseOptions = getChallengeResponseOptions;
var ChallengeType;
(function (ChallengeType) {
    ChallengeType["TRUCO"] = "TRUCO";
    ChallengeType["RETRUCO"] = "RETRUCO";
    ChallengeType["VALE_CUATRO"] = "VALECUATRO";
    ChallengeType["ENVIDO"] = "ENVIDO";
    ChallengeType["REAL_ENVIDO"] = "REAL_ENVIDO";
    ChallengeType["FALTA_ENVIDO"] = "FALTA_ENVIDO";
})(ChallengeType || (exports.ChallengeType = ChallengeType = {}));
exports.CHALLENGE_POINTS = {
    [ChallengeType.TRUCO]: 2,
    [ChallengeType.RETRUCO]: 3,
    [ChallengeType.VALE_CUATRO]: 4,
    [ChallengeType.ENVIDO]: 2,
    [ChallengeType.REAL_ENVIDO]: 3,
    [ChallengeType.FALTA_ENVIDO]: 0,
};
exports.VALID_CHALLENGE_SEQUENCES = {
    [ChallengeType.TRUCO]: [ChallengeType.RETRUCO],
    [ChallengeType.RETRUCO]: [ChallengeType.VALE_CUATRO],
    [ChallengeType.VALE_CUATRO]: [],
    [ChallengeType.ENVIDO]: [ChallengeType.REAL_ENVIDO, ChallengeType.FALTA_ENVIDO],
    [ChallengeType.REAL_ENVIDO]: [ChallengeType.FALTA_ENVIDO],
    [ChallengeType.FALTA_ENVIDO]: [],
};
var ChallengeCategory;
(function (ChallengeCategory) {
    ChallengeCategory["TRUCO"] = "TRUCO";
    ChallengeCategory["ENVIDO"] = "ENVIDO";
})(ChallengeCategory || (exports.ChallengeCategory = ChallengeCategory = {}));
function getChallengeCategory(type) {
    if ([ChallengeType.TRUCO, ChallengeType.RETRUCO, ChallengeType.VALE_CUATRO].includes(type)) {
        return ChallengeCategory.TRUCO;
    }
    return ChallengeCategory.ENVIDO;
}
function isValidChallengeRaise(currentType, newType) {
    const validRaises = exports.VALID_CHALLENGE_SEQUENCES[currentType];
    return validRaises.includes(newType);
}
function getFaltaEnvidoPoints(challengerScore, opponentScore) {
    const challengerRemaining = 30 - challengerScore;
    const opponentRemaining = 30 - opponentScore;
    return Math.max(challengerRemaining, opponentRemaining);
}
function calculateChallengePoints(challenges, challengerScore, opponentScore) {
    let trucoPoints = 1;
    let envidoPoints = 0;
    for (const challenge of challenges) {
        if (challenge.accepted === false) {
            continue;
        }
        const category = getChallengeCategory(challenge.type);
        const points = exports.CHALLENGE_POINTS[challenge.type];
        if (category === ChallengeCategory.TRUCO) {
            trucoPoints = points;
        }
        else if (category === ChallengeCategory.ENVIDO) {
            if (challenge.type === ChallengeType.FALTA_ENVIDO) {
                envidoPoints += getFaltaEnvidoPoints(challengerScore, opponentScore);
            }
            else {
                envidoPoints += points;
            }
        }
    }
    return { trucoPoints, envidoPoints };
}
function canMakeChallenge(type, existingChallenges, trickNumber) {
    const category = getChallengeCategory(type);
    if (category === ChallengeCategory.ENVIDO && trickNumber > 1) {
        return { allowed: false, reason: 'Envido can only be called in the first trick' };
    }
    const pendingChallenge = existingChallenges.find(c => c.accepted === null);
    if (pendingChallenge) {
        if (getChallengeCategory(pendingChallenge.type) !== category) {
            return { allowed: false, reason: 'Cannot mix challenge categories' };
        }
        if (!isValidChallengeRaise(pendingChallenge.type, type)) {
            return { allowed: false, reason: `Cannot raise ${pendingChallenge.type} to ${type}` };
        }
    }
    const sameCategoryAccepted = existingChallenges.filter(c => getChallengeCategory(c.type) === category && c.accepted === true);
    if (sameCategoryAccepted.length > 0) {
        const latestAccepted = sameCategoryAccepted[sameCategoryAccepted.length - 1];
        if (latestAccepted && !isValidChallengeRaise(latestAccepted.type, type)) {
            return { allowed: false, reason: `Cannot raise ${latestAccepted.type} to ${type}` };
        }
    }
    return { allowed: true };
}
exports.CHALLENGE_NAMES = {
    [ChallengeType.TRUCO]: 'Truco',
    [ChallengeType.RETRUCO]: 'Retruco',
    [ChallengeType.VALE_CUATRO]: 'Vale Cuatro',
    [ChallengeType.ENVIDO]: 'Envido',
    [ChallengeType.REAL_ENVIDO]: 'Real Envido',
    [ChallengeType.FALTA_ENVIDO]: 'Falta Envido',
};
function getChallengeResponseOptions(type) {
    const category = getChallengeCategory(type);
    if (category === ChallengeCategory.TRUCO) {
        const raises = exports.VALID_CHALLENGE_SEQUENCES[type];
        return ['Accept (Quiero)', 'Reject (No quiero)', ...raises.map(r => `Raise to ${exports.CHALLENGE_NAMES[r]}`)];
    }
    else {
        const raises = exports.VALID_CHALLENGE_SEQUENCES[type];
        return ['Accept (Quiero)', 'Reject (No quiero)', ...raises.map(r => `Raise to ${exports.CHALLENGE_NAMES[r]}`)];
    }
}
exports.default = {
    ChallengeType,
    CHALLENGE_POINTS: exports.CHALLENGE_POINTS,
    VALID_CHALLENGE_SEQUENCES: exports.VALID_CHALLENGE_SEQUENCES,
    getChallengeCategory,
    isValidChallengeRaise,
    getFaltaEnvidoPoints,
    calculateChallengePoints,
    canMakeChallenge,
    CHALLENGE_NAMES: exports.CHALLENGE_NAMES,
    getChallengeResponseOptions,
};
//# sourceMappingURL=challenge-values.js.map