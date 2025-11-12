export interface HomePageDoctor {
    id: string;
    avatarUrl: string;
    fullName: string;
    userName: string;
    specializationName: string;
    yearsOfExperience: number;
    averageRating: number;
}

export interface HomeArticle{
    title: string;
    summary: string;
    thumbnailUrl: string;
    publishedAt: string;
}

export interface HomeMetadata {
    banners: Banner[];
    displayedDoctors: HomePageDoctor[];
    articles: HomeArticle[];
}
export interface Banner {
    id: string;
    bannerTitle: string;
    bannerImageUrl?: string; // Đã thay đổi thành optional
    bannerUrl?: string;      // Đã thay đổi thành optional
    displayOrder?: number;
    isActive: boolean;
    isLocked?: boolean;
    createdAt?: string;      // Đã thay đổi thành optional
    startDate?: string | null;
    endDate?: string | null;
}
