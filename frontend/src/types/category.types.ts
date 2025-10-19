export interface CategoryDTO {
  id: string
  name: string
  slug?: string
  description?: string
  isActive?: boolean
  parentId?: string | null
  parentName?: string | null
}

export interface CreateCategoryRequest {
  name: string
  slug?: string
  description?: string
  isActive?: boolean
  parentId?: string | null
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}
