import React, { useState, useMemo, useEffect } from 'react';
import DoctorService from '../../services/doctorService';
import { DoctorPerformanceDto } from '../../types/doctor.types';
import { useToast } from '../../contexts/ToastContext';
import DoctorUpdateModal from './DoctorUpdateModal';
import styles from '../../styles/manager/DoctorEvaluation.module.css';

interface DoctorEvaluationProps {
  doctors: any[];
  degrees: any[];
  onUpdateSalary?: (doctorId: string) => void;
  onUpdateEducation?: (doctorId: string) => void;
  onRefresh?: () => void;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export default function DoctorEvaluation({ 
  doctors, 
  degrees,
  onUpdateSalary,
  onUpdateEducation,
  onRefresh
}: DoctorEvaluationProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'compositeScore', direction: 'desc' });
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<DoctorPerformanceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateModalDoctor, setUpdateModalDoctor] = useState<any>(null);
  const [updateType, setUpdateType] = useState<'salary' | 'education' | 'both'>('both');
  const { showToast } = useToast();

  // Load performance data from API
  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const data = await DoctorService.getTopDoctorsByPerformance(0.7, 0.3);
      setPerformanceData(data);
    } catch (error) {
      console.error('Error loading performance data:', error);
      showToast('Không thể tải dữ liệu hiệu suất bác sĩ', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Lọc chỉ các bác sĩ đang hoạt động
  const activeDoctors = doctors.filter(d => d.statusCode === 1);

  // Tính toán chỉ số hiệu suất cho từng bác sĩ
  const doctorsWithMetrics = useMemo(() => {
    return performanceData.map(perfData => {
      // Tìm thông tin bác sĩ từ danh sách doctors
      const doctor = doctors.find(d => d.id === perfData.doctorId) || {};
      
      // Chuyển đổi compositeScore (0-1) thành performanceScore (0-100)
      const performanceScore = Math.round(perfData.compositeScore * 100);
      
      // Đề xuất dựa trên hiệu suất
      let recommendation = '';
      let recommendationType: 'salary' | 'education' | 'both' | 'none' = 'none';
      
      if (performanceScore >= 80 && perfData.reviewCount >= 20) {
        recommendation = 'Ứng viên xuất sắc cho tăng lương và nâng cấp trình độ học vấn';
        recommendationType = 'both';
      } else if (performanceScore >= 70 && perfData.reviewCount >= 10) {
        recommendation = 'Ứng viên cho tăng lương';
        recommendationType = 'salary';
      } else if (perfData.successRate >= 0.8 && perfData.averageRating >= 4.0) {
        recommendation = 'Ứng viên cho nâng cấp trình độ học vấn';
        recommendationType = 'education';
      } else if (performanceScore >= 60) {
        recommendation = 'Hiệu suất đạt yêu cầu, tiếp tục theo dõi';
        recommendationType = 'none';
      } else {
        recommendation = 'Cần cải thiện hiệu suất';
        recommendationType = 'none';
      }

      return {
        id: perfData.doctorId,
        fullName: perfData.doctorName,
        email: doctor.email || '',
        specialization: perfData.specialization,
        avatarUrl: perfData.imageUrl,
        rating: perfData.averageRating,
        reviewCount: perfData.reviewCount,
        education: doctor.education || '',
        yearsOfExperience: doctor.yearsOfExperience || 0,
        statusCode: doctor.statusCode || 1,
        successfulCases: perfData.successfulCases,
        totalCases: perfData.totalCases,
        successRate: perfData.successRate,
        formattedSuccessRate: perfData.formattedSuccessRate,
        consultationFee: perfData.consultationFee || 0,
        performanceScore,
        recommendation,
        recommendationType
      };
    });
  }, [performanceData, doctors]);

  // Lọc và sắp xếp
  const filteredAndSortedDoctors = useMemo(() => {
    let filtered = doctorsWithMetrics.filter(d => {
      const searchLower = searchTerm.toLowerCase();
      return (
        d.fullName?.toLowerCase().includes(searchLower) ||
        d.email?.toLowerCase().includes(searchLower) ||
        d.specialization?.toLowerCase().includes(searchLower)
      );
    });

    // Sắp xếp
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'fullName':
          aValue = (a.fullName || '').toLowerCase();
          bValue = (b.fullName || '').toLowerCase();
          break;
        case 'specialization':
          aValue = (a.specialization || '').toLowerCase();
          bValue = (b.specialization || '').toLowerCase();
          break;
        case 'education':
          aValue = (a.education || '').toLowerCase();
          bValue = (b.education || '').toLowerCase();
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'reviewCount':
          aValue = a.reviewCount || 0;
          bValue = b.reviewCount || 0;
          break;
        case 'yearsOfExperience':
          aValue = a.yearsOfExperience || 0;
          bValue = b.yearsOfExperience || 0;
          break;
        case 'successRate':
          aValue = a.successRate || 0;
          bValue = b.successRate || 0;
          break;
        case 'consultationFee':
          aValue = a.consultationFee || 0;
          bValue = b.consultationFee || 0;
          break;
        case 'performanceScore':
          aValue = a.performanceScore || 0;
          bValue = b.performanceScore || 0;
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [doctorsWithMetrics, searchTerm, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getEducationLabel = (educationCode?: string): string => {
    if (!educationCode) return 'Chưa có';
    const degree = degrees.find((d: any) => d.code === educationCode);
    return degree ? degree.description : educationCode;
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return '#10b981'; // Xanh lá
    if (score >= 60) return '#f59e0b'; // Vàng
    return '#ef4444'; // Đỏ
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'both': return '🏆';
      case 'salary': return '💰';
      case 'education': return '📚';
      default: return '📊';
    }
  };

  const handleUpdateSubmit = async (data: any) => {
    try {
      showToast('Đang cập nhật thông tin bác sĩ...', 'info');
      
      await DoctorService.updateDoctorEducationAndFee(updateModalDoctor.id, data);
      
      showToast('Cập nhật thông tin bác sĩ thành công!', 'success');
      setUpdateModalDoctor(null);
      
      // Refresh data
      await loadPerformanceData();
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('Error updating doctor:', error);
      showToast(error.message || 'Không thể cập nhật thông tin bác sĩ', 'error');
      throw error;
    }
  };

  // Thống kê chung
  const stats = useMemo(() => {
    const total = doctorsWithMetrics.length;
    const excellentPerformers = doctorsWithMetrics.filter(d => d.performanceScore >= 80).length;
    const goodPerformers = doctorsWithMetrics.filter(d => d.performanceScore >= 60 && d.performanceScore < 80).length;
    const needsImprovement = doctorsWithMetrics.filter(d => d.performanceScore < 60).length;
    const avgScore = total > 0 
      ? Math.round(doctorsWithMetrics.reduce((sum, d) => sum + d.performanceScore, 0) / total)
      : 0;
    const avgRating = total > 0
      ? (doctorsWithMetrics.reduce((sum, d) => sum + (d.rating || 0), 0) / total).toFixed(1)
      : '0.0';
    const salaryRecommendations = doctorsWithMetrics.filter(d => 
      d.recommendationType === 'salary' || d.recommendationType === 'both'
    ).length;
    const educationRecommendations = doctorsWithMetrics.filter(d => 
      d.recommendationType === 'education' || d.recommendationType === 'both'
    ).length;

    return {
      total,
      excellentPerformers,
      goodPerformers,
      needsImprovement,
      avgScore,
      avgRating,
      salaryRecommendations,
      educationRecommendations
    };
  }, [doctorsWithMetrics]);

  if (loading) {
    return (
      <div className={styles.evaluationContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Đang tải dữ liệu hiệu suất bác sĩ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.evaluationContainer}>
      {/* Thống kê hiệu suất */}
      <div className={styles.performanceStats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#667eea' }}>
            <i className="bi bi-graph-up-arrow"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Điểm trung bình</div>
            <div className={styles.statValue}>{stats.avgScore}/100</div>
            <div className={styles.statSubtext}>Đánh giá: {stats.avgRating}/5.0</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#10b981' }}>
            <i className="bi bi-trophy-fill"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Hiệu suất xuất sắc</div>
            <div className={styles.statValue}>{stats.excellentPerformers}</div>
            <div className={styles.statSubtext}>≥ 80 điểm</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f59e0b' }}>
            <i className="bi bi-star-half"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Hiệu suất tốt</div>
            <div className={styles.statValue}>{stats.goodPerformers}</div>
            <div className={styles.statSubtext}>60-79 điểm</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#8b5cf6' }}>
            <i className="bi bi-cash-coin"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Đề xuất tăng lương</div>
            <div className={styles.statValue}>{stats.salaryRecommendations}</div>
            <div className={styles.statSubtext}>Ứng viên phù hợp</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#ec4899' }}>
            <i className="bi bi-mortarboard-fill"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Đề xuất nâng cấp học vấn</div>
            <div className={styles.statValue}>{stats.educationRecommendations}</div>
            <div className={styles.statSubtext}>Ứng viên phù hợp</div>
          </div>
        </div>
      </div>

      {/* Thanh tìm kiếm */}
      <div className={styles.searchBar}>
        <i className="bi bi-search"></i>
        <input
          type="text"
          placeholder="Tìm kiếm bác sĩ theo tên, email hoặc chuyên khoa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className={styles.clearBtn}>
            <i className="bi bi-x-lg"></i>
          </button>
        )}
      </div>

      {/* Bảng đánh giá */}
      <div className={styles.tableContainer}>
        <table className={styles.evaluationTable}>
          <thead>
            <tr>
              <th style={{ width: '50px' }}>STT</th>
              <th style={{ width: '70px' }}>Ảnh</th>
              <th onClick={() => handleSort('fullName')} className={styles.sortable}>
                Họ và tên
                {sortConfig.key === 'fullName' && (
                  <i className={`bi bi-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSort('specialization')} className={styles.sortable}>
                Chuyên khoa
                {sortConfig.key === 'specialization' && (
                  <i className={`bi bi-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSort('education')} className={styles.sortable}>
                Trình độ học vấn
                {sortConfig.key === 'education' && (
                  <i className={`bi bi-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSort('yearsOfExperience')} className={styles.sortable}>
                Kinh nghiệm
                {sortConfig.key === 'yearsOfExperience' && (
                  <i className={`bi bi-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSort('rating')} className={styles.sortable}>
                Đánh giá
                {sortConfig.key === 'rating' && (
                  <i className={`bi bi-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSort('reviewCount')} className={styles.sortable}>
                Số đánh giá
                {sortConfig.key === 'reviewCount' && (
                  <i className={`bi bi-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSort('successRate')} className={styles.sortable}>
                Tỷ lệ thành công
                {sortConfig.key === 'successRate' && (
                  <i className={`bi bi-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSort('consultationFee')} className={styles.sortable}>
                Giá khám
                {sortConfig.key === 'consultationFee' && (
                  <i className={`bi bi-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSort('performanceScore')} className={styles.sortable}>
                Điểm hiệu suất
                {sortConfig.key === 'performanceScore' && (
                  <i className={`bi bi-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th style={{ width: '300px' }}>Đề xuất</th>
              <th style={{ width: '100px' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedDoctors.length > 0 ? (
              filteredAndSortedDoctors.map((doctor, index) => (
                <tr key={doctor.id} className={styles.tableRow}>
                  <td>{index + 1}</td>
                  <td>
                    <img
                      src={doctor.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.fullName)}&background=667eea&color=fff`}
                      alt={doctor.fullName}
                      className={styles.avatar}
                    />
                  </td>
                  <td>
                    <div className={styles.doctorInfo}>
                      <span className={styles.doctorName}>{doctor.fullName}</span>
                      <span className={styles.doctorEmail}>{doctor.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.specialtyBadge}>{doctor.specialization}</span>
                  </td>
                  <td>
                    <span className={styles.educationBadge}>
                      {getEducationLabel(doctor.education)}
                    </span>
                  </td>
                  <td className={styles.centerText}>
                    <span className={styles.experienceBadge}>
                      {doctor.yearsOfExperience || 0} năm
                    </span>
                  </td>
                  <td className={styles.centerText}>
                    <div className={styles.ratingDisplay}>
                      <i className="bi bi-star-fill" style={{ color: '#fbbf24' }}></i>
                      <span className={styles.ratingValue}>{(doctor.rating || 0).toFixed(1)}</span>
                    </div>
                  </td>
                  <td className={styles.centerText}>
                    <span className={styles.reviewCountBadge}>
                      {doctor.reviewCount || 0}
                    </span>
                  </td>
                  <td className={styles.centerText}>
                    <div className={styles.successRateDisplay}>
                      <span className={styles.successRateBadge}>
                        {doctor.formattedSuccessRate || '0%'}
                      </span>
                      <span className={styles.casesInfo}>
                        ({doctor.successfulCases || 0}/{doctor.totalCases || 0})
                      </span>
                    </div>
                  </td>
                  <td className={styles.centerText}>
                    <span className={styles.consultationFeeBadge}>
                      {(doctor.consultationFee || 0).toLocaleString('vi-VN')} ₫
                    </span>
                  </td>
                  <td className={styles.centerText}>
                    <div className={styles.performanceIndicator}>
                      <div 
                        className={styles.performanceBar}
                        style={{ 
                          width: `${doctor.performanceScore}%`,
                          background: getPerformanceColor(doctor.performanceScore)
                        }}
                      ></div>
                      <span 
                        className={styles.performanceScore}
                        style={{ color: getPerformanceColor(doctor.performanceScore) }}
                      >
                        {doctor.performanceScore}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.recommendation}>
                      <span className={styles.recommendationIcon}>
                        {getRecommendationIcon(doctor.recommendationType)}
                      </span>
                      <span className={styles.recommendationText}>
                        {doctor.recommendation}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.detailsBtn}
                        onClick={() => setSelectedDoctor(doctor)}
                        title="Xem chi tiết"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={13} className={styles.emptyState}>
                  <i className="bi bi-inbox"></i>
                  <p>Không tìm thấy bác sĩ nào</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal chi tiết */}
      {selectedDoctor && (
        <div className={styles.modal} onClick={() => setSelectedDoctor(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <i className="bi bi-clipboard-data"></i>
                Đánh giá chi tiết
              </h2>
              <button onClick={() => setSelectedDoctor(null)} className={styles.closeBtn}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.doctorHeader}>
                <img
                  src={selectedDoctor.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDoctor.fullName)}&background=667eea&color=fff`}
                  alt={selectedDoctor.fullName}
                  className={styles.doctorAvatar}
                />
                <div className={styles.doctorMeta}>
                  <h3>{selectedDoctor.fullName}</h3>
                  <p>{selectedDoctor.email}</p>
                  <span className={styles.specialtyTag}>{selectedDoctor.specialization}</span>
                </div>
              </div>

              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <div className={styles.metricIcon}>
                    <i className="bi bi-star-fill"></i>
                  </div>
                  <div className={styles.metricInfo}>
                    <span className={styles.metricLabel}>Đánh giá trung bình</span>
                    <span className={styles.metricValue}>{(selectedDoctor.rating || 0).toFixed(1)}/5.0</span>
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricIcon}>
                    <i className="bi bi-chat-left-text"></i>
                  </div>
                  <div className={styles.metricInfo}>
                    <span className={styles.metricLabel}>Tổng số đánh giá</span>
                    <span className={styles.metricValue}>{selectedDoctor.reviewCount || 0}</span>
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricIcon}>
                    <i className="bi bi-calendar3"></i>
                  </div>
                  <div className={styles.metricInfo}>
                    <span className={styles.metricLabel}>Số năm kinh nghiệm</span>
                    <span className={styles.metricValue}>{selectedDoctor.yearsOfExperience || 0}</span>
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricIcon}>
                    <i className="bi bi-mortarboard"></i>
                  </div>
                  <div className={styles.metricInfo}>
                    <span className={styles.metricLabel}>Trình độ học vấn</span>
                    <span className={styles.metricValue} style={{ fontSize: '0.9rem' }}>
                      {getEducationLabel(selectedDoctor.education)}
                    </span>
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricIcon}>
                    <i className="bi bi-clipboard-check"></i>
                  </div>
                  <div className={styles.metricInfo}>
                    <span className={styles.metricLabel}>Trường hợp thành công</span>
                    <span className={styles.metricValue}>
                      {selectedDoctor.successfulCases || 0}/{selectedDoctor.totalCases || 0}
                    </span>
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricIcon}>
                    <i className="bi bi-percent"></i>
                  </div>
                  <div className={styles.metricInfo}>
                    <span className={styles.metricLabel}>Tỷ lệ thành công</span>
                    <span className={styles.metricValue}>
                      {selectedDoctor.formattedSuccessRate || '0%'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.performanceSection}>
                <h4>
                  <i className="bi bi-graph-up"></i>
                  Điểm hiệu suất
                </h4>
                <div className={styles.performanceBarLarge}>
                  <div 
                    className={styles.performanceBarFill}
                    style={{ 
                      width: `${selectedDoctor.performanceScore}%`,
                      background: getPerformanceColor(selectedDoctor.performanceScore)
                    }}
                  >
                    <span>{selectedDoctor.performanceScore}/100</span>
                  </div>
                </div>
              </div>

              <div className={styles.recommendationSection}>
                <h4>
                  <i className="bi bi-lightbulb"></i>
                  Đề xuất
                </h4>
                <div className={`${styles.recommendationBox} ${styles[selectedDoctor.recommendationType]}`}>
                  <span className={styles.recIcon}>
                    {getRecommendationIcon(selectedDoctor.recommendationType)}
                  </span>
                  <p>{selectedDoctor.recommendation}</p>
                </div>
              </div>

              {selectedDoctor.recommendationType === 'both' && (
                <div className={styles.actionSection}>
                  <button 
                    className={styles.bothBtn}
                    onClick={() => {
                      setUpdateType('both');
                      setUpdateModalDoctor(selectedDoctor);
                      setSelectedDoctor(null);
                    }}
                  >
                    <i className="bi bi-stars"></i>
                    Tăng lương & Nâng cấp học vấn
                  </button>
                </div>
              )}

              {selectedDoctor.recommendationType === 'salary' && (
                <div className={styles.actionSection}>
                  <button 
                    className={styles.salaryBtn}
                    onClick={() => {
                      setUpdateType('salary');
                      setUpdateModalDoctor(selectedDoctor);
                      setSelectedDoctor(null);
                    }}
                  >
                    <i className="bi bi-cash-coin"></i>
                    Điều chỉnh lương
                  </button>
                </div>
              )}

              {selectedDoctor.recommendationType === 'education' && (
                <div className={styles.actionSection}>
                  <button 
                    className={styles.educationBtn}
                    onClick={() => {
                      setUpdateType('education');
                      setUpdateModalDoctor(selectedDoctor);
                      setSelectedDoctor(null);
                    }}
                  >
                    <i className="bi bi-mortarboard-fill"></i>
                    Cập nhật trình độ học vấn
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {updateModalDoctor && (
        <DoctorUpdateModal
          doctor={updateModalDoctor}
          degrees={degrees}
          onClose={() => setUpdateModalDoctor(null)}
          onSubmit={handleUpdateSubmit}
          updateType={updateType}
        />
      )}
    </div>
  );
}

