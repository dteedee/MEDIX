import React, { useState, useEffect } from 'react';
import { ArticleDTO } from '../../types/article.types';
import { useToast } from '../../contexts/ToastContext';
import { articleService } from '../../services/articleService';
import { categoryService } from '../../services/categoryService'; // Import categoryService
import { CategoryDTO } from '../../types/category.types'; // Import CategoryDTO
import styles from '../../styles/admin/ArticleForm.module.css';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth

interface Props {
  article?: ArticleDTO | null;
  mode: 'view' | 'edit' | 'create';
  onSaved: () => void;
  onCancel: () => void;
  onSaveRequest?: (formData: any) => void;
}

export default function ArticleForm({ article, mode, onSaved, onCancel, onSaveRequest }: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth(); // Get current user from AuthContext
  const [statuses, setStatuses] = useState<Array<{ code: string; displayName: string }>>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    title: article?.title || '',
    slug: article?.slug || '',
    summary: article?.summary || '',
    content: article?.content || '',
    displayType: article?.displayType || 'STANDARD',
    isHomepageVisible: article?.isHomepageVisible ?? false,
    displayOrder: article?.displayOrder || 0,
    metaTitle: article?.metaTitle || '',
    metaDescription: article?.metaDescription || '',
    authorId: user?.id || '', // Use logged-in user ID
    statusCode: article?.statusCode || 'DRAFT',
    categoryIds: article?.categoryIds || [],
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string>(article?.thumbnailUrl || '');
  const [coverPreview, setCoverPreview] = useState<string>(article?.coverImageUrl || '');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || '',
        slug: article.slug || '',
        summary: article.summary || '',
        content: article.content || '',
        displayType: article.displayType || 'STANDARD',
        isHomepageVisible: article.isHomepageVisible ?? false,
        displayOrder: article.displayOrder || 0,
        metaTitle: article.metaTitle || '',
        metaDescription: article.metaDescription || '',
        authorId: user?.id || '', // Use logged-in user ID
        statusCode: article.statusCode || 'DRAFT',
        categoryIds: article.categoryIds || [],
      });
      setThumbnailPreview(article.thumbnailUrl || '');
      setCoverPreview(article.coverImageUrl || '');
    }
  }, [article]);

  useEffect(() => {
    const fetchStatusesAndCategories = async () => {
      try {
        // Fetch statuses
        const fetchedStatuses = await articleService.getStatuses();
        setStatuses(fetchedStatuses);

        // If in create mode and no article status is set, default to 'DRAFT'
        if (mode === 'create' && !formData.statusCode) {
          setFormData(prev => ({ ...prev, statusCode: 'DRAFT' }));
        }

        // Fetch categories
        const fetchedCategories = await articleService.getCachedCategories(); // Use cached categories
        setCategories(fetchedCategories.items.filter((cat: CategoryDTO) => cat.isActive)); // Filter for active categories
      } catch (error) {
        console.error('Error fetching statuses or categories:', error);
        showToast('Không thể tải dữ liệu trạng thái hoặc danh mục.', 'error');
      }
    };

    fetchStatusesAndCategories();
  }, [mode, formData.statusCode]); // Re-run if mode or initial status changes

  // Ensure authorId is always set if user is available
  useEffect(() => { if (user?.id && formData.authorId !== user.id) setFormData(prev => ({ ...prev, authorId: user.id })); }, [user?.id, formData.authorId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề bài viết không được để trống';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Tiêu đề không được vượt quá 200 ký tự';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug không được để trống';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang';
    }

    if (!formData.summary.trim()) {
      newErrors.summary = 'Tóm tắt không được để trống';
    } else if (formData.summary.length > 500) {
      newErrors.summary = 'Tóm tắt không được vượt quá 500 ký tự';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Nội dung không được để trống';
    }

    if (formData.displayOrder < 0) {
      newErrors.displayOrder = 'Thứ tự hiển thị phải lớn hơn hoặc bằng 0';
    }

    if (formData.metaTitle && formData.metaTitle.length > 60) {
      newErrors.metaTitle = 'Meta title không được vượt quá 60 ký tự';
    }

    if (formData.metaDescription && formData.metaDescription.length > 160) {
      newErrors.metaDescription = 'Meta description không được vượt quá 160 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      showToast('Vui lòng kiểm tra lại các trường dữ liệu', 'error');
      return;
    }

    // For edit mode, use existing URLs if no new files uploaded
    let finalThumbnailUrl = formData.isHomepageVisible ? (thumbnailPreview || '') : '';
    let finalCoverUrl = coverPreview || '';

    const payload = {
      title: formData.title,
      slug: formData.slug,
      summary: formData.summary,
      content: formData.content,
      displayType: formData.displayType,
      thumbnailUrl: finalThumbnailUrl,
      coverImageUrl: finalCoverUrl,
      isHomepageVisible: formData.isHomepageVisible,
      displayOrder: formData.displayOrder,
      metaTitle: formData.metaTitle,
      metaDescription: formData.metaDescription,
      authorId: formData.authorId,
      statusCode: formData.statusCode,
      categoryIds: formData.categoryIds,
      thumbnailFile: thumbnailFile || undefined,
      coverFile: coverFile || undefined,
    };

    console.log('Form submission - Mode:', mode);
    console.log('Form submission - FormData:', formData);
    console.log('Form submission - Thumbnail preview:', thumbnailPreview);
    console.log('Form submission - Cover preview:', coverPreview);
    console.log('Form submission - Thumbnail file:', thumbnailFile);
    console.log('Form submission - Cover file:', coverFile);
    console.log('Form submission - Payload:', payload);

    if (onSaveRequest) {
      onSaveRequest(payload);
    } else {
      // Direct save (no confirmation)
      await saveArticle(payload);
    }
  };

  const saveArticle = async (payload: any) => {
    setLoading(true);
    try {
      if (mode === 'create') {
        console.log('Creating new article with payload:', payload);
        await articleService.create(payload);
        showToast('Tạo bài viết thành công!', 'success');
      } else if (article) {
        console.log('Updating article with ID:', article.id);
        console.log('Update payload:', payload);
        await articleService.update(article.id, payload);
        console.log('Update successful');
        showToast('Cập nhật bài viết thành công!', 'success');
      }
      onSaved();
    } catch (error: any) {
      console.error('Error saving article:', error);
      console.error('Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message
      });
      const message = error?.response?.data?.message || error?.message || 'Không thể lưu bài viết';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target as HTMLInputElement; // Cast to HTMLInputElement for checkbox
    setFormData(prev => {
      const newCategoryIds = checked
        ? [...prev.categoryIds, value]
        : prev.categoryIds.filter(id => id !== value);
      return { ...prev, categoryIds: newCategoryIds };
    });
  };

  // Helper to check if a category is selected
  const isCategorySelected = (categoryId: string) => {
    return formData.categoryIds.includes(categoryId);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setThumbnailPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCoverPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDateForDisplay = (dateString?: string | null) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formContent}>
        {/* Article Title */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-pencil"></i>
            Tiêu đề bài viết <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            disabled={mode === 'view'}
            className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
            placeholder="Nhập tiêu đề bài viết"
            maxLength={200}
          />
          {errors.title && <p className={styles.errorText}>{errors.title}</p>}
          {mode !== 'view' && <p className={styles.helpText}>{formData.title.length}/200 ký tự</p>}
        </div>

        {/* Slug */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-link-45deg"></i>
            Slug <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            disabled={mode === 'view'}
            className={`${styles.input} ${errors.slug ? styles.inputError : ''}`}
            placeholder="bai-viet-example"
          />
          {errors.slug && <p className={styles.errorText}>{errors.slug}</p>}
          <p className={styles.helpText}>URL thân thiện cho bài viết</p>
        </div>

        {/* Summary */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-file-text"></i>
            Tóm tắt <span className={styles.required}>*</span>
          </label>
          <textarea
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            disabled={mode === 'view'}
            className={`${styles.textarea} ${errors.summary ? styles.inputError : ''}`}
            placeholder="Nhập tóm tắt bài viết"
            rows={3}
            maxLength={500}
          />
          {errors.summary && <p className={styles.errorText}>{errors.summary}</p>}
          {mode !== 'view' && <p className={styles.helpText}>{formData.summary.length}/500 ký tự</p>}
        </div>

        {/* Content */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-file-earmark-richtext"></i>
            Nội dung <span className={styles.required}>*</span>
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            disabled={mode === 'view'}
            className={`${styles.textarea} ${styles.large} ${errors.content ? styles.inputError : ''}`}
            placeholder="Nhập nội dung bài viết"
            rows={12}
          />
          {errors.content && <p className={styles.errorText}>{errors.content}</p>}
        </div>

        {/* Images */}
        <div className={styles.gridTwoCols}>
          {/* Thumbnail */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="bi bi-image"></i>
              Ảnh thumbnail {mode === 'create' && !thumbnailPreview ? <span className={styles.required}>*</span> : ''}
            </label>
            {mode === 'view' ? (
              <div className={styles.imageViewContainer}>
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Preview" className={styles.imagePreview} />
                ) : (
                  <div className={styles.noImage}>Không có ảnh</div>
                )}
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className={styles.fileInput}
                  id="thumbnailImage"
                />
                <label htmlFor="thumbnailImage" className={styles.fileInputLabel}>
                  <i className="bi bi-cloud-upload"></i>
                  <span>{thumbnailFile ? thumbnailFile.name : thumbnailPreview ? 'Chọn ảnh khác' : 'Chọn ảnh thumbnail'}</span>
                </label>
                {thumbnailPreview && (
                  <div className={styles.imagePreviewContainer}>
                    <img src={thumbnailPreview} alt="Preview" className={styles.imagePreview} />
                    {mode === 'edit' && (
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnailPreview('');
                          setThumbnailFile(null);
                        }}
                        className={styles.removeImageBtn}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
            {errors.thumbnailUrl && <p className={styles.errorText}>{errors.thumbnailUrl}</p>}
          </div>

          {/* Cover Image */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="bi bi-image"></i>
              Ảnh bìa
            </label>
            {mode === 'view' ? (
              <div className={styles.imageViewContainer}>
                {coverPreview ? (
                  <img src={coverPreview} alt="Preview" className={styles.imagePreview} />
                ) : (
                  <div className={styles.noImage}>Không có ảnh</div>
                )}
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className={styles.fileInput}
                  id="coverImage"
                />
                <label htmlFor="coverImage" className={styles.fileInputLabel}>
                  <i className="bi bi-cloud-upload"></i>
                  <span>{coverFile ? coverFile.name : coverPreview ? 'Chọn ảnh khác' : 'Chọn ảnh bìa'}</span>
                </label>
                {coverPreview && (
                  <div className={styles.imagePreviewContainer}>
                    <img src={coverPreview} alt="Preview" className={styles.imagePreview} />
                    {mode === 'edit' && (
                      <button
                        type="button"
                        onClick={() => {
                          setCoverPreview('');
                          setCoverFile(null);
                        }}
                        className={styles.removeImageBtn}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Display Settings */}
        <div className={styles.gridTwoCols}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="bi bi-collection"></i>
              Loại hiển thị
            </label>
            <select
              name="displayType"
              value={formData.displayType}
              onChange={handleChange}
              disabled={mode === 'view'}
              className={styles.select}
            >
              <option value="STANDARD">Tiêu chuẩn</option>
              <option value="FEATURED">Nổi bật</option>
            </select>
            <p className={styles.helpText}>Chọn loại hiển thị cho bài viết</p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="bi bi-sort-numeric-down"></i>
              Thứ tự hiển thị
            </label>
            <input
              type="number"
              name="displayOrder"
              value={formData.displayOrder}
              onChange={handleChange}
              disabled={mode === 'view'}
              className={`${styles.input} ${errors.displayOrder ? styles.inputError : ''}`}
              placeholder="0"
              min="0"
            />
            {errors.displayOrder && <p className={styles.errorText}>{errors.displayOrder}</p>}
            <p className={styles.helpText}>Số càng nhỏ, bài viết hiển thị trước</p>
          </div>
        </div>

        {/* Homepage Visibility Toggle */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-house-door"></i>
            Hiển thị trên trang chủ
          </label>
          <div className={styles.toggleContainer}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={formData.isHomepageVisible}
                onChange={e => setFormData(prev => ({ ...prev, isHomepageVisible: e.target.checked }))}
                disabled={mode === 'view'}
                className={styles.toggleInput}
              />
              <span className={`${styles.toggleSwitch} ${formData.isHomepageVisible ? styles.active : ''}`}>
                <span className={styles.toggleSlider}></span>
              </span>
              <span className={styles.toggleText}>
                {formData.isHomepageVisible ? 'Hiển thị' : 'Ẩn'}
              </span>
            </label>
            <p className={styles.helpText}>
              {formData.isHomepageVisible
                ? 'Bài viết sẽ hiển thị trên trang chủ'
                : 'Bài viết sẽ không hiển thị trên trang chủ'}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-info-circle"></i>
            Trạng thái xuất bản
          </label>
          <select
            name="statusCode"
            value={formData.statusCode}
            onChange={handleChange}
            disabled={mode === 'view'}
            className={styles.select}
          >
            {statuses.map(status => (
              <option key={status.code} value={status.code}>{status.displayName}</option>
            ))}
          </select>
          {errors.statusCode && <p className={styles.errorText}>{errors.statusCode}</p>}
          <p className={styles.helpText}>Chọn trạng thái cho bài viết</p>
          {mode === 'create' && !formData.statusCode && <p className={styles.errorText}>Trạng thái mặc định là Bản nháp</p>}
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="bi bi-tags"></i>
              Danh mục
            </label>
            <div className={styles.checkboxGroup}>
              {categories.map((category: CategoryDTO) => (
                <label key={category.id} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="categoryIds"
                    value={category.id}
                    checked={isCategorySelected(category.id)}
                    onChange={handleCategoryChange}
                    disabled={mode === 'view'}
                    className={styles.checkboxInput}
                  />
                  {category.name}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Meta Tags */}
        <div className={styles.gridTwoCols}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="bi bi-tag"></i>
              Meta Title
            </label>
            <input
              type="text"
              name="metaTitle"
              value={formData.metaTitle}
              onChange={handleChange}
              disabled={mode === 'view'}
              className={`${styles.input} ${errors.metaTitle ? styles.inputError : ''}`}
              placeholder="Nhập meta title"
              maxLength={60}
            />
            {errors.metaTitle && <p className={styles.errorText}>{errors.metaTitle}</p>}
            {mode !== 'view' && <p className={styles.helpText}>{formData.metaTitle.length}/60 ký tự</p>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="bi bi-card-text"></i>
              Meta Description
            </label>
            <textarea
              name="metaDescription"
              value={formData.metaDescription}
              onChange={handleChange}
              disabled={mode === 'view'}
              className={`${styles.textarea} ${errors.metaDescription ? styles.inputError : ''}`}
              placeholder="Nhập meta description"
              rows={2}
              maxLength={160}
            />
            {errors.metaDescription && <p className={styles.errorText}>{errors.metaDescription}</p>}
            {mode !== 'view' && <p className={styles.helpText}>{formData.metaDescription.length}/160 ký tự</p>}
          </div>
        </div>

        {/* View Mode Specific Fields */}
        {mode === 'view' && article && (
          <div className={styles.infoSection}>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Ngày tạo:</div>
              <div className={styles.infoValue}>{formatDateForDisplay(article.createdAt)}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Ngày cập nhật:</div>
              <div className={styles.infoValue}>{formatDateForDisplay(article.updatedAt)}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Lượt xem:</div>
              <div className={styles.infoValue}>{article.viewCount || 0}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Lượt thích:</div>
              <div className={styles.infoValue}>{article.likeCount || 0}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Trạng thái khóa:</div>
              <div className={styles.infoValue}>
                <span className={`${styles.infoBadge} ${article.isLocked ? styles.locked : styles.unlocked}`}>
                  {article.isLocked ? 'Đã khóa' : 'Chưa khóa'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {mode !== 'view' && (
        <div className={styles.formActions}>
          <button type="button" onClick={onCancel} className={styles.cancelButton}>
            <i className="bi bi-x-circle"></i>
            Hủy
          </button>
          <button type="submit" className={styles.saveButton} disabled={loading}>
            {loading ? (
              <>
                <i className="bi bi-hourglass-split"></i>
                Đang lưu...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle"></i>
                {mode === 'create' ? 'Tạo Bài viết' : 'Lưu thay đổi'}
              </>
            )}
          </button>
        </div>
      )}
    </form>
  );
}
