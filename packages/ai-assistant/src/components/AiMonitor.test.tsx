import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { GET_AI_USAGE_SUMMARY, GET_OLLAMA_STATUS, GET_AI_RECENT_LOGS } from '@mycircle/shared';
import AiMonitor from './AiMonitor';

const usageMock = {
  request: { query: GET_AI_USAGE_SUMMARY, variables: { days: 7 } },
  result: {
    data: {
      aiUsageSummary: {
        totalCalls: 42,
        totalInputTokens: 10000,
        totalOutputTokens: 5000,
        ollamaCalls: 30,
        geminiCalls: 12,
        avgLatencyMs: 1500,
        errorCount: 2,
        errorRate: 0.048,
        dailyBreakdown: [
          { date: '2026-02-28', calls: 20, avgLatencyMs: 1200, tokens: 8000, errors: 1 },
          { date: '2026-03-01', calls: 22, avgLatencyMs: 1800, tokens: 7000, errors: 1 },
        ],
        since: '2026-02-22T00:00:00.000Z',
      },
    },
  },
};

const statusMock = {
  request: { query: GET_OLLAMA_STATUS },
  result: {
    data: {
      ollamaStatus: {
        models: [{ name: 'gemma2:2b', size: 1.6, sizeVram: 1.6, expiresAt: '2026-03-01T12:00:00Z' }],
        reachable: true,
        latencyMs: 120,
      },
    },
  },
};

const logsMock = {
  request: { query: GET_AI_RECENT_LOGS, variables: { limit: 20 } },
  result: {
    data: {
      aiRecentLogs: [
        {
          id: 'log-1',
          timestamp: '2026-03-01T10:00:00Z',
          provider: 'ollama',
          model: 'gemma2:2b',
          inputTokens: 200,
          outputTokens: 100,
          latencyMs: 1200,
          toolCalls: [{ name: 'getWeather', durationMs: 300, error: null }],
          questionPreview: 'What is the weather?',
          answerPreview: 'The weather is sunny.',
          status: 'success',
          error: null,
        },
      ],
    },
  },
};

const renderWithProviders = (mocks = [usageMock, statusMock, logsMock]) => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <AiMonitor />
    </MockedProvider>
  );
};

describe('AiMonitor', () => {
  it('shows loading skeleton initially', () => {
    renderWithProviders();
    // Should show skeleton cards (animate-pulse elements)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders usage stat cards after loading', async () => {
    renderWithProviders();
    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(await screen.findByText('10.0K')).toBeInTheDocument();
    expect(await screen.findByText('5.0K')).toBeInTheDocument();
  });

  it('renders ollama status as online', async () => {
    renderWithProviders();
    expect(await screen.findByText(/Online/)).toBeInTheDocument();
    expect(await screen.findByText(/gemma2:2b/)).toBeInTheDocument();
  });

  it('renders recent logs', async () => {
    renderWithProviders();
    expect(await screen.findByText('What is the weather?')).toBeInTheDocument();
  });

  it('renders chart labels', async () => {
    renderWithProviders();
    expect(await screen.findByText('Calls Per Day')).toBeInTheDocument();
    expect(await screen.findByText('Latency Trend')).toBeInTheDocument();
  });

  it('shows empty state for no chart data', async () => {
    const emptyUsage = {
      ...usageMock,
      result: {
        data: {
          aiUsageSummary: {
            ...usageMock.result.data.aiUsageSummary,
            dailyBreakdown: [],
          },
        },
      },
    };

    render(
      <MockedProvider mocks={[emptyUsage, statusMock, logsMock]} addTypename={false}>
        <AiMonitor />
      </MockedProvider>
    );

    expect(await screen.findByText('No data available for charts')).toBeInTheDocument();
  });
});
