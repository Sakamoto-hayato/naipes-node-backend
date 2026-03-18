import { PrismaClient } from '@prisma/client';

// Prisma Client 인스턴스 생성
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
  errorFormat: 'pretty',
});

// Prisma 연결 확인
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✓ Database connected successfully');
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    throw error;
  }
}

// Prisma 연결 종료
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('✓ Database disconnected');
  } catch (error) {
    console.error('✗ Database disconnection failed:', error);
    throw error;
  }
}

export default prisma;
