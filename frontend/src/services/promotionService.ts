import { apiClient } from "../lib/apiClient";
import { PromotionDto, UserPromotionDto } from "../types/promotion.types";

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

    async getUserActivePromotions(): Promise<UserPromotionDto[]> {
        try {
            const response = await apiClient.get<UserPromotionDto[]>('/UserPromotion/my-active-promotions');
            console.log('📦 Response.data:', response.data);
            console.log('📦 Is array?', Array.isArray(response.data));
            console.log('📦 Length?', response.data?.length);
            
            // Backend returns array directly: return Ok(result);
            if (Array.isArray(response.data)) {
                console.log('✅ Returning promotions array:', response.data);
                return response.data;
            }
            
            console.warn('⚠️ Unexpected response structure, expected array but got:', typeof response.data);
            return [];
        } catch (error: any) {
            console.error('❌ Get user active promotions error:', error);
            console.error('❌ Error response:', error.response?.data);
            return [];
        }
    }
}

export default new PromotionService();
