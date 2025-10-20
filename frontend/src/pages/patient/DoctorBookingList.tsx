import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/common.types';

interface Doctor {
  id: string;
  fullName: string;
  degree: string; // Học vị
  specialty: string; // Chuyên khoa
  experience: string; // Kinh nghiệm
  rating: number; // Đánh giá (1-5)
  reviewCount: number; // Số lượt đánh giá
  price: number; // Mức giá
  tier: 'Basic' | 'Professional' | 'Premium' | 'VIP'; // Phân tier
  bio: string; // Đặc điểm
  imageUrl?: string; // Ảnh đại diện
}

interface DoctorTier {
  id: string;
  name: 'Basic' | 'Professional' | 'Premium' | 'VIP';
  description: string;
  priceMultiplier: number;
  discountPercent: number;
  maxBookingsPerDay: number;
  features: string[];
  monthlyFee: number;
  isActive: boolean;
}

const DoctorBookingList: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [currentBasicPage, setCurrentBasicPage] = useState(1);
  const [currentProfessionalPage, setCurrentProfessionalPage] = useState(1);
  const [currentPremiumPage, setCurrentPremiumPage] = useState(1);
  const [currentVipPage, setCurrentVipPage] = useState(1);
  const doctorsPerPage = 4;

  // Mock data theo 4 tier từ database
  const [basicDoctors] = useState<Doctor[]>([
    {
      id: '1',
      fullName: 'Phạm Quỳnh Anh',
      degree: 'Bác sĩ',
      specialty: 'Nội khoa',
      experience: '2+ năm kinh nghiệm',
      rating: 4.5,
      reviewCount: 45,
      price: 50000,
      tier: 'Basic',
      bio: 'Tư vấn sức khỏe tổng quát, khám bệnh cơ bản'
    },
    {
      id: '2',
      fullName: 'Trần Minh Hải',
      degree: 'Bác sĩ',
      specialty: 'Da liễu',
      experience: '3+ năm kinh nghiệm',
      rating: 4.6,
      reviewCount: 38,
      price: 50000,
      tier: 'Basic',
      bio: 'Điều trị bệnh da liễu thường gặp'
    }
  ]);

  const [professionalDoctors] = useState<Doctor[]>([
    {
      id: '3',
      fullName: 'Lê Thu Hằng',
      degree: 'Thạc sĩ, Bác sĩ',
      specialty: 'Nhi khoa',
      experience: '6+ năm kinh nghiệm',
      rating: 4.8,
      reviewCount: 156,
      price: 75000,
      tier: 'Professional',
      bio: 'Khám bệnh nhi, tư vấn dinh dưỡng trẻ em'
    },
    {
      id: '4',
      fullName: 'Nguyễn Văn Đức',
      degree: 'Thạc sĩ, Bác sĩ',
      specialty: 'Tai mũi họng',
      experience: '7+ năm kinh nghiệm',
      rating: 4.7,
      reviewCount: 203,
      price: 75000,
      tier: 'Professional',
      bio: 'Điều trị bệnh tai mũi họng, phẫu thuật nhỏ'
    }
  ]);

  const [premiumDoctors] = useState<Doctor[]>([
    {
      id: '5',
      fullName: 'Võ Minh Anh',
      degree: 'Tiến sĩ, Phó Giáo sư',
      specialty: 'Tim mạch',
      experience: '15+ năm kinh nghiệm',
      rating: 4.9,
      reviewCount: 324,
      price: 100000,
      tier: 'Premium',
      bio: 'Chuyên gia tim mạch hàng đầu, phẫu thuật tim'
    },
    {
      id: '6',
      fullName: 'Phạm Hoàng Lan',
      degree: 'Tiến sĩ, Phó Giáo sư',
      specialty: 'Ung bướu',
      experience: '18+ năm kinh nghiệm',
      rating: 5.0,
      reviewCount: 456,
      price: 100000,
      tier: 'Premium',
      bio: 'Chuyên gia ung thư, điều trị đa mô thức'
    }
  ]);

  const [vipDoctors] = useState<Doctor[]>([
    {
      id: '7',
      fullName: 'Lê Quang Nhật',
      degree: 'Tiến sĩ, Giáo sư',
      specialty: 'Thần kinh',
      experience: '20+ năm kinh nghiệm',
      rating: 5.0,
      reviewCount: 289,
      price: 150000,
      tier: 'VIP',
      bio: 'Chuyên gia thần kinh hàng đầu, phẫu thuật não'
    },
    {
      id: '8',
      fullName: 'Nguyễn Mai Lan',
      degree: 'Tiến sĩ, Giáo sư',
      specialty: 'Ngoại khoa',
      experience: '25+ năm kinh nghiệm',
      rating: 5.0,
      reviewCount: 512,
      price: 150000,
      tier: 'VIP',
      bio: 'Chuyên gia ngoại khoa quốc tế, phẫu thuật phức tạp'
    }
  ]);

  // Filter options
  const tierOptions = [
    { value: 'all', label: 'Tất cả gói khám' },
    { value: 'Basic', label: 'Gói Basic' },
    { value: 'Professional', label: 'Gói Professional' },
    { value: 'Premium', label: 'Gói Premium' },
    { value: 'VIP', label: 'Gói VIP' }
  ];

  const degreeOptions = [
    { value: 'all', label: 'Tất cả học vị' },
    { value: 'Bác sĩ', label: 'Bác sĩ' },
    { value: 'Thạc sĩ, Bác sĩ', label: 'Thạc sĩ, Bác sĩ' },
    { value: 'Tiến sĩ, Phó Giáo sư', label: 'Tiến sĩ, Phó Giáo sư' },
    { value: 'Tiến sĩ, Giáo sư', label: 'Tiến sĩ, Giáo sư' }
  ];

  const specialtyOptions = [
    { value: 'all', label: 'Tất cả chuyên khoa' },
    { value: 'Nội khoa', label: 'Nội khoa' },
    { value: 'Da liễu', label: 'Da liễu' },
    { value: 'Nhi khoa', label: 'Nhi khoa' },
    { value: 'Tai mũi họng', label: 'Tai mũi họng' },
    { value: 'Tim mạch', label: 'Tim mạch' },
    { value: 'Ung bướu', label: 'Ung bướu' },
    { value: 'Thần kinh', label: 'Thần kinh' },
    { value: 'Ngoại khoa', label: 'Ngoại khoa' }
  ];

  const priceRangeOptions = [
    { value: 'all', label: 'Tất cả mức giá' },
    { value: '0-60000', label: 'Dưới 60.000đ' },
    { value: '60000-80000', label: '60.000đ - 80.000đ' },
    { value: '80000-120000', label: '80.000đ - 120.000đ' },
    { value: '120000+', label: 'Trên 120.000đ' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Tên A-Z' },
    { value: 'rating', label: 'Đánh giá cao nhất' },
    { value: 'price-low', label: 'Giá thấp đến cao' },
    { value: 'price-high', label: 'Giá cao đến thấp' },
    { value: 'experience', label: 'Kinh nghiệm' }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ/phút';
  };

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {[...Array(5)].map((_, index) => (
          <span
            key={index}
            style={{
              color: '#FCD34D',
              fontSize: '16px'
            }}
          >
            ⭐
          </span>
        ))}
        <span style={{
          fontSize: '14px',
          color: '#6B7280',
          marginLeft: '8px'
        }}>
          ({rating}/5)
        </span>
      </div>
    );
  };

  const handleBooking = (doctorId: string) => {
    if (!isAuthenticated) {
      if (window.confirm('Bạn cần đăng nhập để đặt lịch khám. Bạn có muốn đăng nhập ngay không?')) {
        navigate('/login');
      }
      return;
    }

    if (user?.role !== UserRole.PATIENT) {
      alert('Chỉ bệnh nhân mới có thể đặt lịch khám. Vui lòng đăng ký tài khoản bệnh nhân!');
      return;
    }

    navigate(`/app/patient/booking/${doctorId}`);
  };

  // Pagination logic
  const getPageDoctors = (doctors: Doctor[], currentPage: number) => {
    const startIndex = (currentPage - 1) * doctorsPerPage;
    return doctors.slice(startIndex, startIndex + doctorsPerPage);
  };

  const getTotalPages = (doctors: Doctor[]) => {
    return Math.ceil(doctors.length / doctorsPerPage);
  };

  const renderDoctorCard = (doctor: Doctor) => {
    const getTierColor = (tier: string) => {
      switch (tier) {
        case 'Basic': return { bg: '#FFFFFF', badge: '#6B7280', text: 'BASIC' };
        case 'Professional': return { bg: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)', badge: '#0EA5E9', text: 'PROFESSIONAL' };
        case 'Premium': return { bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', badge: '#F59E0B', text: 'PREMIUM' };
        case 'VIP': return { bg: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)', badge: '#EC4899', text: 'VIP' };
        default: return { bg: '#FFFFFF', badge: '#6B7280', text: 'BASIC' };
      }
    };

    const tierStyle = getTierColor(doctor.tier);

    return (
      <div
        key={doctor.id}
        style={{
          background: tierStyle.bg,
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'pointer',
          height: '100%',
          minHeight: '420px',
          maxWidth: '280px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }}
      >
        {/* Phân hạng */}
        <div style={{
          backgroundColor: tierStyle.badge,
          color: 'white',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          marginBottom: '16px',
          letterSpacing: '0.5px'
        }}>
          {tierStyle.text}
        </div>

        {/* Avatar */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          overflow: 'hidden',
          border: '3px solid white',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#9CA3AF">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>

        {/* Thông tin chính */}
        <div style={{ marginBottom: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1F2937',
            marginBottom: '4px'
          }}>
            {doctor.fullName}
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            fontWeight: '500',
            marginBottom: '8px'
          }}>
            {doctor.degree}
          </p>
          <p style={{
            fontSize: '14px',
            color: '#374151',
            fontWeight: '500',
            marginBottom: '6px'
          }}>
            Chuyên khoa: {doctor.specialty}
          </p>
          <p style={{
            fontSize: '13px',
            color: '#6B7280',
            marginBottom: '12px'
          }}>
            {doctor.experience}
          </p>
        </div>

        {/* Đánh giá */}
        <div style={{ marginBottom: '16px' }}>
          {renderStars(doctor.rating)}
        </div>

        {/* Mức giá */}
        <div style={{
          backgroundColor: '#FEF3C7',
          border: '2px solid #F59E0B',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '12px',
          width: '100%'
        }}>
          <span style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#D97706'
          }}>
            {formatPrice(doctor.price)}
          </span>
        </div>

        {/* Tiểu sử */}
        <p style={{
          fontSize: '13px',
          color: '#4B5563',
          lineHeight: '1.4',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {doctor.bio}
        </p>

        {/* Nút đặt lịch */}
        <button
          onClick={() => handleBooking(doctor.id)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            border: doctor.tier === 'Basic' ? '2px solid #2563EB' : 'none',
            backgroundColor: doctor.tier === 'Basic' ? 'white' : '#2563EB',
            color: doctor.tier === 'Basic' ? '#2563EB' : 'white',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginTop: 'auto'
          }}
          onMouseEnter={(e) => {
            if (doctor.tier === 'Basic') {
              e.currentTarget.style.backgroundColor = '#2563EB';
              e.currentTarget.style.color = 'white';
            } else {
              e.currentTarget.style.backgroundColor = '#1D4ED8';
            }
          }}
          onMouseLeave={(e) => {
            if (doctor.tier === 'Basic') {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = '#2563EB';
            } else {
              e.currentTarget.style.backgroundColor = '#2563EB';
            }
          }}
        >
          Đặt Lịch Ngay
        </button>
      </div>
    );
  };

  const renderPagination = (totalPages: number, currentPage: number, onPageChange: (page: number) => void) => {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        marginTop: '40px',
        paddingTop: '20px'
      }}>
        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index + 1}
            onClick={() => onPageChange(index + 1)}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              backgroundColor: currentPage === index + 1 ? '#2563EB' : 'white',
              color: currentPage === index + 1 ? 'white' : '#374151',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: currentPage === index + 1 ? '600' : '400'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== index + 1) {
                e.currentTarget.style.backgroundColor = '#F3F4F6';
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== index + 1) {
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            {index + 1}
          </button>
        ))}
        <span style={{ color: '#6B7280', margin: '0 8px' }}>...</span>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
      padding: '20px'
    }}>
      {/* Notification Banner for unauthenticated users */}
      {!isAuthenticated && (
        <div style={{
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '8px',
          padding: '12px 16px',
          margin: '0 auto 20px',
          maxWidth: '1200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>ℹ️</span>
            <span style={{ color: '#1E40AF', fontSize: '14px' }}>
              Bạn đang xem danh sách bác sĩ với tư cách khách. 
              <strong> Đăng nhập để đặt lịch khám!</strong>
            </span>
          </div>
          <button
            onClick={() => navigate('/login')}
            style={{
              backgroundColor: '#2563EB',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1D4ED8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
          >
            Đăng nhập ngay
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        marginBottom: '40px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#1F2937',
          marginBottom: '8px'
        }}>
          Danh Sách Bác Sĩ Được Đề Xuất
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6B7280',
          marginBottom: '0'
        }}>
          Tìm và đặt lịch khám với các bác sĩ chuyên nghiệp
        </p>
      </div>

      {/* Filter Bar */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 40px',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E5E7EB'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          {/* Gói khám filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Gói khám ▼
            </label>
            <select
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="all">Tất cả gói khám</option>
              <option value="Basic">Gói Basic</option>
              <option value="Professional">Gói Professional</option>
              <option value="Premium">Gói Premium</option>
              <option value="VIP">Gói VIP</option>
            </select>
          </div>

          {/* Học vị filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Học vị ▼
            </label>
            <select
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="all">Tất cả học vị</option>
              <option value="Bác sĩ">Bác sĩ</option>
              <option value="Thạc sĩ">Thạc sĩ, Bác sĩ</option>
              <option value="Tiến sĩ">Tiến sĩ, Phó Giáo sư</option>
              <option value="Giáo sư">Tiến sĩ, Giáo sư</option>
            </select>
          </div>

          {/* Chuyên khoa filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Chuyên khoa ▼
            </label>
            <select
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="all">Tất cả chuyên khoa</option>
              <option value="Nội khoa">Nội khoa</option>
              <option value="Da liễu">Da liễu</option>
              <option value="Nhi khoa">Nhi khoa</option>
              <option value="Tai mũi họng">Tai mũi họng</option>
              <option value="Tim mạch">Tim mạch</option>
              <option value="Ung bướu">Ung bướu</option>
              <option value="Thần kinh">Thần kinh</option>
              <option value="Ngoại khoa">Ngoại khoa</option>
            </select>
          </div>

          {/* Phòng khám filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Phòng khám ▼
            </label>
            <select
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="all">Tất cả phòng khám</option>
              <option value="BV Bạch Mai">Bệnh viện Bạch Mai</option>
              <option value="BV Việt Đức">Bệnh viện Việt Đức</option>
              <option value="BV 108">Bệnh viện 108</option>
              <option value="BV K">Bệnh viện K</option>
            </select>
          </div>

          {/* Mức giá filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Mức giá ▼
            </label>
            <select
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="all">Tất cả mức giá</option>
              <option value="0-60000">Dưới 60.000đ</option>
              <option value="60000-80000">60.000đ - 80.000đ</option>
              <option value="80000-120000">80.000đ - 120.000đ</option>
              <option value="120000+">Trên 120.000đ</option>
            </select>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              ÁP DỤNG
            </button>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              ĐẶT LẠI
            </button>
          </div>
        </div>
      </div>



      {/* Phần 1: BASIC */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        marginBottom: '60px'
      }}>
        {/* Label ở trên */}
        <div style={{
          marginBottom: '32px',
          paddingLeft: '20px'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            lineHeight: '1.2',
            margin: '0',
            borderLeft: '4px solid #6B7280',
            paddingLeft: '20px'
          }}>
            GÓI BASIC
          </h2>
          <p style={{
            color: '#9CA3AF',
            fontSize: '14px',
            marginTop: '12px',
            marginLeft: '24px',
            lineHeight: '1.5'
          }}>
            Gói cơ bản cho bác sĩ mới với giá cả phù hợp
          </p>
        </div>
        
        {/* Thẻ bác sĩ ở dưới */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          padding: '0 20px'
        }}>
          {getPageDoctors(basicDoctors, currentBasicPage).map((doctor) => 
            renderDoctorCard(doctor)
          )}
        </div>

        {renderPagination(
          getTotalPages(basicDoctors), 
          currentBasicPage, 
          setCurrentBasicPage
        )}
      </div>

      {/* Phần 2: PROFESSIONAL */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        marginBottom: '60px'
      }}>
        {/* Label ở trên */}
        <div style={{
          marginBottom: '32px',
          paddingLeft: '20px'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#0EA5E9',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            lineHeight: '1.2',
            margin: '0',
            borderLeft: '4px solid #0EA5E9',
            paddingLeft: '20px'
          }}>
            GÓI PROFESSIONAL
          </h2>
          <p style={{
            color: '#0EA5E9',
            fontSize: '14px',
            marginTop: '12px',
            marginLeft: '24px',
            lineHeight: '1.5'
          }}>
            Gói chuyên nghiệp với nhiều tính năng hỗ trợ
          </p>
        </div>
        
        {/* Thẻ bác sĩ ở dưới */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          padding: '0 20px'
        }}>
          {getPageDoctors(professionalDoctors, currentProfessionalPage).map((doctor) => 
            renderDoctorCard(doctor)
          )}
        </div>

        {renderPagination(
          getTotalPages(professionalDoctors), 
          currentProfessionalPage, 
          setCurrentProfessionalPage
        )}
      </div>

      {/* Phần 3: PREMIUM */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        marginBottom: '60px'
      }}>
        {/* Label ở trên */}
        <div style={{
          marginBottom: '32px',
          paddingLeft: '20px'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#F59E0B',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            lineHeight: '1.2',
            margin: '0',
            borderLeft: '4px solid #F59E0B',
            paddingLeft: '20px'
          }}>
            GÓI PREMIUM
          </h2>
          <p style={{
            color: '#F59E0B',
            fontSize: '14px',
            marginTop: '12px',
            marginLeft: '24px',
            lineHeight: '1.5'
          }}>
            Gói cao cấp với ưu tiên hiển thị và hỗ trợ chuyên biệt
          </p>
        </div>
        
        {/* Thẻ bác sĩ ở dưới */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          padding: '0 20px'
        }}>
          {getPageDoctors(premiumDoctors, currentPremiumPage).map((doctor) => 
            renderDoctorCard(doctor)
          )}
        </div>

        {renderPagination(
          getTotalPages(premiumDoctors), 
          currentPremiumPage, 
          setCurrentPremiumPage
        )}
      </div>

      {/* Phần 4: VIP */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Label ở trên */}
        <div style={{
          marginBottom: '32px',
          paddingLeft: '20px'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#EC4899',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            lineHeight: '1.2',
            margin: '0',
            borderLeft: '4px solid #EC4899',
            paddingLeft: '20px'
          }}>
            GÓI VIP
          </h2>
          <p style={{
            color: '#EC4899',
            fontSize: '14px',
            marginTop: '12px',
            marginLeft: '24px',
            lineHeight: '1.5'
          }}>
            Gói VIP đặc biệt với khả năng hiển thị tối đa và quản lý riêng biệt
          </p>
        </div>
        
        {/* Thẻ bác sĩ ở dưới */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          padding: '0 20px'
        }}>
          {getPageDoctors(vipDoctors, currentVipPage).map((doctor) => 
            renderDoctorCard(doctor)
          )}
        </div>

        {renderPagination(
          getTotalPages(vipDoctors), 
          currentVipPage, 
          setCurrentVipPage
        )}
      </div>
    </div>
  );
};

export default DoctorBookingList;