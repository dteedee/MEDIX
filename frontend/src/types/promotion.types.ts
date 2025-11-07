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
