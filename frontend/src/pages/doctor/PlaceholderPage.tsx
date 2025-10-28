import React from 'react';
import styles from '../../styles/doctor/DoctorPlaceholder.module.css';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: string;
  features?: string[];
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ 
  title, 
  description, 
  icon, 
  features = [] 
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconContainer}>
          <i className={`bi ${icon}`}></i>
        </div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
        
        {features.length > 0 && (
          <div className={styles.features}>
            <h3>Tính năng sẽ có:</h3>
            <ul>
              {features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className={styles.status}>
          <div className={styles.statusBadge}>
            <i className="bi bi-clock"></i>
            Đang phát triển
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
