import React, { useState, useEffect, useCallback } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
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

interface EmailServerSettingsState {
  enabled: boolean;
  username: string;
  fromEmail: string;
  fromName: string;
  password: string;
  hasPassword: boolean;
}

interface EmailTemplateState {
  templateKey: string;
  displayName: string;
  description?: string;
  subject: string;
  body: string;
}

interface TemplateTokenInfo {
  token: string;
  description: string;
}

const TEMPLATE_TOKEN_MAP: Record<string, TemplateTokenInfo[]> = {
  PASSWORD_RESET_LINK: [
    { token: '{{email}}', description: 'Email của người nhận' },
    { token: '{{reset_link}}', description: 'Liên kết đặt lại mật khẩu' },
  ],
  FORGOT_PASSWORD_CODE: [
    { token: '{{email}}', description: 'Email của người nhận' },
    { token: '{{code}}', description: 'Mã OTP xác nhận' },
    { token: '{{code_expire_minutes}}', description: 'Số phút mã còn hiệu lực' },
  ],
  NEW_USER_WELCOME: [
    { token: '{{username}}', description: 'Tên đăng nhập của người dùng' },
    { token: '{{email}}', description: 'Email của người dùng' },
    { token: '{{temporary_password}}', description: 'Mật khẩu tạm thời được gửi' },
    { token: '{{login_link}}', description: 'Liên kết đăng nhập hệ thống' },
  ],
  ACCOUNT_VERIFICATION: [
    { token: '{{email}}', description: 'Email của người nhận' },
    { token: '{{verification_link}}', description: 'Liên kết xác minh tài khoản' },
  ],
};

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
  const [emailServerSettings, setEmailServerSettings] = useState<EmailServerSettingsState>({
    enabled: true,
    username: '',
    fromEmail: '',
    fromName: '',
    password: '',
    hasPassword: false,
  });
  const [passwordDirty, setPasswordDirty] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateState[]>([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('');
  const [emailSettingsLoading, setEmailSettingsLoading] = useState(false);
  const [emailSettingsSaving, setEmailSettingsSaving] = useState(false);
  const [emailTemplateSaving, setEmailTemplateSaving] = useState(false);
  const [refundPercentage, setRefundPercentage] = useState(80);
  const [refundSaving, setRefundSaving] = useState(false);

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

  const fetchEmailSettings = useCallback(async () => {
    setEmailSettingsLoading(true);
    try {
      const [serverRes, templatesRes] = await Promise.all([
        apiClient.get('/SystemConfiguration/email/server'),
        apiClient.get('/SystemConfiguration/email/templates'),
      ]);

      const serverData = serverRes.data || {};
      setEmailServerSettings({
        enabled: serverData.enabled ?? true,
        username: serverData.username || '',
        fromEmail: serverData.fromEmail || '',
        fromName: serverData.fromName || '',
        password: serverData.password || '',
        hasPassword: !!serverData.hasPassword,
      });
      setPasswordDirty(false);
      setShowPassword(false);

      const templates = (templatesRes.data || []) as EmailTemplateState[];
      setEmailTemplates(templates);
      if (templates.length > 0) {
        setSelectedTemplateKey((current) =>
          current && templates.some((t) => t.templateKey === current)
            ? current
            : templates[0].templateKey
        );
      } else {
        setSelectedTemplateKey('');
      }
    } catch (error) {
      console.error('Failed to fetch email settings', error);
      showToast('Không thể tải cấu hình email.', 'error');
    } finally {
      setEmailSettingsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEmailSettings();
  }, [fetchEmailSettings]);

  const fetchRefundConfig = useCallback(async () => {
    try {
      const response = await apiClient.get('/SystemConfiguration/APPOINTMENT_PATIENT_CANCEL_REFUND_PERCENT');
      const rawValue = parseFloat(response.data?.configValue ?? '0.8');
      const normalized = !Number.isNaN(rawValue)
        ? (rawValue <= 1 ? rawValue * 100 : rawValue)
        : 80;
      setRefundPercentage(Math.min(100, Math.max(0, Math.round(normalized))));
    } catch (error) {
      console.error('Failed to fetch refund percentage', error);
      showToast('Không thể tải cấu hình hoàn tiền hủy lịch.', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    fetchRefundConfig();
  }, [fetchRefundConfig]);

  const updateEmailServer = (patch: Partial<EmailServerSettingsState>) => {
    setEmailServerSettings((prev) => ({ ...prev, ...patch }));
    if (Object.prototype.hasOwnProperty.call(patch, 'password')) {
      setPasswordDirty(true);
    }
  };

  const handleSaveEmailServerSettings = async () => {
    setEmailSettingsSaving(true);
    showToast('Đang lưu cấu hình email...', 'info');
    try {
      await apiClient.put('/SystemConfiguration/email/server', {
        enabled: emailServerSettings.enabled,
        username: emailServerSettings.username,
        fromEmail: emailServerSettings.fromEmail,
        fromName: emailServerSettings.fromName,
        password: passwordDirty ? emailServerSettings.password : undefined,
      });
      showToast('Đã lưu cấu hình máy chủ email.', 'success');
      await fetchEmailSettings();
    } catch (error) {
      console.error('Failed to save email server settings', error);
      showToast('Lưu cấu hình email thất bại.', 'error');
    } finally {
      setEmailSettingsSaving(false);
    }
  };

  const handleSaveRefundPercentage = async () => {
    setRefundSaving(true);
    showToast('Đang lưu cấu hình hoàn tiền...', 'info');
    try {
      const value = (refundPercentage / 100).toString();
      await apiClient.put('/SystemConfiguration/APPOINTMENT_PATIENT_CANCEL_REFUND_PERCENT', { value });
      showToast('Đã lưu cấu hình hoàn tiền.', 'success');
      await fetchRefundConfig();
    } catch (error) {
      console.error('Failed to save refund percentage', error);
      showToast('Lưu cấu hình hoàn tiền thất bại.', 'error');
    } finally {
      setRefundSaving(false);
    }
  };

  const selectedTemplate = emailTemplates.find((template) => template.templateKey === selectedTemplateKey);
  const availableTokens = selectedTemplate ? TEMPLATE_TOKEN_MAP[selectedTemplate.templateKey] ?? [] : [];

  const handleTemplateChange = (field: 'subject' | 'body', value: string) => {
    setEmailTemplates((prev) =>
      prev.map((template) =>
        template.templateKey === selectedTemplateKey
          ? { ...template, [field]: value }
          : template
      )
    );
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    setEmailTemplateSaving(true);
    showToast('Đang lưu mẫu email...', 'info');
    try {
      await apiClient.put(`/SystemConfiguration/email/templates/${selectedTemplate.templateKey}`, {
        subject: selectedTemplate.subject,
        body: selectedTemplate.body,
      });
      showToast('Đã lưu mẫu email.', 'success');
    } catch (error) {
      console.error('Failed to save email template', error);
      showToast('Lưu mẫu email thất bại.', 'error');
    } finally {
      setEmailTemplateSaving(false);
    }
  };

  const copyTokenToClipboard = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      showToast(`Đã sao chép ${token}`, 'success');
    } catch {
      showToast('Không thể sao chép tự động, vui lòng dùng Ctrl+C.', 'error');
    }
  };


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

            
           
            {/* Email Server Settings */}
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <h3>
                  <i className="bi bi-envelope"></i>
                  Máy chủ email
                </h3>
              </div>
              <div className={styles.cardContent}>
                {emailSettingsLoading ? (
                  <div className={styles.loadingState}>Đang tải cấu hình email...</div>
                ) : (
                  <>
                   
                    <div className={styles.settingItem}>
                      <label>
                        <input
                          type="checkbox"
                          checked={emailServerSettings.enabled}
                          onChange={(e) => updateEmailServer({ enabled: e.target.checked })}
                        />
                        Bật gửi email tự động
                      </label>
                    </div>
                    <div className={styles.noticeBox}>
                      <strong>Gmail SMTP:</strong> smtp.gmail.com:587 (STARTTLS) - Thiết lập cố định.
                    </div>
                    <div className={styles.settingItem}>
                      <label>Tên đăng nhập SMTP</label>
                      <input
                        type="text"
                        value={emailServerSettings.username}
                        onChange={(e) => updateEmailServer({ username: e.target.value })}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Email người gửi</label>
                      <input
                        type="email"
                        value={emailServerSettings.fromEmail}
                        onChange={(e) => updateEmailServer({ fromEmail: e.target.value })}
                        placeholder="noreply@example.com"
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>Tên hiển thị</label>
                      <input
                        type="text"
                        value={emailServerSettings.fromName}
                        onChange={(e) => updateEmailServer({ fromName: e.target.value })}
                        placeholder="Medix Notifications"
                      />
                    </div>
                    <div className={styles.settingItem}>
                      <label>
                        Mật khẩu SMTP
                        {emailServerSettings.hasPassword && !passwordDirty && (
                          <span className={styles.hintText}> Đã thiết lập</span>
                        )}
                      </label>
                      <div className={styles.passwordField}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={emailServerSettings.password}
                          onChange={(e) => updateEmailServer({ password: e.target.value })}
                          placeholder={emailServerSettings.hasPassword && !passwordDirty ? '********' : 'Nhập mật khẩu ứng dụng'}
                        />
                        <button
                          type="button"
                          className={styles.toggleBtn}
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? 'Ẩn' : 'Hiện'}
                        </button>
                      </div>
                      <p className={styles.hintText}>
                        Sử dụng mật khẩu ứng dụng Gmail (App Password) để đảm bảo bảo mật.
                      </p>
                    </div>
                    <div className={styles.settingItem}>
                      <button
                        className={styles.saveBtn}
                        onClick={handleSaveEmailServerSettings}
                        disabled={emailSettingsSaving}
                      >
                        <i className={`bi ${emailSettingsSaving ? 'bi-arrow-repeat' : 'bi-save'}`}></i>
                        {emailSettingsSaving ? 'Đang lưu...' : 'Lưu cấu hình email'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Email Templates */}
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <h3>
                  <i className="bi bi-file-earmark-text"></i>
                  Mẫu email tự động
                </h3>
              </div>
              <div className={styles.cardContent}>
                {emailSettingsLoading ? (
                  <div className={styles.loadingState}>Đang tải mẫu email...</div>
                ) : emailTemplates.length === 0 ? (
                  <div className={styles.emptyState}>Chưa có mẫu email nào.</div>
                ) : (
                  <div className={styles.templateSection}>
                    <div className={styles.templateList}>
                      {emailTemplates.map((template) => (
                        <button
                          key={template.templateKey}
                          type="button"
                          className={`${styles.templateButton} ${template.templateKey === selectedTemplateKey ? styles.templateButtonActive : ''}`}
                          onClick={() => setSelectedTemplateKey(template.templateKey)}
                        >
                          <span>{template.displayName}</span>
                          {template.description && <small>{template.description}</small>}
                        </button>
                      ))}
                    </div>
                    {selectedTemplate && (
                      <div className={styles.templateEditor}>
                        <div className={styles.settingItem}>
                          <label>Tiêu đề email</label>
                          <input
                            type="text"
                            value={selectedTemplate.subject}
                            onChange={(e) => handleTemplateChange('subject', e.target.value)}
                          />
                        </div>
                        <div className={styles.settingItem}>
                          <label>Nội dung email</label>
                          <div className={styles.editorWrapper}>
                            <CKEditor
                              key={selectedTemplate.templateKey}
                              editor={ClassicEditor}
                              data={selectedTemplate.body}
                              onChange={(_, editor) => {
                                const data = editor.getData();
                                handleTemplateChange('body', data);
                              }}
                              config={{
                                toolbar: [
                                  'heading',
                                  '|',
                                  'bold',
                                  'italic',
                                  'underline',
                                  'link',
                                  'bulletedList',
                                  'numberedList',
                                  'blockQuote',
                                  '|',
                                  'undo',
                                  'redo',
                                ],
                                placeholder: 'Soạn nội dung email...'
                              }}
                            />
                          </div>
                          {availableTokens.length > 0 && (
                            <div className={styles.tokenHelper}>
                              <span>Biến động có thể dùng:</span>
                              <div className={styles.tokenChips}>
                                {availableTokens.map((token) => (
                                  <button
                                    type="button"
                                    key={token.token}
                                    className={styles.tokenChip}
                                    onClick={() => copyTokenToClipboard(token.token)}
                                    title={token.description}
                                  >
                                    {token.token}
                                  </button>
                                ))}
                              </div>
                              <p className={styles.hintText}>Nhấp để sao chép, sau đó dán vào vị trí mong muốn.</p>
                            </div>
                          )}
                        </div>
                        {selectedTemplate.description && (
                          <p className={styles.hintText}>{selectedTemplate.description}</p>
                        )}
                        <div className={styles.settingItem}>
                          <button
                            className={styles.saveBtn}
                            onClick={handleSaveTemplate}
                            disabled={emailTemplateSaving}
                          >
                            <i className={`bi ${emailTemplateSaving ? 'bi-arrow-repeat' : 'bi-save'}`}></i>
                            {emailTemplateSaving ? 'Đang lưu...' : 'Lưu mẫu email'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Refund Policy Settings */}
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <h3>
                  <i className="bi bi-cash-coin"></i>
                  Chính sách hoàn tiền hủy lịch
                </h3>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.settingItem}>
                  <label>Tỷ lệ hoàn tiền cho bệnh nhân (%)</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={refundPercentage}
                    onChange={(e) => setRefundPercentage(Number(e.target.value))}
                  />
                  <div className={styles.rangeValue}>
                    <strong>{refundPercentage}%</strong>
                    <span>Phí hủy lịch: {100 - refundPercentage}%</span>
                  </div>
                </div>
                <div className={styles.settingItem}>
                  <label>Nhập chính xác</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={refundPercentage}
                    onChange={(e) =>
                      setRefundPercentage(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
                    }
                  />
                </div>
                <p className={styles.hintText}>
                  Áp dụng khi bệnh nhân hủy lịch hợp lệ. Ví dụ: 80% nghĩa là hoàn lại 80% chi phí, thu phí hủy 20%.
                </p>
                <div className={styles.settingItem}>
                  <button
                    className={styles.saveBtn}
                    onClick={handleSaveRefundPercentage}
                    disabled={refundSaving}
                  >
                    <i className={`bi ${refundSaving ? 'bi-arrow-repeat' : 'bi-save'}`}></i>
                    {refundSaving ? 'Đang lưu...' : 'Lưu chính sách hoàn tiền'}
                  </button>
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
