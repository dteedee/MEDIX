import React, { useEffect, useState, useMemo } from 'react';
import serviceTierService from '../../services/serviceTierService';
import { TierListPresenter } from '../../types/serviceTier.types';
import styles from '../../styles/doctor/DoctorPackage.module.css';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { useToast } from '../../contexts/ToastContext';
import { PageLoader } from '../../components/ui';
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Package, Wallet2, Calendar, Star, CheckCircle2, Sparkles, Crown, Zap } from 'lucide-react';

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
      showToast(`Hủy đăng ký gói ${tierName} thành công!`, 'success');
    }
    catch {
      showToast('Hủy đăng ký gói không thành công. Vui lòng thử lại sau', 'error');
    }
  }

  const handleUnsubscribe = async () => {
    setPageLoading(true);
    await unsubscribe();
    await fetchDisplayedList();
    setPageLoading(false);
    setShowUnsubscribe(false);
  }

  const sortedPackages = useMemo(() => {
    if (!data?.list) return [];
    return [...data.list].sort((a, b) => {
      const priceA = a.monthlyPrice || 0;
      const priceB = b.monthlyPrice || 0;
      
      if (priceA === 0 && priceB > 0) return 1;
      if (priceB === 0 && priceA > 0) return -1;
      
      return priceA - priceB;
    });
  }, [data?.list]);

  const getPackageTheme = (price: number, name: string) => {
    if (price === 0) return { theme: 'themeFree', icon: <Package size={24} />, name: 'Miễn phí' };
    
    const nameLower = name.toLowerCase();
    if (nameLower.includes('professional') || nameLower.includes('chuyên nghiệp')) {
      return { theme: 'themeBasic', icon: <Zap size={24} />, name: 'Professional' };
    }
    if (nameLower.includes('premium')) {
      return { theme: 'themePremium', icon: <Sparkles size={24} />, name: 'Premium' };
    }
    if (nameLower.includes('vip')) {
      return { theme: 'themeVip', icon: <Crown size={24} />, name: 'VIP' };
    }
    
    if (price < 1000000) return { theme: 'themeBasic', icon: <Zap size={24} />, name: 'Professional' };
    if (price < 3000000) return { theme: 'themePremium', icon: <Sparkles size={24} />, name: 'Premium' };
    return { theme: 'themeVip', icon: <Crown size={24} />, name: 'VIP' };
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('vi-VN').format(balance);
  };

  const formatCurrencyCompact = (value: number): string => {
    const amount = value || 0;
    const abs = Math.abs(amount);

    if (abs >= 1_000_000_000) {
      const compact = amount / 1_000_000_000;
      const text = compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1);
      return `${text}B VND`;
    }

    if (abs >= 1_000_000) {
      const compact = amount / 1_000_000;
      const text = compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1);
      return `${text}M VND`;
    }

    return `${amount.toLocaleString('vi-VN')} VND`;
  };

  const translateFeature = (feature: string): string => {
    const featureMap: { [key: string]: string } = {
      'Basic Listing': 'Hiển thị danh sách cơ bản',
      'basic listing': 'Hiển thị danh sách cơ bản',
      'Standard Search': 'Tìm kiếm tiêu chuẩn',
      'standard search': 'Tìm kiếm tiêu chuẩn',
      
      'Priority Listing': 'Hiển thị ưu tiên trong danh sách',
      'priority listing': 'Hiển thị ưu tiên trong danh sách',
      'Search Boost': 'Tối ưu hóa tìm kiếm',
      'search boost': 'Tối ưu hóa tìm kiếm',
      'Profile Highlight': 'Làm nổi bật hồ sơ bác sĩ',
      'profile highlight': 'Làm nổi bật hồ sơ bác sĩ',
      
      'Homepage Spotlight': 'Vị trí nổi bật trên trang chủ',
      'homepage spotlight': 'Vị trí nổi bật trên trang chủ',
      'Top Category': 'Vị trí đầu danh mục chuyên khoa',
      'top category': 'Vị trí đầu danh mục chuyên khoa',
      'Premium Badge': 'Nhãn xác thực Premium',
      'premium badge': 'Nhãn xác thực Premium',
      'Priority Support': 'Dịch vụ hỗ trợ ưu tiên',
      'priority support': 'Dịch vụ hỗ trợ ưu tiên',
      
      'VIP Placement': 'Vị trí ưu tiên cao nhất',
      'vip placement': 'Vị trí ưu tiên cao nhất',
      'Maximum Visibility': 'Tối đa hóa khả năng hiển thị',
      'maximum visibility': 'Tối đa hóa khả năng hiển thị',
      'Dedicated Manager': 'Quản lý tài khoản chuyên biệt',
      'dedicated manager': 'Quản lý tài khoản chuyên biệt',
      'Custom Campaigns': 'Chiến dịch quảng bá cá nhân hóa',
      'custom campaigns': 'Chiến dịch quảng bá cá nhân hóa',
    };

    if (featureMap[feature]) {
      return featureMap[feature];
    }

    const lowerFeature = feature.toLowerCase();
    for (const [key, value] of Object.entries(featureMap)) {
      if (key.toLowerCase() === lowerFeature) {
        return value;
      }
    }

    return feature;
  };

  if (pageLoading) {
    return <PageLoader />;
  }

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleIcon}>
              <Package size={28} />
            </div>
            <div>
              <h1 className={styles.title}>Gói dịch vụ</h1>
              <p className={styles.subtitle}>Chọn gói dịch vụ phù hợp với nhu cầu của bạn</p>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <div className={styles.dateIconWrapper}>
              <Calendar size={20} className={styles.dateIcon} />
            </div>
            <div className={styles.dateContent}>
              <span className={styles.dateText}>{new Date().toLocaleDateString('vi-VN', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}</span>
              <div className={styles.dateGlow}></div>
            </div>
          </div>
          <div className={styles.balanceCard}>
            <div className={styles.balanceIcon}>
              <Wallet2 size={20} />
            </div>
            <div className={styles.balanceInfo}>
              <span className={styles.balanceLabel}>Số dư ví</span>
              <span className={styles.balanceAmount}>
                {data?.balance ? formatCurrencyCompact(data.balance) : '0 VND'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.packagesGrid}>
        {sortedPackages.map((item, index) => {
          const isCurrentTier = data?.currentTierId === item.id;
          const features = JSON.parse(item.features || '[]');
          const packageTheme = getPackageTheme(item.monthlyPrice || 0, item.name);
          
          return (
            <div 
              key={item.id} 
              className={`${styles.packageCard} ${styles[packageTheme.theme]} ${isCurrentTier ? styles.currentTier : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {isCurrentTier && (
                <div className={`${styles.badge} ${!data?.currentSubscriptionActive ? styles.cancelledBadgeTop : ''}`}>
                  {data?.currentSubscriptionActive ? (
                    <>
                      <CheckCircle2 size={14} />
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
                <div className={`${styles.packageIcon} ${styles[`${packageTheme.theme}Icon`]}`}>
                  {packageTheme.icon}
                </div>
                <h3 className={`${styles.packageName} ${styles[`${packageTheme.theme}Name`]}`}>
                  Gói {item.name}
                </h3>
                <div className={styles.packagePrice}>
                  {item.monthlyPrice ? (
                    <>
                      <span className={`${styles.priceAmount} ${styles[`${packageTheme.theme}Price`]}`}>
                        {formatCurrencyCompact(item.monthlyPrice)}
                      </span>
                      <span className={styles.priceUnit}>/tháng</span>
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
                      <CheckCircle2 size={16} className={styles.featureIcon} />
                      <span>{translateFeature(feature)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.packageFooter}>
                {isCurrentTier ? (
                  <>
                    {item.monthlyPrice && item.monthlyPrice > 0 ? (
                      <>
                        {data?.currentSubscriptionActive ? (
                          <button
                            onClick={() => handleShowUnsubscribe(item.name, item.id)}
                            className={`${styles.actionButton} ${styles.cancelButton}`}
                          >
                            <i className="bi bi-x-circle"></i>
                            Hủy đăng ký
                          </button>
                        ) : (
                          <button
                            onClick={() => handleShowConfirmation(
                              item.name, 
                              item.id, 
                              "Nếu bạn tiếp tục đăng ký, hệ thống sẽ trừ số dư trong ví của bạn để gia hạn gói dịch vụ cho kỳ tiếp theo. Vui lòng xác nhận nếu bạn muốn tiếp tục đăng ký."
                            )}
                            className={`${styles.actionButton} ${styles[`${packageTheme.theme}Button`]}`}
                          >
                            <i className="bi bi-arrow-clockwise"></i>
                            Đăng ký lại
                          </button>
                        )}
                      </>
                    ) : null}
                  </>
                ) : (
                  <button
                    onClick={() => handleShowConfirmation(
                      item.name, 
                      item.id,
                      "Gói sẽ được làm mới mỗi tháng và sẽ sử dụng số tiền trong ví của bạn để thanh toán."
                    )}
                    className={`${styles.actionButton} ${styles[`${packageTheme.theme}Button`]}`}
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
        title={`Hủy đăng ký gói ${tierName}`}
        message={'Sau khi hủy, bạn vẫn sẽ tiếp tục được sử dụng đầy đủ quyền lợi của gói hiện tại cho đến khi hết thời hạn. Gói sẽ không được gia hạn tự động và số dư trong ví của bạn sẽ không bị trừ thêm khi gói hết hạn.'}
        onConfirm={() => handleUnsubscribe()}
        onCancel={() => setShowUnsubscribe(false)} />
    </div>
  );
};

export default DoctorPackages;
