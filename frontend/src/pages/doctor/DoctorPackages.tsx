import React, { useEffect, useState } from 'react';
import serviceTierService from '../../services/serviceTierService';
import { TierListPresenter } from '../../types/serviceTier.types';
import styles from '../../styles/doctor/DoctorPackage.module.css';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../../components/ui';
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const DoctorPackages: React.FC = () => {
  const { showToast } = useToast();

  const [pageLoading, setPageLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showUnsubscribe, setShowUnsubscribe] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");

  const [data, setData] = useState<TierListPresenter | null>(null);

  const [tierName, setTierName] = useState<string>("");
  const [tierId, setTierId] = useState<string>("");

  const getTimeLeftLabel = (utcDateString: string) => {
    try {
      const date = new Date(utcDateString);
      if (date == null) {
        return null;
      }

      return formatDistanceToNow(date, {
        addSuffix: false,
        locale: vi,
      });
    } catch (error) {
      return 'Không xác định thời gian';
    }
  }

  useEffect(() => {
    (async () => {
      await fetchDisplayedList();
      setPageLoading(false);
    })();
  }, []);

  const fetchDisplayedList = async () => {
    try {
      const data = await serviceTierService.getDisplayedList();
      setData(data);
    } catch (error: any) {

    }
  }

  const handleShowConfirmation = (name: string, id: string, message: string) => {
    setConfirmationMessage(message);
    setShowConfirmation(true);
    setTierName(name);
    setTierId(id);
  }

  const upgrade = async () => {
    try {
      await serviceTierService.upgradePackage(tierId);
      showToast(`Mua gói ${tierName} thành công!`, 'success');
    }
    catch (error: any) {
      if (error.response?.status === 400) {
        const message = error.response.data || "Yêu cầu không hợp lệ.";
        showToast(message, 'error');
      } else {
        showToast('Mua gói không thành công. Vui lòng thử lại sau', 'error');
      }
    }
  }

  const handleUpgrade = async () => {
    setPageLoading(true);
    await upgrade();
    await fetchDisplayedList();
    setPageLoading(false);
    setShowConfirmation(false);
  }

  const handleShowUnsubscribe = (name: string, id: string) => {
    setTierName(name);
    setTierId(id);
    setShowUnsubscribe(true);
  }

  const unsubscribe = async () => {
    try {
      await serviceTierService.unsubscribe(tierId);
      showToast(`Hủy đăng kí gói ${tierName} thành công!`, 'success');
    }
    catch {
      showToast('Hủy đăng kí gói không thành công. Vui lòng thử lại sau', 'error');
    }
  }

  const handleUnsubscribe = async () => {
    setPageLoading(true);
    await unsubscribe();
    await fetchDisplayedList();
    setPageLoading(false);
    setShowUnsubscribe(false);
  }

  if (pageLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('vi-VN').format(balance);
  };

  return (
    <div className={styles.container}>
      {/* Phần đầu trang */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Gói dịch vụ</h1>
          <p className={styles.subtitle}>
            <i className="bi bi-box-seam"></i>
            Chọn gói dịch vụ phù hợp với nhu cầu của bạn
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.balanceCard}>
            <div className={styles.balanceIcon}>
              <i className="bi bi-wallet2"></i>
            </div>
            <div className={styles.balanceInfo}>
              <span className={styles.balanceLabel}>Số dư ví</span>
              <span className={styles.balanceAmount}>
                {data?.balance ? formatBalance(data.balance) : '0'} đ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lưới hiển thị gói dịch vụ */}
      <div className={styles.packagesGrid}>
        {data?.list.map((item, index) => {
          const isCurrentTier = data.currentTierId === item.id;
          const features = JSON.parse(item.features || '[]');
          
          // Xác định màu sắc theo thứ tự gói
          const getPackageTheme = (idx: number) => {
            if (idx === 0) return 'themeBlue';
            if (idx === 1) return 'themeGreen';
            return 'themeGold';
          };
          
          const themeClass = getPackageTheme(index);
          
          return (
            <div 
              key={item.id} 
              className={`${styles.packageCard} ${styles[themeClass]} ${isCurrentTier ? styles.currentTier : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {isCurrentTier && (
                <div className={`${styles.badge} ${!data.currentSubscriptionActive ? styles.cancelledBadgeTop : ''}`}>
                  {data.currentSubscriptionActive ? (
                    <>
                      <i className="bi bi-check-circle-fill"></i>
                      {data.expiredAt ? (
                        <>
                          Đang sở hữu • Còn {getTimeLeftLabel(data.expiredAt)}
                        </>
                      ) : (
                        'Đang sở hữu'
                      )}
                    </>
                  ) : (
                    <>
                      <i className="bi bi-x-circle"></i>
                      Đã hủy
                    </>
                  )}
                </div>
              )}
              
              <div className={styles.packageHeader}>
                <div className={`${styles.packageIcon} ${styles[`${themeClass}Icon`]}`}>
                  <i className="bi bi-star-fill"></i>
                </div>
                <h3 className={`${styles.packageName} ${styles[`${themeClass}Name`]}`}>Gói {item.name}</h3>
                <div className={styles.packagePrice}>
                  {item.monthlyPrice ? (
                    <>
                      <span className={`${styles.priceAmount} ${styles[`${themeClass}Price`]}`}>
                        {formatBalance(item.monthlyPrice)}
                      </span>
                      <span className={styles.priceUnit}>đ/tháng</span>
                    </>
                  ) : (
                    <span className={styles.freeLabel}>Miễn phí</span>
                  )}
                </div>
              </div>

              <div className={styles.packageFeatures}>
                <ul className={styles.featuresList}>
                  {features.map((feature: string, idx: number) => (
                    <li key={idx} className={styles.featureItem}>
                      <i className="bi bi-check-circle-fill"></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.packageFooter}>
                {isCurrentTier ? (
                  <>
                    {item.monthlyPrice > 0 && (
                      <>
                        {data.currentSubscriptionActive ? (
                          <button
                            onClick={() => handleShowUnsubscribe(item.name, item.id)}
                            className={`${styles.actionButton} ${styles.cancelButton}`}
                          >
                            <i className="bi bi-x-circle"></i>
                            Hủy đăng kí
                          </button>
                        ) : (
                          <button
                            onClick={() => handleShowConfirmation(
                              item.name, 
                              item.id, 
                              "Nếu bạn tiếp tục đăng ký, hệ thống sẽ trừ số dư trong ví của bạn để gia hạn gói dịch vụ cho kỳ tiếp theo. Vui lòng xác nhận nếu bạn muốn tiếp tục đăng ký."
                            )}
                            className={`${styles.actionButton} ${styles[`${themeClass}Button`]}`}
                          >
                            <i className="bi bi-arrow-clockwise"></i>
                            Đăng kí lại
                          </button>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => handleShowConfirmation(
                      item.name, 
                      item.id,
                      "Gói sẽ được làm mới mỗi tháng và sẽ sử dụng số tiền trong ví của bạn để thanh toán."
                    )}
                    className={`${styles.actionButton} ${styles[`${themeClass}Button`]}`}
                  >
                    <i className="bi bi-cart-plus"></i>
                    Mua gói
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmationDialog
        isOpen={showConfirmation}
        title={`Mua gói ${tierName}`}
        message={confirmationMessage}
        onConfirm={() => handleUpgrade()}
        onCancel={() => setShowConfirmation(false)} />

      <ConfirmationDialog
        isOpen={showUnsubscribe}
        title={`Hủy đăng kí gói ${tierName}`}
        message={'Sau khi hủy, bạn vẫn sẽ tiếp tục được sử dụng đầy đủ quyền lợi của gói hiện tại cho đến khi hết thời hạn. Gói sẽ không được gia hạn tự động và số dư trong ví của bạn sẽ không bị trừ thêm khi gói hết hạn.'}
        onConfirm={() => handleUnsubscribe()}
        onCancel={() => setShowUnsubscribe(false)} />
    </div>
  );
};

export default DoctorPackages;
