import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';
import styles from '../../styles/admin/SettingsPage.module.css';
import { Language } from '../../contexts/LanguageContext';

interface SystemSettings {
  siteName: string;
  systemDescription: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  jwtExpiryMinutes: number;
  maxFailedLoginAttempts: number;
  accountLockoutDurationMinutes: number;
  passwordMinLength: number;
  passwordMaxLength: number;
  requireDigit: boolean;
  requireLowercase: boolean;
  requireUppercase: boolean;
  requireSpecial: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceSchedule: string;
  defaultLanguage: Language;
}

interface DatabaseBackupInfo {
  fileName: string;
  filePath: string;
  fileSize: number;
  fileSizeFormatted: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Partial<SystemSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backupSettings, setBackupSettings] = useState({
    enabled: false,
    frequency: 'daily',
    time: '02:00',
    retentionDays: 30,
  });
  const [backupList, setBackupList] = useState<DatabaseBackupInfo[]>([]);
  const [backupName, setBackupName] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSaving, setBackupSaving] = useState(false);
  const [backupRunning, setBackupRunning] = useState(false);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);

  useEffect(() => {
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [
        siteNameRes,
        descriptionRes,
        emailRes,
        phoneRes,
        addressRes,
        jwtExpiryRes,
        maxFailedLoginRes,
        lockoutDurationRes,
        passwordMinLengthRes,
        passwordMaxLengthRes,
        requireDigitRes,
        requireLowercaseRes,
        requireUppercaseRes,
        requireSpecialRes,
        maintenanceModeRes,
        maintenanceMessageRes,
        maintenanceScheduleRes,
        defaultLanguageRes,
      ] = await Promise.all([
        apiClient.get('/SystemConfiguration/SiteName'),
        apiClient.get('/SystemConfiguration/SystemDescription'),
        apiClient.get('/SystemConfiguration/ContactEmail'),
        apiClient.get('/SystemConfiguration/ContactPhone'),
        apiClient.get('/SystemConfiguration/ContactAddress'),
        // Security settings
        apiClient.get('/SystemConfiguration/JWT_EXPIRY_MINUTES'),
        apiClient.get('/SystemConfiguration/MaxFailedLoginAttempts'),
        apiClient.get('/SystemConfiguration/AccountLockoutDurationMinutes'),
        // Password policy settings
        apiClient.get('/SystemConfiguration/PASSWORD_MIN_LENGTH'),
        apiClient.get('/SystemConfiguration/PASSWORD_MAX_LENGTH'),
        apiClient.get('/SystemConfiguration/REQUIRE_DIGIT'),
        apiClient.get('/SystemConfiguration/REQUIRE_LOWERCASE'),
        apiClient.get('/SystemConfiguration/REQUIRE_UPPERCASE'),
        apiClient.get('/SystemConfiguration/REQUIRE_SPECIAL'),
        apiClient.get('/SystemConfiguration/MAINTENANCE_MODE'),
        apiClient.get('/SystemConfiguration/MAINTENANCE_MESSAGE'),
        apiClient.get('/SystemConfiguration/MAINTENANCE_SCHEDULE'),
        apiClient.get('/SystemConfiguration/DEFAULT_LANGUAGE'),
      ]);

      setSettings({
        siteName: siteNameRes.data.configValue,
        systemDescription: descriptionRes.data.configValue,
        contactEmail: emailRes.data.configValue,
        contactPhone: phoneRes.data.configValue,
        contactAddress: addressRes.data.configValue,
        // Security settings
        jwtExpiryMinutes: parseInt(jwtExpiryRes.data.configValue, 10),
        maxFailedLoginAttempts: parseInt(maxFailedLoginRes.data.configValue, 10),
        accountLockoutDurationMinutes: parseInt(lockoutDurationRes.data.configValue, 10),
        // Password policy settings
        passwordMinLength: parseInt(passwordMinLengthRes.data.configValue, 10),
        passwordMaxLength: parseInt(passwordMaxLengthRes.data.configValue, 10),
        requireDigit: requireDigitRes.data.configValue.toLowerCase() === 'true',
        requireLowercase: requireLowercaseRes.data.configValue.toLowerCase() === 'true',
        requireUppercase: requireUppercaseRes.data.configValue.toLowerCase() === 'true',
        requireSpecial: requireSpecialRes.data.configValue.toLowerCase() === 'true',
        maintenanceMode: maintenanceModeRes.data?.configValue?.toLowerCase() === 'true',
        maintenanceMessage: maintenanceMessageRes.data?.configValue || '',
        maintenanceSchedule: maintenanceScheduleRes.data?.configValue || '',
        defaultLanguage: (defaultLanguageRes.data?.configValue as Language) || 'vi',
      });

    } catch (error) {
      console.error("Failed to fetch settings", error);
      showToast('Không thể tải cài đặt hệ thống.', 'error');
    } finally {
      setLoading(false);
    }
  };

  fetchSettings();
}, [showToast]);

const fetchBackupSettings = useCallback(async () => {
  setBackupLoading(true);
  try {
    const [enabledRes, frequencyRes, timeRes, retentionRes, backupFilesRes] = await Promise.all([
      apiClient.get('/SystemConfiguration/AUTO_BACKUP_ENABLED'),
      apiClient.get('/SystemConfiguration/AUTO_BACKUP_FREQUENCY'),
      apiClient.get('/SystemConfiguration/AUTO_BACKUP_TIME'),
      apiClient.get('/SystemConfiguration/BACKUP_RETENTION_DAYS'),
      apiClient.get('/SystemConfiguration/database-backup'),
    ]);

    setBackupSettings({
      enabled: enabledRes.data?.configValue?.toLowerCase() === 'true',
      frequency: frequencyRes.data?.configValue || 'daily',
      time: timeRes.data?.configValue || '02:00',
      retentionDays: parseInt(retentionRes.data?.configValue || '30', 10),
    });

    setBackupList(backupFilesRes.data || []);
  } catch (error) {
    console.error('Failed to fetch backup settings', error);
    showToast('Không thể tải cấu hình sao lưu.', 'error');
  } finally {
    setBackupLoading(false);
  }
}, [showToast]);

useEffect(() => {
  fetchBackupSettings();
}, [fetchBackupSettings]);


  const handleInputChange = (key: keyof SystemSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleCheckboxChange = (key: keyof SystemSettings, checked: boolean) => {
    setSettings(prev => ({ ...prev, [key]: checked }));
  };

  const handleMaintenanceModeChange = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, maintenanceMode: enabled }));
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    showToast('Đang lưu thay đổi...', 'info');
    try {
      await Promise.all([
        apiClient.put('/SystemConfiguration/SiteName', { value: settings.siteName }),
        apiClient.put('/SystemConfiguration/SystemDescription', { value: settings.systemDescription }),
        apiClient.put('/SystemConfiguration/ContactEmail', { value: settings.contactEmail }),
        apiClient.put('/SystemConfiguration/ContactPhone', { value: settings.contactPhone }),
        apiClient.put('/SystemConfiguration/ContactAddress', { value: settings.contactAddress }),
        // Security settings
        apiClient.put('/SystemConfiguration/JWT_EXPIRY_MINUTES', { value: settings.jwtExpiryMinutes?.toString() }),
        apiClient.put('/SystemConfiguration/MaxFailedLoginAttempts', { value: settings.maxFailedLoginAttempts?.toString() }),
        apiClient.put('/SystemConfiguration/AccountLockoutDurationMinutes', { value: settings.accountLockoutDurationMinutes?.toString() }),
        // Password policy settings
        apiClient.put('/SystemConfiguration/PASSWORD_MIN_LENGTH', { value: settings.passwordMinLength?.toString() }),
        apiClient.put('/SystemConfiguration/PASSWORD_MAX_LENGTH', { value: settings.passwordMaxLength?.toString() }),
        apiClient.put('/SystemConfiguration/REQUIRE_DIGIT', { value: settings.requireDigit?.toString() }),
        apiClient.put('/SystemConfiguration/REQUIRE_LOWERCASE', { value: settings.requireLowercase?.toString() }),
        apiClient.put('/SystemConfiguration/REQUIRE_UPPERCASE', { value: settings.requireUppercase?.toString() }),
        apiClient.put('/SystemConfiguration/REQUIRE_SPECIAL', { value: settings.requireSpecial?.toString() }),
        apiClient.put('/SystemConfiguration/DEFAULT_LANGUAGE', { value: settings.defaultLanguage || 'vi' }),
      ]);
      showToast('Lưu thay đổi thành công!', 'success');
    } catch (error) {
      console.error("Failed to save settings", error);
      showToast('Lưu thay đổi thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBackupSettingChange = (key: 'enabled' | 'frequency' | 'time' | 'retentionDays', value: string | boolean) => {
    setBackupSettings((prev) => ({
      ...prev,
      [key]:
        key === 'retentionDays'
          ? Math.max(1, Number(value) || 1)
          : value,
    }));
  };

  const handleSaveBackupSettings = async () => {
    setBackupSaving(true);
    showToast('Đang lưu cấu hình sao lưu...', 'info');
    try {
      await Promise.all([
        apiClient.put('/SystemConfiguration/AUTO_BACKUP_ENABLED', { value: backupSettings.enabled.toString() }),
        apiClient.put('/SystemConfiguration/AUTO_BACKUP_FREQUENCY', { value: backupSettings.frequency }),
        apiClient.put('/SystemConfiguration/AUTO_BACKUP_TIME', { value: backupSettings.time }),
        apiClient.put('/SystemConfiguration/BACKUP_RETENTION_DAYS', { value: backupSettings.retentionDays.toString() }),
      ]);
      showToast('Đã lưu cấu hình sao lưu.', 'success');
      await fetchBackupSettings();
    } catch (error) {
      console.error('Failed to save backup settings', error);
      showToast('Lưu cấu hình sao lưu thất bại.', 'error');
    } finally {
      setBackupSaving(false);
    }
  };

  const downloadBlobFile = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const extractFileName = (contentDisposition?: string): string | null => {
    if (!contentDisposition) return null;
    const match = contentDisposition.match(/filename="?([^";]+)"?/i);
    return match ? match[1] : null;
  };

  const handleBackupNow = async () => {
    setBackupRunning(true);
    showToast('Đang tạo bản sao lưu...', 'info');
    try {
      const response = await apiClient.post<Blob>(
        '/SystemConfiguration/database-backup',
        backupName ? { backupName } : {},
        { responseType: 'blob' }
      );

      const suggestedName =
        extractFileName(response.headers['content-disposition']) ||
        `${backupName || 'db-backup'}_${new Date().toISOString().replace(/[:.]/g, '-')}.bak`;

      downloadBlobFile(response.data, suggestedName);
      showToast('Đã tạo và tải xuống bản sao lưu.', 'success');
      setBackupName('');
      await fetchBackupSettings();
    } catch (error) {
      console.error('Backup failed', error);
      showToast('Sao lưu thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setBackupRunning(false);
    }
  };

  const handleDownloadBackup = async (fileName: string) => {
    try {
      const response = await apiClient.get<Blob>('/SystemConfiguration/database-backup/download', {
        params: { fileName },
        responseType: 'blob',
      });
      const suggestedName = extractFileName(response.headers['content-disposition']) || fileName;
      downloadBlobFile(response.data, suggestedName);
    } catch (error) {
      console.error('Download failed', error);
      showToast('Tải bản sao lưu thất bại.', 'error');
    }
  };

  const handleSaveMaintenanceSettings = async (mode?: boolean) => {
    setMaintenanceSaving(true);
    try {
      const maintenanceMode = mode !== undefined ? mode : settings.maintenanceMode;
      await Promise.all([
        apiClient.put('/SystemConfiguration/MAINTENANCE_MODE', { value: maintenanceMode ? 'true' : 'false' }),
        apiClient.put('/SystemConfiguration/MAINTENANCE_MESSAGE', { value: settings.maintenanceMessage || '' }),
        apiClient.put('/SystemConfiguration/MAINTENANCE_SCHEDULE', { value: settings.maintenanceSchedule || '' }),
      ]);
      setSettings((prev) => ({ ...prev, maintenanceMode }));
      showToast('Đã cập nhật cấu hình bảo trì.', 'success');
    } catch (error) {
      console.error('Failed to save maintenance settings', error);
      showToast('Lưu cấu hình bảo trì thất bại.', 'error');
    } finally {
      setMaintenanceSaving(false);
    }
  };


  return (
    <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <h1 className={styles.title}>Cấu hình hệ thống</h1>
              <p className={styles.subtitle}>Quản lý cài đặt và cấu hình hệ thống</p>
            </div>
            <div className={styles.headerRight}>
              <button onClick={handleSaveChanges} className={styles.saveBtn} disabled={saving || loading}>
                <i className={`bi ${saving ? 'bi-arrow-repeat' : 'bi-check-lg'}`}></i>
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>

          {/* Settings Grid */}
          <div className={styles.settingsGrid}>
            {/* General Settings */}
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <h3>
                  <i className="bi bi-gear"></i>
                  Cài đặt chung
                </h3>
              </div>
              {loading ? (
                <div className={styles.loadingState}>Đang tải cài đặt...</div>
              ) : (
                <div className={styles.cardContent}>
                  <div className={styles.settingItem}>
                    <label>Tên hệ thống</label>
                    <input
                      type="text"
                      value={settings.siteName || ''}
                      onChange={(e) => handleInputChange('siteName', e.target.value)}
                      placeholder="Nhập tên hệ thống"
                    />
                  </div>
                  <div className={styles.settingItem}>
                    <label>Mô tả hệ thống</label>
                    <textarea
                      value={settings.systemDescription || ''}
                      onChange={(e) => handleInputChange('systemDescription', e.target.value)}
                      placeholder="Nhập mô tả hệ thống"
                    ></textarea>
                  </div>
                  <div className={styles.settingItem}>
                    <label>Email liên hệ</label>
                    <input
                      type="email"
                      value={settings.contactEmail || ''}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      placeholder="Nhập email liên hệ"
                    />
                  </div>
                  <div className={styles.settingItem}>
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      value={settings.contactPhone || ''}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      placeholder="Nhập số điện thoại liên hệ"
                    />
                  </div>
                  <div className={styles.settingItem}>
                    <label>Địa chỉ liên hệ</label>
                    <textarea
                      value={settings.contactAddress || ''}
                      onChange={(e) => handleInputChange('contactAddress', e.target.value)}
                      placeholder="Nhập địa chỉ liên hệ"
                    ></textarea>
                  </div>
                </div>
              )}
            </div>

            {/* Security Settings */}
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <h3>
                  <i className="bi bi-shield-check"></i>
                  Bảo mật
                </h3>
              </div>
              {loading ? (
                <div className={styles.loadingState}>Đang tải cài đặt...</div>
              ) : (
                <div className={styles.cardContent}>
                  <div className={styles.settingItem}>
                    <label>Thời gian hết hạn phiên đăng nhập (phút)</label>
                    <input
                      type="number"
                      value={settings.jwtExpiryMinutes || ''}
                      onChange={(e) => handleInputChange('jwtExpiryMinutes', e.target.value)}
                      placeholder="Ví dụ: 30"
                    />
                  </div>
                  <div className={styles.settingItem}>
                    <label>Số lần đăng nhập sai tối đa</label>
                    <input
                      type="number"
                      value={settings.maxFailedLoginAttempts || ''}
                      onChange={(e) => handleInputChange('maxFailedLoginAttempts', e.target.value)}
                      placeholder="Ví dụ: 5"
                    />
                  </div>
                  <div className={styles.settingItem}>
                    <label>Thời gian khóa tài khoản (phút)</label>
                    <input
                      type="number"
                      value={settings.accountLockoutDurationMinutes || ''}
                      onChange={(e) => handleInputChange('accountLockoutDurationMinutes', e.target.value)}
                      placeholder="Ví dụ: 15"
                    />
                  </div>
                  <div className={styles.settingItem}>
                    <label>Độ dài mật khẩu tối thiểu</label>
                    <input
                      type="number"
                      value={settings.passwordMinLength || ''}
                      onChange={(e) => handleInputChange('passwordMinLength', e.target.value)}
                      placeholder="Ví dụ: 6"
                    />
                  </div>
                  <div className={styles.settingItem}>
                    <label>Độ dài mật khẩu tối đa</label>
                    <input
                      type="number"
                      value={settings.passwordMaxLength || ''}
                      onChange={(e) => handleInputChange('passwordMaxLength', e.target.value)}
                      placeholder="Ví dụ: 128"
                    />
                  </div>
                  <div className={styles.settingItem}>
                    <label>
                      <input type="checkbox" checked={settings.requireDigit || false} onChange={(e) => handleCheckboxChange('requireDigit', e.target.checked)} />
                      Yêu cầu có chữ số
                    </label>
                  </div>
                  <div className={styles.settingItem}>
                    <label>
                      <input type="checkbox" checked={settings.requireLowercase || false} onChange={(e) => handleCheckboxChange('requireLowercase', e.target.checked)} />
                      Yêu cầu có chữ thường
                    </label>
                  </div>
                  <div className={styles.settingItem}>
                    <label>
                      <input type="checkbox" checked={settings.requireUppercase || false} onChange={(e) => handleCheckboxChange('requireUppercase', e.target.checked)} />
                      Yêu cầu có chữ hoa
                    </label>
                  </div>
                  <div className={styles.settingItem}>
                    <label>
                      <input type="checkbox" checked={settings.requireSpecial || false} onChange={(e) => handleCheckboxChange('requireSpecial', e.target.checked)} />
                      Yêu cầu có ký tự đặc biệt
                    </label>
                  </div>


                </div>
              )}
            </div>

            {/* Notification Settings */}
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <h3>
                  <i className="bi bi-bell"></i>
                  Thông báo
                </h3>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.settingItem}>
                  <label>
                    <input type="checkbox" defaultChecked />
                    Thông báo email
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <label>
                    <input type="checkbox" defaultChecked />
                    Thông báo SMS
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <label>
                    <input type="checkbox" defaultChecked />
                    Thông báo đẩy
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <label>Thời gian gửi thông báo (giờ)</label>
                  <input type="time" defaultValue="09:00" />
                </div>
              </div>
            </div>

            {/* System Settings */}
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <h3>
                  <i className="bi bi-cpu"></i>
                  Hệ thống
                </h3>
              </div>
              <div className={styles.cardContent}>
                
                <div className={styles.settingItem}>
                  <label>Ngôn ngữ mặc định</label>
                  <select
                    value={settings.defaultLanguage || 'vi'}
                    onChange={(e) => handleInputChange('defaultLanguage', e.target.value as Language)}
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>
                
                
              </div>
            </div>

            {/* Backup Settings */}
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <h3>
                  <i className="bi bi-cloud-arrow-up"></i>
                  Sao lưu
                </h3>
              </div>
              <div className={styles.cardContent}>
                {backupLoading ? (
                  <div className={styles.loadingState}>Đang tải cấu hình sao lưu...</div>
                ) : (
                  <>
                    <div className={styles.settingItem}>
                      <label>
                        <input
                          type="checkbox"
                          checked={backupSettings.enabled}
                          onChange={(e) => handleBackupSettingChange('enabled', e.target.checked)}
                        />
                        Bật sao lưu tự động
                      </label>
                    </div>
                    <div className={styles.settingItem}>
                      <label>Tần suất sao lưu</label>
                      <select
                        value={backupSettings.frequency}
                        onChange={(e) => handleBackupSettingChange('frequency', e.target.value)}
                      >
                        <option value="daily">Hàng ngày</option>
                        <option value="weekly">Hàng tuần</option>
                        <option value="monthly">Hàng tháng</option>
                      </select>
                    </div>
                    <div className={styles.settingItem}>
                      <label>Thời gian sao lưu</label>
                      <input
                        type="time"
                        value={backupSettings.time}
                        onChange={(e) => handleBackupSettingChange('time', e.target.value)}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Số bản sao lưu giữ lại</label>
                      <input
                        type="number"
                        min={1}
                        value={backupSettings.retentionDays}
                        onChange={(e) => handleBackupSettingChange('retentionDays', e.target.value)}
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <button
                        className={styles.saveBtn}
                        onClick={handleSaveBackupSettings}
                        disabled={backupSaving}
                      >
                        <i className={`bi ${backupSaving ? 'bi-arrow-repeat' : 'bi-save'}`}></i>
                        {backupSaving ? 'Đang lưu...' : 'Lưu cấu hình sao lưu'}
                      </button>
                    </div>
                    <hr />
                    <div className={styles.settingItem}>
                      <label>Đặt tên bản sao lưu (tùy chọn)</label>
                      <input
                        type="text"
                        value={backupName}
                        onChange={(e) => setBackupName(e.target.value)}
                        placeholder="Ví dụ: BackUp"
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <button
                        className={styles.backupBtn}
                        onClick={handleBackupNow}
                        disabled={backupRunning}
                      >
                        <i className={`bi ${backupRunning ? 'bi-arrow-repeat' : 'bi-download'}`}></i>
                        {backupRunning ? 'Đang sao lưu...' : 'Sao lưu ngay'}
                      </button>
                    </div>
                    <div className={styles.settingItem}>
                      <label>Danh sách bản sao lưu gần đây</label>
                      {backupList.length === 0 ? (
                        <p className={styles.emptyState}>Chưa có bản sao lưu nào.</p>
                      ) : (
                        <div className={styles.backupList}>
                          {backupList.map((backup) => (
                            <div key={backup.fileName} className={styles.backupRow}>
                              <div>
                                <strong>{backup.fileName}</strong>
                                <div className={styles.backupMeta}>
                                  {backup.fileSizeFormatted} •{' '}
                                  {new Date(backup.createdAt).toLocaleString()}
                                </div>
                              </div>
                              <button
                                className={styles.downloadBtn}
                                onClick={() => handleDownloadBackup(backup.fileName)}
                              >
                                <i className="bi bi-cloud-download"></i>
                                Tải xuống
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Maintenance Settings */}
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <h3>
                  <i className="bi bi-tools"></i>
                  Bảo trì
                </h3>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.settingItem}>
                  <label>Chế độ bảo trì</label>
                  <div className={styles.toggleGroup}>
                    <label className={styles.toggle}>
                      <input
                        type="radio"
                        name="maintenance"
                        value="off"
                        checked={!settings.maintenanceMode}
                        onChange={() => handleMaintenanceModeChange(false)}
                      />
                      <span>Tắt</span>
                    </label>
                    <label className={styles.toggle}>
                      <input
                        type="radio"
                        name="maintenance"
                        value="on"
                        checked={!!settings.maintenanceMode}
                        onChange={() => handleMaintenanceModeChange(true)}
                      />
                      <span>Bật</span>
                    </label>
                  </div>
                </div>
                <div className={styles.settingItem}>
                  <label>Thông báo bảo trì</label>
                  <textarea
                    value={settings.maintenanceMessage || ''}
                    onChange={(e) => handleInputChange('maintenanceMessage', e.target.value)}
                    placeholder="Nhập thông báo bảo trì..."
                  ></textarea>
                </div>
                
                <div className={styles.settingItem}>
                  <button
                    className={styles.maintenanceBtn}
                    onClick={() => handleSaveMaintenanceSettings()}
                    disabled={maintenanceSaving}
                  >
                    <i className={`bi ${maintenanceSaving ? 'bi-arrow-repeat' : 'bi-save'}`}></i>
                    {maintenanceSaving ? 'Đang lưu...' : 'Lưu cấu hình bảo trì'}
                  </button>
                </div>
                <div className={styles.settingItem}>
                  <button
                    className={styles.maintenanceBtn}
                    onClick={() => handleSaveMaintenanceSettings(true)}
                    disabled={maintenanceSaving}
                  >
                    <i className="bi bi-gear"></i>
                    Kích hoạt chế độ bảo trì
                  </button>
                </div>
              </div>
            </div>
          </div>
    </div>
  );
}
