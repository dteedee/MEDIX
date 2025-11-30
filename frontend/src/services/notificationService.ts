import { apiClient } from "../lib/apiClient";
import { NotificationMetadata } from "../types/notification.types";

class NotificationService{
    async getMetadata(): Promise<NotificationMetadata>{
        const response = await apiClient.get<NotificationMetadata>('/notification');
        return response.data;
    }
}

export default new NotificationService();