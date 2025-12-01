import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext'; 
import { categoryService } from '../../services/categoryService';
import type { CategoryDTO, CreateCategoryRequest, UpdateCategoryRequest } from '../../types/category.types';
import styles from '../../styles/admin/ArticleForm.module.css'; 

interface Props {
  category?: CategoryDTO | null;
  mode: 'edit' | 'create' | 'view';
  onSaved: () => void;
  onCancel: () => void;
}

export default function CategoryForm({ category, mode, onSaved, onCancel }: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Tên danh mục không được để trống.';
    if (!formData.slug.trim()) newErrors.slug = 'Slug không được để trống.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      showToast('Vui lòng điền đầy đủ các trường bắt buộc.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        parentId: null, // Không sử dụng danh mục cha
      };

      if (mode === 'create') {
        await categoryService.create(payload as CreateCategoryRequest);
        showToast('Tạo danh mục thành công!', 'success');
      } else if (category) {
        await categoryService.update(category.id, { ...payload, isActive: category.isActive ?? true });
        showToast('Cập nhật danh mục thành công!', 'success');
      }
      onSaved();
    } catch (error: any) {
      const backendErrors = error; // categoryService đã xử lý và ném lại object lỗi
      if (backendErrors) {
        const newErrors: Record<string, string> = {};
        for (const key in backendErrors) {
          newErrors[key.toLowerCase()] = Array.isArray(backendErrors[key]) ? backendErrors[key][0] : backendErrors[key];
        }
        setErrors(prev => ({ ...prev, ...newErrors }));
        showToast('Một số thông tin không hợp lệ, vui lòng kiểm tra lại.', 'error');
      } else {
        showToast('Thao tác thất bại. Vui lòng thử lại.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!value.trim()) {
      setErrors(prev => ({ ...prev, [name]: 'Trường này không được để trống.' }));
    }
  };

  return (
    <form id="category-form" onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formContent}>
        {/* Category Name */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Tên danh mục <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            placeholder="Nhập tên danh mục"
            disabled={mode === 'view'}
          />
          {errors.name && <p className={styles.errorText}>{errors.name}</p>}
        </div>

        {/* Slug */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Slug <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`${styles.input} ${errors.slug ? styles.inputError : ''}`}
            placeholder="vi-du-slug"
            disabled={mode === 'view'}
          />
          {errors.slug && <p className={styles.errorText}>{errors.slug}</p>}
        </div>

        {/* Description */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Mô tả</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={styles.textarea}
            placeholder="Nhập mô tả ngắn"
            rows={3}
            disabled={mode === 'view'}
          />
        </div>
      </div>

      {/* Action Buttons */}
      {mode === 'create' || mode === 'edit' ? (
        <div className={styles.formActions}>
          <button type="button" onClick={onCancel} className={styles.cancelButton} disabled={loading}>
            <i className="bi bi-x-circle"></i>
            Hủy
          </button>
          <button type="submit" form="category-form" className={styles.saveButton} disabled={loading}>
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Đang xử lý...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle"></i>
                {mode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
              </>
            )}
          </button>
        </div>
      ) : (
        <div className={styles.formActions}>
          <button type="button" onClick={onCancel} className={styles.saveButton}>
            <i className="bi bi-x-circle"></i>
            Đóng
          </button>
        </div>
      )}
    </form>
  );
}