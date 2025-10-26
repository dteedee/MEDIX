import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { articleService } from '../../services/articleService';
import { categoryService } from '../../services/categoryService';
import { ArticleDTO } from '../../types/article.types';
import { CategoryDTO } from '../../types/category.types';
import { useToast } from '../../contexts/ToastContext';
import styles from '../../styles/manager/ArticleManagement.module.css';

interface ArticleFilters {
  search: string;
  category: string;
  status: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

export default function ArticleManagement() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [articles, setArticles] = useState<ArticleDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ArticleDTO | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  
  const [filters, setFilters] = useState<ArticleFilters>({
    search: '',
    category: 'all',
    status: 'all',
    sortBy: 'createdAt',
    sortDirection: 'desc'
  });

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    categoryId: '',
    status: 'Draft',
    tags: '',
    featuredImage: null as File | null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [articlesResponse, categoriesResponse] = await Promise.all([
        articleService.getAll(),
        categoryService.getAll()
      ]);
      
      setArticles(articlesResponse.data || []);
      setCategories(categoriesResponse.data || []);
    } catch (err) {
      setError('Không thể tải dữ liệu');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                         article.summary.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = filters.category === 'all' || article.categoryId === filters.category;
    const matchesStatus = filters.status === 'all' || article.status === filters.status;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedArticles = [...filteredArticles].sort((a, b) => {
    const aValue = a[filters.sortBy as keyof ArticleDTO];
    const bValue = b[filters.sortBy as keyof ArticleDTO];
    
    if (filters.sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleCreateArticle = async () => {
    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        summary: formData.summary,
        categoryId: formData.categoryId,
        status: formData.status,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        featuredImage: formData.featuredImage
      };

      await articleService.create(payload);
      showToast('Tạo bài viết thành công!', 'success');
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      showToast('Không thể tạo bài viết', 'error');
      console.error('Error creating article:', err);
    }
  };

  const handleEditArticle = async () => {
    if (!selectedArticle) return;

    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        summary: formData.summary,
        categoryId: formData.categoryId,
        status: formData.status,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        featuredImage: formData.featuredImage
      };

      await articleService.update(selectedArticle.id, payload);
      showToast('Cập nhật bài viết thành công!', 'success');
      setShowEditModal(false);
      setSelectedArticle(null);
      resetForm();
      fetchData();
    } catch (err) {
      showToast('Không thể cập nhật bài viết', 'error');
      console.error('Error updating article:', err);
    }
  };

  const handleDeleteArticle = async () => {
    if (!selectedArticle) return;

    try {
      await articleService.delete(selectedArticle.id);
      showToast('Xóa bài viết thành công!', 'success');
      setShowDeleteDialog(false);
      setSelectedArticle(null);
      fetchData();
    } catch (err) {
      showToast('Không thể xóa bài viết', 'error');
      console.error('Error deleting article:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      summary: '',
      categoryId: '',
      status: 'Draft',
      tags: '',
      featuredImage: null
    });
  };

  const openEditModal = (article: ArticleDTO) => {
    setSelectedArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      summary: article.summary,
      categoryId: article.categoryId,
      status: article.status,
      tags: article.tags?.join(', ') || '',
      featuredImage: null
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Published': { text: 'Đã xuất bản', class: styles.statusPublished },
      'Draft': { text: 'Bản nháp', class: styles.statusDraft },
      'Archived': { text: 'Đã lưu trữ', class: styles.statusArchived }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Draft;
    return <span className={`${styles.statusBadge} ${config.class}`}>{config.text}</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Quản lý bài viết</h1>
          <p>Quản lý và xuất bản các bài viết y tế</p>
        </div>
        <div className={styles.headerRight}>
          <button 
            className={styles.createBtn}
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-plus-lg"></i>
            Tạo bài viết mới
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <div className={styles.searchInput}>
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <button 
            className={styles.filterBtn}
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
          >
            <i className="bi bi-funnel"></i>
            Bộ lọc
            <i className={`bi bi-chevron-${showAdvancedFilter ? 'up' : 'down'}`}></i>
          </button>
        </div>

        {showAdvancedFilter && (
          <div className={styles.advancedFilter}>
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label>Danh mục</label>
                <select 
                  value={filters.category} 
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="all">Tất cả</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Trạng thái</label>
                <select 
                  value={filters.status} 
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="all">Tất cả</option>
                  <option value="Published">Đã xuất bản</option>
                  <option value="Draft">Bản nháp</option>
                  <option value="Archived">Đã lưu trữ</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Sắp xếp theo</label>
                <select 
                  value={filters.sortBy} 
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                >
                  <option value="createdAt">Ngày tạo</option>
                  <option value="title">Tiêu đề</option>
                  <option value="status">Trạng thái</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Thứ tự</label>
                <select 
                  value={filters.sortDirection} 
                  onChange={(e) => setFilters(prev => ({ ...prev, sortDirection: e.target.value as 'asc' | 'desc' }))}
                >
                  <option value="desc">Giảm dần</option>
                  <option value="asc">Tăng dần</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Articles List */}
      <div className={styles.articlesList}>
        {sortedArticles.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="bi bi-file-text"></i>
            <h3>Chưa có bài viết nào</h3>
            <p>Hãy tạo bài viết đầu tiên của bạn</p>
          </div>
        ) : (
          sortedArticles.map((article) => (
            <div key={article.id} className={styles.articleCard}>
              <div className={styles.articleImage}>
                <img 
                  src={article.featuredImageUrl || '/images/default-article.jpg'} 
                  alt={article.title}
                />
              </div>
              <div className={styles.articleContent}>
                <div className={styles.articleHeader}>
                  <h3 className={styles.articleTitle}>{article.title}</h3>
                  {getStatusBadge(article.status)}
                </div>
                <p className={styles.articleSummary}>{article.summary}</p>
                <div className={styles.articleMeta}>
                  <span className={styles.articleCategory}>
                    {categories.find(cat => cat.id === article.categoryId)?.name || 'Không có danh mục'}
                  </span>
                  <span className={styles.articleDate}>
                    {formatDate(article.createdAt)}
                  </span>
                  <span className={styles.articleViews}>
                    <i className="bi bi-eye"></i>
                    {article.viewCount || 0}
                  </span>
                </div>
              </div>
              <div className={styles.articleActions}>
                <button 
                  className={styles.actionBtn}
                  onClick={() => navigate(`/articles/${article.slug}`)}
                  title="Xem"
                >
                  <i className="bi bi-eye"></i>
                </button>
                <button 
                  className={styles.actionBtn}
                  onClick={() => openEditModal(article)}
                  title="Chỉnh sửa"
                >
                  <i className="bi bi-pencil"></i>
                </button>
                <button 
                  className={styles.actionBtn}
                  onClick={() => {
                    setSelectedArticle(article);
                    setShowDeleteDialog(true);
                  }}
                  title="Xóa"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{showCreateModal ? 'Tạo bài viết mới' : 'Chỉnh sửa bài viết'}</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedArticle(null);
                  resetForm();
                }}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Tiêu đề *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nhập tiêu đề bài viết"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Tóm tắt *</label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="Nhập tóm tắt bài viết"
                  rows={3}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Danh mục *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="Draft">Bản nháp</option>
                    <option value="Published">Đã xuất bản</option>
                    <option value="Archived">Đã lưu trữ</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Nhập tags, phân cách bằng dấu phẩy"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Hình ảnh đại diện</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData(prev => ({ ...prev, featuredImage: e.target.files?.[0] || null }))}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Nội dung *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Nhập nội dung bài viết"
                  rows={10}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelBtn}
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedArticle(null);
                  resetForm();
                }}
              >
                Hủy
              </button>
              <button 
                className={styles.saveBtn}
                onClick={showCreateModal ? handleCreateArticle : handleEditArticle}
              >
                {showCreateModal ? 'Tạo bài viết' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedArticle && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Xác nhận xóa</h3>
            </div>
            <div className={styles.modalBody}>
              <p>Bạn có chắc chắn muốn xóa bài viết <strong>"{selectedArticle.title}"</strong>?</p>
              <p className={styles.warningText}>Hành động này không thể hoàn tác.</p>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelBtn}
                onClick={() => {
                  setShowDeleteDialog(false);
                  setSelectedArticle(null);
                }}
              >
                Hủy
              </button>
              <button 
                className={styles.deleteBtn}
                onClick={handleDeleteArticle}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
