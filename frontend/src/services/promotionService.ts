import { apiClient } from "../lib/apiClient";
import { PromotionDto, UserPromotionDto, PromotionTargetDto } from "../types/promotion.types";

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
    applicableTargets?: string;
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
    applicableTargets?: string;
}

interface BulkAssignPromotionRequest {
    promotionId: string;
    applicableToAllUsers: boolean;
    applicableToNewUsers: boolean;
    applicableToVipUsers: boolean;
    newUserDays?: number;
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
            throw error;
        }
    }

    async getAvailablePromotions(): Promise<PromotionDto[]> {
        try {
            const response = await apiClient.get<PromotionDto[]>('/promotion/available');
            return response.data || [];
        } catch (error: any) {
            return [];
        }
    }

    async getUserActivePromotions(): Promise<UserPromotionDto[]> {
        try {
            const response = await apiClient.get<UserPromotionDto[]>('/UserPromotion/my-active-promotions');
            
            if (Array.isArray(response.data)) {
                return response.data;
            }
            
            return [];
        } catch (error: any) {
            return [];
        }
    }

    async getAllPromotions(): Promise<PromotionDto[]> {
        try {
            const response = await apiClient.get<PromotionDto[]>('/promotion/getAll');
            return response.data || [];
        } catch (error: any) {
            throw error;
        }
    }

    async getPromotionById(id: string): Promise<PromotionDto> {
        try {
            const response = await apiClient.get<PromotionDto>(`/promotion/${id}`);
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }

    async createPromotion(data: CreatePromotionDto): Promise<PromotionDto> {
        try {
            const response = await apiClient.post<any>('/promotion', data);
            
            let promotionData = response.data;
            
            if (response.data?.data) {
                promotionData = response.data.data;
            }
            
            if (response.data?.result) {
                promotionData = response.data.result;
            }
            
            
            return promotionData;
        } catch (error: any) {
            throw error;
        }
    }

    async updatePromotion(id: string, data: UpdatePromotionDto): Promise<PromotionDto> {
        try {
            const response = await apiClient.put<PromotionDto>(`/promotion/${id}`, data);
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }

    async deletePromotion(id: string): Promise<void> {
        try {
            await apiClient.delete(`/promotion/${id}`);
        } catch (error: any) {
            throw error;
        }
    }

    async promotionCodeExists(code: string): Promise<boolean> {
        try {
            const response = await apiClient.get<boolean>(`/promotion/code-exists/${code}`);
            return response.data;
        } catch (error: any) {
            return false;
        }
    }

    async assignPromotionBulk(request: BulkAssignPromotionRequest): Promise<any> {
        try {
            const payload = {
                promotionId: request.promotionId,
                applicableToAllUsers: request.applicableToAllUsers,
                applicableToNewUsers: request.applicableToNewUsers,
                applicableToVipUsers: request.applicableToVipUsers,
                newUserDays: request.newUserDays || 30
            };
            const response = await apiClient.post('/UserPromotion/assign/bulk', payload);
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }

    async getPromotionTargets(): Promise<PromotionTargetDto[]> {
        try {
            const response = await apiClient.get<PromotionTargetDto[]>('/promotion/getTarget');
            return response.data || [];
        } catch (error: any) {
            return [];
        }
    }
}

export default new PromotionService();
