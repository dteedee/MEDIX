import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';
import styles from '../../styles/admin/SettingsPage.module.css';

interface SystemSettings {
  siteName: string;
  systemDescription: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

export default function SettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Partial<SystemSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [siteNameRes, descriptionRes, emailRes, phoneRes, addressRes] = await Promise.all([
        apiClient.get('/SystemConfiguration/SiteName'),
        apiClient.get('/SystemConfiguration/SystemDescription'),
        apiClient.get('/SystemConfiguration/ContactEmail'),
        apiClient.get('/SystemConfiguration/ContactPhone'),
        apiClient.get('/SystemConfiguration/ContactAddress'),
      ]);

      setSettings({
        siteName: siteNameRes.data.configValue,
        systemDescription: descriptionRes.data.configValue,
        contactEmail: emailRes.data.configValue,
        contactPhone: phoneRes.data.configValue,
        contactAddress: addressRes.data.configValue,
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


  const handleInputChange = (key: keyof SystemSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
      ]);
      showToast('Lưu thay đổi thành công!', 'success');
    } catch (error) {
      console.error("Failed to save settings", error);
      showToast('Lưu thay đổi thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setSaving(false);
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
              <div className={styles.cardContent}>
                <div className={styles.settingItem}>
                  <label>Thời gian hết hạn phiên đăng nhập (phút)</label>
                  <input type="number" defaultValue="30" />
                </div>
                <div className={styles.settingItem}>
                  <label>Số lần đăng nhập sai tối đa</label>
                  <input type="number" defaultValue="5" />
                </div>
                <div className={styles.settingItem}>
                  <label>Thời gian khóa tài khoản (phút)</label>
                  <input type="number" defaultValue="15" />
                </div>
                <div className={styles.settingItem}>
                  <label>
                    <input type="checkbox" defaultChecked />
                    Yêu cầu xác thực 2 bước
                  </label>
                </div>
              </div>
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
                  <label>Múi giờ</label>
                  <select defaultValue="Asia/Ho_Chi_Minh">
                    <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                  </select>
                </div>
                <div className={styles.settingItem}>
                  <label>Ngôn ngữ mặc định</label>
                  <select defaultValue="vi">
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className={styles.settingItem}>
                  <label>Định dạng ngày tháng</label>
                  <select defaultValue="dd/mm/yyyy">
                    <option value="dd/mm/yyyy">dd/mm/yyyy</option>
                    <option value="mm/dd/yyyy">mm/dd/yyyy</option>
                    <option value="yyyy-mm-dd">yyyy-mm-dd</option>
                  </select>
                </div>
                <div className={styles.settingItem}>
                  <label>Định dạng tiền tệ</label>
                  <select defaultValue="VND">
                    <option value="VND">VND (₫)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
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
                <div className={styles.settingItem}>
                  <label>Tần suất sao lưu</label>
                  <select defaultValue="daily">
                    <option value="hourly">Hàng giờ</option>
                    <option value="daily">Hàng ngày</option>
                    <option value="weekly">Hàng tuần</option>
                    <option value="monthly">Hàng tháng</option>
                  </select>
                </div>
                <div className={styles.settingItem}>
                  <label>Thời gian sao lưu</label>
                  <input type="time" defaultValue="02:00" />
                </div>
                <div className={styles.settingItem}>
                  <label>Số bản sao lưu giữ lại</label>
                  <input type="number" defaultValue="30" />
                </div>
                <div className={styles.settingItem}>
                  <button className={styles.backupBtn}>
                    <i className="bi bi-download"></i>
                    Sao lưu ngay
                  </button>
                </div>
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
                      <input type="radio" name="maintenance" value="off" defaultChecked />
                      <span>Tắt</span>
                    </label>
                    <label className={styles.toggle}>
                      <input type="radio" name="maintenance" value="on" />
                      <span>Bật</span>
                    </label>
                  </div>
                </div>
                <div className={styles.settingItem}>
                  <label>Thông báo bảo trì</label>
                  <textarea placeholder="Nhập thông báo bảo trì..."></textarea>
                </div>
                <div className={styles.settingItem}>
                  <label>Thời gian bảo trì</label>
                  <input type="datetime-local" />
                </div>
                <div className={styles.settingItem}>
                  <button className={styles.maintenanceBtn}>
                    <i className="bi bi-gear"></i>
                    Khởi động bảo trì
                  </button>
                </div>
              </div>
            </div>
          </div>
    </div>
  );
}
