export interface BannerDTO {
  id: string
  bannerTitle: string
  bannerImageUrl?: string
  bannerUrl?: string
  isActive: boolean
  displayOrder?: number
  startDate?: string | null
  endDate?: string | null
  createdAt?: string
}

export interface CreateBannerRequest {
  // Backend expects these fields when creating a banner
  bannerTitle: string
  bannerImageUrl?: string
  bannerUrl?: string
  displayOrder?: number
  startDate?: string
  endDate?: string
  isActive: boolean
  bannerFile?: File; // Add this for file uploads
}

export interface UpdateBannerRequest extends Partial<CreateBannerRequest> {
  bannerFile?: File; // Also add here
}
