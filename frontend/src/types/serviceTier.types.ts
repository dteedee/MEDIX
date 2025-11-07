export interface ServiceTierDto{
    id: string;
    name: string;
    monthlyPrice: string;
    features: string;
}

export interface TierListPresenter{
    list: ServiceTierDto[];
    currentTierId: string;
}