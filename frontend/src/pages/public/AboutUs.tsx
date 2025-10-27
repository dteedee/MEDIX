import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/public/about.module.css';

const AboutUs: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={styles["about-container"]}>
      <div className={styles["about-content"]}>
        <div className={styles["breadcrumb"]}>
          <Link to="/">Trang chủ</Link> / <span>Về chúng tôi</span>
        </div>

        <div className={styles["about-header"]}>
          <h1>GIỚI THIỆU VỀ MEDIX</h1>
        </div>

        <div className={styles["about-body"]}>
          <section className={styles["intro-section"]}>
            <h2>Giới thiệu chung</h2>
            <p>
              MEDIX là hệ thống y tế thông minh ứng dụng AI do đội ngũ chuyên gia công nghệ và y tế 
              phát triển, với tầm nhìn trở thành một nền tảng y tế số hàng đầu Việt Nam thông qua 
              những đột phá công nghệ AI, nhằm mang lại chất lượng chẩn đoán xuất sắc và dịch vụ 
              chăm sóc sức khỏe cá nhân hóa hoàn hảo.
            </p>
          </section>

          <section className={styles["vision-section"]}>
            <h2>Tầm nhìn</h2>
            <p>
              MEDIX hướng đến mô hình y học thông minh, phục vụ người dân Việt Nam và khu vực Đông Nam Á, 
              thông qua nghiên cứu và phát triển công nghệ AI tiên tiến, nhằm mang lại chất lượng chẩn đoán 
              xuất sắc và giải pháp chăm sóc sức khỏe dựa trên dữ liệu và trí tuệ nhân tạo.
            </p>
          </section>

          <section className={styles["mission-section"]}>
            <h2>Sứ mệnh</h2>
            <p className={styles["mission-text"]}>
              Chăm sóc bằng <strong>Công nghệ AI</strong>, <strong>Chuyên môn Y tế</strong> và <strong>Sự thấu cảm</strong>.
            </p>
          </section>

          <section className={styles["values-section"]}>
            <h2>Giá trị cốt lõi - <strong>S.M.A.R.T</strong></h2>
            
            <div className={styles["values-grid"]}>
              <div className={styles["value-card"]}>
                <div className={styles["value-icon"]}>🧠</div>
                <h3>Smart - Thông minh</h3>
                <p>
                  Ứng dụng trí tuệ nhân tạo để cung cấp chẩn đoán chính xác và 
                  tư vấn y tế thông minh cho mọi người dân.
                </p>
              </div>

              <div className={styles["value-card"]}>
                <div className={styles["value-icon"]}>🎯</div>
                <h3>Medical - Y tế</h3>
                <p>
                  Đặt chất lượng y tế lên hàng đầu với đội ngũ bác sĩ chuyên khoa 
                  và công nghệ y tế tiên tiến nhất.
                </p>
              </div>

              <div className={styles["value-card"]}>
                <div className={styles["value-icon"]}>⚡</div>
                <h3>Agile - Linh hoạt</h3>
                <p>
                  Phát triển nhanh chóng và thích ứng với nhu cầu thay đổi của 
                  ngành y tế và công nghệ.
                </p>
              </div>

              <div className={styles["value-card"]}>
                <div className={styles["value-icon"]}>🔒</div>
                <h3>Reliable - Tin cậy</h3>
                <p>
                  Cam kết bảo mật dữ liệu tuyệt đối và trở thành nền tảng y tế 
                  đáng tin cậy nhất cho cộng đồng.
                </p>
              </div>

              <div className={styles["value-card"]}>
                <div className={styles["value-icon"]}>🚀</div>
                <h3>Technology - Công nghệ</h3>
                <p>
                  Không ngừng đổi mới công nghệ để mang đến những giải pháp 
                  y tế tốt nhất và tiên tiến nhất.
                </p>
              </div>
            </div>
          </section>

          <section className={styles["capabilities-section"]}>
            <h2>Năng lực Hệ thống</h2>
            
            <div className={styles["capability-highlight"]}>
              <div className={styles["capability-number"]}>95%</div>
              <div className={styles["capability-label"]}>Độ chính xác AI chẩn đoán</div>
            </div>

            <div className={styles["stats-grid"]}>
              <div className={styles["stat-item"]}>
                <div className={styles["stat-number"]}>50,000+</div>
                <div className={styles["stat-label"]}>Người dùng đã tin tưởng</div>
              </div>

              <div className={styles["stat-item"]}>
                <div className={styles["stat-number"]}>100,000+</div>
                <div className={styles["stat-label"]}>Lượt tư vấn AI</div>
              </div>

              <div className={styles["stat-item"]}>
                <div className={styles["stat-number"]}>1,000+</div>
                <div className={styles["stat-label"]}>Bác sĩ chuyên khoa</div>
              </div>

              <div className={styles["stat-item"]}>
                <div className={styles["stat-number"]}>500+</div>
                <div className={styles["stat-label"]}>Chuyên khoa y tế</div>
              </div>

              <div className={styles["stat-item"]}>
                <div className={styles["stat-number"]}>24/7</div>
                <div className={styles["stat-label"]}>Hỗ trợ khách hàng</div>
              </div>

              <div className={styles["stat-item"]}>
                <div className={styles["stat-number"]}>99.9%</div>
                <div className={styles["stat-label"]}>Thời gian hoạt động</div>
              </div>
            </div>
          </section>

          <section className={styles["technology-section"]}>
            <h2>Công nghệ tiên tiến</h2>
            
            <div className={styles["tech-grid"]}>
              <div className={styles["tech-card"]}>
                <div className={styles["tech-icon"]}>🤖</div>
                <h3>AI Chẩn đoán</h3>
                <p>
                  Sử dụng Machine Learning và Deep Learning để phân tích triệu chứng 
                  và đưa ra chẩn đoán sơ bộ với độ chính xác cao.
                </p>
              </div>

              <div className={styles["tech-card"]}>
                <div className={styles["tech-icon"]}>📱</div>
                <h3>Ứng dụng di động</h3>
                <p>
                  Nền tảng di động thông minh cho phép người dùng truy cập dịch vụ 
                  y tế mọi lúc mọi nơi.
                </p>
              </div>

              <div className={styles["tech-card"]}>
                <div className={styles["tech-icon"]}>🔐</div>
                <h3>Bảo mật dữ liệu</h3>
                <p>
                  Mã hóa AES-256 và blockchain để đảm bảo an toàn tuyệt đối 
                  cho dữ liệu y tế cá nhân.
                </p>
              </div>

              <div className={styles["tech-card"]}>
                <div className={styles["tech-icon"]}>☁️</div>
                <h3>Cloud Computing</h3>
                <p>
                  Hạ tầng cloud hiện đại đảm bảo tốc độ xử lý nhanh và 
                  khả năng mở rộng linh hoạt.
                </p>
              </div>
            </div>
          </section>

          <section className={styles["team-section"]}>
            <h2>Đội ngũ chuyên gia</h2>
            
            <div className={styles["team-grid"]}>
              <div className={styles["team-card"]}>
                <div className={styles["team-icon"]}>👨‍⚕️</div>
                <h3>Bác sĩ chuyên khoa</h3>
                <p>
                  Hơn 1,000 bác sĩ từ các bệnh viện hàng đầu với kinh nghiệm 
                  lâm sàng và chuyên môn sâu.
                </p>
              </div>

              <div className={styles["team-card"]}>
                <div className={styles["team-icon"]}>💻</div>
                <h3>Kỹ sư AI</h3>
                <p>
                  Đội ngũ kỹ sư AI từ các công ty công nghệ hàng đầu thế giới 
                  với kinh nghiệm phát triển hệ thống y tế.
                </p>
              </div>

              <div className={styles["team-card"]}>
                <div className={styles["team-icon"]}>🔬</div>
                <h3>Nhà nghiên cứu</h3>
                <p>
                  Các nhà nghiên cứu y học và công nghệ từ các trường đại học 
                  và viện nghiên cứu uy tín.
                </p>
              </div>
            </div>
          </section>

          <section className={styles["contact-section"]}>
            <h2>Liên hệ với chúng tôi</h2>
            
            <div className={styles["contact-info"]}>
              <div className={styles["contact-item"]}>
                <div className={styles["contact-icon"]}>📧</div>
                <div>
                  <h4>Email</h4>
                  <p>medix.sp@gmail.com</p>
                </div>
              </div>

              <div className={styles["contact-item"]}>
                <div className={styles["contact-icon"]}>📞</div>
                <div>
                  <h4>Hotline</h4>
                  <p>0969.995.633</p>
                </div>
              </div>

              <div className={styles["contact-item"]}>
                <div className={styles["contact-icon"]}>🌐</div>
                <div>
                  <h4>Website</h4>
                  <p>www.medix.com</p>
                </div>
              </div>

              <div className={styles["contact-item"]}>
                <div className={styles["contact-icon"]}>📍</div>
                <div>
                  <h4>Địa chỉ</h4>
                  <p>FPT University</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
