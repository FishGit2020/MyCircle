import React from 'react';

export default function AiAssistantMock() {
  return (
    <div data-testid="ai-assistant-mock">
      <h2>AI Assistant</h2>
      <input
        type="text"
        placeholder="Ask me about weather, stocks, or anything..."
        data-testid="ai-chat-input"
      />
    </div>
  );
}
