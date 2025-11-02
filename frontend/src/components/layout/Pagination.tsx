import styles from '../../styles/public/pagination.module.css'; // adjust path as needed

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const pages: (number | '...')[] = [];

  pages.push(1);

  if (currentPage > 3) {
    pages.push('...');
  }

  for (let i = currentPage - 1; i <= currentPage + 1; i++) {
    if (i > 1 && i < totalPages) {
      pages.push(i);
    }
  }

  if (currentPage < totalPages - 2) {
    pages.push('...');
  }

  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return (
    <div className={styles.paginationContainer}>
      <div className={styles.paginationControls}>
        {currentPage > 1 && (
          <>
            <button className={styles.paginationButton} onClick={() => onPageChange(1)}>
              Trang đầu
            </button>
            <button className={styles.paginationButton} onClick={() => onPageChange(currentPage - 1)}>
              Trang trước
            </button>
          </>
        )}

        {pages.map((page, index) =>
          page === '...' ? (
            <span key={`ellipsis-${index}`} className={styles.paginationEllipsis}>
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`${styles.paginationButton} ${page === currentPage ? styles.activePage : ''
                }`}
            >
              {page}
            </button>
          )
        )}

        {currentPage < totalPages && (
          <>
            <button className={styles.paginationButton} onClick={() => onPageChange(currentPage + 1)}>
              Trang sau
            </button>
            <button className={styles.paginationButton} onClick={() => onPageChange(totalPages)}>
              Trang cuối
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Pagination;