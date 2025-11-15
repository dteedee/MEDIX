import React, { useState } from 'react';
import styles from '../../styles/manager/DoctorReviewModal.module.css';

interface Props {
  doctor: any;
  degrees: any[];
  onClose: () => void;
  onSubmit: (approved: boolean, data: any) => Promise<void>;
  isLoading: boolean;
}

export default function DoctorReviewModal({ doctor, degrees, onClose, onSubmit, isLoading }: Props) {
  const [reviewMode, setReviewMode] = useState<'view' | 'approve' | 'reject'>('view');
  const [formData, setFormData] = useState({
    education: '',
    rejectReason: '',
    consultationFee: 0,
  });
  const [errors, setErrors] = useState<any>({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getGender = (code?: string) => {
    if (code === 'Male') return 'Nam';
    if (code === 'Female') return 'Nữ';
    if (code === 'Other') return 'Khác';
    return 'Chưa có';
  };

  const handleShowImage = (url: string) => {
    setModalImageUrl(url);
    setShowImageModal(true);
  };

  const handleApprove = async () => {
    let error = false;
    let newErrors = {
      education: '',
      consultationFee: '',
    };

    if (!formData.education) {
      newErrors.education = 'Vui lòng chọn trình độ học vấn';
      //setErrors({ ...errors, education: 'Vui lòng chọn trình độ học vấn' });
      error = true;
    }

    if (!formData.consultationFee || formData.consultationFee <= 0) {
      newErrors.consultationFee = 'Vui lòng nhập giá khám là số dương';
      //setErrors({ ...errors, consultationFee: 'Vui lòng nhập giá khám là số dương' });
      error = true;
    }

    if (error) {
      setErrors({ ...errors, ...newErrors });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(true, {
        isApproved: true,
        education: formData.education,
        consultationFee: formData.consultationFee,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!formData.rejectReason.trim()) {
      setErrors({ rejectReason: 'Vui lòng nhập lý do từ chối' });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(false, {
        isApproved: false,
        rejectReason: formData.rejectReason
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h2 className={styles.title}>
              <i className="bi bi-clipboard-check"></i>
              Phê duyệt hồ sơ bác sĩ
            </h2>
            <button onClick={onClose} className={styles.closeButton}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}></div>
              <p>Đang tải chi tiết...</p>
            </div>
          ) : (
            <>
              <div className={styles.content}>
                {/* Doctor Info */}
                <div className={styles.doctorCard}>
                  <img
                    src={doctor.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.fullName)}&background=667eea&color=fff`}
                    alt={doctor.fullName}
                    className={styles.doctorAvatar}
                  />
                  <div className={styles.doctorInfo}>
                    <h3>{doctor.fullName}</h3>
                    <p className={styles.email}>{doctor.email}</p>
                    <p className={styles.specialty}>
                      <i className="bi bi-hospital"></i>
                      {doctor.specialization}
                    </p>
                  </div>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                  <button
                    className={`${styles.tab} ${reviewMode === 'view' ? styles.tabActive : ''}`}
                    onClick={() => setReviewMode('view')}
                  >
                    <i className="bi bi-info-circle"></i>
                    Thông tin
                  </button>
                  <button
                    className={`${styles.tab} ${reviewMode === 'approve' ? styles.tabActive : ''}`}
                    onClick={() => setReviewMode('approve')}
                  >
                    <i className="bi bi-check-circle"></i>
                    Chấp nhận
                  </button>
                  <button
                    className={`${styles.tab} ${reviewMode === 'reject' ? styles.tabActive : ''}`}
                    onClick={() => setReviewMode('reject')}
                  >
                    <i className="bi bi-x-circle"></i>
                    Từ chối
                  </button>
                </div>

                {/* View Mode */}
                {reviewMode === 'view' && (
                  <div className={styles.viewMode}>
                    <div className={styles.infoSection}>
                      <h4>
                        <i className="bi bi-person"></i>
                        Thông tin cá nhân
                      </h4>
                      <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                          <label>Tên đăng nhập</label>
                          <span>{doctor.userName}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <label>Ngày sinh</label>
                          <span>{doctor.dob ? new Date(doctor.dob).toLocaleDateString('vi-VN') : 'Chưa có'}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <label>Giới tính</label>
                          <span>{getGender(doctor.gender)}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <label>Số điện thoại</label>
                          <span>{doctor.phoneNumber}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <label>Số CMND/CCCD</label>
                          <span>{doctor.identificationNumber}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <label>Ảnh CCCD</label>
                          <a
                            className={styles.btnDownload}
                            href={doctor.identityCardImageUrl}
                            download
                          >
                            <i className="bi bi-download"></i>
                            Tải về
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className={styles.infoSection}>
                      <h4>
                        <i className="bi bi-briefcase"></i>
                        Thông tin nghề nghiệp
                      </h4>
                      <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                          <label>Chuyên khoa</label>
                          <span className={styles.specialtyBadge}>{doctor.specialization}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <label>Kinh nghiệm</label>
                          <span>{doctor.yearsOfExperience} năm</span>
                        </div>
                        <div className={styles.infoItem}>
                          <label>Số giấy phép hành nghề</label>
                          <span>{doctor.licenseNumber}</span>
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
                      </div>
                      {doctor.bio && (
                        <div className={styles.infoItem} style={{ marginTop: '16px' }}>
                          <label>Tiểu sử</label>
                          <p className={styles.bioText}>{doctor.bio}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Approve Mode */}
                {reviewMode === 'approve' && (
                  <div className={styles.approveMode}>
                    <div className={styles.formGroup}>
                      <label>
                        Trình độ học vấn bác sĩ <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.degreeOptions}>
                        {degrees.map(degree => (
                          <label key={degree.code} className={styles.degreeOption}>
                            <input
                              type="radio"
                              name="education"
                              value={degree.code}
                              checked={formData.education === degree.code}
                              onChange={(e) => {
                                setFormData({ ...formData, education: e.target.value });
                                setErrors({ ...errors, education: '' });
                              }}
                            />
                            <span>{degree.description}</span>
                          </label>
                        ))}
                      </div>
                      {errors.education && (
                        <div className={styles.error}>{errors.education}</div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>
                        Giá khám <span className={styles.required}>*</span>
                      </label>
                      <input
                        type='number'
                        className={styles.textarea}
                        placeholder="Giá khám..."
                        value={formData.consultationFee}
                        onChange={(e) => {
                          const fee = parseFloat(e.target.value); // or Number(e.target.value)
                          setFormData({ ...formData, consultationFee: isNaN(fee) ? 0 : fee });
                          setErrors({ ...errors, consultationFee: '' });
                        }}
                      />
                      {errors.consultationFee && (
                        <div className={styles.error}>{errors.consultationFee}</div>
                      )}
                    </div>

                    <div className={styles.infoBox}>
                      <i className="bi bi-info-circle"></i>
                      <p>Sau khi chấp nhận, hồ sơ bác sĩ sẽ được kích hoạt và bác sĩ có thể bắt đầu sử dụng hệ thống.</p>
                    </div>
                  </div>
                )}

                {/* Reject Mode */}
                {reviewMode === 'reject' && (
                  <div className={styles.rejectMode}>
                    <div className={styles.formGroup}>
                      <label>
                        Lý do từ chối <span className={styles.required}>*</span>
                      </label>
                      <textarea
                        className={styles.textarea}
                        rows={5}
                        placeholder="Nhập lý do từ chối hồ sơ..."
                        value={formData.rejectReason}
                        onChange={(e) => {
                          setFormData({ ...formData, rejectReason: e.target.value });
                          setErrors({ ...errors, rejectReason: '' });
                        }}
                      />
                      {errors.rejectReason && (
                        <div className={styles.error}>{errors.rejectReason}</div>
                      )}
                    </div>

                    <div className={styles.warningBox}>
                      <i className="bi bi-exclamation-triangle"></i>
                      <p>Lý do từ chối sẽ được gửi đến bác sĩ qua email. Vui lòng cung cấp lý do rõ ràng và chi tiết.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.footer}>
                <button
                  className={styles.btnCancel}
                  onClick={onClose}
                  disabled={submitting}
                >
                  <i className="bi bi-x-lg"></i>
                  Hủy
                </button>

                {reviewMode === 'approve' && (
                  <button
                    className={styles.btnApprove}
                    onClick={handleApprove}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className={styles.btnSpinner}></div>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg"></i>
                        Chấp nhận hồ sơ
                      </>
                    )}
                  </button>
                )}

                {reviewMode === 'reject' && (
                  <button
                    className={styles.btnReject}
                    onClick={handleReject}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className={styles.btnSpinner}></div>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-x-lg"></i>
                        Từ chối hồ sơ
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
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