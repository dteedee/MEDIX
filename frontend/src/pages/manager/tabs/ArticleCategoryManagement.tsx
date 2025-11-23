import React from 'react';
import CategoryList from '../CategoryManagement';

// Wrapper component để sử dụng lại CategoryManagement cho Article Categories
// CategoryManagement đã có đầy đủ CRUD, sort, search, filter cho ContentCategory
export default function ArticleCategoryManagement() {
  return (
    <div>
      <CategoryList />
    </div>
  );
}

