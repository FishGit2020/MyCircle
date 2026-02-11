import React from 'react';

export default function StockTrackerMock() {
  return (
    <div data-testid="stock-tracker-mock">
      <h2>Stock Tracker</h2>
      <input
        type="text"
        placeholder="Search stocks..."
        data-testid="stock-search-input"
      />
    </div>
  );
}
