import React, { useState, useEffect } from 'react';
import styles from '../../styles/manager/DoctorDetails.module.css';
import DoctorDegreeService from '../../services/doctorDegreeService';
import { DoctorDegree } from '../../types/education.types';

interface Props {
  doctor: any;
  onClose: () => void;
  isLoading: boolean;
  isPending?: boolean;
}

export default function DoctorDetails({ doctor, onClose, isLoading, isPending = false }: Props) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [degrees, setDegrees] = useState<DoctorDegree[]>([]);

  useEffect(() => {
    const loadDegrees = async () => {
      try {
        const data = await DoctorDegreeService.getAll();
        setDegrees(data || []);
      } catch (error) {
        console.error("Failed to load degrees:", error);
      }
    };
    loadDegrees();
  }, []);

  if (!doctor) return null;

  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleString('vi-VN') : 'Chưa có';
  
  const getGender = (code?: string) => {
    if (code === 'Male') return 'Nam';
    if (code === 'Female') return 'Nữ';
    if (code === 'Other') return 'Khác';
    return 'Chưa có';
  };

  const getRatingStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  const getEducationLabel = (educationCode?: string): string => {
    if (!educationCode) return 'Chưa có';
    
    // Try to find matching degree description
    const degree = degrees.find(d => d.code === educationCode);
    if (degree) {
      return degree.description;
    }
    
    // If not found, return the code as is (might be already a description)
    return educationCode;
  };

  const handleShowImage = (url: string) => {
    setModalImageUrl(url);
    setShowImageModal(true);
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.headerLeft}>
                <div className={styles.doctorAvatar}>
                  <img 
                    src={doctor.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.fullName)}&background=667eea&color=fff`}
                    alt="Avatar" 
                  />
                </div>
                <div className={styles.doctorInfo}>
                  <h2 className={styles.title}>{doctor.fullName || 'Chưa có tên'}</h2>
                  <p className={styles.subtitle}>{doctor.email}</p>
                  {!isPending && (
                    <div className={styles.statusBadge}>
                      <span className={`${styles.statusDot} ${doctor.statusCode === 1 ? styles.statusActive : styles.statusInactive}`}></span>
                      <span>{doctor.statusCode === 1 ? 'Đang hoạt động' : 'Ngừng hoạt động'}</span>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={onClose} className={styles.closeButton}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}></div>
              <p>Đang tải chi tiết...</p>
            </div>
          ) : (
            <div className={styles.content}>
              <div className={styles.sections}>
                {/* Personal Information */}
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <i className="bi bi-person"></i>
                    <h3>Thông tin cá nhân</h3>
                  </div>
                  <div className={styles.sectionContent}>
                    <div className={styles.infoGrid}>
                      <div className={styles.infoItem}>
                        <label>
                          <i className="bi bi-person-badge"></i>
                          Họ và tên
                        </label>
                        <span className={styles.valueHighlight}>{doctor.fullName || 'Chưa có'}</span>
                      </div>
                      {isPending && (
                        <div className={styles.infoItem}>
                          <label>
                            <i className="bi bi-person-circle"></i>
                            Tên đăng nhập
                          </label>
                          <span>{doctor.userName || 'Chưa có'}</span>
                        </div>
                      )}
                      <div className={styles.infoItem}>
                        <label>
                          <i className="bi bi-envelope"></i>
                          Email
                        </label>
                        <span>{doctor.email || 'Chưa có'}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <label>
                          <i className="bi bi-telephone"></i>
                          Số điện thoại
                        </label>
                        <span>{doctor.phoneNumber || 'Chưa có'}</span>
                      </div>
                      {!isPending && doctor.address && (
                        <div className={styles.infoItem}>
                          <label>
                            <i className="bi bi-geo-alt"></i>
                            Địa chỉ
                          </label>
                          <span>{doctor.address}</span>
                        </div>
                      )}
                      {(isPending || doctor.dob) && (
                        <div className={styles.infoItem}>
                          <label>
                            <i className="bi bi-calendar-event"></i>
                            Ngày sinh
                          </label>
                          <span>{doctor.dob ? new Date(doctor.dob).toLocaleDateString('vi-VN') : 'Chưa có'}</span>
                        </div>
                      )}
                      {(isPending || doctor.gender || doctor.genderCode) && (
                        <div className={styles.infoItem}>
                          <label>
                            <i className="bi bi-gender-ambiguous"></i>
                            Giới tính
                          </label>
                          <span>{getGender(doctor.gender || doctor.genderCode)}</span>
                        </div>
                      )}
                      {(isPending || doctor.identificationNumber) && (
                        <>
                          <div className={styles.infoItem}>
                            <label>
                              <i className="bi bi-card-text"></i>
                              Số CMND/CCCD
                            </label>
                            <span>{doctor.identificationNumber || 'Chưa có'}</span>
                          </div>
                          {doctor.identityCardImageUrl && (
                            <div className={styles.infoItem}>
                              <label>
                                <i className="bi bi-image"></i>
                                Ảnh CMND/CCCD
                              </label>
                              <button 
                                className={styles.btnImage}
                                onClick={() => handleShowImage(doctor.identityCardImageUrl)}
                              >
                                <i className="bi bi-eye"></i>
                                Xem ảnh
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <i className="bi bi-briefcase"></i>
                    <h3>Thông tin nghề nghiệp</h3>
                  </div>
                  <div className={styles.sectionContent}>
                    <div className={styles.infoGrid}>
                      <div className={styles.infoItem}>
                        <label>
                          <i className="bi bi-hospital"></i>
                          Chuyên khoa
                        </label>
                        <span className={styles.specialtyBadge}>{doctor.specialization || 'Chưa có'}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <label>
                          <i className="bi bi-mortarboard"></i>
                          Học vị / Bằng cấp
                        </label>
                        <span className={styles.educationBadge}>
                          {getEducationLabel(doctor.education)}
                        </span>
                      </div>
                      <div className={styles.infoItem}>
                        <label>
                          <i className="bi bi-calendar-check"></i>
                          Kinh nghiệm
                        </label>
                        <span>{doctor.yearsOfExperience || doctor.experience || 0} {doctor.yearsOfExperience || doctor.experience ? 'năm' : ''}</span>
                      </div>
                      {doctor.serviceTier && (
                        <div className={styles.infoItem}>
                          <label>
                            <i className="bi bi-star"></i>
                            Gói dịch vụ
                          </label>
                          <span className={styles.serviceTierBadge}>{doctor.serviceTier}</span>
                        </div>
                      )}
                      {doctor.price && (
                        <div className={styles.infoItem}>
                          <label>
                            <i className="bi bi-currency-dollar"></i>
                            Giá khám
                          </label>
                          <span className={styles.priceText}>
                            {Number(doctor.price || doctor.consultationFee || 0).toLocaleString('vi-VN')} VNĐ
                          </span>
                        </div>
                      )}
                      {(isPending || doctor.licenseNumber) && (
                        <div className={styles.infoItem}>
                          <label>
                            <i className="bi bi-file-earmark-medical"></i>
                            Số giấy phép hành nghề
                          </label>
                          <span>{doctor.licenseNumber || 'Chưa có'}</span>
                        </div>
                      )}
                      {doctor.licenseImageUrl && (
                        <div className={styles.infoItem}>
                          <label>
                            <i className="bi bi-image"></i>
                            Ảnh chứng chỉ hành nghề
                          </label>
                          <button 
                            className={styles.btnImage}
                            onClick={() => handleShowImage(doctor.licenseImageUrl)}
                          >
                            <i className="bi bi-eye"></i>
                            Xem ảnh
                          </button>
                        </div>
                      )}
                      {doctor.degreeFilesUrl && (
                        <div className={styles.infoItem}>
                          <label>
                            <i className="bi bi-file-earmark-pdf"></i>
                            Tệp bằng cấp / Chứng chỉ
                          </label>
                          <a 
                            href={doctor.degreeFilesUrl} 
                            download 
                            className={styles.btnDownload}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="bi bi-download"></i>
                            Tải về
                          </a>
                        </div>
                      )}
                    </div>
                    {doctor.bio && (
                      <div className={styles.infoItem} style={{ marginTop: '16px', gridColumn: '1 / -1' }}>
                        <label>
                          <i className="bi bi-file-text"></i>
                          Tiểu sử / Giới thiệu
                        </label>
                        <p className={styles.bioText}>{doctor.bio}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance & Reviews */}
                {!isPending && (
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <i className="bi bi-graph-up"></i>
                      <h3>Hiệu suất & Đánh giá</h3>
                    </div>
                    <div className={styles.sectionContent}>
                      <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                          <label>
                            <i className="bi bi-star-fill"></i>
                            Đánh giá trung bình
                          </label>
                          <div className={styles.ratingDisplay}>
                            <span className={styles.ratingStars}>{getRatingStars(doctor.rating || 0)}</span>
                            <span className={styles.ratingValue}>{(doctor.rating || 0).toFixed(1)}</span>
                            <span className={styles.ratingMax}>/ 5.0</span>
                          </div>
                        </div>
                        <div className={styles.infoItem}>
                          <label>
                            <i className="bi bi-chat-left-text"></i>
                            Tổng số đánh giá
                          </label>
                          <span className={styles.reviewCountBadge}>{doctor.reviewCount || 0} đánh giá</span>
                        </div>
                        {doctor.numberOfReviews !== undefined && doctor.numberOfReviews !== doctor.reviewCount && (
                          <div className={styles.infoItem}>
                            <label>
                              <i className="bi bi-chat-dots"></i>
                              Số lượt đánh giá
                            </label>
                            <span>{doctor.numberOfReviews}</span>
                          </div>
                        )}
                        {doctor.averageRating !== undefined && (
                          <div className={styles.infoItem}>
                            <label>
                              <i className="bi bi-star-half"></i>
                              Điểm trung bình
                            </label>
                            <span>{doctor.averageRating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* System Information */}
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <i className="bi bi-gear"></i>
                    <h3>Thông tin hệ thống</h3>
                  </div>
                  <div className={styles.sectionContent}>
                    <div className={styles.infoGrid}>
                      {doctor.id && (
                        <div className={styles.infoItem}>
                          <label>
                            <i className="bi bi-hash"></i>
                            ID bác sĩ
                          </label>
                          <span className={styles.idText}>{doctor.id}</span>
                        </div>
                      )}
                      {doctor.userId && (
                        <div className={styles.infoItem}>
                          <label>
                            <i className="bi bi-person-badge"></i>
                            ID tài khoản
                          </label>
                          <span className={styles.idText}>{doctor.userId}</span>
                        </div>
                      )}
                      <div className={styles.infoItem}>
                        <label>
                          <i className="bi bi-calendar-plus"></i>
                          Ngày đăng ký
                        </label>
                        <span>{fmtDate(doctor.createdAt)}</span>
                      </div>
                      {doctor.updatedAt && (
                        <div className={styles.infoItem}>
                          <label>
                            <i className="bi bi-clock-history"></i>
                            Cập nhật lần cuối
                          </label>
                          <span>{fmtDate(doctor.updatedAt)}</span>
                        </div>
                      )}
                      {!isPending && (
                        <div className={styles.infoItem}>
                          <label>
                            <i className="bi bi-toggle-on"></i>
                            Trạng thái tài khoản
                          </label>
                          <span className={`${styles.statusBadge} ${doctor.statusCode === 1 ? styles.statusActive : styles.statusInactive}`}>
                            <i className={`bi bi-${doctor.statusCode === 1 ? 'check-circle-fill' : 'x-circle-fill'}`}></i>
                            {doctor.statusCode === 1 ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                          </span>
                        </div>
                      )}
                      {doctor.isVerified !== undefined && (
                        <div className={styles.infoItem}>
                          <label>
                            <i className="bi bi-shield-check"></i>
                            Xác thực
                          </label>
                          <span className={doctor.isVerified ? styles.verified : styles.unverified}>
                            <i className={`bi bi-${doctor.isVerified ? 'shield-check' : 'shield-x'}`}></i>
                            {doctor.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className={styles.imageModalOverlay} onClick={() => setShowImageModal(false)}>
          <div className={styles.imageModal} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.imageModalClose}
              onClick={() => setShowImageModal(false)}
            >
              <i className="bi bi-x-lg"></i>
            </button>
            <img src={modalImageUrl} alt="Document" className={styles.imageModalContent} />
          </div>
        </div>
      )}
    </>
  );
}