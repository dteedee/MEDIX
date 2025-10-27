import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/public/privacy.module.css';

const TermsOfService: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={styles["privacy-container"]}>
      <div className={styles["privacy-content"]}>
        <div className={styles["breadcrumb"]}>
          <Link to="/">Trang chủ</Link> / <span>Điều khoản dịch vụ</span>
        </div>

        <div className={styles["privacy-header"]}>
          <h1>Điều khoản dịch vụ của Hệ thống Y tế Thông minh MEDIX</h1>
          <p className={styles["update-date"]}>Ngày cập nhật: 12-10-2025</p>
        </div>

        <div className={styles["privacy-body"]}>
          <p>
            Điều khoản dịch vụ này quy định các điều kiện sử dụng dịch vụ của Hệ thống Y tế Thông minh MEDIX 
            (sau đây gọi là "MEDIX" hoặc "Chúng tôi"). Bằng việc sử dụng dịch vụ của MEDIX, bạn đồng ý tuân thủ 
            các điều khoản và điều kiện được nêu trong tài liệu này.
          </p>

          <section className={styles["section"]}>
            <h2>ĐIỀU 1. ĐỊNH NGHĨA</h2>
            
            <div className={styles["subsection"]}>
              <h3>1.1. Các thuật ngữ:</h3>
              <ul>
                <li><strong>"MEDIX"</strong>: Hệ thống Y tế Thông minh ứng dụng AI</li>
                <li><strong>"Người dùng"</strong>: Bệnh nhân, bác sĩ và các cá nhân sử dụng dịch vụ</li>
                <li><strong>"Dịch vụ"</strong>: Các dịch vụ y tế trực tuyến do MEDIX cung cấp</li>
                <li><strong>"Nội dung"</strong>: Thông tin, dữ liệu, hình ảnh trên nền tảng MEDIX</li>
                <li><strong>"Tài khoản"</strong>: Tài khoản đăng ký để sử dụng dịch vụ</li>
              </ul>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 2. CHẤP NHẬN ĐIỀU KHOẢN</h2>
            
            <div className={styles["subsection"]}>
              <h3>2.1. Đồng ý:</h3>
              <p>
                Bằng việc truy cập và sử dụng dịch vụ của MEDIX, bạn xác nhận rằng đã đọc, hiểu và đồng ý 
                tuân thủ các điều khoản này. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng không sử dụng dịch vụ.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>2.2. Năng lực pháp lý:</h3>
              <p>
                Bạn phải đủ 18 tuổi hoặc có sự đồng ý của người giám hộ hợp pháp để sử dụng dịch vụ của MEDIX.
              </p>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 3. MÔ TẢ DỊCH VỤ</h2>
            
            <div className={styles["subsection"]}>
              <h3>3.1. Dịch vụ chính:</h3>
              <ul>
                <li>AI chẩn đoán và tư vấn sức khỏe</li>
                <li>Đặt lịch khám với bác sĩ chuyên khoa</li>
                <li>Quản lý hồ sơ bệnh án điện tử (EMR)</li>
                <li>Tư vấn y tế trực tuyến</li>
                <li>Nhắc nhở lịch khám và uống thuốc</li>
                <li>Chia sẻ thông tin y tế với bác sĩ</li>
              </ul>
            </div>

            <div className={styles["subsection"]}>
              <h3>3.2. Giới hạn dịch vụ:</h3>
              <p>
                MEDIX không thay thế hoàn toàn việc khám bệnh trực tiếp tại cơ sở y tế. 
                Dịch vụ chỉ mang tính chất hỗ trợ và tư vấn.
              </p>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 4. ĐĂNG KÝ TÀI KHOẢN</h2>
            
            <div className={styles["subsection"]}>
              <h3>4.1. Yêu cầu đăng ký:</h3>
              <ul>
                <li>Cung cấp thông tin chính xác và đầy đủ</li>
                <li>Xác thực email và số điện thoại</li>
                <li>Tạo mật khẩu mạnh và bảo mật</li>
                <li>Đồng ý với điều khoản dịch vụ và chính sách bảo mật</li>
              </ul>
            </div>

            <div className={styles["subsection"]}>
              <h3>4.2. Trách nhiệm tài khoản:</h3>
              <p>
                Bạn có trách nhiệm bảo mật thông tin đăng nhập và chịu trách nhiệm cho mọi hoạt động 
                diễn ra trên tài khoản của mình.
              </p>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 5. QUYỀN VÀ NGHĨA VỤ CỦA NGƯỜI DÙNG</h2>
            
            <div className={styles["subsection"]}>
              <h3>5.1. Quyền của người dùng:</h3>
              <ul>
                <li>Sử dụng dịch vụ theo đúng mục đích</li>
                <li>Được bảo vệ thông tin cá nhân</li>
                <li>Khiếu nại về chất lượng dịch vụ</li>
                <li>Hủy tài khoản bất cứ lúc nào</li>
                <li>Yêu cầu hỗ trợ kỹ thuật</li>
              </ul>
            </div>

            <div className={styles["subsection"]}>
              <h3>5.2. Nghĩa vụ của người dùng:</h3>
              <ul>
                <li>Cung cấp thông tin chính xác và cập nhật</li>
                <li>Tuân thủ các quy định pháp luật</li>
                <li>Không sử dụng dịch vụ cho mục đích bất hợp pháp</li>
                <li>Không chia sẻ tài khoản với người khác</li>
                <li>Báo cáo các hoạt động đáng ngờ</li>
              </ul>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 6. QUYỀN VÀ NGHĨA VỤ CỦA MEDIX</h2>
            
            <div className={styles["subsection"]}>
              <h3>6.1. Quyền của MEDIX:</h3>
              <ul>
                <li>Từ chối dịch vụ cho người dùng vi phạm</li>
                <li>Thay đổi, cập nhật dịch vụ</li>
                <li>Thu thập và sử dụng dữ liệu theo chính sách</li>
                <li>Bảo vệ quyền sở hữu trí tuệ</li>
                <li>Chấm dứt dịch vụ trong trường hợp cần thiết</li>
              </ul>
            </div>

            <div className={styles["subsection"]}>
              <h3>6.2. Nghĩa vụ của MEDIX:</h3>
              <ul>
                <li>Cung cấp dịch vụ với chất lượng tốt nhất</li>
                <li>Bảo vệ thông tin cá nhân người dùng</li>
                <li>Hỗ trợ kỹ thuật 24/7</li>
                <li>Tuân thủ các quy định pháp luật</li>
                <li>Bồi thường thiệt hại do lỗi hệ thống</li>
              </ul>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 7. THANH TOÁN VÀ HOÀN TIỀN</h2>
            
            <div className={styles["subsection"]}>
              <h3>7.1. Phương thức thanh toán:</h3>
              <ul>
                <li>Thẻ tín dụng/ghi nợ</li>
                <li>Ví điện tử (MoMo, ZaloPay, VNPay)</li>
                <li>Chuyển khoản ngân hàng</li>
                <li>Thanh toán tại cơ sở y tế</li>
              </ul>
            </div>

            <div className={styles["subsection"]}>
              <h3>7.2. Chính sách hoàn tiền:</h3>
              <p>
                MEDIX sẽ hoàn tiền trong các trường hợp: hủy dịch vụ trước khi sử dụng, 
                lỗi kỹ thuật từ phía MEDIX, hoặc không thể cung cấp dịch vụ như cam kết.
              </p>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 8. BẢO MẬT VÀ QUYỀN RIÊNG TƯ</h2>
            
            <div className={styles["subsection"]}>
              <h3>8.1. Cam kết bảo mật:</h3>
              <p>
                MEDIX cam kết bảo vệ thông tin cá nhân và dữ liệu y tế của người dùng 
                theo các tiêu chuẩn bảo mật cao nhất.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>8.2. Chính sách riêng tư:</h3>
              <p>
                Việc thu thập, sử dụng và bảo vệ dữ liệu được quy định chi tiết trong 
                <Link to="/privacy" className={styles["terms-link"]}> Chính sách bảo mật</Link>.
              </p>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 9. GIỚI HẠN TRÁCH NHIỆM</h2>
            
            <div className={styles["subsection"]}>
              <h3>9.1. Giới hạn:</h3>
              <p>
                MEDIX không chịu trách nhiệm cho các thiệt hại gián tiếp, đặc biệt, 
                ngẫu nhiên hoặc hậu quả phát sinh từ việc sử dụng dịch vụ.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>9.2. Trường hợp ngoại lệ:</h3>
              <p>
                MEDIX vẫn chịu trách nhiệm trong các trường hợp: lỗi kỹ thuật nghiêm trọng, 
                vi phạm bảo mật dữ liệu, hoặc không tuân thủ cam kết dịch vụ.
              </p>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 10. VI PHẠM VÀ XỬ LÝ</h2>
            
            <div className={styles["subsection"]}>
              <h3>10.1. Các hành vi vi phạm:</h3>
              <ul>
                <li>Cung cấp thông tin giả mạo</li>
                <li>Sử dụng dịch vụ cho mục đích bất hợp pháp</li>
                <li>Hack hoặc tấn công hệ thống</li>
                <li>Chia sẻ tài khoản trái phép</li>
                <li>Vi phạm bản quyền và sở hữu trí tuệ</li>
              </ul>
            </div>

            <div className={styles["subsection"]}>
              <h3>10.2. Biện pháp xử lý:</h3>
              <ul>
                <li>Cảnh báo và nhắc nhở</li>
                <li>Tạm khóa tài khoản</li>
                <li>Khóa vĩnh viễn tài khoản</li>
                <li>Khởi kiện pháp lý nếu cần thiết</li>
              </ul>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 11. THAY ĐỔI ĐIỀU KHOẢN</h2>
            
            <div className={styles["subsection"]}>
              <h3>11.1. Quyền thay đổi:</h3>
              <p>
                MEDIX có quyền thay đổi, cập nhật điều khoản dịch vụ để phù hợp với 
                các thay đổi về pháp luật và hoạt động kinh doanh.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>11.2. Thông báo:</h3>
              <p>
                Mọi thay đổi sẽ được thông báo trước ít nhất 30 ngày qua email và 
                thông báo trên website. Việc tiếp tục sử dụng dịch vụ được coi là đồng ý với điều khoản mới.
              </p>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 12. GIẢI QUYẾT TRANH CHẤP</h2>
            
            <div className={styles["subsection"]}>
              <h3>12.1. Nguyên tắc:</h3>
              <p>
                Mọi tranh chấp sẽ được giải quyết thông qua đàm phán, hòa giải trước khi 
                đưa ra tòa án có thẩm quyền.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>12.2. Luật áp dụng:</h3>
              <p>
                Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. 
                Tòa án có thẩm quyền là tòa án tại Việt Nam.
              </p>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 13. LIÊN HỆ</h2>
            
            <div className={styles["subsection"]}>
              <h3>13.1. Thông tin liên hệ:</h3>
              <div className={styles["contact-info"]}>
                <p><strong>Hệ thống Y tế Thông minh MEDIX</strong></p>
                <p>Email: support@medix.com</p>
                <p>Hotline: 1900-MEDIX (1900-63349)</p>
                <p>Địa chỉ: Việt Nam</p>
              </div>
            </div>

            <div className={styles["subsection"]}>
              <h3>13.2. Thời gian hỗ trợ:</h3>
              <p>
                Chúng tôi hỗ trợ khách hàng 24/7 qua hotline và email. 
                Thời gian phản hồi email trong vòng 24 giờ.
              </p>
            </div>
          </section>

          <section className={styles["section"]}>
            <h2>ĐIỀU 14. HIỆU LỰC</h2>
            
            <div className={styles["subsection"]}>
              <h3>14.1. Ngày có hiệu lực:</h3>
              <p>
                Điều khoản dịch vụ này có hiệu lực từ ngày 12/10/2025 và áp dụng cho 
                tất cả người dùng dịch vụ của MEDIX.
              </p>
            </div>

            <div className={styles["subsection"]}>
              <h3>14.2. Tính toàn vẹn:</h3>
              <p>
                Nếu bất kỳ điều khoản nào trong tài liệu này bị vô hiệu, 
                các điều khoản còn lại vẫn có hiệu lực đầy đủ.
              </p>
            </div>
          </section>

          <div className={styles["footer-note"]}>
            <p>
              <strong>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của MEDIX!</strong><br/>
              Chúng tôi cam kết mang đến những dịch vụ y tế chất lượng cao và bảo vệ quyền lợi của người dùng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
