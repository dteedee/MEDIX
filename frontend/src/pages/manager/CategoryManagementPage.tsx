import React, { useState } from 'react';
import styles from '../../styles/manager/CategoryManagement.module.css';
import SpecializationManagement from './tabs/SpecializationManagement';
import ArticleCategoryManagement from './tabs/ArticleCategoryManagement';
import MedicationManagement from './tabs/MedicationManagement';

type TabType = 'specializations' | 'article-categories' | 'medications';

const CategoryManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('specializations');

  const tabs = [
    { id: 'specializations' as TabType, label: 'Chuyên khoa', icon: 'bi-hospital' },
    { id: 'article-categories' as TabType, label: 'Danh mục bài viết', icon: 'bi-book' },
    { id: 'medications' as TabType, label: 'Danh mục thuốc', icon: 'bi-capsule' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Quản lý Danh mục</h1>
          <p className={styles.subtitle}>Quản lý các danh mục trong hệ thống</p>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={`bi ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'specializations' && <SpecializationManagement />}
        {activeTab === 'article-categories' && <ArticleCategoryManagement />}
        {activeTab === 'medications' && <MedicationManagement />}
      </div>
    </div>
  );
};

export default CategoryManagementPage;

