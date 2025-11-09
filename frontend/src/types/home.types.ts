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
    bannerUrls: string[];
    displayedDoctors: HomePageDoctor[];
    articles: HomeArticle[];
}