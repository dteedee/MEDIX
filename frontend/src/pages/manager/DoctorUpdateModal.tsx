import React, { useState, useEffect } from 'react';
import styles from '../../styles/manager/DoctorUpdateModal.module.css';

interface Props {
  doctor: any;
  degrees: any[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  updateType: 'salary' | 'education' | 'both';
}

export default function DoctorUpdateModal({ doctor, degrees, onClose, onSubmit, updateType }: Props) {
  const [formData, setFormData] = useState({
    education: doctor.education || '',
    consultationFee: doctor.consultationFee || 0,
  });
  const [errors, setErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      education: doctor.education || '',
      consultationFee: doctor.consultationFee || 0,
    });
  }, [doctor]);

  const getEducationLabel = (educationCode?: string): string => {
    if (!educationCode) return 'Chưa có';
    const degree = degrees.find((d: any) => d.code === educationCode);
    return degree ? degree.description : educationCode;
  };

  const handleSubmit = async () => {
    let error = false;
    let newErrors = {
      education: '',
      consultationFee: '',
    };

    // Kiểm tra ít nhất một trong hai trường phải được thay đổi
    const educationChanged = formData.education && formData.education !== doctor.education;
    const feeChanged = formData.consultationFee && formData.consultationFee !== doctor.consultationFee;

    if (!educationChanged && !feeChanged) {
      newErrors.education = 'Vui lòng thay đổi ít nhất một thông tin (trình độ hoặc giá khám)';
      error = true;
    }

    // Validate consultationFee nếu có nhập
    if (formData.consultationFee && formData.consultationFee <= 0) {
      newErrors.consultationFee = 'Giá khám phải là số dương';
      error = true;
    }

    if (error) {
      setErrors({ ...errors, ...newErrors });
      return;
    }

    setSubmitting(true);
    try {
      const updateData: any = {};
      
      // Chỉ gửi các trường đã thay đổi
      if (formData.education && formData.education !== doctor.education) {
        updateData.education = formData.education;
      }
      
      if (formData.consultationFee && formData.consultationFee !== doctor.consultationFee) {
        updateData.consultationFee = formData.consultationFee;
      }

      await onSubmit(updateData);
    } finally {
      setSubmitting(false);
    }
  };

  const getTitle = () => {
    return 'Cập nhật trình độ học vấn hoặc giá khám';
  };

  const getIcon = () => {
    return 'bi-pencil-square';
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <i className={`bi ${getIcon()}`}></i>
            {getTitle()}
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

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

          {/* Current Info */}
          <div className={styles.currentInfo}>
            <h4>
              <i className="bi bi-info-circle"></i>
              Thông tin hiện tại
            </h4>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Trình độ học vấn</label>
                <span className={styles.educationBadge}>
                  {getEducationLabel(doctor.education)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <label>Giá khám hiện tại</label>
                <span className={styles.feeBadge}>
                  {(doctor.consultationFee || 0).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              <div className={styles.infoItem}>
                <label>Kinh nghiệm</label>
                <span>{doctor.yearsOfExperience || 0} năm</span>
              </div>
              <div className={styles.infoItem}>
                <label>Đánh giá</label>
                <span>
                  <i className="bi bi-star-fill" style={{ color: '#fbbf24' }}></i>
                  {(doctor.rating || 0).toFixed(1)} ({doctor.reviewCount || 0} đánh giá)
                </span>
              </div>
            </div>
          </div>

          {/* Performance Info */}
          {doctor.performanceScore !== undefined && (
            <div className={styles.performanceInfo}>
              <h4>
                <i className="bi bi-graph-up-arrow"></i>
                Hiệu suất
              </h4>
              <div className={styles.performanceGrid}>
                <div className={styles.performanceItem}>
                  <label>Điểm hiệu suất</label>
                  <div className={styles.performanceScore}>
                    <div className={styles.scoreCircle}>
                      {doctor.performanceScore}
                    </div>
                    <span>/100</span>
                  </div>
                </div>
                {doctor.successRate !== undefined && (
                  <div className={styles.performanceItem}>
                    <label>Tỷ lệ thành công</label>
                    <div className={styles.successRate}>
                      <i className="bi bi-check-circle-fill" style={{ color: '#10b981' }}></i>
                      <span>{doctor.formattedSuccessRate || '0%'}</span>
                      <span className={styles.cases}>
                        ({doctor.successfulCases || 0}/{doctor.totalCases || 0})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Update Form */}
          <div className={styles.updateForm}>
            <h4>
              <i className="bi bi-pencil-square"></i>
              Thông tin cập nhật
            </h4>

            {/* Education Section */}
            <div className={styles.formGroup}>
              <label>
                Trình độ học vấn mới
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

            {/* Consultation Fee Section */}
            <div className={styles.formGroup}>
              <label>
                Giá khám mới (VNĐ)
              </label>
                <div className={styles.feeInputWrapper}>
                  <i className="bi bi-cash-stack"></i>
                  <input
                    type='number'
                    className={styles.feeInput}
                    placeholder="Nhập giá khám mới..."
                    value={formData.consultationFee}
                    onChange={(e) => {
                      const fee = parseFloat(e.target.value);
                      setFormData({ ...formData, consultationFee: isNaN(fee) ? 0 : fee });
                      setErrors({ ...errors, consultationFee: '' });
                    }}
                  />
                  <span className={styles.currency}>VNĐ</span>
                </div>
                
                {/* Quick adjustment buttons */}
                <div className={styles.quickAdjust}>
                  <span className={styles.quickAdjustLabel}>Điều chỉnh nhanh:</span>
                  <div className={styles.quickAdjustButtons}>
                    <button
                      type="button"
                      className={styles.quickBtn}
                      onClick={() => {
                        const newFee = (formData.consultationFee || 0) + 50000;
                        setFormData({ ...formData, consultationFee: newFee });
                        setErrors({ ...errors, consultationFee: '' });
                      }}
                    >
                      <i className="bi bi-plus-circle"></i>
                      +50K
                    </button>
                    <button
                      type="button"
                      className={styles.quickBtn}
                      onClick={() => {
                        const newFee = (formData.consultationFee || 0) + 100000;
                        setFormData({ ...formData, consultationFee: newFee });
                        setErrors({ ...errors, consultationFee: '' });
                      }}
                    >
                      <i className="bi bi-plus-circle"></i>
                      +100K
                    </button>
                    <button
                      type="button"
                      className={styles.quickBtn}
                      onClick={() => {
                        const newFee = (formData.consultationFee || 0) + 200000;
                        setFormData({ ...formData, consultationFee: newFee });
                        setErrors({ ...errors, consultationFee: '' });
                      }}
                    >
                      <i className="bi bi-plus-circle"></i>
                      +200K
                    </button>
                    <button
                      type="button"
                      className={`${styles.quickBtn} ${styles.quickBtnReset}`}
                      onClick={() => {
                        setFormData({ ...formData, consultationFee: doctor.consultationFee || 0 });
                        setErrors({ ...errors, consultationFee: '' });
                      }}
                    >
                      <i className="bi bi-arrow-counterclockwise"></i>
                      Reset
                    </button>
                  </div>
                </div>

                {formData.consultationFee > 0 && (
                  <div className={styles.feePreview}>
                    Định dạng: {formData.consultationFee.toLocaleString('vi-VN')} VNĐ
                    {doctor.consultationFee && formData.consultationFee !== doctor.consultationFee && (
                      <span className={styles.feeChange}>
                        {formData.consultationFee > doctor.consultationFee ? '↑' : '↓'}
                        {' '}
                        {Math.abs(formData.consultationFee - doctor.consultationFee).toLocaleString('vi-VN')} VNĐ
                      </span>
                    )}
                  </div>
                )}
              {errors.consultationFee && (
                <div className={styles.error}>{errors.consultationFee}</div>
              )}
            </div>

            <div className={styles.infoBox}>
              <i className="bi bi-info-circle"></i>
              <p>
                Bạn có thể cập nhật trình độ học vấn, giá khám hoặc cả hai. 
                Vui lòng thay đổi ít nhất một thông tin trước khi xác nhận.
              </p>
            </div>
          </div>
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

          <button
            className={styles.btnSubmit}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className={styles.btnSpinner}></div>
                Đang cập nhật...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg"></i>
                Xác nhận cập nhật
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

