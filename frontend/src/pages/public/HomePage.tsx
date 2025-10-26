import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../../styles/public/home.module.css'
import { HomeMetadata } from '../../types/home.types';
import HomeService from '../../services/homeService';
import { useLanguage } from '../../contexts/LanguageContext';
import { ArticleDTO } from '../../types/article.types';
import { articleService } from '../../services/articleService';

function HomePage() {
    const navigate = useNavigate();
    const { t } = useLanguage();

    //get home page details
    const [homeMetadata, setHomeMetadata] = useState<HomeMetadata>();
    const [featuredArticles, setFeaturedArticles] = useState<ArticleDTO[]>([]);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const data = await HomeService.getHomeMetadata();
                setHomeMetadata(data);
            } catch (error) {
                console.error('Failed to fetch home metadata:', error);
            }
        };

        fetchMetadata();

        const fetchArticles = async () => {
            try {
                const articles = await articleService.getHomepageArticles(6); // Lấy 6 bài viết
                setFeaturedArticles(articles);
            } catch (error) {
                console.error('Failed to fetch homepage articles:', error);
            }
        };
        fetchArticles();
    }, []);

    //handle doctors sliding
    const [currentIndex, setCurrentIndex] = useState(0);
    const doctorsPerPage = 4;

    const visibleDoctors = homeMetadata?.displayedDoctors.slice(
        currentIndex,
        currentIndex + doctorsPerPage
    );

    const handlePrev = () => {
        setCurrentIndex((prev) => Math.max(prev - doctorsPerPage, 0));
    };

    const handleNext = () => {
        if (homeMetadata?.displayedDoctors) {
            setCurrentIndex((prev) =>
                Math.min(prev + doctorsPerPage, homeMetadata.displayedDoctors.length - doctorsPerPage)
            );
        }
    };

    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
      const handleScroll = () => {
        setShowButton(window.scrollY > 300);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    return (
        <div>
            <nav className={styles["navbar"]}>
                <ul className={styles["nav-menu"]}>
                    <li>
                        <a
                            onClick={() => navigate('/')}
                            className={`${styles["nav-link"]} ${location.pathname === '/' ? styles["active"] : ''}`}
                        >
                            {t('nav.home')}
                        </a>
                    </li>
                    <li><span>|</span></li>
                    <li>
                        <a
                            onClick={() => navigate('/ai-chat')}
                            className={`${styles["nav-link"]} ${location.pathname === '/ai-chat' ? styles["active"] : ''}`}
                        >
                            {t('nav.ai-diagnosis')}
                        </a>
                    </li>
                    <li><span>|</span></li>
                    <li>
                        <a
                            onClick={() => navigate('/specialties')}
                            className={`${styles["nav-link"]} ${location.pathname === '/specialties' ? styles["active"] : ''}`}
                        >
                            {t('nav.specialties')}
                        </a>
                    </li>
                    <li><span>|</span></li>
                    <li>
                        <a
                            onClick={() => navigate('/doctors')}
                            className={`${styles["nav-link"]} ${location.pathname === '/doctors' ? styles["active"] : ''}`}
                        >
                            {t('nav.doctors')}
                        </a>
                    </li>
                    <li><span>|</span></li>
                    <li>
                        <a
                            onClick={() => navigate('/app/articles')}
                            className={`${styles["nav-link"]} ${location.pathname === '/articles' ? styles["active"] : ''}`}
                        >
                            {t('nav.health-articles')}
                        </a>
                    </li>
                    <li><span>|</span></li>
                    <li>
                        <a
                            onClick={() => navigate('/about')}
                            className={`${styles["nav-link"]} ${location.pathname === '/about' ? styles["active"] : ''}`}
                        >
                            {t('nav.about')}
                        </a>
                    </li>
                </ul>
            </nav>

            {/* Hero Section */}
            <section className={styles["hero"]}>
                {/* Floating Elements */}
                <div className={styles["floating-elements"]}>
                    <div className={styles["floating-card"]} style={{ top: '15%', left: '5%' }}>
                    <div className={styles["floating-icon"]}>🏥</div>
                    <div className={styles["floating-text"]}>{t('hero.healthcare')}</div>
                    </div>
                    <div className={styles["floating-card"]} style={{ top: '25%', right: '8%' }}>
                    <div className={styles["floating-icon"]}>👨‍⚕️</div>
                    <div className={styles["floating-text"]}>{t('hero.doctor')}</div>
                    </div>
                    <div className={styles["floating-card"]} style={{ bottom: '20%', left: '8%' }}>
                    <div className={styles["floating-icon"]}>🤖</div>
                    <div className={styles["floating-text"]}>{t('hero.ai')}</div>
                    </div>
                    <div className={styles["floating-card"]} style={{ bottom: '25%', right: '5%' }}>
                    <div className={styles["floating-icon"]}>📱</div>
                    <div className={styles["floating-text"]}>{t('hero.booking')}</div>
                    </div>
                </div>
                <div className={styles["hero-content"]}>
                    <div className={styles["hero-text"]}>
                        <h1>{t('hero.title')}<br />{t('hero.subtitle')}</h1>
                        <p>{t('hero.description')}</p>
                        <div className={styles["features-box"]}>
                            <div className={styles["feature-item"]}>
                                <div className={styles["icon"]}>🤖</div>
                                <strong>{t('hero.ai-diagnosis')}</strong>
                                <small>{t('hero.ai-diagnosis.desc')}</small>
                            </div>
                            <div className={styles["feature-item"]}>
                                <div className={styles["icon"]}>📅</div>
                                <strong>{t('hero.appointment')}</strong>
                                <small>{t('hero.appointment.desc')}</small>
                            </div>
                            <div className={styles["feature-item"]}>
                                <div className={styles["icon"]}>👨‍⚕️</div>
                                <strong>{t('hero.find-doctor')}</strong>
                                <small>{t('hero.find-doctor.desc')}</small>
                            </div>
                        </div>
                    </div>
                    <div id="carouselBanner" className="carousel slide" data-bs-ride="carousel" data-bs-interval="5000">
                        <div className="carousel-inner">
                            {homeMetadata?.bannerUrls.map((bannerUrl, index) => (
                                <div className={`carousel-item${index === 0 ? ' active' : ''}`} key={index}>
                                    <img
                                        src={bannerUrl}
                                        className="d-block w-100"
                                        alt={`Banner ${index + 1}`}
                                    />
                                </div>
                            ))}
                        </div>
                        <button className="carousel-control-prev" type="button" data-bs-target="#carouselBanner" data-bs-slide="prev">
                            <span className="carousel-control-prev-icon" aria-hidden="true" />
                            <span className="visually-hidden">Previous</span>
                        </button>
                        <button className="carousel-control-next" type="button" data-bs-target="#carouselBanner" data-bs-slide="next">
                            <span className="carousel-control-next-icon" aria-hidden="true" />
                            <span className="visually-hidden">Next</span>
                        </button>
                        <div className="carousel-indicators">
                            {homeMetadata?.bannerUrls.map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    data-bs-target="#carouselBanner"
                                    data-bs-slide-to={index}
                                    className={index === 0 ? 'active' : ''}
                                    aria-current={index === 0 ? 'true' : 'false'}
                                    aria-label={`Slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            {/* Why Choose Section */}
            <section className={styles["why-choose"]}>
                <h2>{t('why-choose.title')}</h2>
                <div className={styles["why-content"]}>
                    <div className={styles["doctor-image"]}>
                        <img src="/images/why-choose-doctor.png" alt="Doctor" />
                    </div>
                    <div className={styles["benefits"]}>
                        <div className={styles["benefit-item"]}>
                            <img src="/images/why-choose-1.png" className={styles["icon"]} />
                            <h3>{t('why-choose.expert.title')}</h3>
                            <p>{t('why-choose.expert.desc')}</p>
                        </div>
                        <div className={styles["benefit-item"]}>
                            <img src="/images/why-choose-2.png" className={styles["icon"]} />
                            <h3>{t('why-choose.quality.title')}</h3>
                            <p>{t('why-choose.quality.desc')}</p>
                        </div>
                        <div className={styles["benefit-item"]}>
                            <img src="/images/why-choose-3.png" className={styles["icon"]} />
                            <h3>{t('why-choose.research.title')}</h3>
                            <p>{t('why-choose.research.desc')}</p>
                        </div>
                        <div className={styles["benefit-item"]}>
                            <img src="/images/why-choose-1.png" className={styles["icon"]} />
                            <h3>{t('why-choose.technology.title')}</h3>
                            <p>{t('why-choose.technology.desc')}</p>
                        </div>
                    </div>
                </div>
            </section>
            {/* AI Section */}
            <section className={styles["ai-section"]}>
                <div className={styles["ai-content"]}>
                    <div className={styles["ai-badge"]}>{t('ai.badge')}</div>
                    <div className={styles["ai-features"]}>
                        <div className={styles["ai-robot"]}>
                            <div className={styles["robot-circle"]}>
                                <div className={styles["robot-icon"]}>
                                    <img src="/images/medix-logo.png" />
                                </div>
                                <div className={styles["status-indicator"]} />
                            </div>
                        </div>
                        <div className={styles["ai-text"]}>
                            <p>{t('ai.description')}</p>
                        </div>
                    </div>
                    <div className={styles["ai-features"]}>
                        <div className={styles["ai-text"]}>
                            <p>{t('ai.description')}</p>
                        </div>
                        <div className={styles["ai-robot"]}>
                            <div className={styles["robot-circle"]}>
                                <div className={styles["robot-icon"]}>
                                    <img src="/images/ai-95-percent.png" />
                                </div>
                            </div>
                            <div style={{ marginTop: '15px' }}>
                                <span><i>{t('ai.accuracy')}</i></span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* Steps Section */}
            <section className={styles["steps"]}>
            <h2>{t('steps.title')}</h2>
            <div className={styles["steps-container"]}>
                <div className={styles["step"]}>
                <div className={styles["step-circle"]}>01</div>
                <div className={styles["step-icon"]}>
                    <i className="bi bi-robot"></i>
                </div>
                <h3>{t('steps.step1.title')}</h3>
                <p>{t('steps.step1.desc')}</p>
                </div>

                <div className={styles["step"]}>
                <div className={styles["step-circle"]}>02</div>
                <div className={styles["step-icon"]}>
                    <i className="bi bi-person-vcard"></i>
                </div>
                <h3>{t('steps.step2.title')}</h3>
                <p>{t('steps.step2.desc')}</p>
                </div>

                <div className={styles["step"]}>
                <div className={styles["step-circle"]}>03</div>
                <div className={styles["step-icon"]}>
                    <i className="bi bi-calendar-heart"></i>
                </div>
                <h3>{t('steps.step3.title')}</h3>
                <p>{t('steps.step3.desc')}</p>
                </div>
            </div>
            </section>
            {/* Doctors Section */}
            <section className={styles["doctors"]}>
                <h2>{t('doctors.title')}</h2>
                <div className={styles["doctor-carousel-container"]}>
                    <button onClick={handlePrev} disabled={currentIndex === 0} className={styles["doctor-nav-button"]}>←</button>

                    <div className={styles["doctors-grid"]}>
                        {visibleDoctors?.map((doctor, index) => (
                            <a key={`doctor-${doctor.userName}-${index}`} href={`/doctor/details/${doctor.userName}`} className={styles["doctor-card"]}>
                                <div className={styles["doctor-photo"]}>
                                    <img className={styles['doctor-photo']} src={doctor.avatarUrl}></img>
                                </div>
                                <h3>{doctor.fullName}</h3>
                                <p className={styles["specialty"]}>{t('doctors.specialty')} - {doctor.specializationName}</p>
                                <p className={styles["specialty"]}>{doctor.yearsOfExperience} {t('common.years-experience')}</p>
                                <div className={styles["rating"]}>
                                    {'★'.repeat(Math.round(doctor.averageRating)) + '☆'.repeat(5 - Math.round(doctor.averageRating))}
                                </div>
                            </a>
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={currentIndex + doctorsPerPage >= (homeMetadata?.displayedDoctors?.length ?? 0)}
                        className={styles["doctor-nav-button"]}>
                        →
                    </button>

                </div>
                <div className={styles["view-all"]}>
                    <button 
                        className={styles["btn-view-all"]}
                        onClick={() => navigate('/doctors')}
                    >
                        {t('doctors.view-all')}
                    </button>
                </div>
            </section >
            {/* Knowledge Section */}
            <section className={styles["knowledge"]}>
                <h2>{t('knowledge.title')}</h2>
                <div className={styles["knowledge-grid"]}>
                    {featuredArticles.map((article) => (
                        <Link to={`/app/articles/${article.slug}`} key={article.id} className={styles["knowledge-card"]}>
                            <div className={styles["knowledge-image-container"]}>
                                <img className={styles["knowledge-image"]} src={article.thumbnailUrl || '/placeholder-image.jpg'} alt={article.title} />
                            </div>
                            <div className={styles["knowledge-content"]}>
                                <h5>{article.title}</h5>
                                <p>{article.summary}</p>
                            </div>
                            <div className={styles["knowledge-footer"]}>
                                <span className={styles["knowledge-date"]}>
                                    📅 {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('vi-VN') : ''}
                                </span>
                                <span className={styles["read-more"]}>Đọc thêm &rarr;</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section >

            <div className={styles["ai-bubble"]}>
                <img src="/images/medix-logo-mirrored.jpg" alt="Chat" />
                <div className={styles['status-indicator-sm']}></div>
            </div>

            <button
                className={`${styles["back-to-top"]} ${!showButton ? styles["hidden"] : ""}`}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label="Back to top"
            >
                <i className="fas fa-arrow-up"></i>
            </button>
    </div>
  );
}

export default HomePage;