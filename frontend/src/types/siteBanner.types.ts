export interface SiteBannerDTO {
  id: string;
  bannerTitle: string;
  bannerImageUrl: string;
  bannerUrl: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface CreateSiteBannerRequest {
  bannerTitle: string;
  bannerImageUrl: string;
  bannerUrl: string;
  isActive: boolean;
  displayOrder: number;
}

export interface UpdateSiteBannerRequest extends CreateSiteBannerRequest {}