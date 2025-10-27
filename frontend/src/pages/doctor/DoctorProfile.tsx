import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import doctorService from '../../services/doctorService';
import styles from '../../styles/doctor/DoctorProfile.module.css';

interface DoctorProfileData {
  userName: string;
  email: string;
  avatarUrl: string;
  phoneNumber: string;
  fullName: string;
  dateOfBirth: string;
  address: string;
  education: string;
  bio: string;
  yearsOfExperience: number;
  consultationFee: string;
  specialization?: string;
  licenseNumber?: string;
  licenseUrl?: string;
  certifications?: string;
  gender?: string;
  identificationNumber?: string;
}

const DoctorProfile: React.FC = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<DoctorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await doctorService.getDoctorProfileDetails();
      setProfileData(data);
    } catch (err: any) {
      console.error('Error fetching profile data:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Chưa cập nhật';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: string | number) => {
    if (!amount) return 'Chưa cập nhật';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(numAmount);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Đang tải thông tin hồ sơ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>
          <i className="bi bi-exclamation-triangle"></i>
        </div>
        <h3>Không thể tải thông tin hồ sơ</h3>
        <p>{error}</p>
        <button onClick={fetchProfileData} className={styles.retryBtn}>
          Thử lại
        </button>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>
          <i className="bi bi-person-x"></i>
        </div>
        <h3>Không tìm thấy thông tin hồ sơ</h3>
        <p>Vui lòng liên hệ quản trị viên để được hỗ trợ.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Thông tin cá nhân</h1>
          <p className={styles.subtitle}>Xem và quản lý thông tin hồ sơ của bạn</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.editBtn}>
            <i className="bi bi-pencil"></i>
            Chỉnh sửa
          </button>
        </div>
      </div>

      {/* Profile Overview */}
      <div className={styles.profileOverview}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarContainer}>
            <img 
              src={profileData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.fullName || 'Doctor')}&background=667eea&color=fff`}
              alt={profileData.fullName}
              className={styles.avatar}
            />
            <div className={styles.avatarOverlay}>
              <i className="bi bi-camera"></i>
            </div>
          </div>
          <div className={styles.basicInfo}>
            <h2 className={styles.doctorName}>{profileData.fullName}</h2>
            <p className={styles.doctorTitle}>Bác sĩ</p>
            <p className={styles.doctorSpecialty}>{profileData.specialization || 'Chưa cập nhật'}</p>
            <div className={styles.rating}>
              <div className={styles.stars}>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
              </div>
              <span className={styles.ratingText}>4.8 (124 đánh giá)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className={styles.detailsGrid}>
        {/* Personal Information */}
        <div className={styles.detailCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <i className="bi bi-person"></i>
            </div>
            <h3 className={styles.cardTitle}>Thông tin cá nhân</h3>
          </div>
          <div className={styles.detailList}>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>
                <i className="bi bi-person-circle"></i>
                Họ và tên
              </div>
              <div className={styles.detailValue}>{profileData.fullName}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>
                <i className="bi bi-person-badge"></i>
                Tên đăng nhập
              </div>
              <div className={styles.detailValue}>{profileData.userName}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>
                <i className="bi bi-calendar-date"></i>
                Ngày sinh
              </div>
              <div className={styles.detailValue}>{formatDate(profileData.dateOfBirth)}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>
                <i className="bi bi-gender-ambiguous"></i>
                Giới tính
              </div>
              <div className={styles.detailValue}>{profileData.gender || 'Chưa cập nhật'}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>
                <i className="bi bi-card-text"></i>
                CCCD/CMND
              </div>
              <div className={styles.detailValue}>{profileData.identificationNumber || 'Chưa cập nhật'}</div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className={styles.detailCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <i className="bi bi-telephone"></i>
            </div>
            <h3 className={styles.cardTitle}>Thông tin liên hệ</h3>
          </div>
          <div className={styles.detailList}>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>
                <i className="bi bi-envelope"></i>
                Email
              </div>
              <div className={styles.detailValue}>{profileData.email}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>
                <i className="bi bi-phone"></i>
                Số điện thoại
              </div>
              <div className={styles.detailValue}>{profileData.phoneNumber || 'Chưa cập nhật'}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>
                <i className="bi bi-geo-alt"></i>
                Địa chỉ
              </div>
              <div className={styles.detailValue}>{profileData.address || 'Chưa cập nhật'}</div>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className={styles.detailCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <i className="bi bi-briefcase"></i>
            </div>
            <h3 className={styles.cardTitle}>Thông tin nghề nghiệp</h3>
          </div>
          <div className={styles.detailList}>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>
                <i className="bi bi-hospital"></i>
                Chuyên khoa
              </div>
              <div className={styles.detailValue}>{profileData.specialization || 'Chưa cập nhật'}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>
                <i className="bi bi-award"></i>
                Số chứng chỉ
              </div>
              <div className={styles.detailValue}>{profileData.licenseNumber || 'Chưa cập nhật'}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>
                <i className="bi bi-file-earmark-text"></i>
                Chứng chỉ làm việc
              </div>
              <div className={styles.detailValue}>
                {profileData.licenseUrl ? (
                  <a href={profileData.licenseUrl} target="_blank" rel="noopener noreferrer" className={styles.downloadLink}>
                    <i className="bi bi-download"></i>
                    Tải xuống
                  </a>
                ) : (
                  'Chưa cập nhật'
                )}
              </div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>
                <i className="bi bi-file-earmark-zip"></i>
                Bằng cấp
              </div>
              <div className={styles.detailValue}>
                {profileData.certifications ? (
                  <a href={profileData.certifications} target="_blank" rel="noopener noreferrer" className={styles.downloadLink}>
                    <i className="bi bi-download"></i>
                    Tải xuống
                  </a>
                ) : (
                  'Chưa cập nhật'
                )}
              </div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>
                <i className="bi bi-clock-history"></i>
                Số năm kinh nghiệm
              </div>
              <div className={styles.detailValue}>{profileData.yearsOfExperience || 0} năm</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>
                <i className="bi bi-currency-dollar"></i>
                Phí tư vấn
              </div>
              <div className={styles.detailValue}>{formatCurrency(profileData.consultationFee)}</div>
            </div>
          </div>
        </div>

        {/* Education & Biography */}
        <div className={styles.detailCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <i className="bi bi-mortarboard"></i>
            </div>
            <h3 className={styles.cardTitle}>Học vấn & Tiểu sử</h3>
          </div>
          <div className={styles.detailList}>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>
                <i className="bi bi-book"></i>
                Trình độ học vấn
              </div>
              <div className={styles.detailValue}>{profileData.education || 'Chưa cập nhật'}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>
                <i className="bi bi-file-text"></i>
                Tiểu sử
              </div>
              <div className={styles.detailValue}>
                <div className={styles.bioText}>
                  {profileData.bio || 'Chưa cập nhật tiểu sử cá nhân.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
