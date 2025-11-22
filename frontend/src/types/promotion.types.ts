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
    isActive: boolean; // Backend pode retornar 0 ou 1
    createdAt: string;
}

// Helper function to normalize isActive
export const normalizeIsActive = (isActive: boolean | number): boolean => {
    return isActive === true || isActive === 1;
};

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
