import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { userService, UserBasicInfo, UpdateUserInfo } from '../../services/userService';
import registrationService from '../../services/registrationService';
import { apiClient } from '../../lib/apiClient';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import styles from '../../styles/patient/PatientProfile.module.css';

interface BloodType {
  code: string;
  displayName: string;
  isActive: boolean;
}

interface ExtendedUserInfo extends UserBasicInfo {
  cccd?: string;
  identificationNumber?: string;
  gender?: 'male' | 'female' | 'other';
  bloodType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalHistory?: string;
  allergies?: string;
}

// Helper function để hiển thị giới tính
const getGenderDisplayName = (genderCode: string | null | undefined): string => {
  if (!genderCode) return 'Chưa cập nhật';
  switch (genderCode.toLowerCase()) {
    case 'male':
      return 'Nam';
    case 'female':
      return 'Nữ';
    case 'other':
      return 'Khác';
    default:
      return genderCode;
  }
};

interface ExtendedUpdateUserInfo extends UpdateUserInfo {
  username?: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  cccd?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalHistory?: string;
  allergies?: string;
  imageURL?: string;
  bloodTypeCode?: string;
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

export const PatientProfile: React.FC = () => {
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
  const [avatarUpdateKey, setAvatarUpdateKey] = useState(0); // Track avatar updates
  const [bloodTypes, setBloodTypes] = useState<BloodType[]>([]); // Blood types from API

  const getBloodTypeDisplayName = (code: string | undefined): string => {
    if (!code) {
      return data?.bloodType || 'Chưa cập nhật';
    }
    const bloodType = bloodTypes.find(bt => bt.code === code);
    if (bloodType) {
      return bloodType.displayName;
    }
    return data?.bloodType || code || 'Chưa cập nhật';
  };

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

  const validateIdentificationNumber = (idNumber: string): string | null => {
    if (!idNumber) return 'Số CMND/CCCD không được để trống';
    if (!/^\d{9}$|^\d{12}$/.test(idNumber)) return 'Số CMND/CCCD phải có đúng 9 hoặc 12 chữ số';
    return null;
  };


  const validateField = (fieldName: string, value: string): string | null => {
    switch (fieldName) {
      case 'username':
        return validateUsername(value);
      case 'email':
        return validateEmail(value);
      case 'phoneNumber':
      case 'emergencyContactPhone':
        return validatePhoneNumber(value);
      case 'cccd':
        return validateCCCD(value);
      case 'identificationNumber':
        return validateIdentificationNumber(value);
      default:
        return null;
    }
  };

  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (editData.username) {
      const error = validateField('username', editData.username);
      if (error) {
        errors.username = error;
        isValid = false;
      }
    }

    if (editData.phoneNumber) {
      const error = validateField('phoneNumber', editData.phoneNumber);
      if (error) {
        errors.phoneNumber = error;
        isValid = false;
      }
    }

    if (editData.emergencyContactPhone) {
      const error = validateField('emergencyContactPhone', editData.emergencyContactPhone);
      if (error) {
        errors.emergencyContactPhone = error;
        isValid = false;
      }
    }

    if (editData.cccd) {
      const error = validateField('cccd', editData.cccd);
      if (error) {
        errors.cccd = error;
        isValid = false;
      }
    }

    if (editData.phoneNumber && editData.emergencyContactPhone && 
        editData.phoneNumber === editData.emergencyContactPhone) {
      errors.emergencyContactPhone = 'Số điện thoại liên hệ khẩn cấp không được giống số điện thoại chính';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
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
    const loadBloodTypes = async () => {
      try {
        const bloodTypesResponse = await registrationService.getBloodTypes();
        
        if (bloodTypesResponse.success && bloodTypesResponse.data) {
          const bloodTypesWithActive = bloodTypesResponse.data.map(bt => ({
            ...bt,
            isActive: true
          }));
          setBloodTypes(bloodTypesWithActive);
        } else {
        }
      } catch (err) {
      }
    };

    loadBloodTypes();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await userService.getUserInfo();
        if (mounted) {
          let patientData: any = {};
          try {
            const patientResponse = await apiClient.get('/patient/getPatientInfo');
            patientData = patientResponse.data;
         
          } catch (error) {
       
          }
          
          const imageURL = res.imageURL || user?.avatarUrl || (res as any).avatarUrl;
          
          const bloodTypeCode = res.bloodTypeCode || (res as any).bloodTypeCode || patientData.bloodTypeCode || '';
          
        
          const extendedData: ExtendedUserInfo = {
            ...res,
            imageURL: imageURL, // Ensure imageURL is set
            cccd: res.identificationNumber || (res as any).cccd || patientData.cccd,
            identificationNumber: res.identificationNumber || (res as any).identificationNumber,
            genderCode: res.genderCode || (res as any).genderCode || patientData.genderCode || null,
            gender: (res as any).gender || patientData.gender || 'male',
            bloodType: (res as any).bloodType || patientData.bloodType || '',
            emergencyContactName: res.emergencyContactName || patientData.emergencyContactName || (res as any).emergencyContactName || '',
            emergencyContactPhone: res.emergencyContactPhone || patientData.emergencyContactPhone || (res as any).emergencyContactPhone || '',
            medicalHistory: res.medicalHistory || patientData.medicalHistory || (res as any).medicalHistory || '',
            allergies: res.allergies || patientData.allergies || (res as any).allergies || ''
          };
          setData(extendedData);
          setEditData({
            username: res.username || '',
            fullName: res.fullName,
            email: res.email,
            phoneNumber: res.phoneNumber || '',
            address: res.address || '',
            dob: res.dob || '',
            cccd: res.identificationNumber || '',
            bloodTypeCode: bloodTypeCode,
            emergencyContactName: res.emergencyContactName || (res as any).emergencyContactName || '',
            emergencyContactPhone: res.emergencyContactPhone || (res as any).emergencyContactPhone || '',
            medicalHistory: res.medicalHistory || (res as any).medicalHistory || '',
            allergies: res.allergies || (res as any).allergies || '',
            imageURL: imageURL
          });
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Não thể tải thông tin người dùng');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.avatarUrl]); // Re-run when user avatar changes

  useEffect(() => {
    if (user?.avatarUrl && data && (!data.imageURL || data.imageURL !== user.avatarUrl)) {
      setData(prev => prev ? { ...prev, imageURL: user.avatarUrl || prev.imageURL } : null);
      setAvatarUpdateKey(prev => prev + 1); // Force re-render
    }
  }, [user?.avatarUrl, data]);

  const handleSaveClick = () => {
    if (editData.username?.trim() && editData.username.length < 3) {
      showToast('Tên tài khoản phải có ít nhất 3 ký tự', 'error');
      return;
    }


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

    if (!validateAllFields()) {
      showToast('Vui lòng kiểm tra lại thông tin đã nhập', 'error');
      return;
    }

    setShowSaveConfirmation(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    setShowSaveConfirmation(false);

    showToast('Đang cập nhật thông tin...', 'info');

    try {
      const apiData = {
        ...editData,
        identificationNumber: editData.cccd,
        bloodTypeCode: editData.bloodTypeCode || undefined,
        medicalHistory: editData.medicalHistory?.trim() || undefined,
        allergies: editData.allergies?.trim() || undefined
      };
      
      if (!apiData.username || apiData.username.trim() === '') {
        apiData.username = data?.username || '';
      }
      
      delete apiData.cccd; // Remove cccd field before sending to API
      
    
      
      const updatedUser = await userService.updateUserInfo(apiData);
      const finalUsername = updatedUser.username && updatedUser.username !== updatedUser.email 
        ? updatedUser.username 
        : editData.username || data?.username || '';
      
      const preservedImageURL = updatedUser.imageURL || data?.imageURL;
      
      const selectedBloodType = bloodTypes.find(bt => bt.code === editData.bloodTypeCode);
      const bloodTypeDisplay = selectedBloodType?.displayName || (updatedUser as any).bloodType || data?.bloodType || '';
      
     
      
      const updatedData: ExtendedUserInfo = {
        ...updatedUser,
        username: finalUsername,
        imageURL: preservedImageURL, // Keep current avatar if API doesn't return it
        cccd: updatedUser.identificationNumber || editData.cccd || data?.cccd,
        identificationNumber: updatedUser.identificationNumber || editData.cccd || data?.identificationNumber,
        gender: (updatedUser as any).gender || data?.gender,
        bloodType: bloodTypeDisplay,
        emergencyContactName: editData.emergencyContactName || updatedUser.emergencyContactName || data?.emergencyContactName,
        emergencyContactPhone: editData.emergencyContactPhone || updatedUser.emergencyContactPhone || data?.emergencyContactPhone,
        medicalHistory: editData.medicalHistory || updatedUser.medicalHistory || data?.medicalHistory,
        allergies: editData.allergies || updatedUser.allergies || data?.allergies
      };
      
      setData(updatedData);
      
      setEditData(prev => ({
        ...prev,
        bloodTypeCode: updatedUser.bloodTypeCode || editData.bloodTypeCode || ''
      }));
      
      setIsEditing(false);
      showToast('Cập nhật thông tin thành công!', 'success');
      
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
        bloodTypeCode: (data as any).bloodTypeCode || '',
        emergencyContactName: data.emergencyContactName || '',
        emergencyContactPhone: data.emergencyContactPhone || '',
        medicalHistory: data.medicalHistory || '',
        allergies: data.allergies || ''
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
      
      if (result.imageUrl) {
        try {
          const latestUserInfo = await userService.getUserInfo();
          const updatedData: ExtendedUserInfo = {
            ...latestUserInfo,
            cccd: latestUserInfo.identificationNumber || data?.cccd,
            identificationNumber: latestUserInfo.identificationNumber || data?.identificationNumber,
            gender: (latestUserInfo as any).gender || data?.gender,
            bloodType: (latestUserInfo as any).bloodType || data?.bloodType,
            emergencyContactName: latestUserInfo.emergencyContactName || data?.emergencyContactName,
            emergencyContactPhone: latestUserInfo.emergencyContactPhone || data?.emergencyContactPhone,
            medicalHistory: latestUserInfo.medicalHistory || data?.medicalHistory,
            allergies: latestUserInfo.allergies || data?.allergies
          };
          setData(updatedData);
          
          setEditData(prev => ({
            ...prev,
            imageURL: latestUserInfo.imageURL || result.imageUrl
          }));
          
          const finalImageUrl = latestUserInfo.imageURL || result.imageUrl;
          
          updateUser({ avatarUrl: finalImageUrl });
          
          setAvatarUpdateKey(prev => prev + 1);
        } catch (reloadError) {
          if (data) {
            const updatedData = { ...data, imageURL: result.imageUrl };
            setData(updatedData);
          }
          
          updateUser({ avatarUrl: result.imageUrl });
          
          setAvatarUpdateKey(prev => prev + 1);
        }
      }
      
      showToast('Cập nhật ảnh đại diện thành công!', 'success');
      
      URL.revokeObjectURL(previewUrl);
      setPreviewImage(null);
    } catch (e: any) {
      let errorMessage = e?.message || 'Không thể tải ảnh lên';
      
      if (e?.message?.includes('405')) {
        errorMessage = 'Lỗi 405: Không thể tải ảnh lên. Endpoint upload có thể chưa được kích hoạt trong backend. Ảnh preview sẽ được hiển thị tạm thời.';
      } else if (e?.message?.includes('404')) {
        errorMessage = 'Lỗi 404: Endpoint upload không tồn tại. Vui lòng liên hệ quản trị viên.';
      } else if (e?.message?.includes('401')) {
        errorMessage = 'Lỗi 401: Bạn cần đăng nhập lại để upload ảnh.';
      } else if (e?.message?.includes('413')) {
        errorMessage = 'File quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB.';
      }
      
      setError(errorMessage);
      
      setTimeout(() => {
        URL.revokeObjectURL(previewUrl);
        setPreviewImage(null);
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
                  {(previewImage || data.imageURL || user?.avatarUrl) ? (
                    <img 
                      key={`avatar-${avatarUpdateKey}-${data.imageURL || user?.avatarUrl || ''}`} // Force re-render when avatar changes
                      src={previewImage || data.imageURL || user?.avatarUrl || ''} 
                      alt="Profile" 
                      className={styles.avatarImage}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data?.fullName || data?.email || 'Patient')}&background=667eea&color=fff`;
                      }}
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
                  <span className={styles.userRole}>Bệnh nhân</span>
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

                {/* CCCD - Editable */}
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

                {/* Giới tính - Read Only */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <i className="bi bi-gender-ambiguous"></i>
                    Giới tính
                  </label>
                  <div className={styles.inputContainer}>
                    <input disabled value={getGenderDisplayName(data.genderCode)} className={styles.fieldInputDisabled} />
                    <i className="bi bi-lock"></i>
                  </div>
                </div>

                {/* Nhóm máu - Editable */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <i className="bi bi-droplet"></i>
                    Nhóm máu
                  </label>
                  {isEditing ? (
                    <div className={styles.inputContainer}>
                      <select
                        value={editData.bloodTypeCode || ''}
                        onChange={(e) => setEditData({...editData, bloodTypeCode: e.target.value})}
                        className={styles.fieldInput}
                      >
                        <option value="">Chọn nhóm máu</option>
                        {bloodTypes.length > 0 ? (
                          bloodTypes.map((bloodType) => (
                            <option key={bloodType.code} value={bloodType.code}>
                              {bloodType.displayName}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>Đang tải...</option>
                        )}
                      </select>
                      <i className="bi bi-pencil"></i>
                    </div>
                  ) : (
                    <div className={styles.inputContainer}>
                      <input 
                        disabled 
                        value={getBloodTypeDisplayName(editData.bloodTypeCode) || data.bloodType || 'Chưa cập nhật'} 
                        className={styles.fieldInputDisabled} 
                      />
                      <i className="bi bi-lock"></i>
                    </div>
                  )}
                </div>

                {/* Họ tên người liên hệ */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <i className="bi bi-person-heart"></i>
                    Họ tên người liên hệ
                  </label>
                  {isEditing ? (
                    <div className={styles.inputContainer}>
                      <input 
                        value={editData.emergencyContactName || ''} 
                        onChange={(e) => setEditData({...editData, emergencyContactName: e.target.value})}
                        className={styles.fieldInput}
                        placeholder="Nhập họ tên người liên hệ"
                      />
                      <i className="bi bi-pencil"></i>
                    </div>
                  ) : (
                    <div className={styles.inputContainer}>
                      <input disabled value={data.emergencyContactName || 'Chưa cập nhật'} className={styles.fieldInputDisabled} />
                      <i className="bi bi-lock"></i>
                    </div>
                  )}
                </div>

                {/* Số điện thoại người liên hệ */}
                <div className={styles.fieldGroup}>
                  <label className={`${styles.fieldLabel} ${fieldErrors.emergencyContactPhone ? styles.fieldLabelError : ''}`}>
                    <i className="bi bi-telephone-plus"></i>
                    Số điện thoại người liên hệ
                    {fieldErrors.emergencyContactPhone && <span className={styles.errorIcon}>⚠️</span>}
                  </label>
                  {isEditing ? (
                    <div className={styles.inputContainer}>
                      <input 
                        maxLength={10}
                        value={editData.emergencyContactPhone || ''} 
                        onChange={(e) => {
                          const numericValue = e.target.value.replace(/[^0-9]/g, '');
                          setEditData({...editData, emergencyContactPhone: numericValue});
                          if (fieldErrors.emergencyContactPhone) {
                            setFieldErrors({...fieldErrors, emergencyContactPhone: ''});
                          }
                        }}
                        onBlur={(e) => handleFieldBlur('emergencyContactPhone', e.target.value)}
                        className={`${styles.fieldInput} ${fieldErrors.emergencyContactPhone ? styles.fieldInputError : ''}`}
                        placeholder="Nhập số điện thoại người liên hệ"
                        type="tel"
                      />
                      <i className="bi bi-pencil"></i>
                    </div>
                  ) : (
                    <div className={styles.inputContainer}>
                      <input disabled value={data.emergencyContactPhone || 'Chưa cập nhật'} className={styles.fieldInputDisabled} />
                      <i className="bi bi-lock"></i>
                    </div>
                  )}
                  {fieldErrors.emergencyContactPhone && (
                    <div className={styles.fieldError}>{fieldErrors.emergencyContactPhone}</div>
                  )}
                </div>

                {/* Tiền sử bệnh lý */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <i className="bi bi-heart-pulse"></i>
                    Tiền sử bệnh lý
                  </label>
                  {isEditing ? (
                    <div className={styles.inputContainer}>
                      <textarea 
                        value={editData.medicalHistory || ''} 
                        onChange={(e) => setEditData({...editData, medicalHistory: e.target.value})}
                        className={styles.fieldTextarea}
                        placeholder="Nhập tiền sử bệnh lý"
                        rows={3}
                      />
                      <i className="bi bi-pencil"></i>
                    </div>
                  ) : (
                    <div className={styles.inputContainer}>
                      <textarea disabled value={data.medicalHistory || 'Chưa cập nhật'} className={styles.fieldTextareaDisabled} rows={3} />
                      <i className="bi bi-lock"></i>
                    </div>
                  )}
                </div>

                {/* Dị ứng */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <i className="bi bi-exclamation-triangle"></i>
                    Dị ứng
                  </label>
                  {isEditing ? (
                    <div className={styles.inputContainer}>
                      <textarea 
                        value={editData.allergies || ''} 
                        onChange={(e) => setEditData({...editData, allergies: e.target.value})}
                        className={styles.fieldTextarea}
                        placeholder="Nhập thông tin dị ứng"
                        rows={3}
                      />
                      <i className="bi bi-pencil"></i>
                    </div>
                  ) : (
                    <div className={styles.inputContainer}>
                      <textarea disabled value={data.allergies || 'Chưa cập nhật'} className={styles.fieldTextareaDisabled} rows={3} />
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