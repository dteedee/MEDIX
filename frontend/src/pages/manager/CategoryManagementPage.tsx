import React, { useState, useMemo } from 'react';
import { Calendar, RefreshCcw, Tags, Building2, BookOpen, Pill } from 'lucide-react';
import styles from '../../styles/manager/CategoryManagement.module.css';
import SpecializationManagement from './tabs/SpecializationManagement';
import ArticleCategoryManagement from './tabs/ArticleCategoryManagement';
import MedicationManagement from './tabs/MedicationManagement';

type TabType = 'specializations' | 'article-categories' | 'medications';

const CategoryManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('specializations');
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs = [
    { id: 'specializations' as TabType, label: 'Chuyên khoa', icon: Building2 },
    { id: 'article-categories' as TabType, label: 'Danh mục bài viết', icon: BookOpen },
    { id: 'medications' as TabType, label: 'Danh mục thuốc', icon: Pill },
  ];

  const todayLabel = useMemo(() => 
    new Date().toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }), []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleIcon}>
              <Tags size={28} />
            </div>
            <div>
              <h1 className={styles.title}>Quản lý Danh mục</h1>
              <p className={styles.subtitle}>Quản lý các danh mục trong hệ thống</p>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <div className={styles.dateIconWrapper}>
              <Calendar size={20} className={styles.dateIcon} />
            </div>
            <div className={styles.dateContent}>
              <span className={styles.dateText}>{todayLabel}</span>
              <div className={styles.dateGlow}></div>
            </div>
          </div>
          <button className={styles.refreshBtn} onClick={handleRefresh}>
            <RefreshCcw size={16} />
            Làm mới
          </button>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <IconComponent size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'specializations' && <SpecializationManagement key={`specializations-${refreshKey}`} />}
        {activeTab === 'article-categories' && <ArticleCategoryManagement key={`article-categories-${refreshKey}`} />}
        {activeTab === 'medications' && <MedicationManagement key={`medications-${refreshKey}`} />}
      </div>
    </div>
  );
};

export default CategoryManagementPage;

