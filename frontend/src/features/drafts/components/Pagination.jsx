import './Pagination.css';

function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pagination">
      <button
        type="button"
        className="pagination__btn"
        onClick={() => onPageChange(page - 1)}
        disabled={!canPrev}
      >
        Previous
      </button>

      <div className="pagination__pages">
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`pagination__page${p === page ? ' pagination__page--active' : ''}`}
            onClick={() => onPageChange(p)}
            disabled={p === page}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="pagination__btn"
        onClick={() => onPageChange(page + 1)}
        disabled={!canNext}
      >
        Next
      </button>
    </div>
  );
}

export default Pagination;
