import { apiClient } from "../lib/apiClient";
import { PromotionDto } from "../types/promotion.types";

class PromotionService {
    async getPromotionByCode(code: string): Promise<PromotionDto | null> {
        try {
            const response = await apiClient.get<PromotionDto>(`/promotion/code/${code}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error('Get promotion by code error:', error);
            throw error;
        }
    }

    async getAvailablePromotions(): Promise<PromotionDto[]> {
        try {
            const response = await apiClient.get<PromotionDto[]>('/promotion/available');
            return response.data || [];
        } catch (error: any) {
            console.error('Get available promotions error:', error);
            return [];
        }
    }
}

export default new PromotionService();
