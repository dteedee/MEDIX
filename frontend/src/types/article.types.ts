export interface CategoryDTO {
    id: string;
    name: string;
    slug: string;
  }
  
  export interface ArticleDTO {
    id: string;
    title: string;
    slug: string;
    summary?: string;
    content?: string;
    thumbnailUrl?: string;
    coverImageUrl?: string;
    authorName?: string;
    publishedAt?: string;
    updatedAt?: string;
    createdAt?: string;
    viewCount?: number;
    likeCount?: number;
    categories?: CategoryDTO[];
    categoryIds?: string[];
    isLikedByUser?: boolean; // Add this property
    statusCode?: string;
    displayType?: string;
    isHomepageVisible?: boolean;
    displayOrder?: number;
    metaTitle?: string;
    metaDescription?: string;
    authorId?: string;
  }
  