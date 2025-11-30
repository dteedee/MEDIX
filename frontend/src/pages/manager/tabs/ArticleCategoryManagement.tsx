import React from 'react';
import CategoryList from '../CategoryManagement';

export default function ArticleCategoryManagement() {
  return (
    <div>
      <CategoryList hideHeader={true} title="Quản lý Danh mục Bài viết" />
    </div>
  );
}

