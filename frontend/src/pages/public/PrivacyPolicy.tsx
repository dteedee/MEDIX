import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/public/privacy.module.css';

const PrivacyPolicy: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={styles["privacy-container"]}>
      <div className={styles["privacy-content"]}>
        <div className={styles["breadcrumb"]}>
          <Link to="/">Trang chủ</Link> / <span>Chính sách bảo mật</span>
        </div>

        <div className={styles["privacy-header"]}>
          <h1>Chính sách bảo vệ dữ liệu cá nhân của Hệ thống Y tế Thông minh MEDIX</h1>
          <p className={styles["update-date"]}>Ngày cập nhật: 12-10-2025</p>
        </div>

        <div className={styles["privacy-body"]}>
          <p>
            Chính Sách Bảo Vệ Dữ Liệu Cá Nhân này mô tả cách thức thu thập, sử dụng và xử lý dữ liệu cá nhân 
            phát sinh trong quá trình hoạt động, kinh doanh của Hệ thống Y tế Thông minh MEDIX (sau đây gọi là "Hệ thống"), 
            có địa chỉ tại Việt Nam và trang thông tin điện tử chính thức là https://medix.com.
          </p>

          <section className={styles["section"]}>
            <h2>ĐIỀU 1. QUY ĐỊNH CHUNG</h2>
            
            <div className={styles["subsection"]}>
              <h3>1.1. Dữ Liệu Cá Nhân:</h3>
              <p>
                là thông tin dưới dạng ký hiệu, chữ viết, chữ số, hình ảnh, âm thanh hoặc dạng tương tự trên môi trường điện tử 
                gắn liền với con người cụ thể hoặc giúp xác định con người cụ thể. Dữ Liệu Cá Nhân bao gồm Dữ Liệu Cá Nhân cơ bản 
                và Dữ Liệu Cá Nhân nhạy cảm.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>1.2. Chủ Thể Dữ Liệu Cá Nhân:</h3>
              <p>
                là cá nhân được Dữ Liệu Cá Nhân phản ánh, bao gồm tất cả các bệnh nhân, bác sĩ đang sử dụng sản phẩm, 
                dịch vụ của Hệ thống, nhân viên của Hệ thống và/hoặc các cá nhân khác có phát sinh quan hệ pháp lý với Hệ thống.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>1.3. Xử Lý Dữ Liệu Cá Nhân:</h3>
              <p>
                là một hoặc nhiều hoạt động tác động tới Dữ Liệu Cá Nhân, như: thu thập, ghi, phân tích, xác nhận, 
                lưu trữ, chỉnh sửa, công khai, kết hợp, truy cập, truy xuất, thu hồi, mã hóa, giải mã, sao chép, chia sẻ, 
                truyền đưa, cung cấp, chuyển giao, xóa, hủy Dữ Liệu Cá Nhân hoặc các hành động khác có liên quan.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>1.4. Chính Sách Bảo Vệ Dữ Liệu Cá Nhân:</h3>
              <p>
                là toàn bộ nội dung của chính sách do Hệ thống MEDIX soạn thảo và ban hành, bao gồm các điều khoản một cách 
                đầy đủ và toàn vẹn, được áp dụng tại Hệ thống và các địa điểm kinh doanh của Hệ thống.
              </p>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 2. MỤC ĐÍCH THU THẬP DỮ LIỆU CÁ NHÂN</h2>
            
            <div className={styles["subsection"]}>
              <h3>2.1. Mục đích chính:</h3>
              <ul>
                <li>Cung cấp dịch vụ y tế trực tuyến và AI chẩn đoán</li>
                <li>Quản lý hồ sơ bệnh án điện tử (EMR)</li>
                <li>Đặt lịch khám và tư vấn với bác sĩ</li>
                <li>Gửi thông báo và nhắc nhở về lịch khám</li>
                <li>Cải thiện chất lượng dịch vụ y tế</li>
                <li>Tuân thủ các quy định pháp luật về y tế</li>
              </ul>
            </div>

            <div className={styles["subsection"]}>
              <h3>2.2. Mục đích phụ:</h3>
              <ul>
                <li>Nghiên cứu và phát triển công nghệ AI trong y tế</li>
                <li>Thống kê và báo cáo dịch vụ</li>
                <li>Marketing và quảng bá dịch vụ (với sự đồng ý)</li>
              </ul>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 3. CÁC LOẠI DỮ LIỆU CÁ NHÂN ĐƯỢC THU THẬP</h2>
            
            <div className={styles["subsection"]}>
              <h3>3.1. Dữ liệu cá nhân cơ bản:</h3>
              <ul>
                <li>Họ và tên, ngày sinh, giới tính</li>
                <li>Số điện thoại, địa chỉ email</li>
                <li>Địa chỉ thường trú và tạm trú</li>
                <li>Số CCCD/CMND, số bảo hiểm y tế</li>
                <li>Thông tin nghề nghiệp</li>
              </ul>
            </div>

            <div className={styles["subsection"]}>
              <h3>3.2. Dữ liệu cá nhân nhạy cảm:</h3>
              <ul>
                <li>Thông tin sức khỏe và bệnh án</li>
                <li>Kết quả xét nghiệm và chẩn đoán</li>
                <li>Hình ảnh y tế (X-quang, CT, MRI)</li>
                <li>Tiền sử bệnh lý và dị ứng</li>
                <li>Thông tin di truyền (nếu có)</li>
              </ul>
            </div>

            <div className={styles["subsection"]}>
              <h3>3.3. Dữ liệu kỹ thuật:</h3>
              <ul>
                <li>Địa chỉ IP, cookie, thiết bị truy cập</li>
                <li>Lịch sử truy cập và sử dụng dịch vụ</li>
                <li>Dữ liệu định vị (nếu được cấp quyền)</li>
              </ul>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 4. PHƯƠNG THỨC THU THẬP DỮ LIỆU</h2>
            
            <div className={styles["subsection"]}>
              <h3>4.1. Thu thập trực tiếp:</h3>
              <ul>
                <li>Thông qua form đăng ký tài khoản</li>
                <li>Khi đặt lịch khám và sử dụng dịch vụ</li>
                <li>Qua cuộc gọi tư vấn và hỗ trợ khách hàng</li>
                <li>Thông qua ứng dụng di động MEDIX</li>
              </ul>
            </div>

            <div className={styles["subsection"]}>
              <h3>4.2. Thu thập gián tiếp:</h3>
              <ul>
                <li>Từ các đối tác y tế hợp tác</li>
                <li>Thông qua công nghệ AI phân tích</li>
                <li>Từ các thiết bị y tế kết nối</li>
              </ul>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 5. QUYỀN CỦA CHỦ THỂ DỮ LIỆU CÁ NHÂN</h2>
            
            <div className={styles["subsection"]}>
              <h3>5.1. Quyền được thông tin:</h3>
              <p>
                Chủ thể dữ liệu có quyền được thông báo về việc thu thập, sử dụng dữ liệu cá nhân của mình.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>5.2. Quyền truy cập:</h3>
              <p>
                Chủ thể dữ liệu có quyền truy cập, xem dữ liệu cá nhân của mình được lưu trữ trong hệ thống.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>5.3. Quyền chỉnh sửa:</h3>
              <p>
                Chủ thể dữ liệu có quyền yêu cầu chỉnh sửa, cập nhật dữ liệu cá nhân không chính xác.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>5.4. Quyền xóa:</h3>
              <p>
                Chủ thể dữ liệu có quyền yêu cầu xóa dữ liệu cá nhân trong các trường hợp nhất định.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>5.5. Quyền rút lại đồng ý:</h3>
              <p>
                Chủ thể dữ liệu có quyền rút lại đồng ý xử lý dữ liệu cá nhân bất cứ lúc nào.
              </p>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 6. BIỆN PHÁP BẢO VỆ DỮ LIỆU CÁ NHÂN</h2>
            
            <div className={styles["subsection"]}>
              <h3>6.1. Biện pháp kỹ thuật:</h3>
              <ul>
                <li>Mã hóa dữ liệu với chuẩn AES-256</li>
                <li>Xác thực đa yếu tố (2FA/MFA)</li>
                <li>Firewall và hệ thống phát hiện xâm nhập</li>
                <li>Backup và khôi phục dữ liệu định kỳ</li>
                <li>Giám sát và audit log hệ thống</li>
              </ul>
            </div>

            <div className={styles["subsection"]}>
              <h3>6.2. Biện pháp quản lý:</h3>
              <ul>
                <li>Đào tạo nhân viên về bảo mật thông tin</li>
                <li>Phân quyền truy cập theo nguyên tắc "cần biết"</li>
                <li>Ký thỏa thuận bảo mật với nhân viên</li>
                <li>Kiểm tra và đánh giá định kỳ</li>
              </ul>
            </div>

            <div className={styles["subsection"]}>
              <h3>6.3. Biện pháp vật lý:</h3>
              <ul>
                <li>Bảo vệ vật lý các trung tâm dữ liệu</li>
                <li>Kiểm soát ra vào nghiêm ngặt</li>
                <li>Giám sát camera 24/7</li>
              </ul>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 7. CHIA SẺ DỮ LIỆU CÁ NHÂN</h2>
            
            <div className={styles["subsection"]}>
              <h3>7.1. Chia sẻ với bác sĩ:</h3>
              <p>
                Dữ liệu sức khỏe của bệnh nhân chỉ được chia sẻ với bác sĩ được chỉ định và có quyền truy cập 
                trong phạm vi điều trị.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>7.2. Chia sẻ với cơ quan nhà nước:</h3>
              <p>
                Chỉ chia sẻ khi có yêu cầu chính thức từ cơ quan có thẩm quyền theo quy định pháp luật.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>7.3. Chia sẻ với đối tác:</h3>
              <p>
                Chỉ chia sẻ với các đối tác y tế đáng tin cậy và có thỏa thuận bảo mật nghiêm ngặt.
              </p>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 8. THỜI GIAN LƯU TRỮ DỮ LIỆU</h2>
            
            <div className={styles["subsection"]}>
              <h3>8.1. Dữ liệu hồ sơ bệnh án:</h3>
              <p>
                Được lưu trữ tối thiểu 15 năm kể từ lần khám cuối cùng theo quy định của Bộ Y tế.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>8.2. Dữ liệu tài khoản:</h3>
              <p>
                Được lưu trữ cho đến khi người dùng yêu cầu xóa tài khoản.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>8.3. Dữ liệu log hệ thống:</h3>
              <p>
                Được lưu trữ tối thiểu 2 năm để phục vụ mục đích bảo mật và audit.
              </p>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 9. CHUYỂN GIAO DỮ LIỆU RA NƯỚC NGOÀI</h2>
            
            <div className={styles["subsection"]}>
              <h3>9.1. Nguyên tắc:</h3>
              <p>
                MEDIX cam kết tuân thủ nghiêm ngặt các quy định về chuyển giao dữ liệu cá nhân ra nước ngoài 
                theo Luật An toàn thông tin mạng và các văn bản pháp luật liên quan.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>9.2. Điều kiện:</h3>
              <ul>
                <li>Có sự đồng ý rõ ràng của chủ thể dữ liệu</li>
                <li>Quốc gia nhận dữ liệu có mức độ bảo vệ tương đương</li>
                <li>Có thỏa thuận bảo vệ dữ liệu với bên nhận</li>
                <li>Được cơ quan có thẩm quyền phê duyệt</li>
              </ul>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 10. XỬ LÝ VI PHẠM VÀ BỒI THƯỜNG</h2>
            
            <div className={styles["subsection"]}>
              <h3>10.1. Cam kết:</h3>
              <p>
                MEDIX cam kết xử lý nghiêm túc mọi vi phạm về bảo vệ dữ liệu cá nhân và có trách nhiệm bồi thường 
                thiệt hại theo quy định pháp luật.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>10.2. Quy trình xử lý:</h3>
              <ul>
                <li>Tiếp nhận và xác minh thông tin vi phạm</li>
                <li>Điều tra và đánh giá mức độ thiệt hại</li>
                <li>Thực hiện các biện pháp khắc phục</li>
                <li>Báo cáo với cơ quan có thẩm quyền</li>
                <li>Bồi thường thiệt hại cho người bị ảnh hưởng</li>
              </ul>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 11. LIÊN HỆ VÀ KHIẾU NẠI</h2>
            
            <div className={styles["subsection"]}>
              <h3>11.1. Thông tin liên hệ:</h3>
              <p>
                Nếu có bất kỳ câu hỏi nào về bảo vệ dữ liệu cá nhân của Hệ thống MEDIX, vui lòng liên hệ với chúng tôi:
              </p>
              
              <div className={styles["contact-info"]}>
                <p><strong>Hệ thống Y tế Thông minh MEDIX</strong></p>
                <p>Email: privacy@medix.com</p>
                <p>Hotline: 1900-MEDIX (1900-63349)</p>
                <p>Địa chỉ: Việt Nam</p>
              </div>
            </div>

            <div className={styles["subsection"]}>
              <h3>11.2. Quyền khiếu nại:</h3>
              <p>
                Chủ thể dữ liệu có quyền khiếu nại với cơ quan có thẩm quyền nếu cho rằng quyền và lợi ích hợp pháp 
                của mình bị xâm phạm.
              </p>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 12. HIỆU LỰC VÀ CẬP NHẬT</h2>
            
            <div className={styles["subsection"]}>
              <h3>12.1. Hiệu lực:</h3>
              <p>
                Chính sách này có hiệu lực từ ngày 12/10/2025 và được áp dụng cho tất cả các dịch vụ của Hệ thống MEDIX.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>12.2. Cập nhật:</h3>
              <p>
                MEDIX có quyền cập nhật Chính sách này để phù hợp với các thay đổi về pháp luật và hoạt động kinh doanh. 
                Mọi thay đổi sẽ được thông báo trước ít nhất 30 ngày.
              </p>
            </div>
          </section>

          <div className={styles["footer-note"]}>
            <p>
              <strong>Lưu ý:</strong> Chính sách này được xây dựng dựa trên các quy định của Luật An toàn thông tin mạng, 
              Luật Bảo vệ dữ liệu cá nhân và các văn bản pháp luật liên quan của Việt Nam.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
