import React from 'react';

export default function CitySearchMock() {
  return (
    <div data-testid="city-search-mock">
      <input
        type="text"
        placeholder="Search for a city..."
        data-testid="city-search-input"
      />
    </div>
  );
}
