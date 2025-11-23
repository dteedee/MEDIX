import React, { useState, useEffect } from 'react';
import { ArticleDTO } from '../../types/article.types';
import { useToast } from '../../contexts/ToastContext';
import { articleService } from '../../services/articleService';
import { categoryService } from '../../services/categoryService'; // Import categoryService
import { CategoryDTO } from '../../types/category.types'; // Import CategoryDTO
import styles from '../../styles/admin/ArticleForm.module.css';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

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
    statusCode: article?.statusCode || 'Draft',
    categoryIds: article?.categoryIds || [],
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string>(article?.thumbnailUrl || '');
  const [coverPreview, setCoverPreview] = useState<string>(article?.coverImageUrl || '');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [wordCount, setWordCount] = useState(0);

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
        statusCode: article.statusCode || 'Draft',
        categoryIds: article.categoryIds || [],
      });
      setThumbnailPreview(article.thumbnailUrl || '');
      setCoverPreview(article.coverImageUrl || '');
      setWordCount(countWords(article.content || ''));
    }
  }, [article]);

  useEffect(() => {
    const fetchStatusesAndCategories = async () => {
      try {
        // Fetch statuses
        const fetchedStatuses = await articleService.getStatuses();
        setStatuses(fetchedStatuses);

        // If in create mode and no article status is set, default to 'Draft'
        if (mode === 'create' && !formData.statusCode) {
          setFormData(prev => ({ ...prev, statusCode: 'Draft' }));
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

  // Word count utility
  const countWords = (htmlString: string): number => {
    if (!htmlString) return 0;
    const text = htmlString.replace(/<[^>]*>/g, ' ');
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    if (cleanedText === '') return 0;
    return cleanedText.split(' ').length;
  };

  // Ensure authorId is always set if user is available
  useEffect(() => { if (user?.id && formData.authorId !== user.id) setFormData(prev => ({ ...prev, authorId: user.id })); }, [user?.id, formData.authorId]);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (!value.trim()) {
      let errorMessage = 'Trường này không được để trống';
      if (name === 'title') errorMessage = 'Tiêu đề bài viết không được để trống';
      if (name === 'slug') errorMessage = 'Slug không được để trống';
      if (name === 'summary') errorMessage = 'Tóm tắt không được để trống';
      setErrors(prev => ({ ...prev, [name]: errorMessage }));
    }
  };

  const validate = (returnErrors = false): boolean | Record<string, string> => {
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
    } else if (formData.summary.length > 255) {
      newErrors.summary = 'Tóm tắt không được vượt quá 500 ký tự';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Nội dung không được để trống';
    } else {
      if (countWords(formData.content) > 7000) {
        newErrors.content = 'Nội dung không được vượt quá 7000 từ';
      }
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

    if (formData.categoryIds.length === 0) {
      newErrors.categoryIds = 'Phải chọn ít nhất một danh mục';
    }

    if (mode === 'create' && !thumbnailFile) {
      newErrors.thumbnailUrl = 'Ảnh thumbnail không được để trống';
    }

    const hasErrors = Object.keys(newErrors).length > 0;

    if (returnErrors) {
      return newErrors;
    }

    setErrors(newErrors);

    if (hasErrors) {
      // Thứ tự hợp lý: title -> slug -> summary -> categoryIds -> content -> thumbnailUrl -> statusCode -> displayOrder -> metaTitle -> metaDescription -> coverImageUrl
      const fieldOrder = ['title', 'slug', 'summary', 'categoryIds', 'content', 'thumbnailUrl', 'statusCode', 'displayOrder', 'metaTitle', 'metaDescription', 'coverImageUrl'];
      const firstErrorField = fieldOrder.find(field => newErrors[field]);
      if (firstErrorField) {
        document.getElementById(`form-group-${firstErrorField}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return !hasErrors;
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
      try {
        await onSaveRequest(payload);
      } catch (error: any) {
        console.error('Caught error in ArticleForm from onSaveRequest:', error);
        const backendErrors = error?.response?.data?.errors;
        if (backendErrors) {
          const newErrors: Record<string, string> = {};
          for (const key in backendErrors) {
            const frontendKey = key.charAt(0).toLowerCase() + key.slice(1);
            newErrors[frontendKey] = backendErrors[key][0];
          }
          setErrors(prev => ({ ...prev, ...newErrors }));
        } else {
          const message = error?.response?.data?.message || error?.message || 'Không thể lưu bài viết';
          showToast(message, 'error');
        }
      }
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

      // Xử lý lỗi validation từ backend để hiển thị inline
      const backendErrors = error?.response?.data?.errors;
      if (backendErrors) {
        const newErrors: Record<string, string> = {};
        for (const key in backendErrors) {
          // Backend có thể trả về key là 'Title' hoặc 'Slug', chúng ta cần map sang 'title', 'slug'
          const frontendKey = key.charAt(0).toLowerCase() + key.slice(1);
          newErrors[frontendKey] = backendErrors[key][0];
        }
        setErrors(prev => ({ ...prev, ...newErrors }));
      }
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
    // Clear error on change
    if (errors[name] && value.trim()) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target as HTMLInputElement; // Cast to HTMLInputElement for checkbox
    setFormData(prev => {
      const newCategoryIds = checked
        ? [...prev.categoryIds, value]
        : prev.categoryIds.filter(id => id !== value);

      // Clear category error when at least one is selected
      if (newCategoryIds.length > 0 && errors.categoryIds) {
        const newErrors = { ...errors };
        delete newErrors.categoryIds;
        setErrors(newErrors);
      }

      return { ...prev, categoryIds: newCategoryIds };
    });
  };

  // Helper to check if a category is selected
  const isCategorySelected = (categoryId: string) => {
    return formData.categoryIds.includes(categoryId);
  };

  const isValidImageFile = (file: File): boolean => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    return allowedExtensions.includes(fileExtension) && allowedMimeTypes.includes(file.type);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!isValidImageFile(file)) {
        setErrors(prev => ({ ...prev, thumbnailUrl: 'Chỉ chấp nhận các tệp ảnh (.jpg, .png, .gif, .webp).' }));
        e.target.value = ''; // Reset input để người dùng có thể chọn lại
        return;
      }

      // Xóa lỗi nếu tệp hợp lệ
      if (errors.thumbnailUrl) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.thumbnailUrl;
          return newErrors;
        });
      }

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
      if (!isValidImageFile(file)) {
        setErrors(prev => ({ ...prev, coverImageUrl: 'Chỉ chấp nhận các tệp ảnh (.jpg, .png, .gif, .webp).' }));
        e.target.value = ''; // Reset input
        return;
      }

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
        <div id="form-group-title" className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-pencil"></i>
            Tiêu đề bài viết <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={mode === 'view'}
            className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
            placeholder="Nhập tiêu đề bài viết"
            maxLength={200}
          />
          {errors.title && <p className={styles.errorText}>{errors.title}</p>}
          {mode !== 'view' && <p className={styles.helpText}>{formData.title.length}/200 ký tự</p>}
        </div>

        {/* Slug */}
        <div id="form-group-slug" className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-link-45deg"></i>
            Slug <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={mode === 'view'}
            className={`${styles.input} ${errors.slug ? styles.inputError : ''}`}
            placeholder="bai-viet-example"
          />
          {errors.slug && <p className={styles.errorText}>{errors.slug}</p>}
          <p className={styles.helpText}>URL thân thiện cho bài viết</p>
        </div>

        {/* Summary */}
        <div id="form-group-summary" className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-file-text"></i>
            Tóm tắt <span className={styles.required}>*</span>
          </label>
          <textarea
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={mode === 'view'}
            className={`${styles.textarea} ${errors.summary ? styles.inputError : ''}`}
            placeholder="Nhập tóm tắt bài viết"
            rows={3}
            maxLength={255}
          />
          {errors.summary && <p className={styles.errorText}>{errors.summary}</p>}
          {mode !== 'view' && <p className={styles.helpText}>{formData.summary.length}/255 ký tự</p>}
        </div>

        {/* Categories - Required Field - Đặt sau Summary, trước Content */}
        <div id="form-group-categoryIds" className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-tags-fill" style={{ marginRight: '8px', color: '#667eea' }}></i>
            Danh mục bài viết
            <span className={styles.required}>*</span>
          </label>
          {categories.length > 0 ? (
            <>
              <div className={styles.checkboxGroup} style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px',
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: errors.categoryIds ? '2px solid #dc2626' : '1px solid #e5e7eb',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {categories.map((category: CategoryDTO) => (
                  <label 
                    key={category.id} 
                    className={styles.checkboxLabel}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px',
                      background: isCategorySelected(category.id) ? '#e0e7ff' : 'white',
                      borderRadius: '6px',
                      border: isCategorySelected(category.id) ? '2px solid #667eea' : '1px solid #e5e7eb',
                      cursor: mode === 'view' ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      fontWeight: isCategorySelected(category.id) ? '600' : '400'
                    }}
                  >
                    <input
                      type="checkbox"
                      name="categoryIds"
                      value={category.id}
                      checked={isCategorySelected(category.id)}
                      onChange={handleCategoryChange}
                      disabled={mode === 'view'}
                      className={styles.checkboxInput}
                      style={{
                        marginRight: '10px',
                        width: '18px',
                        height: '18px',
                        cursor: mode === 'view' ? 'default' : 'pointer'
                      }}
                    />
                    <span style={{ flex: 1 }}>{category.name}</span>
                    {isCategorySelected(category.id) && (
                      <i className="bi bi-check-circle-fill" style={{ color: '#667eea', marginLeft: '8px' }}></i>
                    )}
                  </label>
                ))}
              </div>
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <small style={{ color: '#6b7280', fontSize: '13px' }}>
                  <i className="bi bi-info-circle" style={{ marginRight: '4px' }}></i>
                  Đã chọn: <strong style={{ color: '#667eea' }}>{formData.categoryIds.length}</strong> danh mục
                </small>
              </div>
              {errors.categoryIds && (
                <p className={styles.errorText} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="bi bi-exclamation-circle-fill"></i>
                  {errors.categoryIds}
                </p>
              )}
            </>
          ) : (
            <div style={{
              padding: '16px',
              background: '#fef3c7',
              borderRadius: '8px',
              border: '1px solid #fde047',
              color: '#92400e'
            }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '8px' }}></i>
              Chưa có danh mục nào. Vui lòng tạo danh mục trước khi tạo bài viết.
            </div>
          )}
        </div>

        {/* Content */}
        <div id="form-group-content" className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-file-earmark-richtext"></i>
            Nội dung <span className={styles.required}>*</span>
          </label>
          <div className={`${styles.editorWrapper} ${errors.content ? styles.inputError : ''}`}>
            <CKEditor
              editor={ClassicEditor}
              data={formData.content}
              onChange={(event, editor) => {
                const data = editor.getData();
                setFormData(prev => ({ ...prev, content: data }));
                const currentWordCount = countWords(data);
                setWordCount(currentWordCount);

                if (currentWordCount > 7000) {
                  setErrors(prev => ({ ...prev, content: 'Nội dung không được vượt quá 7000 từ' }));
                } else if (errors.content && data.trim()) {
                  const newErrors = { ...errors };
                  delete newErrors.content;
                  setErrors(newErrors);
                }
              }}
              onBlur={(event, editor) => {
                const data = editor.getData();
                if (!data.trim()) {
                  setErrors(prev => ({ ...prev, content: 'Nội dung không được để trống' }));
                }
              }}
            disabled={mode === 'view'}
              config={{ placeholder: "Nhập nội dung bài viết..." }}
            />
          </div>
          {errors.content && <p className={styles.errorText}>{errors.content}</p>}
          {mode !== 'view' && (
            <p className={`${styles.helpText} ${wordCount > 7000 ? styles.errorText : ''}`}>{wordCount}/7000 từ</p>
          )}
        </div>

        {/* Images */}
        <div className={styles.gridTwoCols}>
          {/* Thumbnail */}
          <div id="form-group-thumbnailUrl" className={styles.formGroup}>
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
          <div id="form-group-coverImageUrl" className={styles.formGroup}>
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
            {errors.coverImageUrl && <p className={styles.errorText}>{errors.coverImageUrl}</p>}
          </div>
        </div>

        {/* Status - Đặt sau Images, trước Display Settings */}
        <div id="form-group-statusCode" className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-check-circle-fill" style={{ marginRight: '8px', color: '#667eea' }}></i>
            Trạng thái xuất bản
            <span className={styles.required}>*</span>
          </label>
          <select
            name="statusCode"
            value={formData.statusCode}
            onChange={handleChange}
            disabled={mode === 'view'}
            className={`${styles.select} ${errors.statusCode ? styles.inputError : ''}`}
          >
            {statuses.map(status => (
              <option key={status.code} value={status.code}>{status.displayName}</option>
            ))}
          </select>
          {errors.statusCode && <p className={styles.errorText}>{errors.statusCode}</p>}
          <p className={styles.helpText}>
            <i className="bi bi-lightbulb" style={{ marginRight: '4px' }}></i>
            Chọn trạng thái cho bài viết. "Bản nháp" để lưu nháp, "Xuất bản" để hiển thị công khai.
          </p>
        </div>

        {/* Display Settings - Nhóm các cài đặt hiển thị lại với nhau */}
        <div style={{ 
          padding: '20px', 
          background: '#f9fafb', 
          borderRadius: '12px', 
          border: '1px solid #e5e7eb',
          marginBottom: '20px'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#374151', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="bi bi-gear-fill" style={{ color: '#667eea' }}></i>
            Cài đặt hiển thị
          </h3>
          
          <div className={styles.gridTwoCols}>
            <div id="form-group-displayType" className={styles.formGroup}>
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
              <p className={styles.helpText}>
                <i className="bi bi-lightbulb" style={{ marginRight: '4px' }}></i>
                Chọn loại hiển thị cho bài viết
              </p>
            </div>

            <div id="form-group-displayOrder" className={styles.formGroup}>
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
              <p className={styles.helpText}>
                <i className="bi bi-lightbulb" style={{ marginRight: '4px' }}></i>
                Số càng nhỏ, bài viết hiển thị trước
              </p>
            </div>
          </div>

          {/* Homepage Visibility Toggle */}
          <div id="form-group-isHomepageVisible" className={styles.formGroup} style={{ marginTop: '16px' }}>
            <label className={styles.label}>
              <i className="bi bi-house-door-fill"></i>
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
                <i className="bi bi-lightbulb" style={{ marginRight: '4px' }}></i>
                {formData.isHomepageVisible
                  ? 'Bài viết sẽ hiển thị trên trang chủ'
                  : 'Bài viết sẽ không hiển thị trên trang chủ'}
              </p>
            </div>
          </div>
        </div>

        {/* SEO Settings - Đặt cuối cùng */}
        <div style={{ 
          padding: '20px', 
          background: '#f0f9ff', 
          borderRadius: '12px', 
          border: '1px solid #bae6fd',
          marginBottom: '20px'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#374151', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="bi bi-search" style={{ color: '#667eea' }}></i>
            Tối ưu SEO (Tùy chọn)
          </h3>
          
          <div id="form-group-metaTitle" className={styles.formGroup}>
            <label className={styles.label}>
              <i className="bi bi-tag-fill" style={{ marginRight: '8px', color: '#667eea' }}></i>
              Meta Title
            </label>
            <input
              type="text"
              name="metaTitle"
              value={formData.metaTitle}
              onChange={handleChange}
              disabled={mode === 'view'}
              className={`${styles.input} ${errors.metaTitle ? styles.inputError : ''}`}
              placeholder="Tiêu đề SEO (tối đa 60 ký tự)"
              maxLength={60}
            />
            {errors.metaTitle && <p className={styles.errorText}>{errors.metaTitle}</p>}
            <p className={styles.helpText}>
              <i className="bi bi-lightbulb" style={{ marginRight: '4px' }}></i>
              {formData.metaTitle.length}/60 ký tự. Để trống sẽ dùng tiêu đề bài viết.
            </p>
          </div>

          <div id="form-group-metaDescription" className={styles.formGroup}>
            <label className={styles.label}>
              <i className="bi bi-file-text-fill" style={{ marginRight: '8px', color: '#667eea' }}></i>
              Meta Description
            </label>
            <textarea
              name="metaDescription"
              value={formData.metaDescription}
              onChange={handleChange}
              disabled={mode === 'view'}
              className={`${styles.textarea} ${errors.metaDescription ? styles.inputError : ''}`}
              placeholder="Mô tả SEO (tối đa 160 ký tự)"
              rows={3}
              maxLength={160}
            />
            {errors.metaDescription && <p className={styles.errorText}>{errors.metaDescription}</p>}
            <p className={styles.helpText}>
              <i className="bi bi-lightbulb" style={{ marginRight: '4px' }}></i>
              {formData.metaDescription.length}/160 ký tự. Mô tả ngắn gọn về bài viết cho công cụ tìm kiếm.
            </p>
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
                  <span className={styles.spinner}></span>
                  Đang xử lý...
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
