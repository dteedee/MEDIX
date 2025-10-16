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

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const res = await userService.getUserInfo();
				if (mounted) {
					setData(res);
					setEditData({
						fullName: res.fullName,
						email: res.email,
						phoneNumber: res.phoneNumber || '',
						address: res.address || '',
						dob: res.dob || ''
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

	const handleSave = async () => {
		if (!editData.fullName?.trim()) {
			setError('Họ và tên không được để trống');
			return;
		}

		setSaving(true);
		setError(null);
		setSuccess(null);

		try {
			const updatedUser = await userService.updateUserInfo(editData);
			setData(updatedUser);
			setIsEditing(false);
			setSuccess('Cập nhật thông tin thành công!');
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
				fullName: data.fullName,
				phoneNumber: data.phoneNumber || '',
				address: data.address || '',
				dob: data.dob || ''
			});
		}
		setIsEditing(false);
		setError(null);
		setSuccess(null);
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
										background: '#e5e7eb', 
										display: 'flex', 
										alignItems: 'center', 
										justifyContent: 'center',
										border: '4px solid #f3f4f6'
									}}>
										<svg width="60" height="60" viewBox="0 0 24 24" fill="#9ca3af" xmlns="http://www.w3.org/2000/svg">
											<path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 3.134-7 7h2a5 5 0 0 1 10 0h2c0-3.866-3.134-7-7-7z"/>
										</svg>
									</div>
									<button type="button" style={{ 
										marginTop: 16, 
										background: '#2563eb', 
										color: '#fff', 
										padding: '10px 16px', 
										border: 'none', 
										borderRadius: 8, 
										cursor: 'pointer', 
										fontWeight: 600,
										fontSize: 14
									}}>
										Tải ảnh lên
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
									<input disabled value={data.username} style={inputStyleDisabled} />

									<label style={{ textAlign: 'right', color: '#374151', fontWeight: 500 }}>Họ và Tên *</label>
									{isEditing ? (
										<input 
											value={editData.fullName || ''} 
											onChange={(e) => setEditData({...editData, fullName: e.target.value})}
											style={inputStyleEditable}
											placeholder="Nhập họ và tên"
											required
										/>
									) : (
										<input disabled value={data.fullName} style={inputStyleDisabled} />
									)}

									<label style={{ textAlign: 'right', color: '#374151', fontWeight: 500 }}>Email</label>
									<input disabled value={data.email} style={inputStyleDisabled} />

									<label style={{ textAlign: 'right', color: '#374151', fontWeight: 500 }}>Số điện thoại</label>
									{isEditing ? (
										<input 
											value={editData.phoneNumber || ''} 
											onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
											style={inputStyleEditable}
											placeholder="Nhập số điện thoại"
											type="tel"
										/>
									) : (
										<input disabled value={data.phoneNumber || 'Chưa cập nhật'} style={inputStyleDisabled} />
									)}

									<label style={{ textAlign: 'right', color: '#374151', fontWeight: 500 }}>Địa chỉ</label>
									{isEditing ? (
										<input 
											value={editData.address || ''} 
											onChange={(e) => setEditData({...editData, address: e.target.value})}
											style={inputStyleEditable}
											placeholder="Nhập địa chỉ"
										/>
									) : (
										<input disabled value={data.address || 'Chưa cập nhật'} style={inputStyleDisabled} />
									)}

									<label style={{ textAlign: 'right', color: '#374151', fontWeight: 500 }}>Ngày sinh</label>
									{isEditing ? (
										<input 
											type="date"
											value={editData.dob || ''} 
											onChange={(e) => setEditData({...editData, dob: e.target.value})}
											style={inputStyleEditable}
										/>
									) : (
										<input disabled value={formatDate(data.dob)} style={inputStyleDisabled} />
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