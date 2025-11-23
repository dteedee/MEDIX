import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { apiClient } from '../../lib/apiClient';
import styles from '../../styles/public/footer.module.css';

interface FooterSettings {
  siteName?: string;
  systemDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
}

const Footer: React.FC = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<FooterSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFooterSettings = async () => {
      setLoading(true);
      try {
        const [nameRes, descRes, emailRes, phoneRes, addressRes] = await Promise.all([
          apiClient.get('/SystemConfiguration/SiteName').catch(() => ({ data: { configValue: 'MEDIX' } })),
          apiClient.get('/SystemConfiguration/SystemDescription').catch(() => ({ data: { configValue: t('footer.about') } })),
          apiClient.get('/SystemConfiguration/ContactEmail').catch(() => ({ data: { configValue: 'support@medix.com' } })),
          apiClient.get('/SystemConfiguration/ContactPhone').catch(() => ({ data: { configValue: '1900-63349' } })),
          apiClient.get('/SystemConfiguration/ContactAddress').catch(() => ({ data: { configValue: 'FPT University' } })),
        ]);

        setSettings({
          siteName: nameRes.data.configValue,
          systemDescription: descRes.data.configValue,
          contactEmail: emailRes.data.configValue,
          contactPhone: phoneRes.data.configValue,
          contactAddress: addressRes.data.configValue,
        });
      } catch (error) {
        console.error("Failed to fetch footer settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFooterSettings();
  }, [t]);

  return (
    <footer>
      <div className={styles["footer-content"]}>
        {/* Section 1: MEDIX info */}
        <div className={styles["footer-section"]}>
          <h3>{loading ? '...' : (settings.siteName || 'MEDIX')}</h3>
          <p style={{ fontSize: '13px', lineHeight: '1.8' }}>
            {loading ? '...' : (settings.systemDescription || t('footer.about'))}
          </p>
          <div className={styles["social-icons"]}>
            <div className={styles["social-icon"]}>f</div>
            <div className={styles["social-icon"]}>in</div>
          </div>
        </div>

        {/* Section 2: About Us */}
        <div className={styles["footer-section"]}>
          <h3>{t('footer.links.title')}</h3>
          <ul>
            <li><Link to="/">{t('footer.links.home')}</Link></li>
            <li><Link to="/about">{t('footer.links.about')}</Link></li>
            <li><Link to="/doctors">{t('footer.links.doctors')}</Link></li>
            <li><Link to="/articles">{t('footer.links.healthArticles')}</Link></li>
            <li><Link to="/specialties">Chuyên khoa</Link></li>
          </ul>
        </div>

        {/* Section 3: Services */}
        <div className={styles["footer-section"]}>
          <h3>{t('footer.services.title')}</h3>
          <ul>
            <li><Link to="/doctors">{t('footer.services.packages')}</Link></li>
            <li><Link to="/ai-chat">{t('footer.services.aiDiagnosis')}</Link></li>
            <li><Link to="/doctors">{t('footer.services.booking')}</Link></li>
            <li><Link to="/terms">Điều khoản dịch vụ</Link></li>
            <li><Link to="/privacy">Chính sách bảo mật</Link></li>
          </ul>
        </div>

        {/* Section 4: Contact */}
        <div className={styles["footer-section"]}>
          <h3>{t('footer.contact.title')}</h3>
          <ul>
            <li>
              <a href={`mailto:${settings.contactEmail}`}>{`Email: ${loading ? '...' : (settings.contactEmail || 'support@medix.com')}`}</a>
            </li>
            <li>
              <a href={`tel:${settings.contactPhone}`}>{`Hotline: ${loading ? '...' : (settings.contactPhone || '1900-0000')}`}</a>
            </li>
            <li>
              {/* Assuming website is derived from siteName or a fixed URL */}
              <a>Website: {loading ? '...' : (settings.siteName ? `www.${settings.siteName.toLowerCase()}.com` : 'www.medix.com')}</a>
            </li>
            <li>
              <a>{`Địa chỉ: ${loading ? '...' : (settings.contactAddress || 'FPT University')}`}</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom line */}
      <div className={styles["footer-bottom"]}>
        <p>© 2025 MEDIX. {t('footer.rights')}</p>
      </div>
    </footer>
  );
};

export default Footer;
