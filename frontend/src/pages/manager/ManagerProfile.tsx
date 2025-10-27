import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { userService, UserBasicInfo, UpdateUserInfo } from '../../services/userService';
import { apiClient } from '../../lib/apiClient';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import styles from '../../styles/manager/ManagerProfile.module.css';

interface ExtendedUserInfo extends UserBasicInfo {
  cccd?: string;
  identificationNumber?: string;
  gender?: 'male' | 'female' | 'other';
  role?: string;
}

interface ExtendedUpdateUserInfo extends UpdateUserInfo {
  username?: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  cccd?: string;
  imageURL?: string;
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

export const ManagerProfile: React.FC = () => {
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
  
  // Check duplicate data states
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [cccdExists, setCccdExists] = useState(false);
  const [isCheckingCccd, setIsCheckingCccd] = useState(false);

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

  const validateField = (fieldName: string, value: string): string | null => {
    switch (fieldName) {
      case 'username':
        return validateUsername(value);
      case 'email':
        return validateEmail(value);
      case 'phoneNumber':
        return validatePhoneNumber(value);
      case 'cccd':
        return validateCCCD(value);
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

    if (editData.cccd) {
      const error = validateField('cccd', editData.cccd);
      if (error) {
        errors.cccd = error;
        isValid = false;
      }
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
      // Clear error if field is empty
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
        const res = await userService.getUserInfo();
        if (mounted) {
          // Get manager-specific data from API
          let managerData: any = {};
          try {
            // Try to get manager data - this endpoint should exist if manager is registered
            const managerResponse = await apiClient.get('/manager/getManagerInfo');
            managerData = managerResponse.data;
            console.log('Manager data received:', managerData);
          } catch (error) {
            console.log('Manager info not available, using basic data');
          }
          
          const extendedData: ExtendedUserInfo = {
            ...res,
            cccd: res.identificationNumber || (res as any).cccd || managerData.cccd,
            identificationNumber: res.identificationNumber || (res as any).identificationNumber,
            gender: (res as any).gender || managerData.gender || 'male',
            role: 'Manager'
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
    // Validate before showing confirmation
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
      // Map cccd to identificationNumber for API
      const apiData = {
        ...editData,
        identificationNumber: editData.cccd,
      };
      
      // Nếu username không được nhập hoặc rỗng, giữ nguyên username hiện tại
      if (!apiData.username || apiData.username.trim() === '') {
        apiData.username = data?.username || '';
      }
      
      delete apiData.cccd; // Remove cccd field before sending to API
      
      const updatedUser = await userService.updateUserInfo(apiData);
      const finalUsername = updatedUser.username && updatedUser.username !== updatedUser.email 
        ? updatedUser.username 
        : editData.username || data?.username || '';
      
      // Preserve imageURL from current data - API might not return avatarUrl
      const preservedImageURL = updatedUser.imageURL || data?.imageURL;
      
      const updatedData: ExtendedUserInfo = {
        ...updatedUser,
        username: finalUsername,
        imageURL: preservedImageURL, // Keep current avatar if API doesn't return it
        cccd: updatedUser.identificationNumber || editData.cccd || data?.cccd,
        identificationNumber: updatedUser.identificationNumber || editData.cccd || data?.identificationNumber,
        gender: (updatedUser as any).gender || data?.gender,
        role: 'Manager'
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
                  <span className={styles.userRole}>Quản lý</span>
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
                          // Clear error when user starts typing
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
                          // Clear error when user starts typing
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
                          // Clear error when user starts typing
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
                    <input disabled value={data.gender === 'male' ? 'Nam' : data.gender === 'female' ? 'Nữ' : 'Khác'} className={styles.fieldInputDisabled} />
                    <i className="bi bi-lock"></i>
                  </div>
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
