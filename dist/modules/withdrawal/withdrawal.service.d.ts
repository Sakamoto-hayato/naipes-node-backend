export interface CreateWithdrawRequestDto {
    userId: string;
    amount: number;
    method: string;
    accountInfo: string;
}
export interface UpdateWithdrawRequestDto {
    status: string;
    adminNotes?: string;
}
declare class WithdrawalService {
    createWithdrawRequest(data: CreateWithdrawRequestDto): Promise<{
        user: {
            id: string;
            email: string;
            username: string;
        };
    } & {
        id: string;
        createdAt: Date;
        amount: number;
        userId: string;
        status: string;
        paymentMethod: string | null;
        paymentDetails: import("@prisma/client/runtime/library").JsonValue | null;
        adminNotes: string | null;
        processedBy: string | null;
        processedAt: Date | null;
    }>;
    getUserWithdrawRequests(userId: string, limit?: number, offset?: number): Promise<{
        id: string;
        createdAt: Date;
        amount: number;
        userId: string;
        status: string;
        paymentMethod: string | null;
        paymentDetails: import("@prisma/client/runtime/library").JsonValue | null;
        adminNotes: string | null;
        processedBy: string | null;
        processedAt: Date | null;
    }[]>;
    getWithdrawRequestById(requestId: string, userId: string): Promise<{
        user: {
            id: string;
            email: string;
            username: string;
        };
    } & {
        id: string;
        createdAt: Date;
        amount: number;
        userId: string;
        status: string;
        paymentMethod: string | null;
        paymentDetails: import("@prisma/client/runtime/library").JsonValue | null;
        adminNotes: string | null;
        processedBy: string | null;
        processedAt: Date | null;
    }>;
    cancelWithdrawRequest(requestId: string, userId: string): Promise<{
        message: string;
    }>;
    getAllWithdrawRequests(status?: string, limit?: number, offset?: number): Promise<({
        user: {
            id: string;
            email: string;
            username: string;
            coins: number;
        };
    } & {
        id: string;
        createdAt: Date;
        amount: number;
        userId: string;
        status: string;
        paymentMethod: string | null;
        paymentDetails: import("@prisma/client/runtime/library").JsonValue | null;
        adminNotes: string | null;
        processedBy: string | null;
        processedAt: Date | null;
    })[]>;
    updateWithdrawRequest(requestId: string, data: UpdateWithdrawRequestDto): Promise<{
        id: string;
        createdAt: Date;
        amount: number;
        userId: string;
        status: string;
        paymentMethod: string | null;
        paymentDetails: import("@prisma/client/runtime/library").JsonValue | null;
        adminNotes: string | null;
        processedBy: string | null;
        processedAt: Date | null;
    } | {
        message: string;
    }>;
    getWithdrawStatistics(): Promise<{
        totalRequests: number;
        pendingRequests: number;
        byStatus: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.WithdrawRequestGroupByOutputType, "status"[]> & {
            _count: {
                id: number;
            };
            _sum: {
                amount: number | null;
            };
        })[];
    }>;
}
declare const _default: WithdrawalService;
export default _default;
//# sourceMappingURL=withdrawal.service.d.ts.map