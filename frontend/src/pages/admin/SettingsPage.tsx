import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { apiClient } from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';
import styles from '../../styles/admin/SettingsPage.module.css';
import userStyles from '../../styles/admin/UserList.module.css';
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
  const [aiDailyAccessLimit, setAiDailyAccessLimit] = useState(50);
  const [aiAccessLimitSaving, setAiAccessLimitSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SystemSettings, string>>>({});
  const [templateErrors, setTemplateErrors] = useState<Partial<Record<string, { subject?: string; body?: string }>>>({});
  const [emailServerErrors, setEmailServerErrors] = useState<Partial<Record<'username' | 'fromEmail' | 'fromName', string>>>({});

  const passwordRequirementSummary = useMemo(() => {
    const boolText = (value?: boolean) => (value ? 'Bắt buộc' : 'Không bắt buộc');
    return [
      {
        label: 'Độ dài tối thiểu',
        value: settings.passwordMinLength ? `${settings.passwordMinLength} ký tự` : 'Chưa cấu hình',
      },
      {
        label: 'Độ dài tối đa',
        value: settings.passwordMaxLength ? `${settings.passwordMaxLength} ký tự` : 'Chưa cấu hình',
      },
      { label: 'Chữ số', value: boolText(settings.requireDigit) },
      { label: 'Chữ thường', value: boolText(settings.requireLowercase) },
      { label: 'Chữ hoa', value: boolText(settings.requireUppercase) },
      { label: 'Ký tự đặc biệt', value: boolText(settings.requireSpecial) },
    ];
  }, [
    settings.passwordMinLength,
    settings.passwordMaxLength,
    settings.requireDigit,
    settings.requireLowercase,
    settings.requireUppercase,
    settings.requireSpecial,
  ]);

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
          jwtExpiryMinutes: parseInt(jwtExpiryRes.data.configValue, 10),
          maxFailedLoginAttempts: parseInt(maxFailedLoginRes.data.configValue, 10),
          accountLockoutDurationMinutes: parseInt(lockoutDurationRes.data.configValue, 10),
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

      const backups: DatabaseBackupInfo[] = backupFilesRes.data || [];
      const latestBackup = backups.length > 0 
        ? [backups.sort((a: DatabaseBackupInfo, b: DatabaseBackupInfo) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]]
        : [];
      setBackupList(latestBackup);
    } catch (error) {
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
      showToast('Không thể tải cấu hình hoàn tiền hủy lịch.', 'error');
    }
  }, [showToast]);

  const fetchAiDailyAccessLimit = useCallback(async () => {
    try {
      const response = await apiClient.get('/SystemConfiguration/AI_DAILY_ACCESS_LIMIT');
      const value = parseInt(response.data?.configValue ?? '50', 10);
      setAiDailyAccessLimit(Math.max(1, value));
    } catch (error) {
      showToast('Không thể tải cấu hình giới hạn truy cập AI.', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    fetchRefundConfig();
  }, [fetchRefundConfig]);

  useEffect(() => {
    fetchAiDailyAccessLimit();
  }, [fetchAiDailyAccessLimit]);

  const validateEmailServerFields = (
    username: string,
    fromEmail: string,
    fromName: string
  ): Partial<Record<'username' | 'fromEmail' | 'fromName', string>> => {
    const newErrors: Partial<Record<'username' | 'fromEmail' | 'fromName', string>> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!username) {
      newErrors.username = 'Tên đăng nhập SMTP không được để trống.';
    } else if (!emailRegex.test(username)) {
      newErrors.username = 'Định dạng email không hợp lệ.';
    }

    if (!fromEmail) {
      newErrors.fromEmail = 'Email người gửi không được để trống.';
    } else if (!emailRegex.test(fromEmail)) {
      newErrors.fromEmail = 'Định dạng email không hợp lệ.';
    }

    if (!fromName.trim()) {
      newErrors.fromName = 'Tên hiển thị không được để trống.';
    }

    if (username && fromEmail && !newErrors.username && !newErrors.fromEmail && username !== fromEmail) {
      newErrors.username = 'Tên đăng nhập SMTP phải giống Email người gửi.';
      newErrors.fromEmail = 'Email người gửi phải giống Tên đăng nhập SMTP.';
    }

    return newErrors;
  };

  const updateEmailServer = (patch: Partial<EmailServerSettingsState>) => {
    setEmailServerSettings((prev) => {
      const newState = { ...prev, ...patch };
      setEmailServerErrors(validateEmailServerFields(newState.username, newState.fromEmail, newState.fromName));
      return newState;
    });
    if (Object.prototype.hasOwnProperty.call(patch, 'password')) {
      setPasswordDirty(true);
    }
  };

  const handleEmailServerBlur = () => {
    const validationErrors = validateEmailServerFields(emailServerSettings.username, emailServerSettings.fromEmail, emailServerSettings.fromName);
    setEmailServerErrors(validationErrors);
  };

  const handleSaveEmailServerSettings = async () => {
    const validationErrors = validateEmailServerFields(emailServerSettings.username, emailServerSettings.fromEmail, emailServerSettings.fromName);
    if (Object.keys(validationErrors).length > 0) {
      setEmailServerErrors(validationErrors);
      showToast('Vui lòng sửa các lỗi trong cấu hình máy chủ email.', 'error');
      return;
    }
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
      showToast('Lưu cấu hình hoàn tiền thất bại.', 'error');
    } finally {
      setRefundSaving(false);
    }
  };

  const handleSaveAiDailyAccessLimit = async () => {
    setAiAccessLimitSaving(true);
    showToast('Đang lưu cấu hình giới hạn truy cập AI...', 'info');
    try {
      await apiClient.put('/SystemConfiguration/AI_DAILY_ACCESS_LIMIT', { value: aiDailyAccessLimit.toString() });
      showToast('Đã lưu cấu hình giới hạn truy cập AI.', 'success');
      await fetchAiDailyAccessLimit();
    } catch (error) {
      showToast('Lưu cấu hình giới hạn truy cập AI thất bại.', 'error');
    } finally {
      setAiAccessLimitSaving(false);
    }
  };

  const selectedTemplate = emailTemplates.find((template) => template.templateKey === selectedTemplateKey);
  const availableTokens = selectedTemplate ? TEMPLATE_TOKEN_MAP[selectedTemplate.templateKey] ?? [] : [];

  const handleTemplateChange = (field: 'subject' | 'body', value: string) => {
    let error: string | undefined = undefined;
    let finalValue = value;

    if (field === 'subject') {
      if (!value.trim()) {
        error = 'Tiêu đề không được để trống.';
      }
    } else if (field === 'body') {
      if (!value.trim()) {
        error = 'Nội dung email không được để trống.';
      } else if (value.length > 7000) {
        finalValue = value.substring(0, 7000); // Chặn không cho nhập quá
        error = `Nội dung không được vượt quá 7000 ký tự.`;
      }
    }

    setTemplateErrors(prev => ({
      ...prev,
      [selectedTemplateKey]: { ...prev[selectedTemplateKey], [field]: error }
    }));

    setEmailTemplates((prev) =>
      prev.map((template) =>
        template.templateKey === selectedTemplateKey
          ? { ...template, [field]: finalValue }
          : template
      )
    );
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate || templateErrors[selectedTemplateKey]?.subject || templateErrors[selectedTemplateKey]?.body) {
      showToast('Vui lòng sửa lỗi trước khi lưu.', 'error');
      return;
    }
    setEmailTemplateSaving(true);
    showToast('Đang lưu mẫu email...', 'info');
    try {
      await apiClient.put(`/SystemConfiguration/email/templates/${selectedTemplate.templateKey}`, {
        subject: selectedTemplate.subject,
        body: selectedTemplate.body,
      });
      showToast('Đã lưu mẫu email.', 'success');
    } catch (error) {
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
    setErrors(prev => ({ ...prev, [key]: undefined }));

    if (key === 'siteName' && typeof value === 'string') { 
      setSettings(prev => ({ ...prev, [key]: value }));
    } else if (
      (key === 'jwtExpiryMinutes' ||
        key === 'maxFailedLoginAttempts' ||
        key === 'accountLockoutDurationMinutes' ||
        key === 'passwordMinLength' ||
        key === 'passwordMaxLength') &&
      typeof value === 'string'
    ) {
      const sanitizedValue = value.replace(/[^0-9]/g, '');
      setSettings(prev => ({ ...prev, [key]: sanitizedValue }));
    } else if (key === 'contactEmail' && typeof value === 'string') {
      setSettings(prev => ({ ...prev, [key]: value }));
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setErrors(prev => ({ ...prev, contactEmail: 'Định dạng email không hợp lệ.' }));
      } else {
        setErrors(prev => ({ ...prev, contactEmail: undefined }));
      }
    } else if (key === 'systemDescription' && typeof value === 'string') {
      setSettings(prev => ({ ...prev, [key]: value }));
    } else if (key === 'contactPhone' && typeof value === 'string') {
      const sanitizedValue = value.replace(/\D/g, '');
      if (sanitizedValue.length <= 10) {
        setSettings(prev => ({ ...prev, [key]: sanitizedValue }));
      }

      if (sanitizedValue && sanitizedValue.length !== 10) {
        setErrors(prev => ({ ...prev, contactPhone: 'Số điện thoại phải có đúng 10 chữ số.' }));
      } else {
        setErrors(prev => ({ ...prev, contactPhone: undefined }));
      }
    } else {
      setSettings(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleCheckboxChange = (key: keyof SystemSettings, checked: boolean) => {
    setSettings(prev => ({ ...prev, [key]: checked }));
  };

  const handleMaintenanceModeChange = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, maintenanceMode: enabled }));
  };

  const handleBlur = (key: keyof SystemSettings, value: string) => {
    if (!value || value.trim() === '') {
      setErrors(prev => ({ ...prev, [key]: 'Trường này không được để trống.' }));
      return;
    }
    setErrors(prev => ({ ...prev, [key]: undefined }));

    if (key === 'contactEmail') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setErrors(prev => ({ ...prev, [key]: 'Định dạng email không hợp lệ.' }));
      }
    } else if (key === 'contactPhone') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        setErrors(prev => ({ ...prev, [key]: 'Số điện thoại phải có đúng 10 chữ số.' }));
      }
    } else if (key === 'jwtExpiryMinutes') {
      const numValue = parseInt(value, 10);
      if (numValue < 30 || numValue > 60) {
        setErrors(prev => ({ ...prev, [key]: 'Thời gian phải từ 30 đến 60 phút.' }));
      }
    } else if (key === 'maxFailedLoginAttempts') {
      const numValue = parseInt(value, 10);
      if (numValue >= 6) {
        setErrors(prev => ({ ...prev, [key]: 'Số lần phải nhỏ hơn 6.' }));
      }
    } else if (key === 'passwordMinLength' || key === 'passwordMaxLength') {
      const minLength = key === 'passwordMinLength' ? parseInt(value, 10) : settings.passwordMinLength;
      const maxLength = key === 'passwordMaxLength' ? parseInt(value, 10) : settings.passwordMaxLength;

      setErrors(prev => ({ ...prev, passwordMinLength: undefined, passwordMaxLength: undefined }));

      if (minLength && maxLength && minLength >= maxLength - 5) {
        const errorMessage = 'Độ dài tối thiểu phải nhỏ hơn độ dài tối đa ít nhất 6 ký tự.';
        setErrors(prev => ({ ...prev, passwordMinLength: errorMessage, passwordMaxLength: errorMessage }));
        return;
      }
    }
  };

  const validateBeforeSave = () => {
    for (const key in errors) {
      if (errors[key as keyof SystemSettings] || !settings[key as keyof SystemSettings]) {
        showToast(`Vui lòng sửa các lỗi trong form trước khi lưu.`, 'error');
        return false;
      }
    }

    return true;
  };

  const handleSaveChanges = async () => {
    if (!validateBeforeSave()) {
      return;
    }

    setSaving(true);
    showToast('Đang lưu thay đổi...', 'info');
    try {
      await Promise.all([
        apiClient.put('/SystemConfiguration/SiteName', { value: settings.siteName }),
        apiClient.put('/SystemConfiguration/SystemDescription', { value: settings.systemDescription }),
        apiClient.put('/SystemConfiguration/ContactEmail', { value: settings.contactEmail }),
        apiClient.put('/SystemConfiguration/ContactPhone', { value: settings.contactPhone }),
        apiClient.put('/SystemConfiguration/ContactAddress', { value: settings.contactAddress }),
        apiClient.put('/SystemConfiguration/JWT_EXPIRY_MINUTES', { value: settings.jwtExpiryMinutes?.toString() }),
        apiClient.put('/SystemConfiguration/MaxFailedLoginAttempts', { value: settings.maxFailedLoginAttempts?.toString() }),
        apiClient.put('/SystemConfiguration/AccountLockoutDurationMinutes', { value: settings.accountLockoutDurationMinutes?.toString() }),
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
      showToast('Lưu cấu hình bảo trì thất bại.', 'error');
    } finally {
      setMaintenanceSaving(false);
    }
  };


  return (
    <div className={userStyles.container}>
      <div className={userStyles.header}>
        <div className={userStyles.headerLeft}>
          <h1 className={userStyles.title}>Cấu hình hệ thống</h1>
          <p className={userStyles.subtitle}>Quản lý cài đặt và cấu hình hệ thống</p>
        </div>
        <div className={userStyles.headerRight}>
          <div className={styles.dateTime}>
            <i className="bi bi-calendar3"></i>
            <span>{new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>

      <div className={styles.settingsGrid}>
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
                  maxLength={18}
                  value={settings.siteName || ''}
                  onChange={(e) => handleInputChange('siteName', e.target.value)}
                  placeholder="Nhập tên hệ thống"
                  className={errors.siteName ? styles.inputError : ''}
                />
                {errors.siteName && <div className={styles.errorText}>{errors.siteName}</div>}
                <div className={styles.charCounter}>
                  {(settings.siteName || '').length}/18
                </div>
              </div>
              <div className={styles.settingItem}>
                <label>Mô tả hệ thống</label>
                <textarea
                  maxLength={50}
                  value={settings.systemDescription || ''}
                  onChange={(e) => handleInputChange('systemDescription', e.target.value)}
                  placeholder="Nhập mô tả hệ thống"
                  className={errors.systemDescription ? styles.inputError : ''}
                ></textarea>
                {errors.systemDescription && <div className={styles.errorText}>{errors.systemDescription}</div>}
                <div className={styles.charCounter}>
                  {(settings.systemDescription || '').length}/50
                </div>
              </div>
              <div className={styles.settingItem}>
                <label>Email liên hệ</label>
                <input
                  type="email"
                  maxLength={150}
                  value={settings.contactEmail || ''}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="Nhập email liên hệ"
                  className={errors.contactEmail ? styles.inputError : ''}
                />
                {errors.contactEmail && <div className={styles.errorText}>{errors.contactEmail}</div>}
                <div className={styles.charCounter}>
                  {(settings.contactEmail || '').length}/150
                </div>
              </div>
              <div className={styles.settingItem}>
                <label>Số điện thoại</label>
                <input
                  type="text"
                  inputMode="tel"
                  value={settings.contactPhone || ''}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="Nhập số điện thoại liên hệ"
                  className={errors.contactPhone ? styles.inputError : ''}
                />
                {errors.contactPhone && <div className={styles.errorText}>{errors.contactPhone}</div>}
                <div className={styles.charCounter}>
                  {(settings.contactPhone || '').replace(/\D/g, '').length}/10 chữ số
                </div>
              </div>
              <div className={styles.settingItem}>
                <label>Địa chỉ liên hệ</label>
                <textarea
                  value={settings.contactAddress || ''}
                  onChange={(e) => handleInputChange('contactAddress', e.target.value)}
                  placeholder="Nhập địa chỉ liên hệ"
                  className={errors.contactAddress ? styles.inputError : ''}
                ></textarea>
                {errors.contactAddress && <div className={styles.errorText}>{errors.contactAddress}</div>}
              </div>
            </div>
          )}
        </div>
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
                  type="text"
                  inputMode="numeric"
                  value={settings.jwtExpiryMinutes || ''}
                  onChange={e => handleInputChange('jwtExpiryMinutes', e.target.value)}
                  onBlur={e => handleBlur('jwtExpiryMinutes', e.target.value)}
                  placeholder="Ví dụ: 30"
                  className={errors.jwtExpiryMinutes ? styles.inputError : ''}
                />
                {errors.jwtExpiryMinutes && <div className={styles.errorText}>{errors.jwtExpiryMinutes}</div>}
              </div>
              <div className={styles.settingItem}>
                <label>Số lần đăng nhập sai tối đa</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={settings.maxFailedLoginAttempts || ''}
                  onChange={e => handleInputChange('maxFailedLoginAttempts', e.target.value)}
                  onBlur={e => handleBlur('maxFailedLoginAttempts', e.target.value)}
                  placeholder="Ví dụ: 5"
                  className={errors.maxFailedLoginAttempts ? styles.inputError : ''}
                />
                {errors.maxFailedLoginAttempts && <div className={styles.errorText}>{errors.maxFailedLoginAttempts}</div>}
              </div>
              <div className={styles.settingItem}>
                <label>Thời gian khóa tài khoản (phút)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={settings.accountLockoutDurationMinutes || ''}
                  onChange={e => handleInputChange('accountLockoutDurationMinutes', e.target.value)}
                  onBlur={e => handleBlur('accountLockoutDurationMinutes', e.target.value)}
                  placeholder="Ví dụ: 15"
                />
              </div>
              <div className={styles.settingItem}>
                <label>Độ dài mật khẩu tối thiểu</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={settings.passwordMinLength || ''}
                  onChange={e => handleInputChange('passwordMinLength', e.target.value)}
                  onBlur={(e) => handleBlur('passwordMinLength', e.target.value)}
                  placeholder="Ví dụ: 6"
                  className={errors.passwordMinLength ? styles.inputError : ''}
                />
                {errors.passwordMinLength && <div className={styles.errorText}>{errors.passwordMinLength}</div>}
              </div>
              <div className={styles.settingItem}>
                <label>Độ dài mật khẩu tối đa</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={settings.passwordMaxLength || ''}
                  onChange={(e) => handleInputChange('passwordMaxLength', e.target.value)}
                  onBlur={(e) => handleBlur('passwordMaxLength', e.target.value)}
                  placeholder="Ví dụ: 128"
                  className={errors.passwordMaxLength ? styles.inputError : ''}
                />
                {errors.passwordMaxLength && <div className={styles.errorText}>{errors.passwordMaxLength}</div>}
              </div>
              <div className={styles.settingItem}>
                <label>
                  <input type="checkbox" checked={settings.requireDigit || false} onChange={(e) => handleCheckboxChange('requireDigit', e.target.checked)} />
                  Yêu cầu có chữ số
                </label>
                <div className={styles.helperNote}>Ví dụ: <strong>Medix2024</strong> có chữ số “2024”.</div>
              </div>
              <div className={styles.settingItem}>
                <label>
                  <input type="checkbox" checked={settings.requireLowercase || false} onChange={(e) => handleCheckboxChange('requireLowercase', e.target.checked)} />
                  Yêu cầu có chữ thường
                </label>
                <div className={styles.helperNote}>Giúp mật khẩu dễ đọc nhưng vẫn đủ mạnh.</div>
              </div>
              <div className={styles.settingItem}>
                <label>
                  <input type="checkbox" checked={settings.requireUppercase || false} onChange={(e) => handleCheckboxChange('requireUppercase', e.target.checked)} />
                  Yêu cầu có chữ hoa
                </label>
                <div className={styles.helperNote}>Tăng độ phức tạp bằng cách thêm chữ in hoa.</div>
              </div>
              <div className={styles.settingItem}>
                <label>
                  <input type="checkbox" checked={settings.requireSpecial || false} onChange={(e) => handleCheckboxChange('requireSpecial', e.target.checked)} />
                  Yêu cầu có ký tự đặc biệt
                </label>
                <div className={styles.helperNote}>Ví dụ: !, @, # giúp tài khoản an toàn hơn.</div>
              </div>
              <div className={styles.summaryChips}>
                {passwordRequirementSummary.map((item) => (
                  <div key={item.label} className={styles.summaryChip}>
                    <span className={styles.summaryLabel}>{item.label}</span>
                    <span className={styles.summaryValue}>{item.value}</span>
                  </div>
                ))}
              </div>


            </div>
          )}
        </div>
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
                    onBlur={handleEmailServerBlur}
                    className={emailServerErrors.username ? styles.inputError : ''}
                    placeholder="user@example.com"
                  />
                  {emailServerErrors.username && <div className={styles.errorText}>{emailServerErrors.username}</div>}
                </div>
                <div className={styles.settingItem}>
                  <label>Email người gửi</label>
                  <input
                    type="email"
                    value={emailServerSettings.fromEmail}
                    onChange={(e) => updateEmailServer({ fromEmail: e.target.value })}
                    onBlur={handleEmailServerBlur}
                    className={emailServerErrors.fromEmail ? styles.inputError : ''}
                    placeholder="noreply@example.com"
                  />
                  {emailServerErrors.fromEmail && <div className={styles.errorText}>{emailServerErrors.fromEmail}</div>}
                </div>
                <div className={styles.settingItem}>
                  <label>Tên hiển thị</label>
                  <input
                    type="text"
                    maxLength={225}
                    value={emailServerSettings.fromName}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateEmailServer({ fromName: value });
                    }}
                    onBlur={handleEmailServerBlur}
                    className={emailServerErrors.fromName ? styles.inputError : ''}
                    placeholder="Medix Notifications"
                  />
                  {emailServerErrors.fromName && <div className={styles.errorText}>{emailServerErrors.fromName}</div>}
                  <div className={styles.charCounter}>{(emailServerSettings.fromName || '').length}/225</div>
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
                  <p className={styles.hintText} style={{ color: "red" }}>
                    Bạn phải nhập chính xác mật khẩu ứng dụng SMTP để gửi email.
                  </p>

                  <p className={styles.hintText}>
                    Lưu ý: Để sử dụng SMTP của Gmail, bạn cần bật xác thực hai yếu tố (2FA) và tạo mật khẩu ứng dụng trong tài khoản Google của mình.
                  </p>

                </div>
                <div className={styles.settingItem}>
                  <button
                    className={styles.saveBtn}
                    onClick={handleSaveEmailServerSettings}
                    disabled={emailSettingsSaving || Object.keys(emailServerErrors).length > 0}
                  >
                    <i className={`bi ${emailSettingsSaving ? 'bi-arrow-repeat' : 'bi-save'}`}></i>
                    {emailSettingsSaving ? 'Đang lưu...' : 'Lưu cấu hình email'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
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
                        maxLength={64}
                        value={selectedTemplate.subject}
                        onChange={(e) => handleTemplateChange('subject', e.target.value)}
                        className={templateErrors[selectedTemplateKey]?.subject ? styles.inputError : ''}
                      />
                      {templateErrors[selectedTemplateKey]?.subject && (
                        <div className={styles.errorText}>{templateErrors[selectedTemplateKey]?.subject}</div>
                      )}
                      <div className={styles.charCounter}>
                        {(selectedTemplate.subject || '').length}/64
                      </div>
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
                            placeholder: 'Soạn nội dung email...',
                            toolbar: [
                              'heading', '|',
                              'bold', 'italic', 'underline', 'link', '|',
                              'bulletedList', 'numberedList', 'blockQuote', '|',
                              'undo', 'redo'
                            ],
                          }}
                        />
                      </div>
                      <div className={styles.charCounter}>
                        {(selectedTemplate.body || '').replace(/<[^>]*>/g, '').length}/7000
                      </div>
                      {templateErrors[selectedTemplateKey]?.body && (
                        <div className={styles.errorText}>{templateErrors[selectedTemplateKey]?.body}</div>
                      )}
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
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <h3>
              <i className="bi bi-robot"></i>
              Giới hạn truy cập AI
            </h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.settingItem}>
              <label>Số lượt truy cập AI tối đa trong 1 ngày</label>
              <input
                type="number"
                min={1}
                max={999}
                value={aiDailyAccessLimit}
                onChange={(e) =>
                  setAiDailyAccessLimit(Math.max(1, Number(e.target.value) || 1))
                }
              />
            </div>
            <p className={styles.hintText}>
              Tùy chỉnh số lượt truy cập AI mà người dùng có thể sử dụng trong một ngày. Ví dụ: 50 lượt/ngày.
            </p>
            <div className={styles.settingItem}>
              <button
                className={styles.saveBtn}
                onClick={handleSaveAiDailyAccessLimit}
                disabled={aiAccessLimitSaving}
              >
                <i className={`bi ${aiAccessLimitSaving ? 'bi-arrow-repeat' : 'bi-save'}`}></i>
                {aiAccessLimitSaving ? 'Đang lưu...' : 'Lưu giới hạn AI'}
              </button>
            </div>
          </div>
        </div>
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
                  <label>Bản sao lưu mới nhất</label>
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
                maxLength={255}
                value={settings.maintenanceMessage || ''}
                onChange={(e) => handleInputChange('maintenanceMessage', e.target.value)}
                placeholder="Nhập thông báo bảo trì..."
              ></textarea>
              <div className={styles.charCounter}>
                {(settings.maintenanceMessage || '').length}/255
              </div>
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
              <div className={styles.helperNote}>
                Người dùng sẽ thấy thông điệp này khi truy cập vào khung giờ bảo trì.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footerActions}>
        <button onClick={handleSaveChanges} className={userStyles.btnCreate} disabled={saving || loading}>
          <i className={`bi ${saving ? 'bi-arrow-repeat' : 'bi-check-lg'}`}></i>
          {saving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
        </button>
      </div>
    </div>
  );
}
