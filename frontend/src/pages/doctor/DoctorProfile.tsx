import { useEffect, useState } from 'react';
import styles from '../../styles/doctor/DoctorProfile.module.css';
import { LoadingSpinner } from '../../components/ui';
import { DoctorProfileDetails } from '../../types/doctor.types';
import DoctorService from '../../services/doctorService';
import { useToast } from '../../contexts/ToastContext';
import axios from 'axios';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';

interface DoctorUpdateRequest {
  userName?: string;
  phoneNumber?: string;
  address?: string;
}

export const DoctorProfile: React.FC = () => {
  const { showToast } = useToast();

  const [pageLoading, setPageLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [uploadingDegree, setUploadingDegree] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [data, setData] = useState<DoctorProfileDetails | null>(null);
  const [editData, setEditData] = useState<DoctorUpdateRequest>();

  const [fieldErrors, setFieldErrors] = useState<any>({});

  const previewImage = "https://res.cloudinary.com/dvyswwdcz/image/upload/v1760970670/default_avatar_cnnmzg.jpg";

  useEffect(() => {
    setError(null);
    (async () => {
      try {
        let response = await DoctorService.getDoctorProfileDetails();
        setData(response);
        setEditData({
          userName: response.userName || '',
          address: response.address || '',
          phoneNumber: response.phoneNumber || '',
        });
      } catch (error: any) {
        console.log('Failed to fetch user profile: ', error);
        setError('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      }
      setPageLoading(false);
    })();
    return () => { }
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    setError(null);
    try {
      const response = await DoctorService.updateAvatar(formData);
      console.log(response);
      const newUrl = response.avatarUrl;

      setData((prev) => ({
        ...prev!,
        avatarUrl: newUrl,
      }));

      showToast('Cập nhật ảnh đại diện thành công!', 'success');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorData = error.response?.data;

        if (status === 400 && errorData?.errors?.Avatar?.[0]) {
          setError(errorData.errors.Avatar[0]);
        } else if (status === 500) {
          setError('Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.');
        } else {
          setError('Không thể tải ảnh lên. Vui lòng kiểm tra kết nối hoặc thử lại.');
        }
      } else {
        setError('Lỗi không xác định. Vui lòng thử lại.');
      }
    }
    setUploading(false);
  };

  const handleCancel = () => {
    if (data) {
      setEditData({
        userName: data.userName || '',
        address: data.address || '',
        phoneNumber: data.phoneNumber || '',
      });
    }
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    setFieldErrors({});
  };

  const getFieldDisplayName = (field: string): string => {
    const fieldNames: Record<string, string> = {
      userName: 'Tên tài khoản',
      phoneNumber: 'Số điện thoại',
    };
    return fieldNames[field] || field;
  };

  const validateUsername = (username: string): string | null => {
    if (!username) return 'Tên tài khoản không được để trống';
    if (username.length < 6) return 'Tên tài khoản phải có ít nhất 6 ký tự';
    return null;
  };

  const validatePhoneNumber = (phone: string): string | null => {
    if (!phone) return 'Số điện thoại không được để trống';
    if (!/^0[1-9]\d{8}$/.test(phone)) return 'Số điện thoại phải có đúng 10 chữ số, bắt đầu bằng 0 và chữ số thứ 2 khác 0';
    return null;
  };

  const validateField = (fieldName: string, value: string): string | null => {
    switch (fieldName) {
      case 'userName':
        return validateUsername(value);
      case 'phoneNumber':
        return validatePhoneNumber(value);
      default:
        return null;
    }
  };

  const validateAllFields = (): boolean => {
    const errors: Record<string, string[]> = {};
    let isValid = true;

    // Validate required fields
    const requiredFields = ['userName', 'phoneNumber'];

    for (const field of requiredFields) {
      const value = editData?.[field as keyof typeof editData];
      if (!value || value.toString().trim() === '') {
        errors[field] = [`${getFieldDisplayName(field)} không được để trống`];
        isValid = false;
      } else {
        const error = validateField(field, value.toString());
        if (error) {
          switch (field) {
            case 'userName':
              errors.UserName = [error];
              break;
            case 'phoneNumber':
              errors.PhoneNumber = [error];
              break;
          }
          isValid = false;
        }
      }
    }

    // Validate optional fields if they have values
    if (editData?.address && editData.address.trim() === '') {
      errors.address = ['Địa chỉ không được để trống nếu đã nhập'];
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSaveClick = () => {
    // Check required fields first
    const requiredFields = ['userName', 'phoneNumber'];
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      const value = editData?.[field as keyof typeof editData];
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

    // Show confirmation dialog
    setShowSaveConfirmation(true);
  };

  const handleSave = async () => {
    setShowSaveConfirmation(false);
    if (editData?.userName && editData.phoneNumber) {
      const formData = new FormData();
      formData.append('userName', editData?.userName);
      formData.append('phoneNumber', editData.phoneNumber);
      formData.append('address', editData.address ?? '');

      setSaving(true);
      try {
        await DoctorService.updateDoctorProfile(formData);

        setData((prev) => ({
          ...prev!,
          address: editData.address ?? '',
          userName: editData.userName ?? '',
          phoneNumber: editData.phoneNumber ?? ''
        }));
        setIsEditing(false);

        showToast('Cập nhật thông tin thành công!', 'success');
      } catch (error: any) {
        const status = error.response?.status;
        const errorData = error.response?.data;

        if (axios.isAxiosError(error)) {
          switch (status) {
            case 400:
              if (errorData?.errors) {
                console.log('profileUpdate: ', errorData.errors);
                setFieldErrors(errorData.errors);
              } else {
                showToast('Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.', 'error');
              }
              break;
            default:
              console.error('Profile update error: ', error);
              showToast('Lỗi máy chủ. Vui lòng thử lại sau', 'error');
              break;
          }
        } else {
          console.error('Profile update error: ', error);
          showToast('Không thể cập nhật thông tin', 'error');
        }
      } finally {
        setSaving(false);
      }
    } else {
      return;
    }
  }

  if (pageLoading) {
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
                  {(data.avatarUrl || previewImage) ? (
                    <img
                      src={data.avatarUrl || previewImage || ''}
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
                  accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
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
              {/* Section 1: Thông tin cá nhân */}
              <div className={styles.sectionHeader}>
                <h3>1. Thông tin cá nhân</h3>
                <p>Thông tin cơ bản về bác sĩ</p>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label className={`${styles.fieldLabel} ${fieldErrors?.UserName?.[0] ? styles.fieldLabelError : ''}`}>
                    <i className="bi bi-person"></i>
                    Tên tài khoản
                    {fieldErrors?.UserName?.[0] && <span className={styles.errorIcon}>⚠️</span>}
                  </label>
                  {isEditing ? (
                    <div className={styles.inputContainer}>
                      <input
                        value={editData?.userName || ''}
                        onChange={(e) => {
                          setEditData({ ...editData, userName: e.target.value });
                          if (fieldErrors?.UserName?.[0]) {
                            setFieldErrors({ ...fieldErrors, UserName: [''] });
                          }
                        }}
                        //onBlur={(e) => handleFieldBlur('username', e.target.value)}
                        className={`${styles.fieldInput} ${fieldErrors?.UserName?.[0] ? styles.fieldInputError : ''}`}
                        placeholder="Nhập tên tài khoản"
                      />
                      <i className="bi bi-pencil"></i>
                    </div>
                  ) : (
                    <div className={styles.inputContainer}>
                      <input disabled value={data.userName || ''} className={styles.fieldInputDisabled} />
                      <i className="bi bi-lock"></i>
                    </div>
                  )}
                  {fieldErrors?.UserName?.[0] && (
                    <div className={styles.fieldError}>{fieldErrors?.UserName[0]}</div>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <i className="bi bi-person-badge"></i>
                    Họ và Tên
                  </label>
                  <div className={styles.inputContainer}>
                    <input disabled value={data.fullName} className={styles.fieldInputDisabled} />
                    <i className="bi bi-lock"></i>
                  </div>
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
                  <label className={`${styles.fieldLabel} ${fieldErrors?.PhoneNumber?.[0] ? styles.fieldLabelError : ''}`}>
                    <i className="bi bi-telephone"></i>
                    Số điện thoại
                    {fieldErrors?.PhoneNumber?.[0] && <span className={styles.errorIcon}>⚠️</span>}
                  </label>
                  {isEditing ? (
                    <div className={styles.inputContainer}>
                      <input
                        maxLength={10}
                        value={editData?.phoneNumber || ''}
                        onChange={(e) => {
                          const numericValue = e.target.value.replace(/[^0-9]/g, '');
                          setEditData({ ...editData, phoneNumber: numericValue });
                          if (fieldErrors?.PhoneNumber?.[0]) {
                            setFieldErrors({ ...fieldErrors, PhoneNumber: [''] });
                          }
                        }}
                        //onBlur={(e) => handleFieldBlur('phoneNumber', e.target.value)}
                        className={`${styles.fieldInput} ${fieldErrors?.PhoneNumber?.[0] ? styles.fieldInputError : ''}`}
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
                  {fieldErrors?.PhoneNumber?.[0] && (
                    <div className={styles.fieldError}>{fieldErrors?.PhoneNumber[0]}</div>
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
                        value={editData?.address || ''}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
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
                  <div className={styles.inputContainer}>
                    <input disabled value={data.dob} className={styles.fieldInputDisabled} />
                    <i className="bi bi-lock"></i>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={`${styles.fieldLabel} ${fieldErrors?.cccd ? styles.fieldLabelError : ''}`}>
                    <i className="bi bi-card-text"></i>
                    CCCD
                  </label>
                  <div className={styles.inputContainer}>
                    <input disabled value={data.identificationNumber || 'Chưa cập nhật'} className={styles.fieldInputDisabled} />
                    <i className="bi bi-lock"></i>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <i className="bi bi-gender-ambiguous"></i>
                    Giới tính
                  </label>
                  <div className={styles.inputContainer}>
                    <input disabled value={data.genderCode === 'male' ? 'Nam' : data.genderCode === 'female' ? 'Nữ' : 'Khác'} className={styles.fieldInputDisabled} />
                    <i className="bi bi-lock"></i>
                  </div>
                </div>
              </div>

              {/* Section 2: Thông tin nghề nghiệp */}
              <div className={styles.sectionHeader}>
                <h3>2. Thông tin nghề nghiệp</h3>
                <p>Thông tin về chuyên môn và kinh nghiệm</p>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label className={`${styles.fieldLabel} ${fieldErrors?.specialization ? styles.fieldLabelError : ''}`}>
                    <i className="bi bi-hospital"></i>
                    Chuyên khoa
                    {fieldErrors?.specialization && <span className={styles.errorIcon}>⚠️</span>}
                  </label>
                  <div className={styles.inputContainer}>
                    <input disabled value={data.specialization || 'Chưa cập nhật'} className={styles.fieldInputDisabled} />
                    <i className="bi bi-lock"></i>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={`${styles.fieldLabel} ${fieldErrors?.licenseNumber ? styles.fieldLabelError : ''}`}>
                    <i className="bi bi-award"></i>
                    Số chứng chỉ
                    {fieldErrors?.licenseNumber && <span className={styles.errorIcon}>⚠️</span>}
                  </label>
                  <div className={styles.inputContainer}>
                    <input disabled value={data.licenseNumber || 'Chưa cập nhật'} className={styles.fieldInputDisabled} />
                    <i className="bi bi-lock"></i>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <i className="bi bi-mortarboard"></i>
                    Trình độ học vấn
                  </label>
                  <div className={styles.inputContainer}>
                    <input disabled value={data.education || 'Chưa cập nhật'} className={styles.fieldInputDisabled} />
                    <i className="bi bi-lock"></i>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <i className="bi bi-box"></i>
                    Gói dịch vụ
                  </label>
                  <div className={styles.inputContainer}>
                    <input disabled value={data.serviceTier || 'Chưa cập nhật'} className={styles.fieldInputDisabled} />
                    <i className="bi bi-lock"></i>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={`${styles.fieldLabel} ${fieldErrors?.yearsOfExperience ? styles.fieldLabelError : ''}`}>
                    <i className="bi bi-clock-history"></i>
                    Số năm kinh nghiệm
                    {fieldErrors?.yearsOfExperience && <span className={styles.errorIcon}>⚠️</span>}
                  </label>
                  <div className={styles.inputContainer}>
                    <input disabled value={`${data.yearsOfExperience || 0} năm`} className={styles.fieldInputDisabled} />
                    <i className="bi bi-lock"></i>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <i className="bi bi-file-text"></i>
                    Tiểu sử
                  </label>
                  <div className={styles.inputContainer}>
                    <textarea disabled value={data.bio || 'Chưa cập nhật'} className={styles.fieldTextareaDisabled} rows={3} />
                    <i className="bi bi-lock"></i>
                  </div>
                </div>
              </div>

              {/* Section 3: Chứng chỉ và bằng cấp */}
              <div className={styles.sectionHeader}>
                <h3>3. Chứng chỉ và bằng cấp</h3>
                <p>Quản lý tài liệu chứng nhận</p>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <i className="bi bi-image"></i>
                    Chứng chỉ làm việc (Ảnh)
                  </label>
                  <div className={styles.fileUploadContainer}>
                    <div className={styles.filePreview}>
                      <img src={data.licenseImageUrl} alt="License" className={styles.filePreviewImage} />
                    </div>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <i className="bi bi-file-earmark-zip"></i>
                    Bằng cấp (File RAR/ZIP)
                  </label>
                  <div className={styles.fileUploadContainer}>
                    <div className={styles.filePreview}>
                      <div className={styles.fileIconContainer}>
                        <i className="bi bi-file-earmark-zip" style={{ fontSize: '48px', color: '#667eea' }}></i>
                      </div>
                      <a
                        // type="button"
                        // onClick={() => document.getElementById('degreeFileInput')?.click()}
                        className={styles.fileUpdateBtn}
                        href={data.degreeFilesUrl}
                        download
                        //disabled={uploadingDegree}
                      >
                        Tải về
                      </a>
                    </div>

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