export interface BannerDTO {
  id: string
  title: string
  imageUrl?: string
  link?: string
  isActive: boolean
  order?: number
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
  isActive?: boolean
}

export interface UpdateBannerRequest extends Partial<CreateBannerRequest> {}
