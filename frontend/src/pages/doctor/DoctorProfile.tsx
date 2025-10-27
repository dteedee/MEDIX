import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { userService, UserBasicInfo, UpdateUserInfo } from '../../services/userService';
import doctorService from '../../services/doctorService';
import { apiClient } from '../../lib/apiClient';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import styles from '../../styles/doctor/DoctorProfile.module.css';

interface ExtendedUserInfo extends UserBasicInfo {
  cccd?: string;
  identificationNumber?: string;
  gender?: 'male' | 'female' | 'other';
  role?: string;
  specialization?: string;
  licenseNumber?: string;
  licenseUrl?: string;
  certificates?: string;
  yearsOfExperience?: number;
  education?: string;
  bio?: string;
}

interface ExtendedUpdateUserInfo extends UpdateUserInfo {
  username?: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  cccd?: string;
  imageURL?: string;
  specialization?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  education?: string;
  bio?: string;
}

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return '';
  try {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  } catch {
    return iso;
  }
};

const formatCurrency = (amount: string | number) => {
  if (!amount) return '';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(numAmount);
};

export const DoctorProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<ExtendedUserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ExtendedUpdateUserInfo>({});
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  // Validation functions
  const validateUsername = (username: string): string | null => {
    if (!username) return 'Tên tài khoản không được để trống';
    if (username.length < 6) return 'Tên tài khoản phải có ít nhất 6 ký tự';
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email không được để trống';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Email không hợp lệ';
    return null;
  };

  const validatePhoneNumber = (phone: string): string | null => {
    if (!phone) return 'Số điện thoại không được để trống';
    if (!/^0[1-9]\d{8}$/.test(phone)) return 'Số điện thoại phải có đúng 10 chữ số, bắt đầu bằng 0 và chữ số thứ 2 khác 0';
    return null;
  };

  const validateCCCD = (cccd: string): string | null => {
    if (!cccd) return 'CCCD không được để trống';
    if (!/^\d{12}$/.test(cccd)) return 'CCCD phải có đúng 12 chữ số';
    return null;
  };

  const validateLicenseNumber = (license: string): string | null => {
    if (!license) return 'Số chứng chỉ không được để trống';
    if (license.trim().length < 3) return 'Số chứng chỉ phải có ít nhất 3 ký tự';
    return null;
  };

  const validateYearsOfExperience = (years: string): string | null => {
    if (!years) return 'Số năm kinh nghiệm không được để trống';
    const numYears = parseInt(years);
    if (isNaN(numYears) || numYears < 0) return 'Số năm kinh nghiệm phải là số dương';
    return null;
  };

  const validateField = (fieldName: string, value: string): string | null => {
    switch (fieldName) {
      case 'username':
        return validateUsername(value);
      case 'fullName':
        if (!value || value.trim() === '') return 'Họ và tên không được để trống';
        if (value.trim().length < 2) return 'Họ và tên phải có ít nhất 2 ký tự';
        return null;
      case 'email':
        return validateEmail(value);
      case 'phoneNumber':
        return validatePhoneNumber(value);
      case 'cccd':
        return validateCCCD(value);
      case 'licenseNumber':
        return validateLicenseNumber(value);
      case 'yearsOfExperience':
        return validateYearsOfExperience(value);
      default:
        return null;
    }
  };

  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Validate required fields
    const requiredFields = ['username', 'fullName', 'email', 'phoneNumber', 'cccd', 'specialization', 'licenseNumber', 'yearsOfExperience'];
    
    for (const field of requiredFields) {
      const value = editData[field as keyof typeof editData];
      if (!value || value.toString().trim() === '') {
        errors[field] = `${getFieldDisplayName(field)} không được để trống`;
        isValid = false;
      } else {
        const error = validateField(field, value.toString());
        if (error) {
          errors[field] = error;
          isValid = false;
        }
      }
    }

    // Validate optional fields if they have values
    if (editData.address && editData.address.trim() === '') {
      errors.address = 'Địa chỉ không được để trống nếu đã nhập';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const getFieldDisplayName = (field: string): string => {
    const fieldNames: Record<string, string> = {
      username: 'Tên tài khoản',
      fullName: 'Họ và tên',
      email: 'Email',
      phoneNumber: 'Số điện thoại',
      cccd: 'CCCD',
      address: 'Địa chỉ',
      specialization: 'Chuyên khoa',
      licenseNumber: 'Số chứng chỉ',
      yearsOfExperience: 'Số năm kinh nghiệm',
      education: 'Trình độ học vấn',
      bio: 'Tiểu sử'
    };
    return fieldNames[field] || field;
  };

  const validateSingleField = (fieldName: string, value: string) => {
    const error = validateField(fieldName, value);
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error || ''
    }));
    return !error;
  };

  const handleFieldBlur = (fieldName: string, value: string) => {
    if (value.trim()) {
      validateSingleField(fieldName, value);
    } else {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Get basic user info
        const userRes = await userService.getUserInfo();
        
        // Get doctor-specific data
        let doctorData: any = {};
        try {
          const doctorResponse = await doctorService.getDoctorProfileDetails();
          doctorData = doctorResponse;
          console.log('Doctor data received:', doctorData);
        } catch (error) {
          console.log('Doctor info not available, using basic data');
        }
        
        if (mounted) {
          const extendedData: ExtendedUserInfo = {
            ...userRes,
            cccd: userRes.identificationNumber || doctorData.identificationNumber,
            identificationNumber: userRes.identificationNumber || doctorData.identificationNumber,
            gender: (userRes as any).gender || doctorData.gender || 'male',
            role: 'Doctor',
            specialization: doctorData.specialization,
            licenseNumber: doctorData.licenseNumber,
            licenseUrl: doctorData.licenseUrl,
            certificates: doctorData.certificates,
            yearsOfExperience: doctorData.yearsOfExperience,
            education: doctorData.education,
            bio: doctorData.bio
          };
          
          setData(extendedData);
          setEditData({
            username: userRes.username || '',
            fullName: userRes.fullName,
            email: userRes.email,
            phoneNumber: userRes.phoneNumber || '',
            address: userRes.address || '',
            dob: userRes.dob || '',
            cccd: userRes.identificationNumber || '',
            specialization: doctorData.specialization || '',
            licenseNumber: doctorData.licenseNumber || '',
            yearsOfExperience: doctorData.yearsOfExperience?.toString() || '',
            education: doctorData.education || '',
            bio: doctorData.bio || ''
          });
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Không thể tải thông tin người dùng');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSaveClick = () => {
    // Check required fields first
    const requiredFields = ['username', 'fullName', 'email', 'phoneNumber', 'cccd', 'specialization', 'licenseNumber', 'yearsOfExperience'];
    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
      const value = editData[field as keyof typeof editData];
      if (!value || value.toString().trim() === '') {
        missingFields.push(getFieldDisplayName(field));
      }
    }
    
    if (missingFields.length > 0) {
      showToast(`Vui lòng điền đầy đủ thông tin: ${missingFields.join(', ')}`, 'error');
      return;
    }

    // Validate format
    if (!validateAllFields()) {
      showToast('Vui lòng kiểm tra lại thông tin đã nhập', 'error');
      return;
    }

    // Validate age
    if (editData.dob) {
      const date = new Date(editData.dob);
      const now = new Date();
      let age = now.getFullYear() - date.getFullYear();
      const monthDiff = now.getMonth() - date.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
        age--;
      }
      
      if (age < 18) {
        showToast('Bạn phải đủ 18 tuổi', 'error');
        return;
      }
    }

    // Show confirmation dialog
    setShowSaveConfirmation(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    setShowSaveConfirmation(false);

    showToast('Đang cập nhật thông tin...', 'info');

    try {
      // Update basic user info
      const apiData = {
        ...editData,
        identificationNumber: editData.cccd,
      };
      
      if (!apiData.username || apiData.username.trim() === '') {
        apiData.username = data?.username || '';
      }
      
      delete apiData.cccd;
      
      const updatedUser = await userService.updateUserInfo(apiData);
      
      // Update doctor-specific info
      try {
        const doctorUpdateData = new FormData();
        doctorUpdateData.append('specialization', editData.specialization || '');
        doctorUpdateData.append('licenseNumber', editData.licenseNumber || '');
        doctorUpdateData.append('yearsOfExperience', editData.yearsOfExperience || '0');
        doctorUpdateData.append('education', editData.education || '');
        doctorUpdateData.append('bio', editData.bio || '');
        
        await doctorService.updateDoctorProfile(doctorUpdateData);
      } catch (doctorError) {
        console.warn('Could not update doctor-specific data:', doctorError);
      }
      
      const finalUsername = updatedUser.username && updatedUser.username !== updatedUser.email 
        ? updatedUser.username 
        : editData.username || data?.username || '';
      
      const preservedImageURL = updatedUser.imageURL || data?.imageURL;
      
      const updatedData: ExtendedUserInfo = {
        ...updatedUser,
        username: finalUsername,
        imageURL: preservedImageURL,
        cccd: updatedUser.identificationNumber || editData.cccd || data?.cccd,
        identificationNumber: updatedUser.identificationNumber || editData.cccd || data?.identificationNumber,
        gender: (updatedUser as any).gender || data?.gender,
        role: 'Doctor',
        specialization: editData.specialization || data?.specialization,
        licenseNumber: editData.licenseNumber || data?.licenseNumber,
        yearsOfExperience: parseInt(editData.yearsOfExperience || '0') || data?.yearsOfExperience,
        education: editData.education || data?.education,
        bio: editData.bio || data?.bio
      };
      
      setData(updatedData);
      setIsEditing(false);
      showToast('Cập nhật thông tin thành công!', 'success');
      
      // Update user context with new data
      updateUser({
        fullName: updatedData.fullName || undefined,
        email: updatedData.email || undefined,
        phoneNumber: updatedData.phoneNumber || undefined,
        avatarUrl: preservedImageURL || undefined
      });
      
    } catch (e: any) {
      showToast(e?.message || 'Không thể cập nhật thông tin', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (data) {
      setEditData({
        username: data.username || '',
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber || '',
        address: data.address || '',
        dob: data.dob || '',
        cccd: data.cccd || '',
        specialization: data.specialization || '',
        licenseNumber: data.licenseNumber || '',
        yearsOfExperience: data.yearsOfExperience?.toString() || '',
        education: data.education || '',
        bio: data.bio || ''
      });
    }
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    setFieldErrors({});
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    const hasValidMimeType = allowedTypes.includes(file.type);

    if (!hasValidMimeType || !hasValidExtension) {
      setError(`File không hợp lệ: ${file.name}\nChỉ chấp nhận: JPG, JPEG, PNG, WEBP`);
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File quá lớn: ${(file.size / 1024 / 1024).toFixed(2)}MB. Tối đa 5MB`);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await userService.uploadProfileImage(file);
      
      if (data && result.imageUrl) {
        const updatedData = { ...data, imageURL: result.imageUrl };
        setData(updatedData);
        
        // Update user context with new avatar
        updateUser({ avatarUrl: result.imageUrl });
      }
      
      showToast('Cập nhật ảnh đại diện thành công!', 'success');
      
      URL.revokeObjectURL(previewUrl);
      setPreviewImage(null);
    } catch (e: any) {
      const errorMessage = e?.message || 'Không thể tải ảnh lên';
      setError(`${errorMessage}. Ảnh preview sẽ được hiển thị tạm thời.`);
      
      setTimeout(() => {
        URL.revokeObjectURL(previewUrl);
        setPreviewImage(null);
        setError(null);
      }, 10000);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Thông tin cá nhân</h1>
          <p>Quản lý và cập nhật thông tin tài khoản của bạn</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <i className="bi bi-calendar3"></i>
            <span>{new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>

      <div className={styles.profileCard}>
        {error && (
          <div className={styles.errorMessage}>
            <i className="bi bi-exclamation-triangle"></i>
            {error}
          </div>
        )}
        {success && (
          <div className={styles.successMessage}>
            <i className="bi bi-check-circle"></i>
            {success}
          </div>
        )}
        
        {data && (
          <>
            {/* Profile Info Section */}
            <div className={styles.profileInfoSection}>
              <div className={styles.avatarSection}>
                <div className={styles.avatarContainer}>
                  {(previewImage || data.imageURL) ? (
                    <img 
                      src={previewImage || data.imageURL || ''} 
                      alt="Profile" 
                      className={styles.avatarImage}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      <i className="bi bi-person"></i>
                    </div>
                  )}
                  <div className={styles.avatarOverlay}>
                    <i className="bi bi-camera"></i>
                  </div>
                </div>
                <div className={styles.avatarInfo}>
                  <h3>{data.fullName || 'Chưa cập nhật'}</h3>
                  <p>{data.email}</p>
                  <span className={styles.userRole}>Bác sĩ</span>
                </div>
              </div>
              
              <div className={styles.uploadSection}>
                <input
                  type="file"
                  id="profileImageInput"
                  accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                <button 
                  type="button" 
                  onClick={() => document.getElementById('profileImageInput')?.click()}
                  disabled={uploading}
                  className={styles.uploadBtn}
                >
                  {uploading ? (
                    <>
                      <div className={styles.spinner}></div>
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cloud-upload"></i>
                      Tải ảnh lên
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <h3>Thông tin cơ bản</h3>
                <p>Cập nhật thông tin cá nhân của bạn</p>
              </div>
              
              <div className={styles.formGrid}>
                {/* Basic Information */}
                <div className={styles.fieldGroup}>
                  <label className={`${styles.fieldLabel} ${fieldErrors.username ? styles.fieldLabelError : ''}`}>
                    <i className="bi bi-person"></i>
                    Tên tài khoản
                    {fieldErrors.username && <span className={styles.errorIcon}>⚠️</span>}
                  </label>
                  {isEditing ? (
                    <div className={styles.inputContainer}>
                      <input 
                        value={editData.username || ''} 
                        onChange={(e) => {
                          setEditData({...editData, username: e.target.value});
                          if (fieldErrors.username) {
                            setFieldErrors({...fieldErrors, username: ''});
                          }
                        }}
                        onBlur={(e) => handleFieldBlur('username', e.target.value)}
                        className={`${styles.fieldInput} ${fieldErrors.username ? styles.fieldInputError : ''}`}
                        placeholder="Nhập tên tài khoản"
                      />
                      <i className="bi bi-pencil"></i>
                    </div>
                  ) : (
                    <div className={styles.inputContainer}>
                      <input disabled value={data.username || ''} className={styles.fieldInputDisabled} />
                      <i className="bi bi-lock"></i>
                    </div>
                  )}
                  {fieldErrors.username && (
                    <div className={styles.fieldError}>{fieldErrors.username}</div>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <i className="bi bi-person-badge"></i>
                    Họ và Tên
                  </label>
                  {isEditing ? (
                    <div className={styles.inputContainer}>
                      <input 
                        value={editData.fullName || ''} 
                        onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                        className={styles.fieldInput}
                        placeholder="Nhập họ và tên"
                      />
                      <i className="bi bi-pencil"></i>
                    </div>
                  ) : (
                    <div className={styles.inputContainer}>
                      <input disabled value={data.fullName} className={styles.fieldInputDisabled} />
                      <i className="bi bi-lock"></i>
                    </div>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <i className="bi bi-envelope"></i>
                    Email
                  </label>
                  <div className={styles.inputContainer}>
                    <input disabled value={data.email} className={styles.fieldInputDisabled} />
                    <i className="bi bi-lock"></i>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={`${styles.fieldLabel} ${fieldErrors.phoneNumber ? styles.fieldLabelError : ''}`}>
                    <i className="bi bi-telephone"></i>
                    Số điện thoại
                    {fieldErrors.phoneNumber && <span className={styles.errorIcon}>⚠️</span>}
                  </label>
                  {isEditing ? (
                    <div className={styles.inputContainer}>
                      <input 
                        maxLength={10}
                        value={editData.phoneNumber || ''} 
                        onChange={(e) => {
                          const numericValue = e.target.value.replace(/[^0-9]/g, '');
                          setEditData({...editData, phoneNumber: numericValue});
                          if (fieldErrors.phoneNumber) {
                            setFieldErrors({...fieldErrors, phoneNumber: ''});
                          }
                        }}
                        onBlur={(e) => handleFieldBlur('phoneNumber', e.target.value)}
                        className={`${styles.fieldInput} ${fieldErrors.phoneNumber ? styles.fieldInputError : ''}`}
                        placeholder="Nhập số điện thoại"
                        type="tel"
                      />
                      <i className="bi bi-pencil"></i>
                    </div>
                  ) : (
                    <div className={styles.inputContainer}>
                      <input disabled value={data.phoneNumber || 'Chưa cập nhật'} className={styles.fieldInputDisabled} />
                      <i className="bi bi-lock"></i>
                    </div>
                  )}
                  {fieldErrors.phoneNumber && (
                    <div className={styles.fieldError}>{fieldErrors.phoneNumber}</div>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <i className="bi bi-geo-alt"></i>
                    Địa chỉ
                  </label>
                  {isEditing ? (
                    <div className={styles.inputContainer}>
                      <input 
                        value={editData.address || ''} 
                        onChange={(e) => setEditData({...editData, address: e.target.value})}
                        className={styles.fieldInput}
                        placeholder="Nhập địa chỉ"
                      />
                      <i className="bi bi-pencil"></i>
                    </div>
                  ) : (
                    <div className={styles.inputContainer}>
                      <input disabled value={data.address || 'Chưa cập nhật'} className={styles.fieldInputDisabled} />
                      <i className="bi bi-lock"></i>
                    </div>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <i className="bi bi-calendar3"></i>
                    Ngày sinh
                  </label>
                  {isEditing ? (
                    <div className={styles.inputContainer}>
                      <input 
                        type="date"
                        value={editData.dob || ''} 
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditData({...editData, dob: value});
                          setError(null);
                          
                          if (value) {
                            const date = new Date(value);
                            const now = new Date();
                            let age = now.getFullYear() - date.getFullYear();
                            const monthDiff = now.getMonth() - date.getMonth();
                            
                            if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
                              age--;
                            }
                            
                            if (age < 18) {
                              setError('Bạn phải đủ 18 tuổi');
                            }
                          }
                        }}
                        max="9999-12-31"
                        className={styles.fieldInput}
                      />
                      <i className="bi bi-pencil"></i>
                    </div>
                  ) : (
                    <div className={styles.inputContainer}>
                      <input disabled value={formatDate(data.dob)} className={styles.fieldInputDisabled} />
                      <i className="bi bi-lock"></i>
                    </div>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={`${styles.fieldLabel} ${fieldErrors.cccd ? styles.fieldLabelError : ''}`}>
                    <i className="bi bi-card-text"></i>
                    CCCD
                    {fieldErrors.cccd && <span className={styles.errorIcon}>⚠️</span>}
                  </label>
                  {isEditing ? (
                    <div className={styles.inputContainer}>
                      <input 
                        maxLength={12}
                        value={editData.cccd || ''} 
                        onChange={(e) => {
                          const numericValue = e.target.value.replace(/[^0-9]/g, '');
                          setEditData({...editData, cccd: numericValue});
                          if (fieldErrors.cccd) {
                            setFieldErrors({...fieldErrors, cccd: ''});
                          }
                        }}
                        onBlur={(e) => handleFieldBlur('cccd', e.target.value)}
                        className={`${styles.fieldInput} ${fieldErrors.cccd ? styles.fieldInputError : ''}`}
                        placeholder="Nhập số CCCD"
                        type="text"
                      />
                      <i className="bi bi-pencil"></i>
                    </div>
                  ) : (
                    <div className={styles.inputContainer}>
                      <input disabled value={data.cccd || 'Chưa cập nhật'} className={styles.fieldInputDisabled} />
                      <i className="bi bi-lock"></i>
                    </div>
                  )}
                  {fieldErrors.cccd && (
                    <div className={styles.fieldError}>{fieldErrors.cccd}</div>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <i className="bi bi-gender-ambiguous"></i>
                    Giới tính
                  </label>
                  <div className={styles.inputContainer}>
                    <input disabled value={data.gender === 'male' ? 'Nam' : data.gender === 'female' ? 'Nữ' : 'Khác'} className={styles.fieldInputDisabled} />
                    <i className="bi bi-lock"></i>
                  </div>
                </div>

                 {/* Professional Information */}
                 <div className={styles.fieldGroup}>
                   <label className={`${styles.fieldLabel} ${fieldErrors.specialization ? styles.fieldLabelError : ''}`}>
                     <i className="bi bi-hospital"></i>
                     Chuyên khoa
                     {fieldErrors.specialization && <span className={styles.errorIcon}>⚠️</span>}
                   </label>
                   {isEditing ? (
                     <div className={styles.inputContainer}>
                       <input 
                         value={editData.specialization || ''} 
                         onChange={(e) => {
                           setEditData({...editData, specialization: e.target.value});
                           if (fieldErrors.specialization) {
                             setFieldErrors({...fieldErrors, specialization: ''});
                           }
                         }}
                         onBlur={(e) => handleFieldBlur('specialization', e.target.value)}
                         className={`${styles.fieldInput} ${fieldErrors.specialization ? styles.fieldInputError : ''}`}
                         placeholder="Nhập chuyên khoa"
                       />
                       <i className="bi bi-pencil"></i>
                     </div>
                   ) : (
                     <div className={styles.inputContainer}>
                       <input disabled value={data.specialization || 'Chưa cập nhật'} className={styles.fieldInputDisabled} />
                       <i className="bi bi-lock"></i>
                     </div>
                   )}
                   {fieldErrors.specialization && (
                     <div className={styles.fieldError}>{fieldErrors.specialization}</div>
                   )}
                 </div>

                 <div className={styles.fieldGroup}>
                   <label className={`${styles.fieldLabel} ${fieldErrors.licenseNumber ? styles.fieldLabelError : ''}`}>
                     <i className="bi bi-card-heading"></i>
                     Số chứng chỉ
                     {fieldErrors.licenseNumber && <span className={styles.errorIcon}>⚠️</span>}
                   </label>
                   {isEditing ? (
                     <div className={styles.inputContainer}>
                       <input 
                         value={editData.licenseNumber || ''} 
                         onChange={(e) => {
                           setEditData({...editData, licenseNumber: e.target.value});
                           if (fieldErrors.licenseNumber) {
                             setFieldErrors({...fieldErrors, licenseNumber: ''});
                           }
                         }}
                         onBlur={(e) => handleFieldBlur('licenseNumber', e.target.value)}
                         className={`${styles.fieldInput} ${fieldErrors.licenseNumber ? styles.fieldInputError : ''}`}
                         placeholder="Nhập số chứng chỉ"
                         type="text"
                       />
                       <i className="bi bi-pencil"></i>
                     </div>
                   ) : (
                     <div className={styles.inputContainer}>
                       <input disabled value={data.licenseNumber || 'Chưa cập nhật'} className={styles.fieldInputDisabled} />
                       <i className="bi bi-lock"></i>
                     </div>
                   )}
                   {fieldErrors.licenseNumber && (
                     <div className={styles.fieldError}>{fieldErrors.licenseNumber}</div>
                   )}
                 </div>

                <div className={styles.fieldGroup}>
                  <label className={`${styles.fieldLabel} ${fieldErrors.yearsOfExperience ? styles.fieldLabelError : ''}`}>
                    <i className="bi bi-clock-history"></i>
                    Số năm kinh nghiệm
                    {fieldErrors.yearsOfExperience && <span className={styles.errorIcon}>⚠️</span>}
                  </label>
                  {isEditing ? (
                    <div className={styles.inputContainer}>
                      <input 
                        value={editData.yearsOfExperience || ''} 
                        onChange={(e) => {
                          const numericValue = e.target.value.replace(/[^0-9]/g, '');
                          setEditData({...editData, yearsOfExperience: numericValue});
                          if (fieldErrors.yearsOfExperience) {
                            setFieldErrors({...fieldErrors, yearsOfExperience: ''});
                          }
                        }}
                        onBlur={(e) => handleFieldBlur('yearsOfExperience', e.target.value)}
                        className={`${styles.fieldInput} ${fieldErrors.yearsOfExperience ? styles.fieldInputError : ''}`}
                        placeholder="Nhập số năm kinh nghiệm"
                        type="text"
                      />
                      <i className="bi bi-pencil"></i>
                    </div>
                  ) : (
                    <div className={styles.inputContainer}>
                      <input disabled value={`${data.yearsOfExperience || 0} năm`} className={styles.fieldInputDisabled} />
                      <i className="bi bi-lock"></i>
                    </div>
                  )}
                  {fieldErrors.yearsOfExperience && (
                    <div className={styles.fieldError}>{fieldErrors.yearsOfExperience}</div>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <i className="bi bi-book"></i>
                    Trình độ học vấn
                  </label>
                  {isEditing ? (
                    <div className={styles.inputContainer}>
                      <input 
                        value={editData.education || ''} 
                        onChange={(e) => setEditData({...editData, education: e.target.value})}
                        className={styles.fieldInput}
                        placeholder="Nhập trình độ học vấn"
                      />
                      <i className="bi bi-pencil"></i>
                    </div>
                  ) : (
                    <div className={styles.inputContainer}>
                      <input disabled value={data.education || 'Chưa cập nhật'} className={styles.fieldInputDisabled} />
                      <i className="bi bi-lock"></i>
                    </div>
                  )}
                </div>

                 <div className={styles.fieldGroup}>
                   <label className={styles.fieldLabel}>
                     <i className="bi bi-file-text"></i>
                     Tiểu sử
                   </label>
                   {isEditing ? (
                     <div className={styles.inputContainer}>
                       <textarea 
                         value={editData.bio || ''} 
                         onChange={(e) => setEditData({...editData, bio: e.target.value})}
                         className={styles.fieldTextarea}
                         placeholder="Nhập tiểu sử"
                         rows={3}
                       />
                       <i className="bi bi-pencil"></i>
                     </div>
                   ) : (
                     <div className={styles.inputContainer}>
                       <textarea disabled value={data.bio || 'Chưa cập nhật'} className={styles.fieldTextareaDisabled} rows={3} />
                       <i className="bi bi-lock"></i>
                     </div>
                   )}
                 </div>

                 <div className={styles.fieldGroup}>
                   <label className={styles.fieldLabel}>
                     <i className="bi bi-image"></i>
                     Ảnh chứng chỉ
                   </label>
                   {data?.licenseUrl ? (
                     <div className={styles.inputContainer}>
                       <img src={data.licenseUrl} alt="License" className={styles.licenseImage} />
                     </div>
                   ) : (
                     <div className={styles.inputContainer}>
                       <input disabled value="Chưa có ảnh chứng chỉ" className={styles.fieldInputDisabled} />
                       <i className="bi bi-lock"></i>
                     </div>
                   )}
                 </div>

                 <div className={styles.fieldGroup}>
                   <label className={styles.fieldLabel}>
                     <i className="bi bi-folder"></i>
                     Bằng cấp
                   </label>
                   {data?.certificates ? (
                     <div className={styles.inputContainer}>
                       <a 
                         href={data.certificates} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className={styles.certificateLink}
                       >
                         <i className="bi bi-file-earmark-zip"></i>
                         Tải xuống bằng cấp
                       </a>
                     </div>
                   ) : (
                     <div className={styles.inputContainer}>
                       <input disabled value="Chưa có bằng cấp" className={styles.fieldInputDisabled} />
                       <i className="bi bi-lock"></i>
                     </div>
                   )}
                 </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionSection}>
              {isEditing ? (
                <div className={styles.editActions}>
                  <button 
                    type="button" 
                    onClick={handleCancel}
                    className={styles.cancelBtn}
                    disabled={saving}
                  >
                    <i className="bi bi-x-circle"></i>
                    Hủy
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveClick}
                    className={styles.saveBtn}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className={styles.spinner}></div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle"></i>
                        Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className={styles.viewActions}>
                  <button 
                    type="button" 
                    onClick={() => setShowChangePasswordModal(true)}
                    className={styles.changePasswordBtn}
                  >
                    <i className="bi bi-key"></i>
                    Đổi mật khẩu
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(true)}
                    className={styles.editBtn}
                  >
                    <i className="bi bi-pencil"></i>
                    Chỉnh sửa thông tin
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={() => {
          setShowChangePasswordModal(false);
          showToast('Đổi mật khẩu thành công!', 'success');
        }}
      />

      {/* Save Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showSaveConfirmation}
        title="Xác nhận lưu thay đổi"
        message="Bạn có chắc muốn lưu các thay đổi thông tin cá nhân không?"
        confirmText="Lưu thay đổi"
        cancelText="Hủy"
        onConfirm={handleSave}
        onCancel={() => setShowSaveConfirmation(false)}
        type="info"
      />
    </div>
  );
};