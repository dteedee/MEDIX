import { apiClient } from "../lib/apiClient";
import { PromotionDto, UserPromotionDto } from "../types/promotion.types";

interface CreatePromotionDto {
    code: string;
    name: string;
    description?: string;
    discountType: string;
    discountValue: number;
    maxUsage?: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

interface UpdatePromotionDto {
    code: string;
    name: string;
    description?: string;
    discountType: string;
    discountValue: number;
    maxUsage?: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

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

    // Manager methods
    async getAllPromotions(): Promise<PromotionDto[]> {
        try {
            const response = await apiClient.get<PromotionDto[]>('/promotion/getAll');
            return response.data || [];
        } catch (error: any) {
            console.error('Get all promotions error:', error);
            throw error;
        }
    }

    async getPromotionById(id: string): Promise<PromotionDto> {
        try {
            const response = await apiClient.get<PromotionDto>(`/promotion/${id}`);
            return response.data;
        } catch (error: any) {
            console.error('Get promotion by id error:', error);
            throw error;
        }
    }

    async createPromotion(data: CreatePromotionDto): Promise<PromotionDto> {
        try {
            const response = await apiClient.post<PromotionDto>('/promotion', data);
            return response.data;
        } catch (error: any) {
            console.error('Create promotion error:', error);
            throw error;
        }
    }

    async updatePromotion(id: string, data: UpdatePromotionDto): Promise<PromotionDto> {
        try {
            const response = await apiClient.put<PromotionDto>(`/promotion/${id}`, data);
            return response.data;
        } catch (error: any) {
            console.error('Update promotion error:', error);
            throw error;
        }
    }

    async deletePromotion(id: string): Promise<void> {
        try {
            await apiClient.delete(`/promotion/${id}`);
        } catch (error: any) {
            console.error('Delete promotion error:', error);
            throw error;
        }
    }

    async promotionCodeExists(code: string): Promise<boolean> {
        try {
            const response = await apiClient.get<boolean>(`/promotion/code-exists/${code}`);
            return response.data;
        } catch (error: any) {
            console.error('Check promotion code exists error:', error);
            return false;
        }
    }
}

export default new PromotionService();
