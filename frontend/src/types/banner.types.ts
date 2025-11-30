export interface BannerDTO {
  id: string
  bannerTitle: string
  bannerImageUrl?: string
  bannerUrl?: string
  isActive: boolean
  isLocked: boolean
  displayOrder?: number
  startDate?: string | null
  endDate?: string | null
  createdAt?: string
}

export interface CreateBannerRequest {
  bannerTitle: string
  bannerImageUrl?: string
  bannerUrl?: string
  displayOrder?: number
  startDate?: string
  endDate?: string
  isActive: boolean
  bannerFile?: File; 
}

export interface UpdateBannerRequest extends Partial<CreateBannerRequest> {
  bannerFile?: File; 
}
