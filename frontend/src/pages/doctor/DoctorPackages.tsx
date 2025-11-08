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

  const [data, setData] = useState<TierListPresenter | null>(null);

  const [tierName, setTierName] = useState<string>("");
  const [tierId, setTierId] = useState<string>("");

  const getTimeLeftLabel = (utcDateString: string) => {
    try {
      const date = new Date(utcDateString);

      return formatDistanceToNow(date, {
        addSuffix: false,
        locale: vi,
      });
    } catch (error) {
      console.error('Invalid date:', utcDateString);
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

  const handleShowConfirmation = (name: string, id: string) => {
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

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
        </div>
        <div className={styles.balance}>
          <div className={styles.balance}>
            <i className="bi bi-cash"></i>
            <span>{data?.balance}</span>
          </div>
        </div>
      </div>

      <div className={styles.cardRowWrapper}>
        {data?.list.map((item) => (
          <div className="card text-dark bg-white shadow-sm h-100" style={{ width: '18rem' }}>
            <div className="card-body d-flex flex-column">
              <h5 className="card-title">Gói {item.name}</h5>
              <h6 className="card-subtitle mb-3 text-end fw-bold">
                {item.monthlyPrice ? (
                  <span>{item.monthlyPrice} đ/tháng</span>
                ) : (
                  <span>Miễn phí</span>
                )}
              </h6>

              <ul className="list-group list-group-flush mb-3">
                {JSON.parse(item.features).map((feature: any) => (
                  <li className="list-group-item">{feature}</li>
                ))}
              </ul>
              <div className="mt-auto text-center">
                {data.currentTierId === item.id ? (
                  <>
                    <span className='mb-3'>Đang sở hữu</span>
                    {item.monthlyPrice > 0 && (
                      <>
                        <div>
                          <span className='mb-3'>Còn {getTimeLeftLabel(data.expiredAt)}</span>
                        </div>
                        <div>
                          <button
                            onClick={() => handleShowUnsubscribe(item.name, item.id)}
                            className="btn btn-warning px-4">Hủy đăng kí</button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <button onClick={() => handleShowConfirmation(item.name, item.id)} className="btn btn-primary px-4">Mua</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmationDialog
        isOpen={showConfirmation}
        title={`Mua gói ${tierName}`}
        message={'Gói sẽ được làm mới mỗi tháng và sẽ sử dụng số tiền trong ví của bạn để thanh toán.'}
        onConfirm={() => handleUpgrade()}
        onCancel={() => setShowConfirmation(false)} />

      <ConfirmationDialog
        isOpen={showUnsubscribe}
        title={`Hủy đăng kí gói ${tierName}`}
        message={'Sau khi hủy, bạn vẫn sẽ tiếp tục được sử dụng đầy đủ quyền lợi của gói hiện tại cho đến khi hết thời hạn. Gói sẽ không được gia hạn tự động và số dư trong ví của bạn sẽ không bị trừ thêm khi gói hết hạn.'}
        onConfirm={() => handleUnsubscribe()}
        onCancel={() => setShowUnsubscribe(false)} />
    </>
  );
};

export default DoctorPackages;
