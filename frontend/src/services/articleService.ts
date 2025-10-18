import axios from 'axios'
import { ArticleDTO, CreateArticleRequest, UpdateArticleRequest } from '../types/article.types'
import { categoryService } from './categoryService'

const BASE = '/api/HealthArticle'

function authHeader() {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : undefined
  } catch {
    return undefined
  }
}

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

    const r = await axios.get(url, { params: query, headers: authHeader() });
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
    const r = await axios.get(`${BASE}/${id}`, { headers: authHeader() })
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
      publishedAt: x.publishedAt,
      createdAt: x.createdAt,
      updatedAt: x.updatedAt,
      categories: x.categories?.length ? x.categories : (x.categoryIds || []).map((id: string) => allCategories.find(c => c.id === id)).filter(Boolean),
      categoryIds: x.categoryIds
    };
    return article;
  },
  getBySlug: async (slug: string): Promise<ArticleDTO | null> => {
    try {
      const r = await axios.get(`${BASE}/slug/${encodeURIComponent(slug)}`, { headers: authHeader() })
      return r.data
    } catch (err: any) {
      if (err?.response?.status === 404) return null
      throw err
    }
  },
  create: async (payload: CreateArticleRequest): Promise<ArticleDTO> => {
    const r = await axios.post(BASE, { ...payload }, { headers: authHeader() })
    return r.data
  },
  update: async (id: string, payload: UpdateArticleRequest): Promise<ArticleDTO> => {
    const r = await axios.put(`${BASE}/${id}`, { ...payload }, { headers: authHeader() })
    return r.data
  },
  remove: async (id: string): Promise<void> => {
    await axios.delete(`${BASE}/${id}`, { headers: authHeader() })
  }
  ,
  /**
   * Upload an image file.
   * @param file File to upload
   * @param endpoint optional upload endpoint (defaults to /api/File/Upload)
   * Returns the uploaded file URL as string. The function attempts to normalize common response shapes.
   */
  uploadImage: async (file: File, endpoint = '/api/File/Upload'): Promise<string> => {
    const form = new FormData()
    form.append('file', file)
    try {
      const r = await axios.post(endpoint, form, { headers: { ...(authHeader() ?? {}), 'Content-Type': 'multipart/form-data' } })
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
