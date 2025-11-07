import { apiClient } from "../lib/apiClient";
import { TierListPresenter } from "../types/serviceTier.types";

class ServiceTierService {
    async getDisplayedList(): Promise<TierListPresenter>{
        const response = await apiClient.get<TierListPresenter>("doctorServiceTier/list");
        return response.data;
    }

    async upgradePackage(serviceTierId: string): Promise<any>{
        await apiClient.post("doctorServiceTier/upgrade", {
            serviceTierId
        })
    }
}

export default new ServiceTierService();