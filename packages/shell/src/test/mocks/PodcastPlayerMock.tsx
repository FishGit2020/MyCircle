import React from 'react';

export default function PodcastPlayerMock() {
  return (
    <div data-testid="podcast-player-mock">
      <h2>Podcast Player</h2>
      <input
        type="text"
        placeholder="Search podcasts..."
        data-testid="podcast-search-input"
      />
    </div>
  );
}
