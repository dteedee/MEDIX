export interface ServicePackageDto {
  id: string;
  name: string;
  description?: string | null;
  monthlyFee: number;
  features?: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface ServicePackageModel extends ServicePackageDto {
  featuresList: string[];
}

export interface ServicePackageUpdateRequest {
  name: string;
  monthlyFee: number;
}

