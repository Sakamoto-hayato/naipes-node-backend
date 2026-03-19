export interface CreateCoinPackageDto {
    name: string;
    coins: number;
    price: number;
    currency?: string;
    bonus?: number;
    sortOrder?: number;
}
export interface UpdateCoinPackageDto {
    name?: string;
    coins?: number;
    price?: number;
    currency?: string;
    bonus?: number;
    isActive?: boolean;
    sortOrder?: number;
}
export interface PurchaseCoinPackageDto {
    packageId: string;
    userId: string;
    paymentMethod: string;
    externalId?: string;
}
declare class CoinService {
    getActiveCoinPackages(): Promise<{
        name: string;
        id: string;
        coins: number;
        createdAt: Date;
        updatedAt: Date;
        price: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        bonus: number;
        isActive: boolean;
        sortOrder: number;
    }[]>;
    getAllCoinPackages(): Promise<{
        name: string;
        id: string;
        coins: number;
        createdAt: Date;
        updatedAt: Date;
        price: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        bonus: number;
        isActive: boolean;
        sortOrder: number;
    }[]>;
    getCoinPackageById(packageId: string): Promise<{
        name: string;
        id: string;
        coins: number;
        createdAt: Date;
        updatedAt: Date;
        price: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        bonus: number;
        isActive: boolean;
        sortOrder: number;
    }>;
    createCoinPackage(data: CreateCoinPackageDto): Promise<{
        name: string;
        id: string;
        coins: number;
        createdAt: Date;
        updatedAt: Date;
        price: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        bonus: number;
        isActive: boolean;
        sortOrder: number;
    }>;
    updateCoinPackage(packageId: string, data: UpdateCoinPackageDto): Promise<{
        name: string;
        id: string;
        coins: number;
        createdAt: Date;
        updatedAt: Date;
        price: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        bonus: number;
        isActive: boolean;
        sortOrder: number;
    }>;
    deleteCoinPackage(packageId: string): Promise<{
        message: string;
    }>;
    purchaseCoinPackage(data: PurchaseCoinPackageDto): Promise<{
        transaction: {
            id: string;
            createdAt: Date;
            operation: number;
            amount: number;
            balanceBefore: number | null;
            balanceAfter: number | null;
            description: string | null;
            gameId: string | null;
            externalId: string | null;
            userId: string;
        };
        newBalance: number;
        coinsAdded: number;
    }>;
    getUserTransactions(userId: string, limit?: number, offset?: number): Promise<{
        id: string;
        createdAt: Date;
        operation: number;
        amount: number;
        balanceBefore: number | null;
        balanceAfter: number | null;
        description: string | null;
        gameId: string | null;
        externalId: string | null;
        userId: string;
    }[]>;
    getTransactionById(transactionId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        operation: number;
        amount: number;
        balanceBefore: number | null;
        balanceAfter: number | null;
        description: string | null;
        gameId: string | null;
        externalId: string | null;
        userId: string;
    }>;
    getAllTransactions(limit?: number, offset?: number): Promise<({
        user: {
            id: string;
            email: string;
            username: string;
        };
    } & {
        id: string;
        createdAt: Date;
        operation: number;
        amount: number;
        balanceBefore: number | null;
        balanceAfter: number | null;
        description: string | null;
        gameId: string | null;
        externalId: string | null;
        userId: string;
    })[]>;
    getTransactionStats(): Promise<{
        totalRevenue: number;
        totalPurchases: number;
        recentPurchases: ({
            user: {
                username: string;
            };
        } & {
            id: string;
            createdAt: Date;
            operation: number;
            amount: number;
            balanceBefore: number | null;
            balanceAfter: number | null;
            description: string | null;
            gameId: string | null;
            externalId: string | null;
            userId: string;
        })[];
    }>;
}
declare const _default: CoinService;
export default _default;
//# sourceMappingURL=coin.service.d.ts.map