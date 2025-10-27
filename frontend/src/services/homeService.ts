import { apiClient } from "../lib/apiClient";
import { HomeMetadata } from "../types/home.types";

class HomeService {
    async getHomeMetadata(): Promise<HomeMetadata> {
        const response = await apiClient.get<HomeMetadata>('home');
        const data = response.data;
        
        // Filter out locked articles and banners
        const filteredData = {
            ...data,
            articles: (data.articles || []).filter((article: any) => !article.isLocked),
            banners: (data.banners || []).filter((banner: any) => !banner.isLocked)
        };
        
        return filteredData;
    }
}

export default new HomeService();