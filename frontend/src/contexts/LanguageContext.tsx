import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../lib/apiClient';

export type Language = 'vi' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('medix-language') as Language;
        return saved === 'en' || saved === 'vi' ? saved : 'vi';
    });

    useEffect(() => {
        const savedLanguage = localStorage.getItem('medix-language') as Language;
        if (savedLanguage === 'vi' || savedLanguage === 'en') return;

        let cancelled = false;
        const fetchDefaultLanguage = async () => {
            try {
                const res = await apiClient.get('/SystemConfiguration/DEFAULT_LANGUAGE');
                const configLanguage = res.data?.configValue?.toLowerCase();
                if (!cancelled && (configLanguage === 'vi' || configLanguage === 'en')) {
                    setLanguageState(configLanguage);
                    localStorage.setItem('medix-language', configLanguage);
                }
            } catch {
            }
        };

        fetchDefaultLanguage();
        return () => {
            cancelled = true;
        };
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('medix-language', lang);
    };

    const t = (key: string, vars?: Record<string, string | number>): string => {
        const translations = getTranslations(language);
        let text = translations[key] ?? key;

        if (vars) {
            Object.entries(vars).forEach(([placeholder, value]) => {
                const pattern = new RegExp(`{{\\s*${placeholder}\\s*}}`, 'g');
                text = text.replace(pattern, String(value));
            });
        }

        return text;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

const getTranslations = (language: Language): Record<string, string> => {
    const translations: Record<'vi' | 'en', Record<string, string>> = {
      vi: {
            'header.search.placeholder': 'Chuyên khoa, triệu chứng, tên bác sĩ...',
            'header.login': 'Đăng nhập',
            'header.register': 'Đăng ký',
            'header.logout': 'Đăng xuất',
            'header.notifications': 'Thông báo',
            'header.register.patient': 'Đăng ký bệnh nhân',
            'header.register.doctor': 'Đăng ký bác sĩ',
            
            'nav.home': 'Trang chủ',
            'nav.ai-diagnosis': 'AI chẩn đoán',
            'nav.specialties': 'Chuyên khoa',
            'nav.doctors': 'Bác sĩ',
            'nav.health-articles': 'Bài viết sức khỏe',
            'nav.about': 'Về chúng tôi',
            
            'hero.title': 'CHĂM SÓC SỨC KHỎE TOÀN DIỆN',
            'hero.subtitle': 'TIÊU CHUẨN QUỐC TẾ',
            'hero.description': 'Đội ngũ giáo sư, bác sĩ đầu ngành – Công nghệ AI tiên tiến – Dịch vụ chăm sóc cá nhân hóa',
            'hero.ai-diagnosis': 'AI chẩn đoán',
            'hero.ai-diagnosis.desc': 'Tư vấn và giải đáp các vấn đề của bạn',
            'hero.appointment': 'Đặt lịch hẹn',
            'hero.appointment.desc': 'Đặt lịch hẹn nhanh chóng, tiện lợi',
            'hero.find-doctor': 'Tìm bác sĩ',
            'hero.find-doctor.desc': 'Tìm chuyên gia nhanh chóng',
            
            'about.heading': 'GIỚI THIỆU VỀ',
            'about.intro.title': 'Giới thiệu chung',
            'about.intro.text': '{{siteName}} là hệ thống y tế thông minh ứng dụng AI do đội ngũ chuyên gia công nghệ và y tế phát triển, với tầm nhìn trở thành nền tảng y tế số hàng đầu Việt Nam thông qua những đột phá công nghệ AI, nhằm mang lại chất lượng chẩn đoán xuất sắc và dịch vụ chăm sóc sức khỏe cá nhân hóa hoàn hảo.',
            'about.vision.title': 'Tầm nhìn',
            'about.vision.text': '{{siteName}} hướng đến mô hình y học thông minh, phục vụ người dân Việt Nam và Đông Nam Á thông qua nghiên cứu và phát triển công nghệ AI tiên tiến, mang lại chất lượng chẩn đoán xuất sắc và giải pháp chăm sóc sức khỏe dựa trên dữ liệu.',
            'about.mission.title': 'Sứ mệnh',
            'about.mission.prefix': 'Chăm sóc bằng',
            'about.mission.ai': 'Công nghệ AI',
            'about.mission.medical': 'Chuyên môn Y tế',
            'about.mission.empathy': 'Sự thấu cảm',
            'about.values.title': 'Giá trị cốt lõi - S.M.A.R.T',
            'about.values.smart.title': 'Smart - Thông minh',
            'about.values.smart.desc': 'Ứng dụng trí tuệ nhân tạo để cung cấp chẩn đoán chính xác và tư vấn y tế thông minh cho mọi người dân.',
            'about.values.medical.title': 'Medical - Y tế',
            'about.values.medical.desc': 'Đặt chất lượng y tế lên hàng đầu với đội ngũ bác sĩ chuyên khoa và công nghệ y tế tiên tiến.',
            'about.values.agile.title': 'Agile - Linh hoạt',
            'about.values.agile.desc': 'Phát triển nhanh chóng và thích ứng với nhu cầu thay đổi của ngành y tế và công nghệ.',
            'about.values.reliable.title': 'Reliable - Tin cậy',
            'about.values.reliable.desc': 'Cam kết bảo mật dữ liệu tuyệt đối và trở thành nền tảng y tế đáng tin cậy nhất cho cộng đồng.',
            'about.values.technology.title': 'Technology - Công nghệ',
            'about.values.technology.desc': 'Không ngừng đổi mới công nghệ để mang đến những giải pháp y tế tốt nhất và tiên tiến nhất.',
            'about.capabilities.title': 'Năng lực hệ thống',
            'about.capabilities.accuracy': 'Độ chính xác AI chẩn đoán',
            'about.capabilities.stat.users': 'Người dùng đã tin tưởng',
            'about.capabilities.stat.consultations': 'Lượt tư vấn AI',
            'about.capabilities.stat.doctors': 'Bác sĩ chuyên khoa',
            'about.capabilities.stat.specialties': 'Chuyên khoa y tế',
            'about.capabilities.stat.support': 'Hỗ trợ khách hàng',
            'about.capabilities.stat.uptime': 'Thời gian hoạt động',
            'about.technology.title': 'Công nghệ tiên tiến',
            'about.technology.diagnosis.title': 'AI Chẩn đoán',
            'about.technology.diagnosis.desc': 'Sử dụng Machine Learning và Deep Learning để phân tích triệu chứng và đưa ra chẩn đoán sơ bộ với độ chính xác cao.',
            'about.technology.mobile.title': 'Ứng dụng di động',
            'about.technology.mobile.desc': 'Nền tảng di động thông minh cho phép người dùng truy cập dịch vụ y tế mọi lúc mọi nơi.',
            'about.technology.security.title': 'Bảo mật dữ liệu',
            'about.technology.security.desc': 'Mã hóa AES-256 và blockchain đảm bảo an toàn tuyệt đối cho dữ liệu y tế cá nhân.',
            'about.technology.cloud.title': 'Điện toán đám mây',
            'about.technology.cloud.desc': 'Hạ tầng cloud hiện đại đảm bảo tốc độ xử lý nhanh và khả năng mở rộng linh hoạt.',
            'about.team.title': 'Đội ngũ chuyên gia',
            'about.team.doctors.title': 'Bác sĩ chuyên khoa',
            'about.team.doctors.desc': 'Hơn 1,000 bác sĩ từ các bệnh viện hàng đầu với kinh nghiệm lâm sàng và chuyên môn sâu.',
            'about.team.engineers.title': 'Kỹ sư AI',
            'about.team.engineers.desc': 'Đội ngũ kỹ sư AI từ các công ty công nghệ hàng đầu với kinh nghiệm phát triển hệ thống y tế.',
            'about.team.researchers.title': 'Nhà nghiên cứu',
            'about.team.researchers.desc': 'Các nhà nghiên cứu y học và công nghệ từ các trường đại học và viện nghiên cứu uy tín.',
            'about.contact.title': 'Liên hệ với chúng tôi',
            'about.contact.email': 'Email',
            'about.contact.hotline': 'Hotline',
            'about.contact.website': 'Website',
            'about.contact.address': 'Địa chỉ',

            'articleReader.sidebar.categories': 'Danh mục',
            'articleReader.sidebar.all': 'Tất cả',
            'articleReader.sidebar.viewMode': 'Chế độ xem',
            'articleReader.sidebar.view.grid': 'Lưới',
            'articleReader.sidebar.view.list': 'Danh sách',
            'articleReader.search.placeholder': 'Tìm bài viết sức khỏe...',
            'articleReader.search.clearAria': 'Xoá tìm kiếm',
            'articleReader.stats.total': '{{count}} bài viết',
            'articleReader.stats.filter': 'Đang lọc',
            'articleReader.featured.badge': 'Nổi bật',
            'articleReader.featured.readNow': 'Đọc ngay',
            'articleReader.section.latest': 'Bài viết mới nhất',
            'articleReader.section.count': '{{count}} bài viết',
            'articleReader.loading': 'Đang tải bài viết...',
            'articleReader.empty.title': 'Không tìm thấy bài viết',
            'articleReader.empty.description': 'Thử thay đổi từ khóa hoặc danh mục khác',
            'articleReader.card.preview': 'Xem chi tiết',
            'articleReader.card.readMore': 'Đọc thêm',
            'articleReader.readingTime': '{{minutes}} phút đọc',
            'articleReader.defaultTag': 'Sức khỏe',
            
            'why-choose.title': 'TẠI SAO NÊN CHỌN MEDIX?',
            'why-choose.expert.title': 'Chuyên gia hàng đầu',
            'why-choose.expert.desc': 'MEDIX quy tụ đội ngũ chuyên gia, bác sĩ, dược sĩ và điều dưỡng có trình độ chuyên môn cao, tay nghề giỏi, tận tâm và chuyên nghiệp. Luôn đặt người bệnh làm trung tâm, Medix cam kết đem đến dịch vụ chăm sóc sức khỏe tốt cho khách hàng.',
            'why-choose.quality.title': 'Chất lượng quốc tế',
            'why-choose.quality.desc': 'Hệ thống Y tế MEDIX được quản lý và vận hành dưới sự giám sát của những nhà quản lý y tế giàu kinh nghiệm, cùng với sự hỗ trợ của phương tiện kỹ thuật hiện đại, nhằm đảm bảo cung cấp dịch vụ chăm sóc sức khỏe toàn diện và hiệu quả.',
            'why-choose.research.title': 'Nghiên cứu & Đổi mới',
            'why-choose.research.desc': 'MEDIX liên tục thúc đẩy y học hàn lâm dựa trên nghiên cứu có phương pháp và sự phát triển y tế được chia sẻ từ quan hệ đối tác toàn cầu với các hệ thống chăm sóc sức khỏe hàng đầu thế giới nhằm cung cấp các phương pháp điều trị mang tính cách mạng và sáng tạo cho tiêu chuẩn chăm sóc bệnh nhân tốt nhất.',
            'why-choose.technology.title': 'Công nghệ tiên tiến',
            'why-choose.technology.desc': 'MEDIX cung cấp cơ sở vật chất hạng nhất và dịch vụ 5 sao bằng cách sử dụng các công nghệ tiên tiến được quản lý bởi các bác sĩ lâm sàng lành nghề để đảm bảo dịch vụ chăm sóc sức khỏe toàn diện và hiệu quả cao',
            
            'ai.badge': 'CÔNG NGHỆ AI',
            'ai.description': 'Hệ thống AI của chúng tôi có khả năng phân tích triệu chứng, đưa ra các tư vấn y tế ban đầu, hỗ trợ đặt lịch khám và theo dõi sức khỏe liên tục. Công nghệ AI giúp tối ưu hóa quy trình chăm sóc sức khỏe, tiết kiệm thời gian và nâng cao chất lượng dịch vụ.',
            'ai.accuracy': 'Tỉ lệ chuẩn xác của công cụ chẩn đoán AI MEDIX – được ghi nhận tính đến tháng 11 năm 2025',
            
            'steps.title': 'HƯỚNG DẪN SỬ DỤNG: 3 BƯỚC ĐƠN GIẢN',
            'steps.step1.title': 'Tra cứu triệu chứng với AI',
            'steps.step1.desc': 'Bạn chỉ cần nhập các triệu chứng đang gặp phải — hệ thống AI sẽ phân tích và đưa ra gợi ý ban đầu về tình trạng sức khỏe, giúp bạn hiểu rõ hơn trước khi gặp bác sĩ.',
            'steps.step2.title': 'Đăng ký tài khoản cá nhân',
            'steps.step2.desc': 'Việc tạo tài khoản giúp bạn lưu trữ lịch sử khám bệnh, thông tin cá nhân và dễ dàng quản lý các cuộc hẹn trong tương lai. Quá trình đăng ký nhanh chóng, bảo mật và hoàn toàn miễn phí.',
            'steps.step3.title': 'Đặt lịch hẹn với bác sĩ chuyên khoa',
            'steps.step3.desc': 'Sau khi có thông tin ban đầu, bạn có thể chọn bác sĩ phù hợp và đặt lịch khám trực tuyến ngay trên hệ thống. Lịch hẹn được xác nhận nhanh chóng, giúp bạn tiết kiệm thời gian và chủ động chăm sóc sức khỏe.',
            
            'doctors.title': 'ĐỘI NGŨ BÁC SĨ CỦA CHÚNG TÔI',
            'doctors.view-all': 'XEM TẤT CẢ',
            'doctors.specialty': 'Bác sĩ',
            'doctors.experience': 'năm kinh nghiệm',
            
            'knowledge.title': 'KIẾN THỨC SỨC KHỎE HỮU ÍCH',
            
            'common.years-experience': 'năm kinh nghiệm',
            'common.rating': 'Đánh giá',
            'common.and': 'và',
            
            'footer.about': 'Hệ thống y tế hàng đầu Việt Nam với tiêu chuẩn quốc tế',
            'footer.links.title': 'Về chúng tôi',
            'footer.links.home': 'Trang chủ',
            'footer.links.about': 'Về chúng tôi',
            'footer.links.doctors': 'Bác sĩ',
            'footer.links.healthArticles': 'Bài viết sức khỏe',
            'footer.services.title': 'Dịch vụ',
            'footer.services.packages': 'Gói khám sức khỏe',
            'footer.services.aiDiagnosis': 'AI chẩn đoán',
            'footer.services.booking': 'Đặt lịch hẹn',
            'footer.contact.title': 'Liên hệ',
            'footer.rights': 'Bảo lưu mọi quyền.',
            
            'hero.healthcare': 'Chăm sóc sức khỏe',
            'hero.doctor': 'Bác sĩ chuyên khoa',
            'hero.ai': 'AI chẩn đoán',
            'hero.booking': 'Đặt lịch online',
            
        },
        en: {
            'header.search.placeholder': 'Specialty, symptoms, doctor name...',
            'header.login': 'Login',
            'header.register': 'Register',
            'header.logout': 'Logout',
            'header.notifications': 'Notifications',
            'header.register.patient': 'Register as Patient',
            'header.register.doctor': 'Register as Doctor',
            
            'nav.home': 'Home',
            'nav.ai-diagnosis': 'AI Diagnosis',
            'nav.specialties': 'Specialties',
            'nav.doctors': 'Doctors',
            'nav.health-articles': 'Health Articles',
            'nav.about': 'About Us',
            
            'hero.title': 'COMPREHENSIVE HEALTHCARE',
            'hero.subtitle': 'INTERNATIONAL STANDARDS',
            'hero.description': 'Leading professors and doctors – Advanced AI technology – Personalized healthcare services',
            'hero.ai-diagnosis': 'AI Diagnosis',
            'hero.ai-diagnosis.desc': 'Consult and answer your health questions',
            'hero.appointment': 'Book Appointment',
            'hero.appointment.desc': 'Quick and convenient appointment booking',
            'hero.find-doctor': 'Find Doctor',
            'hero.find-doctor.desc': 'Find specialists quickly',
            
            'about.heading': 'ABOUT',
            'about.intro.title': 'Overview',
            'about.intro.text': '{{siteName}} is an AI-powered intelligent healthcare system developed by technology and medical experts, with the vision of becoming Vietnam’s leading digital healthcare platform through AI breakthroughs that deliver outstanding diagnostics and personalized care.',
            'about.vision.title': 'Vision',
            'about.vision.text': '{{siteName}} aims to build a smart healthcare model for Vietnam and Southeast Asia by advancing AI research to provide excellent diagnostics and data-driven care solutions.',
            'about.mission.title': 'Mission',
            'about.mission.prefix': 'Care powered by',
            'about.mission.ai': 'AI Technology',
            'about.mission.medical': 'Medical Expertise',
            'about.mission.empathy': 'Empathy',
            'about.values.title': 'Core Values - S.M.A.R.T',
            'about.values.smart.title': 'Smart',
            'about.values.smart.desc': 'Apply artificial intelligence to deliver accurate diagnoses and intelligent medical advice for everyone.',
            'about.values.medical.title': 'Medical',
            'about.values.medical.desc': 'Prioritize clinical quality with leading specialists and advanced medical technologies.',
            'about.values.agile.title': 'Agile',
            'about.values.agile.desc': 'Grow rapidly and adapt to the evolving needs of healthcare and technology.',
            'about.values.reliable.title': 'Reliable',
            'about.values.reliable.desc': 'Commit to absolute data security and become the most trusted healthcare platform.',
            'about.values.technology.title': 'Technology',
            'about.values.technology.desc': 'Continuously innovate to deliver the best and most advanced healthcare solutions.',
            'about.capabilities.title': 'Platform Capabilities',
            'about.capabilities.accuracy': 'AI diagnostic accuracy',
            'about.capabilities.stat.users': 'Trusted users',
            'about.capabilities.stat.consultations': 'AI consultations',
            'about.capabilities.stat.doctors': 'Specialist doctors',
            'about.capabilities.stat.specialties': 'Medical specialties',
            'about.capabilities.stat.support': 'Customer support',
            'about.capabilities.stat.uptime': 'System uptime',
            'about.technology.title': 'Advanced Technology',
            'about.technology.diagnosis.title': 'AI Diagnosis',
            'about.technology.diagnosis.desc': 'Use machine learning and deep learning to analyze symptoms and deliver highly accurate preliminary diagnoses.',
            'about.technology.mobile.title': 'Mobile Apps',
            'about.technology.mobile.desc': 'Smart mobile platform that lets users access healthcare services anytime, anywhere.',
            'about.technology.security.title': 'Data Security',
            'about.technology.security.desc': 'AES-256 encryption and blockchain guarantee maximum protection for personal medical data.',
            'about.technology.cloud.title': 'Cloud Computing',
            'about.technology.cloud.desc': 'Modern cloud infrastructure ensures fast performance and flexible scalability.',
            'about.team.title': 'Expert Team',
            'about.team.doctors.title': 'Specialist Doctors',
            'about.team.doctors.desc': 'Over 1,000 doctors from top hospitals with extensive clinical experience.',
            'about.team.engineers.title': 'AI Engineers',
            'about.team.engineers.desc': 'AI engineers from leading tech companies with experience building healthcare systems.',
            'about.team.researchers.title': 'Researchers',
            'about.team.researchers.desc': 'Medical and technology researchers from renowned universities and institutes.',
            'about.contact.title': 'Contact Us',
            'about.contact.email': 'Email',
            'about.contact.hotline': 'Hotline',
            'about.contact.website': 'Website',
            'about.contact.address': 'Address',

            'articleReader.sidebar.categories': 'Categories',
            'articleReader.sidebar.all': 'All',
            'articleReader.sidebar.viewMode': 'View mode',
            'articleReader.sidebar.view.grid': 'Grid',
            'articleReader.sidebar.view.list': 'List',
            'articleReader.search.placeholder': 'Search health articles...',
            'articleReader.search.clearAria': 'Clear search',
            'articleReader.stats.total': '{{count}} articles',
            'articleReader.stats.filter': 'Filter applied',
            'articleReader.featured.badge': 'Featured',
            'articleReader.featured.readNow': 'Read now',
            'articleReader.section.latest': 'Latest articles',
            'articleReader.section.count': '{{count}} articles',
            'articleReader.loading': 'Loading articles...',
            'articleReader.empty.title': 'No articles found',
            'articleReader.empty.description': 'Try another keyword or category',
            'articleReader.card.preview': 'View details',
            'articleReader.card.readMore': 'Read more',
            'articleReader.readingTime': '{{minutes}} min read',
            'articleReader.defaultTag': 'Health',
            
            'why-choose.title': 'WHY CHOOSE MEDIX?',
            'why-choose.expert.title': 'Leading Experts',
            'why-choose.expert.desc': 'MEDIX brings together a team of experts, doctors, pharmacists and nurses with high professional qualifications, excellent skills, dedication and professionalism. Always putting patients at the center, Medix is committed to providing the best healthcare services to customers.',
            'why-choose.quality.title': 'International Quality',
            'why-choose.quality.desc': 'The MEDIX Healthcare System is managed and operated under the supervision of experienced healthcare managers, along with the support of modern technical facilities, to ensure comprehensive and effective healthcare services.',
            'why-choose.research.title': 'Research & Innovation',
            'why-choose.research.desc': 'MEDIX continuously promotes academic medicine based on methodical research and medical development shared from global partnerships with leading healthcare systems worldwide to provide revolutionary and innovative treatment methods for the best patient care standards.',
            'why-choose.technology.title': 'Advanced Technology',
            'why-choose.technology.desc': 'MEDIX provides first-class facilities and 5-star services by using advanced technologies managed by skilled clinical doctors to ensure comprehensive and highly effective healthcare services',
            
            'ai.badge': 'AI TECHNOLOGY',
            'ai.description': 'Our AI system has the ability to analyze symptoms, provide initial medical advice, support appointment booking and continuous health monitoring. AI technology helps optimize healthcare processes, save time and improve service quality.',
            'ai.accuracy': 'Accuracy rate of MEDIX AI diagnostic tool – recorded as of November 2025',
            
            'steps.title': 'HOW TO USE: 3 SIMPLE STEPS',
            'steps.step1.title': 'Search symptoms with AI',
            'steps.step1.desc': 'You just need to enter the symptoms you are experiencing — the AI system will analyze and provide initial suggestions about your health condition, helping you understand better before seeing a doctor.',
            'steps.step2.title': 'Register personal account',
            'steps.step2.desc': 'Creating an account helps you store your medical history, personal information and easily manage future appointments. The registration process is quick, secure and completely free.',
            'steps.step3.title': 'Book appointment with specialist doctor',
            'steps.step3.desc': 'After having initial information, you can choose a suitable doctor and book an online appointment right on the system. Appointments are confirmed quickly, helping you save time and proactively take care of your health.',
            
            'doctors.title': 'OUR DOCTOR TEAM',
            'doctors.view-all': 'VIEW ALL',
            'doctors.specialty': 'Doctor',
            'doctors.experience': 'years of experience',
            
            'knowledge.title': 'USEFUL HEALTH KNOWLEDGE',
            
            'common.years-experience': 'years of experience',
            'common.rating': 'Rating',
            'common.and': 'and',

            'footer.about': "Vietnam's leading healthcare system with international standards.",
            'footer.links.title': 'About us',
            'footer.links.home': 'Home',
            'footer.links.about': 'About us',
            'footer.links.doctors': 'Doctors',
            'footer.links.healthArticles': 'Health Articles',
            'footer.services.title': 'Services',
            'footer.services.packages': 'Health Packages',
            'footer.services.aiDiagnosis': 'AI Diagnosis',
            'footer.services.booking': 'Book Appointment',
            'footer.contact.title': 'Contact',
            'footer.rights': 'All rights reserved.',

            'hero.healthcare': 'Healthcare',
            'hero.doctor': 'Specialist Doctor',
            'hero.ai': 'AI Diagnosis',
            'hero.booking': 'Book Online',

        }
    };

    return translations[language];
};
