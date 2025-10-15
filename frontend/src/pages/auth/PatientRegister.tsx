import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { PatientRegistration, BloodType, Gender, RegisterRequestPatient, PatientDTO, ValidationErrors } from '../../types/auth.types';
import { validatePatientRegistrationForm, validatePassword, getPasswordStrength } from '../../utils/validation';

export const PatientRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    // Phần 1: Thông tin cá nhân & đăng nhập
    fullName: '',
    identificationNumber: '',
    address: '',
    email: '',
    phoneNumber: '',
    password: '',
    passwordConfirmation: '', // Match backend
    
    // Phần 2: Thông tin Y tế & EMR
    dateOfBirth: '',
    genderCode: '', // Match backend
    bloodTypeCode: '',
    
    // Phần 3: Người liên hệ khẩn cấp
    emergencyContactName: '',
    emergencyContactPhone: '',
    
    // Phần 4: Tiền sử bệnh lý
    medicalHistory: '',
    allergies: '',
    
    // Đồng ý điều khoản
    agreeTerms: false,
  });

  const [bloodTypes, setBloodTypes] = useState<BloodType[]>([]);
  const [genderOptions, setGenderOptions] = useState<Gender[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const { registerPatient } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Load blood types and gender options
    const loadOptions = async () => {
      try {
        const [bloodTypesData, genderData] = await Promise.all([
          authService.getBloodTypes(),
          Promise.resolve(authService.getGenderOptions())
        ]);
        setBloodTypes(bloodTypesData);
        setGenderOptions(genderData);
      } catch (err) {
        console.error('Error loading options:', err);
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    // Update password requirements in real-time
    const requirements = validatePassword(formData.password);
    setPasswordRequirements(requirements);
  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate form data
    const errors = validatePatientRegistrationForm(formData);
    setValidationErrors(errors);

    // Check for validation errors
    if (Object.keys(errors).length > 0) {
      setError('Vui lòng kiểm tra và sửa các lỗi trong form');
      return;
    }

    if (!formData.agreeTerms) {
      setError('Vui lòng đồng ý với điều khoản dịch vụ');
      return;
    }

    try {
      setIsLoading(true);
      
      const registerRequest: RegisterRequestPatient = {
        email: formData.email,
        password: formData.password,
        passwordConfirmation: formData.passwordConfirmation,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        identificationNumber: formData.identificationNumber || undefined,
        genderCode: formData.genderCode || undefined,
      };

      const patientDTO: PatientDTO = {
        bloodTypeCode: formData.bloodTypeCode || undefined,
        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactPhone: formData.emergencyContactPhone || undefined,
        allergies: formData.allergies || undefined,
        medicalHistory: formData.medicalHistory || undefined,
      };

      const patientRegistration: PatientRegistration = {
        registerRequest,
        patientDTO,
      };

      await registerPatient(patientRegistration);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch = formData.password && formData.passwordConfirmation && 
                         formData.password === formData.passwordConfirmation;

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold">MEDIX</Link>
            <p className="text-blue-100">HỆ THỐNG Y TẾ THÔNG MINH ỨNG DỤNG AI</p>
            <div className="flex space-x-4">
              <Link to="/login" className="bg-transparent border border-white px-4 py-2 rounded hover:bg-white hover:text-blue-600 transition">
                Đăng Nhập
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {Object.keys(validationErrors).length > 0 && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
              <p className="font-semibold">Vui lòng kiểm tra các trường sau:</p>
              <ul className="list-disc list-inside mt-2">
                {Object.entries(validationErrors).map(([field, errors]) => (
                  <li key={field} className="text-sm">
                    {errors.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Phần 1: Thông tin cá nhân & đăng nhập */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Phần 1: Thông tin cá nhân & đăng nhập
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số CCCD/CMND <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="identificationNumber"
                      required
                      value={formData.identificationNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập số căn cước công dân 12 số"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa chỉ liên lạc
                    </label>
                    <textarea
                      name="address"
                      rows={3}
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập địa chỉ liên lạc của bạn"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      required
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="09xxxxxxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                    
                    {/* Password Requirements */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Độ mạnh mật khẩu:</span>
                        <span className={passwordStrength.color}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="text-xs space-y-1">
                        <div className={passwordRequirements.minLength ? 'text-green-600' : 'text-red-600'}>
                          {passwordRequirements.minLength ? '✓' : '✗'} Ít nhất 6 ký tự
                        </div>
                        <div className={passwordRequirements.hasUppercase ? 'text-green-600' : 'text-red-600'}>
                          {passwordRequirements.hasUppercase ? '✓' : '✗'} Có chữ hoa (A, B, C)
                        </div>
                        <div className={passwordRequirements.hasLowercase ? 'text-green-600' : 'text-red-600'}>
                          {passwordRequirements.hasLowercase ? '✓' : '✗'} Có chữ thường (a, b, c)
                        </div>
                        <div className={passwordRequirements.hasNumber ? 'text-green-600' : 'text-red-600'}>
                          {passwordRequirements.hasNumber ? '✓' : '✗'} Có số (1, 2, 3)
                        </div>
                        <div className={passwordRequirements.hasSpecialChar ? 'text-green-600' : 'text-red-600'}>
                          {passwordRequirements.hasSpecialChar ? '✓' : '✗'} Có ký tự đặc biệt (!@#$%)
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="passwordConfirmation"
                      required
                      value={formData.passwordConfirmation}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                    {formData.passwordConfirmation && (
                      <div className="mt-1 text-xs">
                        {passwordsMatch ? (
                          <span className="text-green-600">✓ Mật khẩu khớp</span>
                        ) : (
                          <span className="text-red-600">✗ Mật khẩu không khớp</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Phần 2: Thông tin Y tế & EMR */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Phần 2: Thông tin Y tế & EMR
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giới tính
                    </label>
                    <div className="flex space-x-4">
                      {genderOptions.map((gender) => (
                        <label key={gender.code} className="flex items-center">
                          <input
                            type="radio"
                            name="genderCode"
                            value={gender.code}
                            checked={formData.genderCode === gender.code}
                            onChange={handleChange}
                            className="mr-2"
                          />
                          {gender.displayName}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nhóm máu
                    </label>
                    <select
                      name="bloodTypeCode"
                      value={formData.bloodTypeCode}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Chọn nhóm máu</option>
                      {bloodTypes.map((bloodType) => (
                        <option key={bloodType.code} value={bloodType.code}>
                          {bloodType.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Phần 3: Người liên hệ khẩn cấp */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Phần 3: Người liên hệ khẩn cấp
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ tên người liên hệ
                    </label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Họ và tên"
                    />
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại liên hệ
                    </label>
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Số điện thoại khẩn cần liên lạc khỏi"
                    />
                  </div>
                </div>
              </div>

              {/* Phần 4: Tiền sử bệnh lý */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Phần 4: Tiền sử bệnh lý
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiền sử bệnh lý
                    </label>
                    <textarea
                      name="medicalHistory"
                      rows={4}
                      value={formData.medicalHistory}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Vui lòng mô tả tiền sử bệnh lý, bệnh mãn tính..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dị ứng
                    </label>
                    <textarea
                      name="allergies"
                      rows={4}
                      value={formData.allergies}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Vui lòng liệt kê các loại dị ứng"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <label className="flex items-start">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="mt-1 mr-3"
                required
              />
              <span className="text-sm text-gray-700">
                Tôi đồng ý{' '}
                <Link to="/terms" className="text-blue-600 hover:underline">
                  Điều khoản dịch vụ
                </Link>{' '}
                và{' '}
                <Link to="/privacy" className="text-blue-600 hover:underline">
                  Chính sách bảo mật
                </Link>{' '}
                của MEDIX. Thông tin y tế của bạn được mã hóa và tuân thủ chuẩn bảo mật y tế.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="mt-8 text-center">
            <button
              type="submit"
              disabled={isLoading || !formData.agreeTerms}
              className="bg-blue-600 text-white px-12 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'ĐANG ĐĂNG KÝ...' : 'ĐĂNG KÝ TÀI KHOẢN'}
            </button>
            
            <div className="mt-4 text-sm text-gray-600">
              Bạn đã có tài khoản?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
