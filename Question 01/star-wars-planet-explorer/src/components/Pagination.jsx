import React from 'react'
import "../styles/pagination.css";

function Pagination({ page, totalPages, setPage }) {
  return (
    <div className="pagination">
      <button
        disabled={page <= 1}
        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
      >
        Previous
      </button>

      <span>
        Page {page} of {totalPages}
      </span>

      <button
        disabled={page >= totalPages}
        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
      >
        Next
      </button>
    </div>
  );
}

export default Pagination;
