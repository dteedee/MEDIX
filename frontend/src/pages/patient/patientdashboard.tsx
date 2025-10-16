import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const PatientDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#2c3e50', marginBottom: '8px' }}>
            Patient Dashboard
          </h1>
          <p style={{ fontSize: '16px', color: '#6c757d' }}>
            Chào mừng, {user?.fullName || 'Bệnh nhân'}
          </p>
        </div>
        <button 
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Đăng xuất
        </button>
      </div>

      <div style={{
        backgroundColor: '#fff',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          Thông tin cá nhân
        </h2>
        <div style={{ fontSize: '14px', color: '#6c757d' }}>
          <p style={{ margin: '8px 0' }}> Email: {user?.email}</p>
          <p style={{ margin: '8px 0' }}> SĐT: {user?.phoneNumber || 'Chưa cập nhật'}</p>
          <p style={{ margin: '8px 0' }}> Role: {user?.role}</p>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px'
      }}>
        <div 
          style={{ 
            padding: '20px', 
            backgroundColor: '#fff', 
            borderRadius: '8px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/app/ai-chat')}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}></div>
          <h4 style={{ fontSize: '16px', fontWeight: '600' }}>AI Tư vấn</h4>
        </div>
      </div>
    </div>
  );
};
