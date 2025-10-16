import { apiClient } from "../lib/apiClient";
import { HomeMetadata } from "../types/home.types";

class HomeService {
    async getHomeMetadata(): Promise<HomeMetadata> {
        try {
            const response = await apiClient.get<HomeMetadata>('home');
            return response.data;
        }
        catch (error: any) {
            console.error('Get home metadata error:', error);
            throw this.handleApiError(error);
        }
    }

    private handleApiError(error: any): Error {
        if (error.response?.data) {
            const apiError = error.response.data;

            // Handle validation errors from backend
            if (apiError.errors) {
                const errorMessages = Object.entries(apiError.errors)
                    .flat()
                    .filter(msg => typeof msg === 'string')
                    .join(', ');
                return new Error(errorMessages || apiError.message || 'Validation error');
            }

            return new Error(apiError.message || 'API error occurred');
        }

        return new Error(error.message || 'Network error occurred');
    }
}

export default new HomeService();