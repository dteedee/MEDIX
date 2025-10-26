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
    createdAt?: string;
    viewCount?: number;
    likeCount?: number;
    categories?: CategoryDTO[];
    isLikedByUser?: boolean; // Add this property
  }
  