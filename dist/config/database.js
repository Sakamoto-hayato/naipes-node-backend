"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    errorFormat: 'pretty',
});
async function connectDatabase() {
    try {
        await prisma.$connect();
        console.log('✓ Database connected successfully');
    }
    catch (error) {
        console.error('✗ Database connection failed:', error);
        throw error;
    }
}
async function disconnectDatabase() {
    try {
        await prisma.$disconnect();
        console.log('✓ Database disconnected');
    }
    catch (error) {
        console.error('✗ Database disconnection failed:', error);
        throw error;
    }
}
exports.default = prisma;
//# sourceMappingURL=database.js.map