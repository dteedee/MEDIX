import { apiClient } from "../lib/apiClient";
import { HomeMetadata } from "../types/home.types";

class HomeService {
    async getHomeMetadata(): Promise<HomeMetadata> {
        const response = await apiClient.get<HomeMetadata>('home');
        return response.data;
    }
}

export default new HomeService();