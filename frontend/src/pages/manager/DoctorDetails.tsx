import React, { useState } from 'react';
import styles from '../../styles/manager/DoctorDetails.module.css';

interface Props {
  doctor: any;
  onClose: () => void;
  isLoading: boolean;
  isPending?: boolean;
}

export default function DoctorDetails({ doctor, onClose, isLoading, isPending = false }: Props) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');

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
                        <label>Họ và tên</label>
                        <span>{doctor.fullName || 'Chưa có'}</span>
                      </div>
                      {isPending && (
                        <div className={styles.infoItem}>
                          <label>Tên đăng nhập</label>
                          <span>{doctor.userName || 'Chưa có'}</span>
                        </div>
                      )}
                      <div className={styles.infoItem}>
                        <label>Email</label>
                        <span>{doctor.email}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <label>Số điện thoại</label>
                        <span>{doctor.phoneNumber || 'Chưa có'}</span>
                      </div>
                      {isPending && (
                        <>
                          <div className={styles.infoItem}>
                            <label>Ngày sinh</label>
                            <span>{doctor.dob ? new Date(doctor.dob).toLocaleDateString('vi-VN') : 'Chưa có'}</span>
                          </div>
                          <div className={styles.infoItem}>
                            <label>Giới tính</label>
                            <span>{getGender(doctor.gender)}</span>
                          </div>
                          <div className={styles.infoItem}>
                            <label>Số CMND/CCCD</label>
                            <span>{doctor.identificationNumber || 'Chưa có'}</span>
                          </div>
                          <div className={styles.infoItem}>
                            <label>Ảnh CCCD</label>
                            <button 
                              className={styles.btnImage}
                              onClick={() => handleShowImage(doctor.identityCardImageUrl)}
                            >
                              <i className="bi bi-image"></i>
                              Xem ảnh
                            </button>
                          </div>
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
                        <label>Chuyên khoa</label>
                        <span className={styles.specialtyBadge}>{doctor.specialization || 'Chưa có'}</span>
                      </div>
                      {doctor.education && (
                        <div className={styles.infoItem}>
                          <label>Học vị</label>
                          <span>{doctor.education}</span>
                        </div>
                      )}
                      <div className={styles.infoItem}>
                        <label>Kinh nghiệm</label>
                        <span>{doctor.yearsOfExperience || 0} năm</span>
                      </div>
                      {isPending && (
                        <>
                          <div className={styles.infoItem}>
                            <label>Số giấy phép hành nghề</label>
                            <span>{doctor.licenseNumber || 'Chưa có'}</span>
                          </div>
                          <div className={styles.infoItem}>
                            <label>Ảnh chứng chỉ hành nghề</label>
                            <button 
                              className={styles.btnImage}
                              onClick={() => handleShowImage(doctor.licenseImageUrl)}
                            >
                              <i className="bi bi-image"></i>
                              Xem ảnh
                            </button>
                          </div>
                          <div className={styles.infoItem}>
                            <label>Tệp bằng cấp</label>
                            <a 
                              href={doctor.degreeFilesUrl} 
                              download 
                              className={styles.btnDownload}
                            >
                              <i className="bi bi-download"></i>
                              Tải về
                            </a>
                          </div>
                        </>
                      )}
                      {!isPending && (
                        <div className={styles.infoItem}>
                          <label>Đánh giá</label>
                          <div className={styles.ratingDisplay}>
                            <span className={styles.ratingStars}>{getRatingStars(doctor.rating || 0)}</span>
                            <span className={styles.ratingValue}>{(doctor.rating || 0).toFixed(1)}</span>
                            <span className={styles.reviewCount}>({doctor.reviewCount || 0} đánh giá)</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {doctor.bio && (
                      <div className={styles.infoItem} style={{ marginTop: '16px' }}>
                        <label>Tiểu sử</label>
                        <p className={styles.bioText}>{doctor.bio}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* System Information */}
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <i className="bi bi-gear"></i>
                    <h3>Thông tin hệ thống</h3>
                  </div>
                  <div className={styles.sectionContent}>
                    <div className={styles.infoGrid}>
                      <div className={styles.infoItem}>
                        <label>Ngày tạo</label>
                        <span>{fmtDate(doctor.createdAt)}</span>
                      </div>
                      {doctor.updatedAt && (
                        <div className={styles.infoItem}>
                          <label>Cập nhật lần cuối</label>
                          <span>{fmtDate(doctor.updatedAt)}</span>
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