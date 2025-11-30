import { ArticleDTO } from '../types/article.types'
import { categoryService } from './categoryService'
import { apiClient } from '../lib/apiClient'


export interface ArticleFormPayload {
  title: string;
  slug: string;
  summary: string;
  content: string;
  displayType: string;
  thumbnailUrl?: string; 
  coverImageUrl?: string;
  isHomepageVisible: boolean;
  displayOrder: number;
  metaTitle: string;
  metaDescription: string;
  authorId: string;
  statusCode: string;
  publishedAt?: string;
  categoryIds: string[];
  thumbnailFile?: File; 
  coverFile?: File; 
}

const BASE = '/HealthArticle'

// Helper to fetch all categories once and cache them for mapping
export const categoryCache = {
  promise: null as Promise<{ items: any[], total?: number }> | null,
  fetchAll: function() {
    if (!this.promise) {
      // Fetch a large number to get all categories, assuming less than 9999
      this.promise = categoryService.list(1, 9999);
    }
    return this.promise;
  }
};

// Helper function to sanitize article content on the frontend
// This is a workaround for a backend issue where content might be a JSON string.
function sanitizeArticleContent(content: any): string {
  if (typeof content !== 'string') {
    return '';
  }
  const trimmedContent = content.trim();
  // Check if the content looks like a JSON object/array
  if ((trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) || (trimmedContent.startsWith('[') && trimmedContent.endsWith(']'))) {
    try {
      JSON.parse(trimmedContent);
      // If parsing succeeds, it's likely invalid JSON content. Return an error message.
      return '<p style="color: red;">[Lỗi: Nội dung bài viết không hợp lệ và không thể hiển thị.]</p>';
    } catch (e) { /* Not a valid JSON, so it might be legitimate content */ }
  }
  return content;
}

export const articleService = {
  getCachedCategories: async (): Promise<{ items: any[], total?: number }> => {
    return categoryCache.fetchAll();
  },
  incrementView: async (id: string): Promise<void> => {
    try {
      await apiClient.post(`${BASE}/${id}/view`)
    } catch (err) {
    }
  },
  toggleLike: async (id: string): Promise<{ likeCount?: number; liked?: boolean } | void> => {
    try {
      const r = await apiClient.post(`${BASE}/${id}/like`)
      return r?.data
    } catch (err) {
      throw err
    }
  },
  getAll: async (): Promise<ArticleDTO[]> => {
    const r = await apiClient.get(BASE, { params: { page: 1, pageSize: 9999 } });
    const data = r.data;
    
    const allCategories = (await categoryCache.fetchAll()).items;
    
    const rawItems = Array.isArray(data)
      ? data
      : data?.data ?? data?.item2 ?? [];
    
    return (rawItems || []).map((x: any) => ({
      id: x.id,
      title: x.title,
      slug: x.slug,
      summary: x.summary,
      content: sanitizeArticleContent(x.content),
      thumbnailUrl: x.thumbnailUrl,
      coverImageUrl: x.coverImageUrl,
      metaTitle: x.metaTitle,
      metaDescription: x.metaDescription,
      statusCode: x.statusCode,
      authorName: x.authorName,
      publishedAt: x.publishedAt,
      viewCount: x.viewCount,
      likeCount: x.likeCount,
      isHomepageVisible: x.isHomepageVisible,
      isLocked: x.isLocked ?? false,
      displayOrder: x.displayOrder,
      displayType: x.displayType,
      createdAt: x.createdAt,
      updatedAt: x.updatedAt,
      categories: x.categories?.length ? x.categories : (x.categoryIds || []).map((id: string) => allCategories.find(c => c.id === id)).filter(Boolean),
      categoryIds: x.categoryIds || (x.categories ? x.categories.map((cat: any) => cat.id) : []),
    }));
  },
  list: async (page = 1, pageSize = 10, params?: { keyword?: string; status?: string; slug?: string }): Promise<{ items: ArticleDTO[]; total?: number }> => {
    const query: any = { page, pageSize };
    let url = BASE;

    if (params?.keyword && params.keyword.trim()) {
      url = `${BASE}/search`;
      query.name = params.keyword;
    }
    if (params?.status) query.status = params.status;
    if (params?.slug) query.slug = params.slug;

    const r = await apiClient.get(url, { params: query });
    const data = r.data

    const allCategories = (await categoryCache.fetchAll()).items;

    if (Array.isArray(data)) {
      const items: ArticleDTO[] = data.map((x: any) => ({
        id: x.id,
        title: x.title,
        slug: x.slug,
        summary: x.summary,
        content: sanitizeArticleContent(x.content),
        thumbnailUrl: x.thumbnailUrl,
        coverImageUrl: x.coverImageUrl,
        metaTitle: x.metaTitle,
        metaDescription: x.metaDescription,
        statusCode: x.statusCode,
        authorName: x.authorName,
        publishedAt: x.publishedAt,
        viewCount: x.viewCount,
        likeCount: x.likeCount,
        isHomepageVisible: x.isHomepageVisible,
        isLocked: x.isLocked ?? false,
        displayOrder: x.displayOrder,
        displayType: x.displayType,
        createdAt: x.createdAt,
        updatedAt: x.updatedAt,
        categories: x.categories?.length ? x.categories : (x.categoryIds || []).map((id: string) => allCategories.find(c => c.id === id)).filter(Boolean),
        categoryIds: x.categoryIds || (x.categories ? x.categories.map((cat: any) => cat.id) : []),
      }))
      return { items, total: items.length }
    }

    const rawItems = data?.item2 ?? [];
    const total = data?.item1;

    const items: ArticleDTO[] = data?.item2?.map((x: any) => ({
      id: x.id,
      title: x.title,
      slug: x.slug,
      summary: x.summary,
      content: sanitizeArticleContent(x.content),
      thumbnailUrl: x.thumbnailUrl,
      coverImageUrl: x.coverImageUrl,
      metaTitle: x.metaTitle,
      metaDescription: x.metaDescription,
      statusCode: x.statusCode,
      authorName: x.authorName,
      publishedAt: x.publishedAt,
      viewCount: x.viewCount,
      likeCount: x.likeCount,

      isHomepageVisible: x.isHomepageVisible,
      isLocked: x.isLocked ?? false,
      displayOrder: x.displayOrder,
      displayType: x.displayType,
      createdAt: x.createdAt,
      updatedAt: x.updatedAt,
      categories: x.categories?.length ? x.categories : (x.categoryIds || []).map((id: string) => allCategories.find(c => c.id === id)).filter(Boolean),
      categoryIds: x.categoryIds || (x.categories ? x.categories.map((cat: any) => cat.id) : []),
    })) ?? []
    return { items, total }
  },
  get: async (id: string): Promise<ArticleDTO> => {
    const r = await apiClient.get(`${BASE}/${id}`)
    const x = r.data;
    
    const allCategories = (await categoryCache.fetchAll()).items;
    const article: ArticleDTO = {
      id: x.id,
      title: x.title,
      slug: x.slug,
      summary: x.summary,
      content: sanitizeArticleContent(x.content),
      thumbnailUrl: x.thumbnailUrl,
      coverImageUrl: x.coverImageUrl,
      metaTitle: x.metaTitle,
      metaDescription: x.metaDescription,
      statusCode: x.statusCode,
      authorName: x.authorName,
      viewCount: x.viewCount,
      likeCount: x.likeCount,
      isHomepageVisible: x.isHomepageVisible,
      isLocked: x.isLocked ?? false,
      displayOrder: x.displayOrder,
      displayType: x.displayType,
      publishedAt: x.publishedAt,
      createdAt: x.createdAt,
      updatedAt: x.updatedAt,
      categories: x.categories?.length ? x.categories : (x.categoryIds || []).map((id: string) => allCategories.find(c => c.id === id)).filter(Boolean),
      categoryIds: x.categoryIds || (x.categories ? x.categories.map((cat: any) => cat.id) : []),
    };
    return article;
  },
  getBySlug: async (slug: string): Promise<ArticleDTO | null> => {
    try {
      const r = await apiClient.get(`${BASE}/slug/${encodeURIComponent(slug)}`)
      const x = r.data;
      if (!x) return null;

      const allCategories = (await categoryCache.fetchAll()).items;
      const article: ArticleDTO = {
        id: x.id,
        title: x.title,
        slug: x.slug,
        summary: x.summary,
        content: sanitizeArticleContent(x.content),
        thumbnailUrl: x.thumbnailUrl,
        coverImageUrl: x.coverImageUrl,
        metaTitle: x.metaTitle,
        metaDescription: x.metaDescription,
        statusCode: x.statusCode,
        authorName: x.authorName,
        publishedAt: x.publishedAt,
        viewCount: x.viewCount,
        likeCount: x.likeCount,
        isHomepageVisible: x.isHomepageVisible,
        isLocked: x.isLocked ?? false, 
        displayOrder: x.displayOrder,
        displayType: x.displayType,
        createdAt: x.createdAt,
        updatedAt: x.updatedAt,
        categories: x.categories?.length ? x.categories : (x.categoryIds || []).map((id: string) => allCategories.find(c => c.id === id)).filter(Boolean),
        categoryIds: x.categoryIds || (x.categories ? x.categories.map((cat: any) => cat.id) : []),
      };
      return article;
    } catch (err: any) {
      if (err?.response?.status === 404) return null
      throw err
    }
  },
  getHomepageArticles: async (limit = 5): Promise<ArticleDTO[]> => {
    try {
      const response = await apiClient.get<ArticleDTO[]>(`${BASE}/homepage`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
 create: async (payload: ArticleFormPayload): Promise<ArticleDTO> => {
    const formData = new FormData();

    formData.append('model.Title', payload.title);
    formData.append('model.Slug', payload.slug);
    formData.append('model.Summary', payload.summary);
    formData.append('model.Content', payload.content);
    formData.append('model.DisplayType', payload.displayType);
    formData.append('model.IsHomepageVisible', payload.isHomepageVisible.toString());
    formData.append('model.DisplayOrder', payload.displayOrder.toString());
    formData.append('model.MetaTitle', payload.metaTitle);
    formData.append('model.MetaDescription', payload.metaDescription);
    formData.append('model.AuthorId', payload.authorId);
    formData.append('model.StatusCode', payload.statusCode);
    if (payload.publishedAt) {
        formData.append('model.PublishedAt', payload.publishedAt);
    }
    payload.categoryIds.forEach(id => formData.append('model.CategoryIds', id));

    if (payload.thumbnailUrl && !payload.thumbnailFile) {
        formData.append('model.ThumbnailUrl', payload.thumbnailUrl);
    }
    if (payload.coverImageUrl && !payload.coverFile) {
        formData.append('model.CoverImageUrl', payload.coverImageUrl);
    }

    if (payload.thumbnailFile) {
        formData.append('thumbnailFile', payload.thumbnailFile);
    }
    if (payload.coverFile) {
        formData.append('coverFile', payload.coverFile);
    }

    try {
      const r = await apiClient.postMultipart(BASE, formData);
      return r.data;
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.errors) {
        console.error("Lỗi validation từ backend khi tạo bài viết:");
        const backendErrors = error.response.data.errors;
        for (const field in backendErrors) {
          if (Object.prototype.hasOwnProperty.call(backendErrors, field)) {
            console.error(`- ${field}: ${backendErrors[field].join(', ')}`);
          }
        }
      }
      throw error;
    }
  },

  update: async (id: string, payload: ArticleFormPayload): Promise<ArticleDTO> => {
    const formData = new FormData();

    formData.append('model.Title', payload.title);
    formData.append('model.Slug', payload.slug);
    formData.append('model.Summary', payload.summary);
    formData.append('model.Content', payload.content);
    formData.append('model.DisplayType', payload.displayType);
    formData.append('model.IsHomepageVisible', payload.isHomepageVisible.toString());
    formData.append('model.DisplayOrder', payload.displayOrder.toString());
    formData.append('model.MetaTitle', payload.metaTitle);
    formData.append('model.MetaDescription', payload.metaDescription);
    formData.append('model.AuthorId', payload.authorId);
    formData.append('model.StatusCode', payload.statusCode);
    if (payload.publishedAt !== undefined) {
        formData.append('model.PublishedAt', payload.publishedAt);
    }
    payload.categoryIds.forEach(catId => formData.append('model.CategoryIds', catId));

    if (payload.thumbnailUrl && !payload.thumbnailFile) {
        formData.append('model.ThumbnailUrl', payload.thumbnailUrl);
    } else if (!payload.thumbnailFile) { 
        formData.append('model.ThumbnailUrl', '');
    }
    if (payload.coverImageUrl && !payload.coverFile) {
        formData.append('model.CoverImageUrl', payload.coverImageUrl);
    } else if (!payload.coverFile) { 
        formData.append('model.CoverImageUrl', '');
    }

    if (payload.thumbnailFile) {
        formData.append('thumbnailFile', payload.thumbnailFile);
    }
    if (payload.coverFile) {
        formData.append('coverFile', payload.coverFile);
    }

    try {
      const r = await apiClient.putMultipart(`${BASE}/${id}`, formData)
      return r.data
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.errors) {
        console.error(`Backend validation error on update (ID: ${id}):`, JSON.stringify(error.response.data.errors, null, 2));
      }
      throw error;
    }
  },
  lock: async (id: string): Promise<void> => {
    await apiClient.put(`${BASE}/${id}/lock`)
  },
  unlock: async (id: string): Promise<void> => {
    await apiClient.put(`${BASE}/${id}/unlock`)
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`)
  },
  checkUniqueness: async (field: 'title' | 'slug' | 'displayOrder', value: string, excludeId?: string): Promise<void> => {
    const params = new URLSearchParams()
    params.append('field', field)
    params.append('value', value)
    if (excludeId) {
      params.append('excludeId', excludeId)
    }
  
    await apiClient.get(`${BASE}/check-uniqueness`, { params });
  },
  getStatuses: async (): Promise<{ code: string; displayName: string }[]> => {
    const r = await apiClient.get(`${BASE}/statuses`);
    return r.data;
  },

  uploadImage: async (file: File, endpoint = '/File/Upload'): Promise<string> => {
    const form = new FormData()
    form.append('file', file)
    try {
      const r = await apiClient.postMultipart(endpoint, form)
      const data = r.data

  
  const tryGet = (obj: any) => {
    if (!obj) return undefined
    if (typeof obj === 'string') return obj
    return obj.url ?? obj.fileUrl ?? obj.path ?? obj.filePath ?? obj.location ?? obj.file ?? obj.filename ?? obj.name
  }

  const candidates = [
    tryGet(data),
    tryGet(data?.data),
    tryGet(data?.result),
    tryGet(data?.payload)
  ]

      for (const c of candidates) {
        if (typeof c === 'string' && c) {
          if (c.startsWith('/')) {
            try {
              return window.location.origin + c
            } catch {
              return c 
            }
          }
          return c
        }
      }

  if (typeof data === 'string') return data

  throw new Error('Unexpected upload response shape; please provide example response so mapping can be adjusted')
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 404 || err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
        const toDataUrl = (f: File) => new Promise<string>((res, rej) => {
          const reader = new FileReader()
          reader.onload = () => res(reader.result as string)
          reader.onerror = () => rej(new Error('Failed to read file'))
          reader.readAsDataURL(f)
        })
        try {
          const dataUrl = await toDataUrl(file)
          return dataUrl
        } catch (e) {
          throw new Error('Upload failed and fallback conversion also failed')
        }
      }

      throw err
    }
  }
}
