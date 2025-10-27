import { apiClient } from "../lib/apiClient";
import { HomeMetadata } from "../types/home.types";

class HomeService {
    async getHomeMetadata(): Promise<HomeMetadata> {
        const response = await apiClient.get<HomeMetadata>('home');
        // Return data directly from the API.
        // The backend should be responsible for deciding which articles/banners to show.
        return response.data;
    }
}

export default new HomeService();