import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DoctorService from '../../services/doctorService';
import DoctorRegistrationFormService from '../../services/doctorRegistrationFormService';
import DoctorDetails from './DoctorDetails';
import { useToast } from '../../contexts/ToastContext';
import { PageLoader } from '../../components/ui';

export default function DoctorProfileDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const loadDoctor = async () => {
      if (!id) {
        showToast('Không tìm thấy ID bác sĩ', 'error');
        navigate('/app/manager/doctor-profiles');
        return;
      }

      setLoading(true);
      try {
        // Try to load as regular doctor first
        try {
          const data = await DoctorService.getById(id);
          setDoctor(data);
          setIsPending(false);
        } catch (error) {
          // If not found, try as pending registration
          try {
            const data = await DoctorRegistrationFormService.getDetails(id);
            setDoctor(data);
            setIsPending(true);
          } catch (error2) {
            showToast('Không thể tải thông tin bác sĩ', 'error');
            navigate('/app/manager/doctor-profiles');
          }
        }
      } catch (error) {
        console.error('Error loading doctor:', error);
        showToast('Không thể tải thông tin bác sĩ', 'error');
        navigate('/app/manager/doctor-profiles');
      } finally {
        setLoading(false);
      }
    };

    loadDoctor();
  }, [id, navigate, showToast]);

  const handleClose = () => {
    navigate('/app/manager/doctor-profiles');
  };

  if (loading || !doctor) {
    return <PageLoader />;
  }

  return (
    <DoctorDetails
      doctor={doctor}
      onClose={handleClose}
      isLoading={loading}
      isPending={isPending}
    />
  );
}
