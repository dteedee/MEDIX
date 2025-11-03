import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from '../../styles/public/footer.module.css';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer>
      <div className={styles["footer-content"]}>
        {/* Section 1: MEDIX info */}
        <div className={styles["footer-section"]}>
          <h3>MEDIX</h3>
          <p style={{ fontSize: '13px', lineHeight: '1.8' }}>
            {t('footer.about')}
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
            <li><a href="/">{t('footer.links.home')}</a></li>
            <li><a href="/about">{t('footer.links.about')}</a></li>
            <li><a href="#">{t('footer.links.doctors')}</a></li>
            <li><a href="#">{t('footer.links.healthArticles')}</a></li>
          </ul>
        </div>

        {/* Section 3: Services */}
        <div className={styles["footer-section"]}>
          <h3>{t('footer.services.title')}</h3>
          <ul>
            <li><a href="#">{t('footer.services.packages')}</a></li>
            <li><a href="#">{t('footer.services.aiDiagnosis')}</a></li>
            <li><a href="#">{t('footer.services.booking')}</a></li>
          </ul>
        </div>

        {/* Section 4: Contact */}
        <div className={styles["footer-section"]}>
          <h3>{t('footer.contact.title')}</h3>
          <ul>
            <li>
              <a>Email: medix.sp@gmail.com</a>
            </li>
            <li>
              <a>Hotline: 0969.995.633</a>
            </li>
            <li>
              <a>Website: www.medix.com</a>
            </li>
            <li>
              <a>Địa chỉ: FPT University</a>
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
