import { apiClient } from "../lib/apiClient";
import { NotificationMetadata } from "../types/notification.types";

class NotificationService{
    async getMetadata(): Promise<NotificationMetadata>{
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) {
            throw new Error('No access token found - please login');
        }

        const response = await apiClient.get<NotificationMetadata>('/notification', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data;
    }
}

export default new NotificationService();