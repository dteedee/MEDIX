export interface CmsPageDTO {
  id: string
  pageTitle: string
  pageSlug?: string
  pageContent?: string
  metaTitle?: string
  metaDescription?: string
  isPublished?: boolean
  publishedAt?: string | null
  authorName?: string
  authorId?: string
  viewCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface CreateCmsPageRequest {
  pageTitle: string
  pageSlug: string
  pageContent: string
  metaTitle: string
  metaDescription: string
  isPublished: boolean
  publishedAt: string
  authorId: string
}

export interface UpdateCmsPageRequest extends Partial<CreateCmsPageRequest> {}
