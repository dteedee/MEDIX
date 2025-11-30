import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import specializationService, { SpecializationListDto } from '../../services/specializationService';
import homeStyles from '../../styles/public/home.module.css';
import styles from '../../styles/public/specialty.module.css';
import ChatbotBubble from '../../components/ChatbotBubble';
import BackToTopButton from '../../components/BackToTopButton';

const SpecialtyListPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [specializations, setSpecializations] = useState<SpecializationListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    loadSpecializations();
  }, []);

  const loadSpecializations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await specializationService.getAll(true);
      setSpecializations(data);
    } catch (err: any) {
      setError('Không thể tải danh sách chuyên khoa. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSpecializations = specializations.filter(spec =>
    spec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spec.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation Bar */}
      <nav className={homeStyles["navbar"]}>
        <ul className={homeStyles["nav-menu"]}>
          <li>
            <Link to="/" className={homeStyles["nav-link"]}>
              {t('nav.home')}
            </Link>
          </li>
          <li><span>|</span></li>
          <li>
            <Link to="/ai-chat" className={homeStyles["nav-link"]}>
              {t('nav.ai-diagnosis')}
            </Link>
          </li>
          <li><span>|</span></li>
          <li>
            <Link to="/specialties" className={`${homeStyles["nav-link"]} ${homeStyles["active"]}`}>
              {t('nav.specialties')}
            </Link>
          </li>
          <li><span>|</span></li>
          <li>
            <Link to="/doctors" className={homeStyles["nav-link"]}>
              {t('nav.doctors')}
            </Link>
          </li>
          <li><span>|</span></li>
          <li>
            <Link to="/app/articles" className={homeStyles["nav-link"]}>
              {t('nav.health-articles')}
            </Link>
          </li>
          <li><span>|</span></li>
          <li>
            <Link to="/about" className={homeStyles["nav-link"]}>
              {t('nav.about')}
            </Link>
          </li>
        </ul>
      </nav>

      <div className={styles.container}>
        <div className={styles.content}>
          {/* Breadcrumb */}
          <div className={styles.breadcrumb}>
            <Link to="/">Trang chủ</Link> / <span>Chuyên khoa</span>
          </div>

          {/* Header */}
          <div className={styles.header}>
            <h1>CHUYÊN KHOA</h1>
            <p className={styles.subtitle}>
              Khám phá các chuyên khoa y tế của MEDIX với đội ngũ bác sĩ chuyên nghiệp và công nghệ hiện đại
            </p>
          </div>

          {/* Search Bar */}
          <div className={styles.searchSection}>
            <div className={styles.searchBox}>
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="Tìm kiếm chuyên khoa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* Specializations Grid */}
          {filteredSpecializations.length === 0 ? (
            <div className={styles.noResults}>
              <p>Không tìm thấy chuyên khoa nào phù hợp với từ khóa "{searchTerm}"</p>
            </div>
          ) : (
            <div className={styles.specialtiesGrid}>
              {filteredSpecializations.map((specialty) => (
                <div
                  key={specialty.id}
                  className={styles.specialtyCard}
                  onClick={() => navigate(`/specialties/${specialty.id}`)}
                >
                  <div className={styles.cardImage}>
                    {specialty.imageUrl ? (
                      <img src={specialty.imageUrl} alt={specialty.name} />
                    ) : (
                      <div className={styles.placeholderImage}>
                        <i className="bi bi-hospital"></i>
                      </div>
                    )}
                  </div>
                  <div className={styles.cardContent}>
                    <h3>{specialty.name}</h3>
                    <p className={styles.cardDescription}>
                      {specialty.description || 'Chuyên khoa y tế chuyên nghiệp'}
                    </p>
                    <div className={styles.cardFooter}>
                      <span className={styles.doctorCount}>
                        <i className="bi bi-people"></i>
                        {specialty.doctorCount} bác sĩ
                      </span>
                      <span className={styles.viewMore}>
                        Xem chi tiết <i className="bi bi-arrow-right"></i>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BackToTopButton />
      <ChatbotBubble />
    </div>
  );
};

export default SpecialtyListPage;

