import React, { useEffect, useState } from 'react';
import PlaceholderPage from './PlaceholderPage';
import serviceTierService from '../../services/serviceTierService';
import { TierListPresenter } from '../../types/serviceTier.types';
import styles from '../../styles/doctor/DoctorPackage.module.css';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { useToast } from '../../contexts/ToastContext';

const DoctorPackages: React.FC = () => {
  const { showToast } = useToast();

  const [data, setData] = useState<TierListPresenter | null>(null);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [tierName, setTierName] = useState<string>("");
  const [tierId, setTierId] = useState<string>("");

  useEffect(() => {
    (async () => {
      await fetchDisplayedList();
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
      showToast(`Mua gói ${tierName} thành công}!`, 'success');
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
    await upgrade();
    await fetchDisplayedList();
    setShowConfirmation(false);
  }

  return (
    <>
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
                  <span>Đang sở hữu</span>
                ) : (
                  <button onClick={() => handleShowConfirmation(item.name, item.id)} className="btn btn-primary px-4">Choose Package</button>
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
    </>
  );
};

export default DoctorPackages;
