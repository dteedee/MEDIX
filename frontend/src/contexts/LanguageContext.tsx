import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'vi' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('vi');

    // Load language from localStorage on mount
    useEffect(() => {
        const savedLanguage = localStorage.getItem('medix-language') as Language;
        if (savedLanguage && (savedLanguage === 'vi' || savedLanguage === 'en')) {
            setLanguageState(savedLanguage);
        }
    }, []);

    // Save language to localStorage when it changes
    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('medix-language', lang);
    };

    // Translation function
    const t = (key: string): string => {
        const translations = getTranslations(language);
        return translations[key] || key;
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

// Translation data
const getTranslations = (language: Language): Record<string, string> => {
    const translations: Record<'vi' | 'en', Record<string, string>> = {
      vi: {
            // Header
            'header.search.placeholder': 'Chuyên khoa, triệu chứng, tên bác sĩ...',
            'header.login': 'Đăng nhập',
            'header.register': 'Đăng ký',
            'header.logout': 'Đăng xuất',
            'header.notifications': 'Thông báo',
            'header.register.patient': 'Đăng ký bệnh nhân',
            'header.register.doctor': 'Đăng ký bác sĩ',
            
            // Navigation
            'nav.home': 'Trang chủ',
            'nav.ai-diagnosis': 'AI chẩn đoán',
            'nav.specialties': 'Chuyên khoa',
            'nav.doctors': 'Bác sĩ',
            'nav.health-articles': 'Bài viết sức khỏe',
            'nav.about': 'Về chúng tôi',
            
            // Hero Section
            'hero.title': 'CHĂM SÓC SỨC KHỎE TOÀN DIỆN',
            'hero.subtitle': 'TIÊU CHUẨN QUỐC TẾ',
            'hero.description': 'Đội ngũ giáo sư, bác sĩ đầu ngành – Công nghệ AI tiên tiến – Dịch vụ chăm sóc cá nhân hóa',
            'hero.ai-diagnosis': 'AI chẩn đoán',
            'hero.ai-diagnosis.desc': 'Tư vấn và giải đáp các vấn đề của bạn',
            'hero.appointment': 'Đặt lịch hẹn',
            'hero.appointment.desc': 'Đặt lịch hẹn nhanh chóng, tiện lợi',
            'hero.find-doctor': 'Tìm bác sĩ',
            'hero.find-doctor.desc': 'Tìm chuyên gia nhanh chóng',
            
            // Why Choose Section
            'why-choose.title': 'TẠI SAO NÊN CHỌN MEDIX?',
            'why-choose.expert.title': 'Chuyên gia hàng đầu',
            'why-choose.expert.desc': 'MEDIX quy tụ đội ngũ chuyên gia, bác sĩ, dược sĩ và điều dưỡng có trình độ chuyên môn cao, tay nghề giỏi, tận tâm và chuyên nghiệp. Luôn đặt người bệnh làm trung tâm, Medix cam kết đem đến dịch vụ chăm sóc sức khỏe tốt cho khách hàng.',
            'why-choose.quality.title': 'Chất lượng quốc tế',
            'why-choose.quality.desc': 'Hệ thống Y tế MEDIX được quản lý và vận hành dưới sự giám sát của những nhà quản lý y tế giàu kinh nghiệm, cùng với sự hỗ trợ của phương tiện kỹ thuật hiện đại, nhằm đảm bảo cung cấp dịch vụ chăm sóc sức khỏe toàn diện và hiệu quả.',
            'why-choose.research.title': 'Nghiên cứu & Đổi mới',
            'why-choose.research.desc': 'MEDIX liên tục thúc đẩy y học hàn lâm dựa trên nghiên cứu có phương pháp và sự phát triển y tế được chia sẻ từ quan hệ đối tác toàn cầu với các hệ thống chăm sóc sức khỏe hàng đầu thế giới nhằm cung cấp các phương pháp điều trị mang tính cách mạng và sáng tạo cho tiêu chuẩn chăm sóc bệnh nhân tốt nhất.',
            'why-choose.technology.title': 'Công nghệ tiên tiến',
            'why-choose.technology.desc': 'MEDIX cung cấp cơ sở vật chất hạng nhất và dịch vụ 5 sao bằng cách sử dụng các công nghệ tiên tiến được quản lý bởi các bác sĩ lâm sàng lành nghề để đảm bảo dịch vụ chăm sóc sức khỏe toàn diện và hiệu quả cao',
            
            // AI Section
            'ai.badge': 'CÔNG NGHỆ AI',
            'ai.description': 'Hệ thống AI của chúng tôi có khả năng phân tích triệu chứng, đưa ra các tư vấn y tế ban đầu, hỗ trợ đặt lịch khám và theo dõi sức khỏe liên tục. Công nghệ AI giúp tối ưu hóa quy trình chăm sóc sức khỏe, tiết kiệm thời gian và nâng cao chất lượng dịch vụ.',
            'ai.accuracy': 'Tỉ lệ chuẩn xác của công cụ chẩn đoán AI MEDIX – được ghi nhận tính đến tháng 11 năm 2025',
            
            // Steps Section
            'steps.title': 'HƯỚNG DẪN SỬ DỤNG: 3 BƯỚC ĐƠN GIẢN',
            'steps.step1.title': 'Tra cứu triệu chứng với AI',
            'steps.step1.desc': 'Bạn chỉ cần nhập các triệu chứng đang gặp phải — hệ thống AI sẽ phân tích và đưa ra gợi ý ban đầu về tình trạng sức khỏe, giúp bạn hiểu rõ hơn trước khi gặp bác sĩ.',
            'steps.step2.title': 'Đăng ký tài khoản cá nhân',
            'steps.step2.desc': 'Việc tạo tài khoản giúp bạn lưu trữ lịch sử khám bệnh, thông tin cá nhân và dễ dàng quản lý các cuộc hẹn trong tương lai. Quá trình đăng ký nhanh chóng, bảo mật và hoàn toàn miễn phí.',
            'steps.step3.title': 'Đặt lịch hẹn với bác sĩ chuyên khoa',
            'steps.step3.desc': 'Sau khi có thông tin ban đầu, bạn có thể chọn bác sĩ phù hợp và đặt lịch khám trực tuyến ngay trên hệ thống. Lịch hẹn được xác nhận nhanh chóng, giúp bạn tiết kiệm thời gian và chủ động chăm sóc sức khỏe.',
            
            // Doctors Section
            'doctors.title': 'ĐỘI NGŨ BÁC SĨ CỦA CHÚNG TÔI',
            'doctors.view-all': 'XEM TẤT CẢ',
            'doctors.specialty': 'Bác sĩ',
            'doctors.experience': 'năm kinh nghiệm',
            
            // Knowledge Section
            'knowledge.title': 'KIẾN THỨC SỨC KHỎE HỮU ÍCH',
            
            // Common
            'common.years-experience': 'năm kinh nghiệm',
            'common.rating': 'Đánh giá',
            
            // Footer
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
            
            // Hero Floating Elements
            'hero.healthcare': 'Chăm sóc sức khỏe',
            'hero.doctor': 'Bác sĩ chuyên khoa',
            'hero.ai': 'AI chẩn đoán',
            'hero.booking': 'Đặt lịch online',
            
        },
        en: {
            // Header
            'header.search.placeholder': 'Specialty, symptoms, doctor name...',
            'header.login': 'Login',
            'header.register': 'Register',
            'header.logout': 'Logout',
            'header.notifications': 'Notifications',
            'header.register.patient': 'Register as Patient',
            'header.register.doctor': 'Register as Doctor',
            
            // Navigation
            'nav.home': 'Home',
            'nav.ai-diagnosis': 'AI Diagnosis',
            'nav.specialties': 'Specialties',
            'nav.doctors': 'Doctors',
            'nav.health-articles': 'Health Articles',
            'nav.about': 'About Us',
            
            // Hero Section
            'hero.title': 'COMPREHENSIVE HEALTHCARE',
            'hero.subtitle': 'INTERNATIONAL STANDARDS',
            'hero.description': 'Leading professors and doctors – Advanced AI technology – Personalized healthcare services',
            'hero.ai-diagnosis': 'AI Diagnosis',
            'hero.ai-diagnosis.desc': 'Consult and answer your health questions',
            'hero.appointment': 'Book Appointment',
            'hero.appointment.desc': 'Quick and convenient appointment booking',
            'hero.find-doctor': 'Find Doctor',
            'hero.find-doctor.desc': 'Find specialists quickly',
            
            // Why Choose Section
            'why-choose.title': 'WHY CHOOSE MEDIX?',
            'why-choose.expert.title': 'Leading Experts',
            'why-choose.expert.desc': 'MEDIX brings together a team of experts, doctors, pharmacists and nurses with high professional qualifications, excellent skills, dedication and professionalism. Always putting patients at the center, Medix is committed to providing the best healthcare services to customers.',
            'why-choose.quality.title': 'International Quality',
            'why-choose.quality.desc': 'The MEDIX Healthcare System is managed and operated under the supervision of experienced healthcare managers, along with the support of modern technical facilities, to ensure comprehensive and effective healthcare services.',
            'why-choose.research.title': 'Research & Innovation',
            'why-choose.research.desc': 'MEDIX continuously promotes academic medicine based on methodical research and medical development shared from global partnerships with leading healthcare systems worldwide to provide revolutionary and innovative treatment methods for the best patient care standards.',
            'why-choose.technology.title': 'Advanced Technology',
            'why-choose.technology.desc': 'MEDIX provides first-class facilities and 5-star services by using advanced technologies managed by skilled clinical doctors to ensure comprehensive and highly effective healthcare services',
            
            // AI Section
            'ai.badge': 'AI TECHNOLOGY',
            'ai.description': 'Our AI system has the ability to analyze symptoms, provide initial medical advice, support appointment booking and continuous health monitoring. AI technology helps optimize healthcare processes, save time and improve service quality.',
            'ai.accuracy': 'Accuracy rate of MEDIX AI diagnostic tool – recorded as of November 2025',
            
            // Steps Section
            'steps.title': 'HOW TO USE: 3 SIMPLE STEPS',
            'steps.step1.title': 'Search symptoms with AI',
            'steps.step1.desc': 'You just need to enter the symptoms you are experiencing — the AI system will analyze and provide initial suggestions about your health condition, helping you understand better before seeing a doctor.',
            'steps.step2.title': 'Register personal account',
            'steps.step2.desc': 'Creating an account helps you store your medical history, personal information and easily manage future appointments. The registration process is quick, secure and completely free.',
            'steps.step3.title': 'Book appointment with specialist doctor',
            'steps.step3.desc': 'After having initial information, you can choose a suitable doctor and book an online appointment right on the system. Appointments are confirmed quickly, helping you save time and proactively take care of your health.',
            
            // Doctors Section
            'doctors.title': 'OUR DOCTOR TEAM',
            'doctors.view-all': 'VIEW ALL',
            'doctors.specialty': 'Doctor',
            'doctors.experience': 'years of experience',
            
            // Knowledge Section
            'knowledge.title': 'USEFUL HEALTH KNOWLEDGE',
            
            // Common
            'common.years-experience': 'years of experience',
            'common.rating': 'Rating',

            // Footer
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

            // Hero Floating Elements
            'hero.healthcare': 'Healthcare',
            'hero.doctor': 'Specialist Doctor',
            'hero.ai': 'AI Diagnosis',
            'hero.booking': 'Book Online',

        }
    };

    return translations[language];
};
