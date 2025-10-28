import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { articleService } from '../../services/articleService';
import { ArticleDTO } from '../../types/article.types';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { useAuth } from '../../contexts/AuthContext';
import ArticleForm from './ArticleForm';
import styles from '../../styles/admin/ArticleManagement.module.css';

interface ArticleListFilters {
  page: number;
  pageSize: number;
  search: string;
  statusFilter: 'all' | 'published' | 'draft';
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

const getInitialState = (): ArticleListFilters => {
  try {
    const savedState = localStorage.getItem('articleListState');
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (e) {
    console.error("Failed to parse articleListState from localStorage", e);
  }
  return {
    page: 1,
    pageSize: 10,
    search: '',
    statusFilter: 'all',
    dateFrom: '',
    dateTo: '',
    sortBy: 'displayOrder',
    sortDirection: 'asc' as const,
  };
};

export default function ArticleManagement() {
  const [allArticles, setAllArticles] = useState<ArticleDTO[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [statuses, setStatuses] = useState<Array<{ code: string; displayName: string }>>([]);
  const [filters, setFilters] = useState<ArticleListFilters>(getInitialState);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<ArticleDTO | null>(null);
  const [editing, setEditing] = useState<ArticleDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [selectedImageTitle, setSelectedImageTitle] = useState('');
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    article: ArticleDTO | null;
    action: 'lock' | 'unlock' | null;
  }>({
    isOpen: false,
    article: null,
    action: null
  });

  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Helper function to calculate percentage change
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Calculate stats with real data
  const getStats = () => {
    const now = new Date();
    
    // Calculate date ranges
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    // Total articles created before last month
    const articlesCreatedBeforeLastMonth = allArticles.filter(a => {
      if (!a.createdAt) return false;
      const createdDate = new Date(a.createdAt);
      return createdDate < oneMonthAgo;
    }).length;
    
    // Total articles now
    const totalNow = allArticles.length;
    
    // Calculate change: how many new articles in last month
    const newArticlesLastMonth = totalNow - articlesCreatedBeforeLastMonth;
    const totalArticleChange = articlesCreatedBeforeLastMonth > 0 
      ? ((newArticlesLastMonth / articlesCreatedBeforeLastMonth) * 100)
      : (newArticlesLastMonth > 0 ? 100 : 0);

    // Published articles: count articles that existed last week and are currently published
    const publishedNow = allArticles.filter(a => a.statusCode?.toUpperCase() === 'PUBLISHED').length;
    
    // Count articles that existed a week ago (by createdAt)
    const existingLastWeek = allArticles.filter(a => {
      if (!a.createdAt) return false;
      const createdDate = new Date(a.createdAt);
      return createdDate < oneWeekAgo;
    });
    
    const publishedLastWeek = existingLastWeek.filter(a => a.statusCode?.toUpperCase() === 'PUBLISHED').length;
    const publishedChange = publishedLastWeek > 0 
      ? ((publishedNow - publishedLastWeek) / publishedLastWeek) * 100
      : (publishedNow > 0 ? 100 : 0);

    // Draft articles: similar logic
    const draftNow = allArticles.filter(a => a.statusCode?.toUpperCase() === 'DRAFT').length;
    const draftLastWeek = existingLastWeek.filter(a => a.statusCode === 'Draft').length;
    const draftChange = draftLastWeek > 0
      ? ((draftNow - draftLastWeek) / draftLastWeek) * 100
      : (draftNow > 0 ? 100 : 0);

    return {
      totalArticleChange,
      publishedChange,
      draftChange
    };
  };

  const stats = getStats();

  const load = async () => {
    setLoading(true);
    try {
      console.log('Loading articles...');
      const articles = await articleService.getAll();
      console.log('Loaded articles:', articles);
      setAllArticles(articles || []);
      setTotal(articles?.length);
    } catch (error) {
      console.error('Error loading articles:', error);
      showToast('Không thể tải danh sách bài viết', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('articleListState', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    load();
    const fetchStatuses = async () => {
      try {
        const fetchedStatuses = await articleService.getStatuses();
        setStatuses(fetchedStatuses);
      } catch (error) {
        console.error('Failed to fetch article statuses:', error);
        showToast('Không thể tải danh sách trạng thái bài viết.', 'error');
      }
    };
    fetchStatuses();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [filters.page, filters.pageSize]);
  const handleFilterChange = (key: keyof ArticleListFilters, value: any) => {
    setFilters(prev => {
      const newState = { ...prev, [key]: value };
      if (key !== 'page') newState.page = 1;
      return newState;
    });
  };

  const handleStatusChange = (articleToUpdate: ArticleDTO, isBeingLocked: boolean) => {
    setConfirmationDialog({
      isOpen: true,
      article: articleToUpdate,
      action: isBeingLocked ? 'lock' : 'unlock'
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmationDialog.article || !confirmationDialog.action) return;

    const { article: currentArticle, action } = confirmationDialog;
    const isBeingLocked = action === 'lock';
    const actionText = isBeingLocked ? 'chuyển thành bản nháp' : 'xuất bản';

    console.log('Confirming status change:', {
      articleId: currentArticle.id,
      title: currentArticle.title,
      currentStatusCode: currentArticle.statusCode,
      isBeingLocked,
      action
    });

    setConfirmationDialog({ isOpen: false, article: null, action: null });
    showToast(`Đang ${actionText} bài viết "${currentArticle.title}"...`, 'info');

    setUpdatingIds(prev => ({ ...prev, [currentArticle.id]: true }));

    try {
      // Update status using articleService.update
      const newStatusCode = isBeingLocked ? 'DRAFT' : 'PUBLISHED';
      const updatePayload = {
        title: currentArticle.title || '',
        slug: currentArticle.slug || '',
        summary: currentArticle.summary || '',
        content: currentArticle.content || '',
        displayType: currentArticle.displayType || 'Article',
        thumbnailUrl: currentArticle.thumbnailUrl || '',
        coverImageUrl: currentArticle.coverImageUrl || '',
        isHomepageVisible: currentArticle.isHomepageVisible || false,
        displayOrder: currentArticle.displayOrder || 0,
        metaTitle: currentArticle.metaTitle || '',
        metaDescription: currentArticle.metaDescription || '',
        authorId: user?.id || '', // Use logged-in user ID
        statusCode: newStatusCode,
        categoryIds: currentArticle.categoryIds || [],
      };

      console.log('Updating article status:', {
        id: currentArticle.id,
        newStatusCode,
        payload: updatePayload
      });

      await articleService.update(currentArticle.id, updatePayload);
      console.log('Status update successful');
      showToast(`Đã ${actionText} bài viết thành công.`, 'success');
      
      // Reload data
      console.log('Reloading articles after lock/unlock...');
      await load();
    } catch (error: any) {
      console.error('Error locking/unlocking article:', error);
      const message = error?.response?.data?.message || error?.message || 'Không thể cập nhật trạng thái bài viết.';
      showToast(message, 'error');
    } finally {
      setUpdatingIds(prev => ({ ...prev, [currentArticle.id]: false }));
    }
  };

  const handleSort = (column: string) => {
    if (filters.sortBy === column) {
      handleFilterChange('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
      setFilters(prev => ({ ...prev, sortBy: column, sortDirection: 'desc' as const }));
    }
  };

  const handleImageClick = (imageUrl: string, imageTitle: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageTitle(imageTitle);
    setShowImagePopup(true);
  };

  const closeImagePopup = () => {
    setShowImagePopup(false);
    setSelectedImageUrl('');
    setSelectedImageTitle('');
  };

  const handleViewDetails = (article: ArticleDTO) => {
    setViewing(article);
  };

  const handleEdit = (article: ArticleDTO) => {
    setEditing(article);
  };

  const handleCreateNew = () => {
    setCreating(true);
  };

  const handleSaveRequest = async (formData: any) => {
    try {
      if (editing) {
        console.log('Updating article with ID:', editing.id);
        console.log('Update payload:', formData);
        await articleService.update(editing.id, formData);
        console.log('Update successful');
        showToast('Cập nhật bài viết thành công!', 'success');
        setEditing(null);
      } else if (creating) {
        console.log('Creating new article with payload:', formData);
        await articleService.create(formData);
        showToast('Tạo bài viết thành công!', 'success');
        setCreating(false);
      }
      await load();
    } catch (error: any) {
      console.error('Error saving article:', error);
      const message = error?.response?.data?.message || error?.message || 'Không thể lưu bài viết';
      showToast(message, 'error');
    }
  };

  const handleResetFilters = () => {
    setFilters({
      ...filters,
      statusFilter: 'all',
      dateFrom: '',
      dateTo: '',
    });
  };

  const processedItems = useMemo(() => {
    const from = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
    const to = filters.dateTo ? (() => {
      const date = new Date(filters.dateTo);
      date.setHours(23, 59, 59, 999);
      return date;
    })() : undefined;

    const filtered = allArticles.filter(a => {
      const searchTerm = filters.search.toLowerCase();
      const okSearch = !searchTerm ||
        (a.title && a.title.toLowerCase().includes(searchTerm));

      // Use statusCode for status filtering
      const okStatus = filters.statusFilter === 'all' || 
        (filters.statusFilter === 'published' ? a.statusCode?.toUpperCase() === 'PUBLISHED' : 
         filters.statusFilter === 'draft' ? a.statusCode?.toUpperCase() === 'DRAFT' : true);

      let okDate = true;
      if (from || to) {
        const created = a.createdAt ? new Date(a.createdAt) : undefined;
        okDate = !!created && (!from || created >= from) && (!to || created <= to);
      }

      return okSearch && okStatus && okDate;
    });

    const sorted = [...filtered].sort((a, b) => {
      let valA: any, valB: any;
      
      if (filters.sortBy === 'createdAt' || filters.sortBy === 'publishedAt') {
        valA = a[filters.sortBy] ? new Date(a[filters.sortBy]!).getTime() : 0;
        valB = b[filters.sortBy] ? new Date(b[filters.sortBy]!).getTime() : 0;
      } else if (filters.sortBy === 'title') {
        valA = (a.title || '').toLowerCase();
        valB = (b.title || '').toLowerCase();
      } else if (filters.sortBy === 'statusCode') {
        valA = a.statusCode || '';
        valB = b.statusCode || '';
      } else if (filters.sortBy === 'displayOrder') {
        valA = a.displayOrder || 0;
        valB = b.displayOrder || 0;
      } else if (filters.sortBy === 'viewCount') {
        valA = a.viewCount || 0;
        valB = b.viewCount || 0;
      }

      if (valA < valB) return filters.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return filters.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [allArticles, filters]);

  const paginatedItems = useMemo(() => processedItems.slice((filters.page - 1) * filters.pageSize, filters.page * filters.pageSize), [processedItems, filters.page, filters.pageSize]);
  const totalPages = Math.ceil(processedItems.length / filters.pageSize);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (statusCode?: string, isLocked?: boolean) => {
    if (!statusCode) {
      return <span className={`${styles.statusBadge} ${styles.statusInactive}`}>Không có</span>;
    }

    const statusInfo = statuses.find(s => s.code.toUpperCase() === statusCode.toUpperCase());
    const displayName = statusInfo ? statusInfo.displayName : statusCode; // Fallback to code if not found

    let statusClass = styles.statusDefault; // Default color
    let iconClass = 'bi bi-question-circle';

    switch (statusCode.toUpperCase()) {
      case 'PUBLISHED':
        statusClass = styles.statusActive;
        iconClass = 'bi bi-check-circle-fill';
        break;
      case 'DRAFT':
        statusClass = styles.statusInactive;
        iconClass = 'bi bi-file-text';
        break;
      case 'ARCHIVE':
        statusClass = styles.statusArchived;
        iconClass = 'bi bi-archive-fill';
        break;
      case 'ANHAI': // Example for custom status
        statusClass = styles.statusCustom;
        iconClass = 'bi bi-tag-fill';
        break;
      default:
        // Keep default icon and color for any other status
        break;
    }

    return (
      <span className={`${styles.statusBadge} ${statusClass}`}>
        <i className={iconClass}></i>
        {displayName}
      </span>
    );
  };


  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Quản lý Bài viết</h1>
          <p className={styles.subtitle}>Quản lý và xuất bản các bài viết sức khỏe</p>
        </div>
        <button onClick={handleCreateNew} className={styles.btnCreate}>
            <i className="bi bi-plus-lg"></i>
          Tạo mới
          </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCard1}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-file-text"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Tổng số bài viết</div>
            <div className={styles.statValue}>{total ?? 0}</div>
            <div className={styles.statTrend}>
              {stats.totalArticleChange >= 0 ? (
                <i className="bi bi-graph-up"></i>
              ) : (
                <i className="bi bi-graph-down"></i>
              )}
              <span>
                {stats.totalArticleChange >= 0 ? '+' : ''}
                {stats.totalArticleChange.toFixed(1)}% so với tháng trước
              </span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-file-text"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard2}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Đã xuất bản</div>
            <div className={styles.statValue}>
              {allArticles.filter(a => a.statusCode?.toUpperCase() === 'PUBLISHED').length}
            </div>
            <div className={`${styles.statTrend} ${stats.publishedChange < 0 ? styles.negative : ''}`}>
              {stats.publishedChange >= 0 ? (
                <i className="bi bi-graph-up"></i>
              ) : (
                <i className="bi bi-graph-down"></i>
              )}
              <span>
                {stats.publishedChange >= 0 ? '+' : ''}
                {stats.publishedChange.toFixed(1)}% tuần này
              </span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-check-circle-fill"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard3}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-pause-circle-fill"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Bản nháp</div>
            <div className={styles.statValue}>
              {allArticles.filter(a => a.statusCode?.toUpperCase() === 'DRAFT').length}
            </div>
            <div className={`${styles.statTrend} ${stats.draftChange >= 0 ? styles.negative : ''}`}>
              {stats.draftChange < 0 ? (
                <i className="bi bi-graph-down"></i>
              ) : (
                <i className="bi bi-graph-up"></i>
              )}
              <span>
                {stats.draftChange >= 0 ? '+' : ''}
                {stats.draftChange.toFixed(1)}% tuần này
              </span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-pause-circle-fill"></i>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
            <i className="bi bi-search"></i>
            <input
              type="text"
            placeholder="Tìm kiếm theo tiêu đề..."
              value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
            className={styles.searchInput}
          />
          {filters.search && (
            <button 
              className={styles.clearSearch}
              onClick={() => handleFilterChange('search', '')}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
          </div>

          <button 
          className={`${styles.btnFilter} ${showFilters ? styles.active : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          >
            <i className="bi bi-funnel"></i>
            Bộ lọc
          {(filters.statusFilter !== 'all' || filters.dateFrom || filters.dateTo) && (
            <span className={styles.filterBadge}></span>
          )}
          </button>
        </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGrid}>
            <div className={styles.filterItem}>
              <label>
                <i className="bi bi-toggle-on"></i>
                Trạng thái
              </label>
              <select value={filters.statusFilter} onChange={e => handleFilterChange('statusFilter', e.target.value)}>
                <option value="all">Tất cả trạng thái</option>
                <option value="published">Đã xuất bản</option>
                <option value="draft">Bản nháp</option>
                </select>
              </div>

            <div className={styles.filterItem}>
              <label>
                <i className="bi bi-calendar-event"></i>
                Từ ngày
              </label>
              <input 
                type="date" 
                value={filters.dateFrom} 
                onChange={e => handleFilterChange('dateFrom', e.target.value)} 
              />
              </div>

            <div className={styles.filterItem}>
              <label>
                <i className="bi bi-calendar-check"></i>
                Đến ngày
              </label>
              <input 
                type="date" 
                value={filters.dateTo} 
                onChange={e => handleFilterChange('dateTo', e.target.value)} 
              />
              </div>
              </div>

          <div className={styles.filterActions}>
            <button onClick={handleResetFilters} className={styles.btnResetFilter}>
              <i className="bi bi-arrow-counterclockwise"></i>
              Đặt lại bộ lọc
            </button>
            <button onClick={() => setShowFilters(false)} className={styles.btnApplyFilter}>
              <i className="bi bi-check2"></i>
              Áp dụng
            </button>
            </div>
          </div>
        )}

      {/* Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : processedItems.length > 0 ? (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>STT</th>
                  <th onClick={() => handleSort('title')} className={styles.sortable}>
                    Tiêu đề
                    {filters.sortBy === 'title' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th>Ảnh</th>
                  <th onClick={() => handleSort('displayOrder')} className={styles.sortable}>
                    Thứ tự
                    {filters.sortBy === 'displayOrder' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('statusCode')} className={styles.sortable}>
                    Trạng thái
                    {filters.sortBy === 'statusCode' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('viewCount')} className={styles.sortable}>
                    Lượt xem
                    {filters.sortBy === 'viewCount' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('createdAt')} className={styles.sortable}>
                    Ngày tạo
                    {filters.sortBy === 'createdAt' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th style={{ textAlign: 'right', width: '150px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((article, index) => (
                  <tr key={article.id} className={styles.tableRow}>
                    <td className={styles.indexCell}>
                      {(filters.page - 1) * filters.pageSize + index + 1}
                    </td>
                    <td>
                      <div className={styles.titleCell} title={article.title}>
                        {article.title || 'Chưa có tiêu đề'}
                      </div>
                    </td>
                    <td className={styles.imageCell}>
                      {article.thumbnailUrl || article.coverImageUrl ? (
                        <div 
                          className={styles.imageContainer}
                          onClick={() => handleImageClick(article.thumbnailUrl || article.coverImageUrl || '', article.title || '')}
                          title="Click để xem ảnh lớn"
                        >
                          <img 
                            src={article.thumbnailUrl || article.coverImageUrl} 
                            alt={article.title || 'Ảnh bài viết'}
                            className={styles.bannerImage}
                          />
                          <div className={styles.imageOverlay}>
                            <i className="bi bi-eye"></i>
              </div>
                </div>
                      ) : (
                        <div className={styles.noImage}>Không có</div>
                      )}
                    </td>
                    <td className={styles.orderCell}>
                      <span className={styles.orderBadge}>{article.displayOrder || 0}</span>
                    </td>
                    <td>{getStatusBadge(article.statusCode, article.isLocked)}</td>
                    <td className={styles.viewCountCell}>
                    <i className="bi bi-eye"></i>
                    {article.viewCount || 0}
                    </td>
                    <td className={styles.dateCell}>{formatDate(article.createdAt)}</td>
                    <td>
                      <div className={styles.actions}>
                <button 
                          onClick={() => handleViewDetails(article)}
                  className={styles.actionBtn}
                          title="Xem chi tiết"
                >
                  <i className="bi bi-eye"></i>
                </button>
                <button 
                          onClick={() => handleEdit(article)}
                  className={styles.actionBtn}
                  title="Chỉnh sửa"
                >
                  <i className="bi bi-pencil"></i>
                </button>
                <button 
                  onClick={() => handleStatusChange(article, article.statusCode?.toUpperCase() === 'PUBLISHED')}
                  disabled={Boolean(updatingIds[article.id])}
                  title={article.statusCode?.toUpperCase() === 'PUBLISHED' ? 'Chuyển thành bản nháp' : 'Xuất bản'}
                  className={`${styles.actionBtn} ${article.statusCode?.toUpperCase() === 'PUBLISHED' ? styles.actionLock : styles.actionUnlock}`}
                >
                  <i className={`bi bi-${article.statusCode?.toUpperCase() === 'PUBLISHED' ? 'file-text' : 'check-circle'}`}></i>
                </button>
              </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                <span>Hiển thị {(filters.page - 1) * filters.pageSize + 1} – {Math.min(filters.page * filters.pageSize, processedItems.length)} trong tổng số {processedItems.length} kết quả</span>
              </div>
              <div className={styles.paginationControls}>
                <select
                  value={filters.pageSize}
                  onChange={e => handleFilterChange('pageSize', Number(e.target.value))}
                  className={styles.pageSizeSelect}
                >
                  <option value={5}>5 / trang</option>
                  <option value={10}>10 / trang</option>
                  <option value={15}>15 / trang</option>
                  <option value={20}>20 / trang</option>
                </select>

                <div className={styles.paginationButtons}>
                  <button onClick={() => handleFilterChange('page', 1)} disabled={filters.page === 1} className={styles.pageBtn}><i className="bi bi-chevron-double-left"></i></button>
                  <button onClick={() => handleFilterChange('page', filters.page - 1)} disabled={filters.page === 1} className={styles.pageBtn}><i className="bi bi-chevron-left"></i></button>
                  <span className={styles.pageInfo}>{filters.page} / {totalPages || 1}</span>
                  <button onClick={() => handleFilterChange('page', filters.page + 1)} disabled={filters.page >= totalPages} className={styles.pageBtn}><i className="bi bi-chevron-right"></i></button>
                  <button onClick={() => handleFilterChange('page', totalPages)} disabled={filters.page >= totalPages} className={styles.pageBtn}><i className="bi bi-chevron-double-right"></i></button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <i className="bi bi-inbox"></i>
            <h3>Không có bài viết nào</h3>
            <p>Hãy tạo bài viết đầu tiên của bạn</p>
            </div>
        )}
      </div>

      {/* Image Popup */}
      {showImagePopup && (
        <div className={styles.imageModalOverlay} onClick={closeImagePopup}>
          <div className={styles.imageModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.imageModalHeader}>
              <h3>{selectedImageTitle}</h3>
              <button className={styles.closeButton} onClick={closeImagePopup}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className={styles.imageModalBody}>
              <img src={selectedImageUrl} alt={selectedImageTitle} className={styles.popupImage} />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        title={confirmationDialog.action === 'lock' ? 'Chuyển thành bản nháp' : 'Xuất bản bài viết'}
        message={`Bạn có chắc chắn muốn ${confirmationDialog.action === 'lock' ? 'chuyển thành bản nháp' : 'xuất bản'} bài viết "${confirmationDialog.article?.title}"?`}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setConfirmationDialog({ isOpen: false, article: null, action: null })}
      />

      {/* View Modal */}
      {viewing && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Chi tiết Bài viết</h2>
              <button onClick={() => setViewing(null)} className={styles.closeButton}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <ArticleForm
                article={viewing}
                mode="view"
                onSaved={() => {}}
                onCancel={() => setViewing(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Chỉnh sửa Bài viết</h2>
              <button onClick={() => setEditing(null)} className={styles.closeButton}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <ArticleForm
                article={editing}
                mode="edit"
                onSaved={() => setEditing(null)}
                onCancel={() => setEditing(null)}
                onSaveRequest={handleSaveRequest}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {creating && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Tạo Bài viết mới</h2>
              <button onClick={() => setCreating(false)} className={styles.closeButton}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <ArticleForm
                article={null}
                mode="create"
                onSaved={() => setCreating(false)}
                onCancel={() => setCreating(false)}
                onSaveRequest={handleSaveRequest}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
