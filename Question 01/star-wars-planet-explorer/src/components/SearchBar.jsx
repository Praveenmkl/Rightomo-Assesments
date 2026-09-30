import React from 'react';

function SearchBar({ search, onSearchChange }) {
  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Search planets..."
        value={search}
        onChange={onSearchChange}
      />
    </div>
  );
}

export default SearchBar;