export interface PromotionDto {
    id: string;
    code: string;
    name: string;
    description?: string;
    discountType: string; // "Percentage" | "FixedAmount"
    discountValue: number;
    maxUsage?: number;
    usedCount: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt: string;
}

export interface UserPromotionDto {
    id: string;
    userId: string;
    promotionId: string;
    usedCount: number;
    expiryDate: string;
    isActive: boolean;
    assignedAt: string;
    lastUsedAt?: string | null;
    promotion?: PromotionDto | null;
    // Computed properties
    isExpired: boolean;
    isValidNow: boolean;
}
