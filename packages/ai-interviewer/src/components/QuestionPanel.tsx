import { useTranslation, useQuery, useLazyQuery, GET_BENCHMARK_ENDPOINTS, GET_BENCHMARK_ENDPOINT_MODELS } from '@mycircle/shared';
import type { GetBenchmarkEndpointsQuery, GetBenchmarkEndpointModelsQuery } from '@mycircle/shared';

interface QuestionPanelProps {
  question: string;
  onQuestionChange: (text: string) => void;
  interviewActive: boolean;
  endpointId: string;
  model: string;
  onEndpointChange: (id: string) => void;
  onModelChange: (model: string) => void;
  onStart: () => void;
  onRepeat: () => void;
  onHint: () => void;
  onEnd: () => void;
  loading: boolean;
}

export default function QuestionPanel({
  question,
  onQuestionChange,
  interviewActive,
  endpointId,
  model,
  onEndpointChange,
  onModelChange,
  onStart,
  onRepeat,
  onHint,
  onEnd,
  loading,
}: QuestionPanelProps) {
  const { t } = useTranslation();

  const { data: endpointsData } = useQuery<GetBenchmarkEndpointsQuery>(GET_BENCHMARK_ENDPOINTS, {
    fetchPolicy: 'cache-and-network',
  });

  const [fetchModels, { data: modelsData }] = useLazyQuery<GetBenchmarkEndpointModelsQuery>(
    GET_BENCHMARK_ENDPOINT_MODELS,
  );

  const endpoints = endpointsData?.benchmarkEndpoints ?? [];
  const models = modelsData?.benchmarkEndpointModels ?? [];

  const handleEndpointChange = (id: string) => {
    onEndpointChange(id);
    onModelChange('');
    if (id) {
      fetchModels({ variables: { endpointId: id } });
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 p-4 gap-3">
      {/* Endpoint / Model selectors */}
      <div className="flex flex-wrap gap-2">
        <select
          value={endpointId}
          onChange={(e) => handleEndpointChange(e.target.value)}
          className="flex-1 min-w-[140px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('aiInterviewer.endpoint')}
        >
          <option value="">{t('aiInterviewer.selectEndpoint')}</option>
          {endpoints.map((ep) => (
            <option key={ep.id} value={ep.id}>
              {ep.name}
            </option>
          ))}
        </select>

        <select
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={!endpointId}
          className="flex-1 min-w-[140px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          aria-label={t('aiInterviewer.model')}
        >
          <option value="">{t('aiInterviewer.selectModel')}</option>
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Question textarea with line numbers */}
      <div className="flex-1 min-h-0 relative">
        <textarea
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          disabled={interviewActive}
          placeholder={t('aiInterviewer.questionPlaceholder')}
          className="w-full h-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm font-mono leading-6 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
          aria-label={t('aiInterviewer.questionLabel')}
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {!interviewActive ? (
          <button
            type="button"
            onClick={onStart}
            disabled={!question.trim() || loading}
            className="flex-1 rounded-lg bg-green-600 dark:bg-green-500 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('aiInterviewer.startInterview')}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onRepeat}
              disabled={loading}
              className="rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('aiInterviewer.repeatQuestion')}
            </button>
            <button
              type="button"
              onClick={onHint}
              disabled={loading}
              className="rounded-lg bg-yellow-500 dark:bg-yellow-600 text-white px-3 py-2 text-sm font-medium hover:bg-yellow-600 dark:hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('aiInterviewer.hint')}
            </button>
            <button
              type="button"
              onClick={onEnd}
              disabled={loading}
              className="rounded-lg bg-red-600 dark:bg-red-500 text-white px-3 py-2 text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('aiInterviewer.endInterview')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
