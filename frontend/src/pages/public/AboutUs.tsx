import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { apiClient } from '../../lib/apiClient';
import styles from '../../styles/public/about.module.css';
import homeStyles from '../../styles/public/home.module.css';
import ChatbotBubble from '../../components/ChatbotBubble';
import BackToTopButton from '../../components/BackToTopButton';

interface SystemSettings {
  siteName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
}

const AboutUs: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [settings, setSettings] = useState<SystemSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const [nameRes, emailRes, phoneRes, addressRes] = await Promise.all([
          apiClient.get('/SystemConfiguration/SiteName').catch(() => ({ data: { configValue: 'MEDIX' } })),
          apiClient.get('/SystemConfiguration/ContactEmail').catch(() => ({ data: { configValue: 'medix.sp@gmail.com' } })),
          apiClient.get('/SystemConfiguration/ContactPhone').catch(() => ({ data: { configValue: '0969.995.633' } })),
          apiClient.get('/SystemConfiguration/ContactAddress').catch(() => ({ data: { configValue: 'FPT University' } })),
        ]);
        setSettings({
          siteName: nameRes.data.configValue,
          contactEmail: emailRes.data.configValue,
          contactPhone: phoneRes.data.configValue,
          contactAddress: addressRes.data.configValue,
        });
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const resolvedSiteName = settings.siteName || 'MEDIX';
  const siteNameDisplay = loading ? '...' : resolvedSiteName;

  const values = [
    { icon: '🧠', title: 'about.values.smart.title', desc: 'about.values.smart.desc' },
    { icon: '🎯', title: 'about.values.medical.title', desc: 'about.values.medical.desc' },
    { icon: '⚡', title: 'about.values.agile.title', desc: 'about.values.agile.desc' },
    { icon: '🔒', title: 'about.values.reliable.title', desc: 'about.values.reliable.desc' },
    { icon: '🚀', title: 'about.values.technology.title', desc: 'about.values.technology.desc' },
  ];

  const stats = [
    { number: '50,000+', label: 'about.capabilities.stat.users' },
    { number: '100,000+', label: 'about.capabilities.stat.consultations' },
    { number: '1,000+', label: 'about.capabilities.stat.doctors' },
    { number: '500+', label: 'about.capabilities.stat.specialties' },
    { number: '24/7', label: 'about.capabilities.stat.support' },
    { number: '99.9%', label: 'about.capabilities.stat.uptime' },
  ];

  const technologies = [
    { icon: '🤖', title: 'about.technology.diagnosis.title', desc: 'about.technology.diagnosis.desc' },
    { icon: '📱', title: 'about.technology.mobile.title', desc: 'about.technology.mobile.desc' },
    { icon: '🔐', title: 'about.technology.security.title', desc: 'about.technology.security.desc' },
    { icon: '☁️', title: 'about.technology.cloud.title', desc: 'about.technology.cloud.desc' },
  ];

  const teamMembers = [
    { icon: '👨‍⚕️', title: 'about.team.doctors.title', desc: 'about.team.doctors.desc' },
    { icon: '💻', title: 'about.team.engineers.title', desc: 'about.team.engineers.desc' },
    { icon: '🔬', title: 'about.team.researchers.title', desc: 'about.team.researchers.desc' },
  ];

  const contactItems = [
    { icon: '📧', label: 'about.contact.email', value: loading ? '...' : (settings.contactEmail || 'medix.sp@gmail.com') },
    { icon: '📞', label: 'about.contact.hotline', value: loading ? '...' : (settings.contactPhone || '0969.995.633') },
    { icon: '🌐', label: 'about.contact.website', value: loading ? '...' : (settings.siteName ? `www.${settings.siteName.toLowerCase()}.com` : 'www.medix.com') },
    { icon: '📍', label: 'about.contact.address', value: loading ? '...' : (settings.contactAddress || 'FPT University') },
  ];

  return (
    <>
      {/* Navigation Bar - Giống HomePage và ArticleReaderPage */}
      <nav className={homeStyles["navbar"]}>
        <ul className={homeStyles["nav-menu"]}>
          <li>
            <a
              onClick={() => navigate('/')}
              className={`${homeStyles["nav-link"]} ${location.pathname === '/' ? homeStyles["active"] : ''}`}
            >
              {t('nav.home')}
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => navigate('/ai-chat')}
              className={`${homeStyles["nav-link"]} ${location.pathname === '/ai-chat' ? homeStyles["active"] : ''}`}
            >
              {t('nav.ai-diagnosis')}
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => navigate('/specialties')}
              className={`${homeStyles["nav-link"]} ${location.pathname === '/specialties' ? homeStyles["active"] : ''}`}
            >
              {t('nav.specialties')}
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => navigate('/doctors')}
              className={`${homeStyles["nav-link"]} ${location.pathname === '/doctors' ? homeStyles["active"] : ''}`}
            >
              {t('nav.doctors')}
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => navigate('/app/articles')}
              className={`${homeStyles["nav-link"]} ${location.pathname === '/articles' ? homeStyles["active"] : ''}`}
            >
              {t('nav.health-articles')}
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => navigate('/about')}
              className={`${homeStyles["nav-link"]} ${location.pathname === '/about' ? homeStyles["active"] : ''}`}
            >
              {t('nav.about')}
            </a>
          </li>
        </ul>
      </nav>

      <div className={styles["about-container"]}>
        <div className={styles["about-content"]}>
          <div className={styles["aboutContentInner"]}>
            <div className={styles["about-header"]}>
            <h1>{t('about.heading')} {siteNameDisplay}</h1>
            </div>

            <div className={styles["about-body"]}>
          <section className={styles["intro-section"]}>
            <h2>{t('about.intro.title')}</h2>
            <p>{loading ? '...' : t('about.intro.text', { siteName: resolvedSiteName })}</p>
          </section>

          <section className={styles["vision-section"]}>
            <h2>{t('about.vision.title')}</h2>
            <p>{loading ? '...' : t('about.vision.text', { siteName: resolvedSiteName })}</p>
          </section>

          <section className={styles["mission-section"]}>
            <h2>{t('about.mission.title')}</h2>
            <p className={styles["mission-text"]}>
              {t('about.mission.prefix')} <strong>{t('about.mission.ai')}</strong>,{' '}
              <strong>{t('about.mission.medical')}</strong> {t('common.and') || '&'}{' '}
              <strong>{t('about.mission.empathy')}</strong>.
            </p>
          </section>

          <section className={styles["values-section"]}>
            <h2>{t('about.values.title')}</h2>
            <div className={styles["values-grid"]}>
              {values.map((value) => (
                <div className={styles["value-card"]} key={value.title}>
                  <div className={styles["value-icon"]}>{value.icon}</div>
                  <h3>{t(value.title)}</h3>
                  <p>{t(value.desc)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles["capabilities-section"]}>
            <h2>{t('about.capabilities.title')}</h2>
            <div className={styles["capability-highlight"]}>
              <div className={styles["capability-number"]}>95%</div>
              <div className={styles["capability-label"]}>{t('about.capabilities.accuracy')}</div>
            </div>

            <div className={styles["stats-grid"]}>
              {stats.map((stat) => (
                <div className={styles["stat-item"]} key={stat.label}>
                  <div className={styles["stat-number"]}>{stat.number}</div>
                  <div className={styles["stat-label"]}>{t(stat.label)}</div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles["technology-section"]}>
            <h2>{t('about.technology.title')}</h2>
            <div className={styles["tech-grid"]}>
              {technologies.map((tech) => (
                <div className={styles["tech-card"]} key={tech.title}>
                  <div className={styles["tech-icon"]}>{tech.icon}</div>
                  <h3>{t(tech.title)}</h3>
                  <p>{t(tech.desc)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles["team-section"]}>
            <h2>{t('about.team.title')}</h2>
            <div className={styles["team-grid"]}>
              {teamMembers.map((member) => (
                <div className={styles["team-card"]} key={member.title}>
                  <div className={styles["team-icon"]}>{member.icon}</div>
                  <h3>{t(member.title)}</h3>
                  <p>{t(member.desc)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles["contact-section"]}>
            <h2>{t('about.contact.title')}</h2>
            <div className={styles["contact-info"]}>
              {contactItems.map((item) => (
                <div className={styles["contact-item"]} key={item.label}>
                  <div className={styles["contact-icon"]}>{item.icon}</div>
                  <div>
                    <h4>{t(item.label)}</h4>
                    <p>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
            </div>
          </div>
        </div>
      </div>
      <BackToTopButton />
      <ChatbotBubble />
    </>
  );
};

export default AboutUs;
