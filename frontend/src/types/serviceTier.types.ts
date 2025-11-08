export interface ServiceTierDto{
    id: string;
    name: string;
    monthlyPrice: number;
    features: string;
}

export interface TierListPresenter{
    list: ServiceTierDto[];
    currentTierId: string;
    balance: number;
    expiredAt: string;
}