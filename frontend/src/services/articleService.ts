import { ArticleDTO } from '../types/article.types'
import { categoryService } from './categoryService'
import { apiClient } from '../lib/apiClient'

// Define a new type for the form payload that can include File objects
// This is used internally by the service to construct FormData
export interface ArticleFormPayload {
  title: string;
  slug: string;
  summary: string;
  content: string;
  displayType: string;
  thumbnailUrl?: string; // Existing URL if no new file is uploaded
  coverImageUrl?: string; // Existing URL if no new file is uploaded
  isHomepageVisible: boolean;
  displayOrder: number;
  metaTitle: string;
  metaDescription: string;
  authorId: string;
  statusCode: string;
  publishedAt?: string;
  categoryIds: string[];
  thumbnailFile?: File; // New file to upload
  coverFile?: File; // New file to upload
}

const BASE = '/HealthArticle'

// Helper to fetch all categories once and cache them for mapping
const categoryCache = {
  promise: null as Promise<{ items: any[], total?: number }> | null,
  fetchAll: function() {
    if (!this.promise) {
      // Fetch a large number to get all categories, assuming less than 1000
      this.promise = categoryService.list(1, 1000);
    }
    return this.promise;
  }
};


export const articleService = {
  list: async (page = 1, pageSize = 10, params?: { keyword?: string; status?: string; slug?: string }): Promise<{ items: ArticleDTO[]; total?: number }> => {
    const query: any = { page, pageSize };
    let url = BASE;

    if (params?.keyword && params.keyword.trim()) {
      url = `${BASE}/search`;
      // API for Article search uses 'name' parameter as requested
      query.name = params.keyword;
    }
    if (params?.status) query.status = params.status;
    if (params?.slug) query.slug = params.slug;

    const r = await apiClient.get(url, { params: query });
    const data = r.data

    // Fetch all categories to map names from IDs
    const allCategories = (await categoryCache.fetchAll()).items;

    // If backend returns an array directly
    if (Array.isArray(data)) {
      const items: ArticleDTO[] = data.map((x: any) => ({
        id: x.id,
        title: x.title,
        slug: x.slug,
        summary: x.summary,
        content: x.content,
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
        displayOrder: x.displayOrder,
        displayType: x.displayType,
        createdAt: x.createdAt,
        updatedAt: x.updatedAt,
        // If categories are not fully populated, map them from the cache
        categories: x.categories?.length ? x.categories : (x.categoryIds || []).map((id: string) => allCategories.find(c => c.id === id)).filter(Boolean),
        categoryIds: x.categoryIds
      }))
      return { items, total: items.length }
    }

    const rawItems = data?.item2 ?? [];
    const total = data?.item1;

    // Map raw items to DTOs
    const items: ArticleDTO[] = data?.item2?.map((x: any) => ({
      id: x.id,
      title: x.title,
      slug: x.slug,
      summary: x.summary,
      content: x.content,
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
      displayOrder: x.displayOrder,
      displayType: x.displayType,
      createdAt: x.createdAt,
      updatedAt: x.updatedAt,
      // If categories are not fully populated, map them from the cache
      categories: x.categories?.length ? x.categories : (x.categoryIds || []).map((id: string) => allCategories.find(c => c.id === id)).filter(Boolean),
      categoryIds: x.categoryIds
    })) ?? []
    return { items, total }
  },
  get: async (id: string): Promise<ArticleDTO> => {
    const r = await apiClient.get(`${BASE}/${id}`)
    const x = r.data;
    
    // Also enrich with categories on single-get
    const allCategories = (await categoryCache.fetchAll()).items;
    const article: ArticleDTO = {
      id: x.id,
      title: x.title,
      slug: x.slug,
      summary: x.summary,
      content: x.content,
      thumbnailUrl: x.thumbnailUrl,
      coverImageUrl: x.coverImageUrl,
      metaTitle: x.metaTitle,
      metaDescription: x.metaDescription,
      statusCode: x.statusCode,
      authorName: x.authorName,
      viewCount: x.viewCount,
      likeCount: x.likeCount,
      isHomepageVisible: x.isHomepageVisible,
      displayOrder: x.displayOrder,
      displayType: x.displayType,
      publishedAt: x.publishedAt,
      createdAt: x.createdAt,
      updatedAt: x.updatedAt,
      categories: x.categories?.length ? x.categories : (x.categoryIds || []).map((id: string) => allCategories.find(c => c.id === id)).filter(Boolean),
      categoryIds: x.categoryIds,
    };
    return article;
  },
  getBySlug: async (slug: string): Promise<ArticleDTO | null> => {
    try {
      const r = await apiClient.get(`${BASE}/slug/${encodeURIComponent(slug)}`)
      return r.data
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
      console.error('Failed to fetch homepage articles:', error);
      throw error;
    }
  },
 create: async (payload: ArticleFormPayload): Promise<ArticleDTO> => {
    const formData = new FormData();

    // Append text fields to FormData under 'model' prefix as expected by [FromForm]
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

    // Append existing image URLs if no new file is provided
    // This is crucial if the backend expects the URL to be part of the DTO
    if (payload.thumbnailUrl && !payload.thumbnailFile) {
        formData.append('model.ThumbnailUrl', payload.thumbnailUrl);
    }
    if (payload.coverImageUrl && !payload.coverFile) {
        formData.append('model.CoverImageUrl', payload.coverImageUrl);
    }

    // Append file objects if present
    if (payload.thumbnailFile) {
        formData.append('thumbnailFile', payload.thumbnailFile);
    }
    if (payload.coverFile) {
        formData.append('coverFile', payload.coverFile);
    }

    try {
      // apiClient automatically adds auth header and sets Content-Type for FormData
      const r = await apiClient.postMultipart(BASE, formData);
      return r.data;
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.errors) {
        console.error("Lỗi validation từ backend khi tạo bài viết:");
        const backendErrors = error.response.data.errors;
        // Lặp qua và log tất cả các lỗi để dễ dàng debug
        for (const field in backendErrors) {
          if (Object.prototype.hasOwnProperty.call(backendErrors, field)) {
            console.error(`- ${field}: ${backendErrors[field].join(', ')}`);
          }
        }
      }
      // Ném lại lỗi để component có thể xử lý và hiển thị trên UI
      throw error;
    }
  },

  update: async (id: string, payload: ArticleFormPayload): Promise<ArticleDTO> => {
    const formData = new FormData();

    // Append text fields to FormData under 'model' prefix as expected by [FromForm]
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
    payload.categoryIds.forEach(catId => formData.append('model.CategoryIds', catId));

    // Append existing image URLs if no new file is provided
    if (payload.thumbnailUrl && !payload.thumbnailFile) {
        formData.append('model.ThumbnailUrl', payload.thumbnailUrl);
    } else if (!payload.thumbnailFile) { // If no new file and no existing URL, explicitly send empty string
        formData.append('model.ThumbnailUrl', '');
    }
    if (payload.coverImageUrl && !payload.coverFile) {
        formData.append('model.CoverImageUrl', payload.coverImageUrl);
    } else if (!payload.coverFile) { // If no new file and no existing URL, explicitly send empty string
        formData.append('model.CoverImageUrl', '');
    }

    // Append file objects if present
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
      // Re-throw the error so the calling component can handle it for UI feedback
      throw error;
    }
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
    // This endpoint should be implemented in the backend.
    // It is expected to return a 2xx status code if the value is unique,
    // and a 4xx status code (e.g., 409 Conflict) if it's not.
    // The `axios` call will automatically throw an error for 4xx/5xx responses,
    // which is caught in the ArticleForm component.
    await apiClient.get(`${BASE}/check-uniqueness`, { params });
  },
  getStatuses: async (): Promise<{ code: string; displayName: string }[]> => {
    const r = await apiClient.get(`${BASE}/statuses`);
    return r.data;
  },
  /**
   * Upload an image file.
   * @param file File to upload
   * @param endpoint optional upload endpoint (defaults to /api/File/Upload)
   * Returns the uploaded file URL as string. The function attempts to normalize common response shapes.
   */
  uploadImage: async (file: File, endpoint = '/File/Upload'): Promise<string> => {
    const form = new FormData()
    form.append('file', file)
    try {
      const r = await apiClient.postMultipart(endpoint, form)
      const data = r.data

  // Try common fields for returned URL/path. Backend commonly returns { url: '...' }.
  // Normalize relative paths by prepending the current origin so the caller always gets an absolute URL.
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
          // If server returned a relative path like '/uploads/..', make it absolute.
          if (c.startsWith('/')) {
            try {
              return window.location.origin + c
            } catch {
              return c // fallback if window is not available for some reason
            }
          }
          return c
        }
      }

  // last resort: return raw data if it's a string
  if (typeof data === 'string') return data

  throw new Error('Unexpected upload response shape; please provide example response so mapping can be adjusted')
    } catch (err: any) {
      // If server returns 404 or endpoint not found, fallback to base64 data URL so UI still displays the image.
      const status = err?.response?.status
      if (status === 404 || err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
        // convert file to data URL
        const toDataUrl = (f: File) => new Promise<string>((res, rej) => {
          const reader = new FileReader()
          reader.onload = () => res(reader.result as string)
          reader.onerror = () => rej(new Error('Failed to read file'))
          reader.readAsDataURL(f)
        })
        try {
          const dataUrl = await toDataUrl(file)
          console.warn('Upload endpoint not found; using data URL fallback for preview')
          return dataUrl
        } catch (e) {
          throw new Error('Upload failed and fallback conversion also failed')
        }
      }

      // rethrow other errors for visibility
      throw err
    }
  }
}
