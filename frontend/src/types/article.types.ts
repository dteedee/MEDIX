export interface ArticleCategory {
  name: string
  slug: string
}

export interface ArticleDTO {
  id: string
  title: string
  slug?: string
  summary?: string
  content?: string | null
  thumbnailUrl?: string
  coverImageUrl?: string
  displayType?: string
  metaTitle?: string | null
  metaDescription?: string | null
  statusCode?: string
  authorName?: string
  publishedAt?: string | null
  viewCount?: number
  likeCount?: number
  isHomepageVisible?: boolean
  displayOrder?: number
  createdAt?: string
  updatedAt?: string
  categories?: ArticleCategory[]
  categoryIds?: string[]
}

export interface CreateArticleRequest {
  title: string
  slug: string
  summary?: string
  content?: string
  displayType: string
  thumbnailUrl?: string
  coverImageUrl?: string
  isHomepageVisible: boolean
  displayOrder: number
  metaTitle?: string
  metaDescription?: string
  authorId: string
  statusCode: string
  publishedAt?: string
  categoryIds: string[]
}

export interface UpdateArticleRequest extends Partial<CreateArticleRequest> {}
