export interface PromotionDto {
    id: string;
    code: string;
    name: string;
    description?: string;
    discountType: string; 
    discountValue: number;
    maxUsage?: number;
    usedCount: number;
    startDate: string;
    endDate: string;
    isActive: boolean; 
    createdAt: string;
    applicableTargets?: string; 
}

export interface PromotionTargetDto {
    id: string;
    name: string;
    target: string;
    description: string;
}

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
    isExpired: boolean;
    isValidNow: boolean;
}
