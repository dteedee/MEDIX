import React, { useEffect, useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { userService, UserBasicInfo, UpdateUserInfo } from '../../services/userService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const formatDate = (iso: string | null | undefined) => {
	if (!iso) return '';
	try {
		// Expecting 'YYYY-MM-DD'
		const [y, m, d] = iso.split('-');
		return `${d}/${m}/${y}`;
	} catch {
		return iso;
	}
};

export const PatientProfile: React.FC = () => {
	const [data, setData] = useState<UserBasicInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [editData, setEditData] = useState<UpdateUserInfo>({});
	const [uploading, setUploading] = useState(false);
	const [previewImage, setPreviewImage] = useState<string | null>(null);
	const [phoneNumberError, setPhoneNumberError] = useState<string | null>(null);
	const [emergencyContactPhoneError, setEmergencyContactPhoneError] = useState<string | null>(null);
	const [usernameError, setUsernameError] = useState<string | null>(null);
	const [fullNameError, setFullNameError] = useState<string | null>(null);
	const [addressError, setAddressError] = useState<string | null>(null);
	const [dobError, setDobError] = useState<string | null>(null);
	const [emergencyContactNameError, setEmergencyContactNameError] = useState<string | null>(null);

	// Add keyframes for spinner animation
	React.useEffect(() => {
		const style = document.createElement('style');
		style.textContent = `
			@keyframes spin {
				0% { transform: rotate(0deg); }
				100% { transform: rotate(360deg); }
			}
		`;
		document.head.appendChild(style);
		return () => {
			document.head.removeChild(style);
		};
	}, []);

	// Phone validation functions
	const validatePhoneNumber = (phone: string) => {
		if (!phone.trim()) {
			setPhoneNumberError(null);
			return true;
		}
		const phonePattern = /^0\d{9}$/;
		if (!phonePattern.test(phone)) {
			setPhoneNumberError('Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số');
			return false;
		}
		setPhoneNumberError(null);
		return true;
	};

	const validateEmergencyContactPhone = (phone: string) => {
		if (!phone.trim()) {
			setEmergencyContactPhoneError(null);
			return true;
		}
		const phonePattern = /^0\d{9}$/;
		if (!phonePattern.test(phone)) {
			setEmergencyContactPhoneError('Số điện thoại liên hệ khẩn cấp phải bắt đầu bằng 0 và có đúng 10 chữ số');
			return false;
		}
		setEmergencyContactPhoneError(null);
		return true;
	};

	const validateUsername = (username: string) => {
		if (!username.trim()) {
			setUsernameError(null);
			return true;
		}
		if (username.length < 3) {
			setUsernameError('Tên tài khoản phải có ít nhất 3 ký tự');
			return false;
		}
		if (!/^[a-zA-Z0-9_]+$/.test(username)) {
			setUsernameError('Tên tài khoản chỉ được chứa chữ cái, số và dấu gạch dưới');
			return false;
		}
		setUsernameError(null);
		return true;
	};

	const validateFullName = (fullName: string) => {
		if (!fullName.trim()) {
			setFullNameError('Họ và tên là trường bắt buộc');
			return false;
		}
		setFullNameError(null);
		return true;
	};

	const validateAddress = (address: string) => {
		if (!address.trim()) {
			setAddressError(null);
			return true;
		}
		setAddressError(null);
		return true;
	};

	const validateDob = (dob: string) => {
		if (!dob.trim()) {
			setDobError(null);
			return true;
		}
		const date = new Date(dob);
		const now = new Date();
		
		// Check if date is valid
		if (isNaN(date.getTime())) {
			setDobError('Ngày sinh không hợp lệ');
			return false;
		}
		
		// Check if date is in the future
		if (date > now) {
			setDobError('Ngày sinh không thể là ngày trong tương lai');
			return false;
		}
		
		// Calculate age
		let age = now.getFullYear() - date.getFullYear();
		const monthDiff = now.getMonth() - date.getMonth();
		
		if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
			age--;
		}
		
		if (age < 18) {
			setDobError('Bạn phải đủ 18 tuổi');
			return false;
		}
		if (age > 150) {
			setDobError('Ngày sinh không hợp lý');
			return false;
		}
		
		setDobError(null);
		return true;
	};

	const validateEmergencyContactName = (name: string) => {
		if (!name.trim()) {
			setEmergencyContactNameError(null);
			return true;
		}
		setEmergencyContactNameError(null);
		return true;
	};

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				console.log('🔄 PatientProfile - Starting to load user data...');
				const res = await userService.getUserInfo();
				console.log('✅ PatientProfile - API response received:', res);
				if (mounted) {
					setData(res);
					console.log('✅ PatientProfile - User data set:', res);
					console.log('Profile Image URL:', res.imageURL);
					console.log('Profile Image URL type:', typeof res.imageURL);
					
					setEditData({
						username: res.username || '',
						fullName: res.fullName,
						email: res.email,
						phoneNumber: res.phoneNumber || '',
						address: res.address || '',
						dob: res.dob || '',
						emergencyContactName: res.emergencyContactName || '',
						emergencyContactPhone: res.emergencyContactPhone || ''
					});
				}
			} catch (e: any) {
				console.error('❌ PatientProfile - Error loading user data:', e);
				console.error('❌ PatientProfile - Error details:', {
					message: e?.message,
					status: e?.response?.status,
					data: e?.response?.data
				});
				if (mounted) setError(e?.message || 'Không thể tải thông tin người dùng');
			} finally {
				console.log('✅ PatientProfile - Loading complete, setting loading to false');
				if (mounted) setLoading(false);
			}
		})();
		return () => { mounted = false; };
	}, []);

	const handleSave = async () => {
		// Check for real-time validation errors first
		if (usernameError || fullNameError || addressError || dobError || 
			phoneNumberError || emergencyContactPhoneError || emergencyContactNameError) {
			setError('Vui lòng sửa các lỗi trong thông tin trước khi lưu');
			return;
		}


		setSaving(true);
		setError(null);
		setSuccess(null);

		try {
			const updatedUser = await userService.updateUserInfo(editData);
			console.log('Updated user data from API:', updatedUser);
			console.log('Original username:', data?.username);
			console.log('Username from editData:', editData.username);
			
			// Use username from editData (what user just entered) if API doesn't return it properly
			// Also check if API returned email in username field (common backend mistake)
			const finalUsername = updatedUser.username && updatedUser.username !== updatedUser.email 
				? updatedUser.username 
				: editData.username || data?.username || '';
			
			const updatedData = {
				...updatedUser,
				username: finalUsername
			};
			console.log('Final updated data:', updatedData);
			
			setData(updatedData);
			setIsEditing(false);
			setSuccess('Cập nhật thông tin thành công!');
			
			// Optional: Reload fresh data from server to ensure consistency
			try {
				const freshData = await userService.getUserInfo();
				console.log('Fresh data from server:', freshData);
				
				// Use the username we just set if server doesn't return the updated one
				const finalFreshData = {
					...freshData,
					username: freshData.username && freshData.username !== freshData.email 
						? freshData.username 
						: finalUsername
				};
				
				setData(finalFreshData);
				console.log('Final fresh data set:', finalFreshData);
			} catch (reloadError) {
				console.warn('Could not reload fresh data:', reloadError);
			}
			
			setTimeout(() => setSuccess(null), 3000);
		} catch (e: any) {
			setError(e?.message || 'Không thể cập nhật thông tin');
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
				emergencyContactName: data.emergencyContactName || '',
				emergencyContactPhone: data.emergencyContactPhone || ''
			});
		}
		setIsEditing(false);
		setError(null);
		setSuccess(null);
		setPhoneNumberError(null);
		setEmergencyContactPhoneError(null);
		setUsernameError(null);
		setFullNameError(null);
		setAddressError(null);
		setDobError(null);
		setEmergencyContactNameError(null);
	};

	const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		console.log('Selected file details:');
		console.log('- Name:', file.name);
		console.log('- Type:', file.type);
		console.log('- Size:', file.size, 'bytes');
		console.log('- Last Modified:', new Date(file.lastModified));

		// Enhanced file type validation
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
		const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
		
		const fileName = file.name.toLowerCase();
		const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
		const hasValidMimeType = allowedTypes.includes(file.type);

		console.log('File validation:');
		console.log('- Valid extension:', hasValidExtension);
		console.log('- Valid MIME type:', hasValidMimeType);

		if (!hasValidMimeType || !hasValidExtension) {
			setError(`File không hợp lệ: ${file.name}\nMIME Type: ${file.type}\nChỉ chấp nhận: JPG, JPEG, PNG, WEBP`);
			return;
		}

		// Validate file size (5MB max)
		const maxSize = 5 * 1024 * 1024; // 5MB in bytes
		if (file.size > maxSize) {
			setError(`File quá lớn: ${(file.size / 1024 / 1024).toFixed(2)}MB. Tối đa 5MB`);
			return;
		}

		// Create preview URL immediately
		const previewUrl = URL.createObjectURL(file);
		setPreviewImage(previewUrl);

		setUploading(true);
		setError(null);
		setSuccess(null);

		try {
			// Try to upload to backend first
			console.log('Attempting to upload file:', file.name, 'to backend...');
			console.log('FormData will contain:', {
				fieldName: 'file',
				fileName: file.name,
				fileType: file.type,
				fileSize: file.size
			});
			
			const result = await userService.uploadProfileImage(file);
			console.log('Upload successful:', result);
			
			// Update user data immediately with new image URL
			if (data && result.imageUrl) {
				const updatedData = { ...data, imageURL: result.imageUrl };
				setData(updatedData);
				console.log('Updated user data with new image:', updatedData);
			}
			
			setSuccess('Cập nhật ảnh đại diện thành công!');
			setTimeout(() => setSuccess(null), 3000);
			
			// Clean up preview URL since we have real URL now
			URL.revokeObjectURL(previewUrl);
			setPreviewImage(null);
		} catch (e: any) {
			console.error('Upload error:', e);
			console.error('Full error object:', JSON.stringify(e, null, 2));
			
			// Enhanced error logging for debugging
			if (e.response) {
				console.error('Response status:', e.response.status);
				console.error('Response data:', e.response.data);
				console.error('Response headers:', e.response.headers);
			}
			
			// Keep the preview image for now since backend failed
			const errorMessage = e?.message || 'Không thể tải ảnh lên';
			setError(`${errorMessage}. Ảnh preview sẽ được hiển thị tạm thời.`);
			
			// Show preview for 10 seconds then clear for better debugging
			setTimeout(() => {
				URL.revokeObjectURL(previewUrl);
				setPreviewImage(null);
				setError(null);
			}, 10000);
		} finally {
			setUploading(false);
			// Reset file input
			event.target.value = '';
		}
	};

	return (
		<div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', padding: '16px' }}>
			<div style={{ display: 'flex', gap: 24 }}>
				<Sidebar />
				<div style={{ 
					flex: 1, 
					display: 'flex', 
					justifyContent: 'center',
					alignItems: 'flex-start',
					paddingTop: '40px'
				}}>
					<div style={{ 
						width: '100%',
						maxWidth: 700,
						background: '#fff', 
						borderRadius: 12, 
						padding: 40, 
						boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
						border: '1px solid #e5e7eb'
					}}>
						{loading && (
							<div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
								<LoadingSpinner />
							</div>
						)}
						{!loading && error && (
							<div style={{ 
								color: '#b91c1c', 
								background: '#fee2e2', 
								border: '1px solid #fecaca', 
								padding: 16, 
								borderRadius: 8,
								textAlign: 'center',
								marginBottom: 20
							}}>
								{error}
							</div>
						)}
						{!loading && success && (
							<div style={{ 
								color: '#059669', 
								background: '#d1fae5', 
								border: '1px solid #6ee7b7', 
								padding: 16, 
								borderRadius: 8,
								textAlign: 'center',
								marginBottom: 20
							}}>
								{success}
							</div>
						)}
						{!loading && data && (
							<>
								{/* Profile Header */}
								<div style={{ textAlign: 'center', marginBottom: 40 }}>
									<h1 style={{ 
										fontSize: 28, 
										fontWeight: 700, 
										color: '#1f2937', 
										marginBottom: 8 
									}}>
										Thông tin cá nhân
									</h1>
									<p style={{ color: '#6b7280', fontSize: 16 }}>
										Quản lý và cập nhật thông tin tài khoản của bạn
									</p>
								</div>

								{/* Avatar */}
								<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
								
									
									<div style={{ 
										width: 120, 
										height: 120, 
										borderRadius: '50%', 
										background: (data.imageURL || previewImage) ? 'transparent' : '#e5e7eb', 
										display: 'flex', 
										alignItems: 'center', 
										justifyContent: 'center',
										border: '4px solid #f3f4f6',
										overflow: 'hidden',
										position: 'relative'
									}}>
										{(previewImage || data.imageURL) ? (
											<img 
												src={previewImage || data.imageURL || ''} 
												alt="Profile" 
												style={{ 
													width: '100%', 
													height: '100%', 
													objectFit: 'cover' 
												}} 
											/>
										) : (
											<svg width="60" height="60" viewBox="0 0 24 24" fill="#9ca3af" xmlns="http://www.w3.org/2000/svg">
												<path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 3.134-7 7h2a5 5 0 0 1 10 0h2c0-3.866-3.134-7-7-7z"/>
											</svg>
										)}
									</div>
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
										style={{ 
											marginTop: 16, 
											background: uploading ? '#9ca3af' : '#2563eb', 
											color: '#fff', 
											padding: '10px 16px', 
											border: 'none', 
											borderRadius: 8, 
											cursor: uploading ? 'not-allowed' : 'pointer', 
											fontWeight: 600,
											fontSize: 14,
											display: 'flex',
											alignItems: 'center',
											gap: 8
										}}
									>
										{uploading ? (
											<>
												<div style={{ 
													width: 16, 
													height: 16, 
													border: '2px solid #fff', 
													borderTop: '2px solid transparent', 
													borderRadius: '50%', 
													animation: 'spin 1s linear infinite' 
												}}></div>
												Đang tải...
											</>
										) : (
											<>
												<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
													<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
												</svg>
												Tải ảnh lên
											</>
										)}
									</button>
								</div>

								{/* Fields */}
								<div style={{ 
									display: 'grid', 
									gridTemplateColumns: '180px 1fr', 
									rowGap: 20, 
									columnGap: 20, 
									alignItems: 'center',
									marginBottom: 40
								}}>
									<label style={{ textAlign: 'right', color: '#374151', fontWeight: 500 }}>Tên tài khoản</label>
									{isEditing ? (
										<div>
											<input 
												value={editData.username || ''} 
												onChange={(e) => {
													const value = e.target.value;
													setEditData({...editData, username: value});
													validateUsername(value);
												}}
												style={{
													...inputStyleEditable,
													borderColor: usernameError ? '#dc2626' : '#d1d5db'
												}}
												placeholder="Nhập tên tài khoản"
											/>
											{usernameError && (
												<div style={{
													color: '#dc2626',
													fontSize: '12px',
													marginTop: '4px'
												}}>
													{usernameError}
												</div>
											)}
										</div>
									) : (
										<input disabled value={data.username || ''} style={inputStyleDisabled} />
									)}

									<label style={{ textAlign: 'right', color: '#374151', fontWeight: 500 }}>Họ và Tên</label>
									{isEditing ? (
										<div>
											<input 
												value={editData.fullName || ''} 
												onChange={(e) => {
													const value = e.target.value;
													setEditData({...editData, fullName: value});
													validateFullName(value);
												}}
												style={{
													...inputStyleEditable,
													borderColor: fullNameError ? '#dc2626' : '#d1d5db'
												}}
												placeholder="Nhập họ và tên"
											/>
											{fullNameError && (
												<div style={{
													color: '#dc2626',
													fontSize: '12px',
													marginTop: '4px'
												}}>
													{fullNameError}
												</div>
											)}
										</div>
									) : (
										<input disabled value={data.fullName} style={inputStyleDisabled} />
									)}

									<label style={{ textAlign: 'right', color: '#374151', fontWeight: 500 }}>Email</label>
									<input disabled value={data.email} style={inputStyleDisabled} />

									<label style={{ textAlign: 'right', color: '#374151', fontWeight: 500 }}>Số điện thoại</label>
									{isEditing ? (
										<div>
											<input 
												maxLength={10}
												value={editData.phoneNumber || ''} 
												onChange={(e) => {
													const numericValue = e.target.value.replace(/[^0-9]/g, '');
													setEditData({...editData, phoneNumber: numericValue});
													validatePhoneNumber(numericValue);
												}}
												style={{
													...inputStyleEditable,
													borderColor: phoneNumberError ? '#dc2626' : '#d1d5db'
												}}
												placeholder="Nhập số điện thoại (bắt đầu bằng 0)"
												type="tel"
											/>
											{phoneNumberError && (
												<div style={{
													color: '#dc2626',
													fontSize: '12px',
													marginTop: '4px'
												}}>
													{phoneNumberError}
												</div>
											)}
										</div>
									) : (
										<input disabled value={data.phoneNumber || 'Chưa cập nhật'} style={inputStyleDisabled} />
									)}

									<label style={{ textAlign: 'right', color: '#374151', fontWeight: 500 }}>Địa chỉ</label>
									{isEditing ? (
										<div>
											<input 
												value={editData.address || ''} 
												onChange={(e) => {
													const value = e.target.value;
													setEditData({...editData, address: value});
													validateAddress(value);
												}}
												style={{
													...inputStyleEditable,
													borderColor: addressError ? '#dc2626' : '#d1d5db'
												}}
												placeholder="Nhập địa chỉ"
											/>
											{addressError && (
												<div style={{
													color: '#dc2626',
													fontSize: '12px',
													marginTop: '4px'
												}}>
													{addressError}
												</div>
											)}
										</div>
									) : (
										<input disabled value={data.address || 'Chưa cập nhật'} style={inputStyleDisabled} />
									)}

									<label style={{ textAlign: 'right', color: '#374151', fontWeight: 500 }}>Ngày sinh</label>
									{isEditing ? (
										<div>
											<input 
												type="date"
												value={editData.dob || ''} 
												onChange={(e) => {
													const value = e.target.value;
													setEditData({...editData, dob: value});
													validateDob(value);
												}}
												style={{
													...inputStyleEditable,
													borderColor: dobError ? '#dc2626' : '#d1d5db'
												}}
											/>
											{dobError && (
												<div style={{
													color: '#dc2626',
													fontSize: '12px',
													marginTop: '4px'
												}}>
													{dobError}
												</div>
											)}
										</div>
									) : (
										<input disabled value={formatDate(data.dob)} style={inputStyleDisabled} />
									)}

									<label style={{ textAlign: 'right', color: '#374151', fontWeight: 500 }}>Số hồ sơ bệnh án</label>
									<input disabled value={data.medicalRecordNumber || 'Chưa có'} style={inputStyleDisabled} />

									<label style={{ textAlign: 'right', color: '#374151', fontWeight: 500 }}>Tên người liên hệ khẩn cấp</label>
									{isEditing ? (
										<div>
											<input 
												value={editData.emergencyContactName || ''} 
												onChange={(e) => {
													const value = e.target.value;
													setEditData({...editData, emergencyContactName: value});
													validateEmergencyContactName(value);
												}}
												style={{
													...inputStyleEditable,
													borderColor: emergencyContactNameError ? '#dc2626' : '#d1d5db'
												}}
												placeholder="Nhập tên người liên hệ khẩn cấp"
											/>
											{emergencyContactNameError && (
												<div style={{
													color: '#dc2626',
													fontSize: '12px',
													marginTop: '4px'
												}}>
													{emergencyContactNameError}
												</div>
											)}
										</div>
									) : (
										<input disabled value={data.emergencyContactName || 'Chưa cập nhật'} style={inputStyleDisabled} />
									)}

									<label style={{ textAlign: 'right', color: '#374151', fontWeight: 500 }}>Số điện thoại liên hệ khẩn cấp</label>
									{isEditing ? (
										<div>
											<input 
												value={editData.emergencyContactPhone || ''} 
												onChange={(e) => {
													const numericValue = e.target.value.replace(/[^0-9]/g, '');
													setEditData({...editData, emergencyContactPhone: numericValue});
													validateEmergencyContactPhone(numericValue);
												}}
												style={{
													...inputStyleEditable,
													borderColor: emergencyContactPhoneError ? '#dc2626' : '#d1d5db'
												}}
												placeholder="Nhập số điện thoại liên hệ khẩn cấp (bắt đầu bằng 0)"
												type="tel"
												maxLength={10}
											/>
											{emergencyContactPhoneError && (
												<div style={{
													color: '#dc2626',
													fontSize: '12px',
													marginTop: '4px'
												}}>
													{emergencyContactPhoneError}
												</div>
											)}
										</div>
									) : (
										<input disabled value={data.emergencyContactPhone || 'Chưa cập nhật'} style={inputStyleDisabled} />
									)}
								</div>

								{/* Actions */}
								<div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
									{isEditing ? (
										<>
											<button 
												type="button" 
												onClick={handleCancel}
												style={buttonSecondary}
												disabled={saving}
											>
												Hủy
											</button>
											<button 
												type="button" 
												onClick={handleSave}
												style={{
													...buttonPrimary,
													opacity: saving ? 0.7 : 1,
													cursor: saving ? 'not-allowed' : 'pointer'
												}}
												disabled={saving}
											>
												{saving ? 'Đang lưu...' : 'Lưu thay đổi'}
											</button>
										</>
									) : (
										<>
											<button type="button" style={buttonSecondary}>
												Đổi mật khẩu
											</button>
											<button 
												type="button" 
												onClick={() => setIsEditing(true)}
												style={buttonPrimary}
											>
												Chỉnh sửa thông tin
											</button>
										</>
									)}
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

const inputStyleDisabled: React.CSSProperties = {
	width: '100%',
	background: '#f9fafb',
	border: '1px solid #e5e7eb',
	borderRadius: 8,
	padding: '12px 16px',
	color: '#6b7280',
	fontSize: 14,
};

const inputStyleEditable: React.CSSProperties = {
	width: '100%',
	background: '#fff',
	border: '2px solid #d1d5db',
	borderRadius: 8,
	padding: '12px 16px',
	color: '#111827',
	fontSize: 14,
	transition: 'border-color 0.2s',
	outline: 'none',
};

const buttonPrimary: React.CSSProperties = {
	background: '#2563eb',
	color: '#fff',
	padding: '12px 20px',
	borderRadius: 8,
	border: 'none',
	cursor: 'pointer',
	fontWeight: 600,
	fontSize: 14,
	minWidth: 140,
	transition: 'background-color 0.2s',
};

const buttonSecondary: React.CSSProperties = {
	background: '#f3f4f6',
	color: '#374151',
	padding: '12px 20px',
	borderRadius: 8,
	border: '1px solid #d1d5db',
	cursor: 'pointer',
	fontWeight: 600,
	fontSize: 14,
	minWidth: 140,
	transition: 'background-color 0.2s',
};

export default PatientProfile;