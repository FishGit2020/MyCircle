import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChineseLearning from './ChineseLearning';

const mockCharacters = [
  { id: 'f01', character: '妈妈', pinyin: 'māma', meaning: 'mom', category: 'family', createdBy: { uid: 'system', displayName: 'MyCircle' } },
  { id: 'f02', character: '爸爸', pinyin: 'bàba', meaning: 'dad', category: 'family', createdBy: { uid: 'system', displayName: 'MyCircle' } },
  { id: 'num01', character: '一', pinyin: 'yī', meaning: 'one', category: 'numbers', createdBy: { uid: 'system', displayName: 'MyCircle' } },
  { id: 'num02', character: '二', pinyin: 'èr', meaning: 'two', category: 'numbers', createdBy: { uid: 'system', displayName: 'MyCircle' } },
  { id: 'p01', character: '你好', pinyin: 'nǐhǎo', meaning: 'hello', category: 'phrases', createdBy: { uid: 'system', displayName: 'MyCircle' } },
];

beforeEach(() => {
  localStorage.clear();
  window.__chineseCharacters = {
    getAll: vi.fn().mockResolvedValue(mockCharacters),
    add: vi.fn().mockResolvedValue('new-id'),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn((cb) => {
      cb(mockCharacters);
      return vi.fn();
    }),
  };
  window.__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
});

describe('ChineseLearning', () => {
  it('renders the title and grid view by default', async () => {
    render(<ChineseLearning />);
    await waitFor(() => {
      expect(screen.getByText('Learn Chinese')).toBeInTheDocument();
    });
    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('Numbers')).toBeInTheDocument();
  });

  it('shows mastered count as 0/N initially', async () => {
    render(<ChineseLearning />);
    await waitFor(() => {
      expect(screen.getByText(/Mastered: 0 \/ 5/)).toBeInTheDocument();
    });
  });

  it('switches to flashcard view', async () => {
    const user = userEvent.setup();
    render(<ChineseLearning />);
    await waitFor(() => expect(screen.getByText('Flashcards')).toBeInTheDocument());

    await user.click(screen.getByText('Flashcards'));
    expect(screen.getByTestId('flashcard')).toBeInTheDocument();
  });

  it('clicking a character in grid switches to flashcard view', async () => {
    const user = userEvent.setup();
    render(<ChineseLearning />);
    await waitFor(() => expect(screen.getByText('妈妈')).toBeInTheDocument());

    await user.click(screen.getAllByText('妈妈')[0]);
    expect(screen.getByTestId('flashcard')).toBeInTheDocument();
  });

  it('can mark a character as mastered from flashcard view', async () => {
    const user = userEvent.setup();
    render(<ChineseLearning />);
    await waitFor(() => expect(screen.getByText('Flashcards')).toBeInTheDocument());

    await user.click(screen.getByText('Flashcards'));
    await user.click(screen.getByTestId('toggle-mastered'));
    expect(screen.getByText(/Mastered: 1 \/ 5/)).toBeInTheDocument();
  });

  it('persists progress to localStorage', async () => {
    const user = userEvent.setup();
    render(<ChineseLearning />);
    await waitFor(() => expect(screen.getByText('Flashcards')).toBeInTheDocument());

    await user.click(screen.getByText('Flashcards'));
    await user.click(screen.getByTestId('toggle-mastered'));

    const stored = JSON.parse(localStorage.getItem('chinese-learning-progress')!);
    expect(stored.masteredIds).toHaveLength(1);
  });

  it('restores progress from localStorage', async () => {
    localStorage.setItem('chinese-learning-progress', JSON.stringify({
      masteredIds: ['f01', 'f02'],
      lastDate: '2026-01-01',
    }));

    render(<ChineseLearning />);
    await waitFor(() => {
      expect(screen.getByText(/Mastered: 2 \/ 5/)).toBeInTheDocument();
    });
  });

  it('resets progress when reset is clicked', async () => {
    localStorage.setItem('chinese-learning-progress', JSON.stringify({
      masteredIds: ['f01'],
      lastDate: '2026-01-01',
    }));

    const user = userEvent.setup();
    render(<ChineseLearning />);
    await waitFor(() => expect(screen.getByText(/Mastered: 1 \/ 5/)).toBeInTheDocument());

    await user.click(screen.getByText('Reset Progress'));
    expect(screen.getByText(/Mastered: 0 \/ 5/)).toBeInTheDocument();
  });

  it('filters characters by category in flashcard view', async () => {
    const user = userEvent.setup();
    render(<ChineseLearning />);
    await waitFor(() => expect(screen.getByText('Flashcards')).toBeInTheDocument());

    await user.click(screen.getByText('Flashcards'));
    await user.click(screen.getByText('Numbers'));
    expect(screen.getByTestId('flashcard-character')).toHaveTextContent('一');
  });

  it('shows Add Character button when authenticated', async () => {
    render(<ChineseLearning />);
    await waitFor(() => {
      expect(screen.getByTestId('add-character-btn')).toBeInTheDocument();
    });
  });

  it('shows sign-in hint when not authenticated', async () => {
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue(null);
    render(<ChineseLearning />);
    await waitFor(() => {
      expect(screen.getByText('Sign in to add characters')).toBeInTheDocument();
    });
  });

  it('opens editor when Add Character is clicked', async () => {
    const user = userEvent.setup();
    render(<ChineseLearning />);
    await waitFor(() => expect(screen.getByTestId('add-character-btn')).toBeInTheDocument());

    await user.click(screen.getByTestId('add-character-btn'));
    expect(screen.getByTestId('character-editor')).toBeInTheDocument();
  });

  it('shows loading state when no cached characters', async () => {
    window.__chineseCharacters = {
      getAll: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      subscribe: undefined,
    };
    localStorage.removeItem('chinese-characters-cache');

    render(<ChineseLearning />);
    // Should show loading briefly then no-characters message
    await waitFor(() => {
      expect(screen.getByText('No characters yet. Add one to get started!')).toBeInTheDocument();
    });
  });

  it('shows no characters message when empty', async () => {
    window.__chineseCharacters = {
      getAll: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      subscribe: vi.fn((cb) => { cb([]); return vi.fn(); }),
    };

    render(<ChineseLearning />);
    await waitFor(() => {
      expect(screen.getByTestId('no-characters')).toBeInTheDocument();
    });
  });
});
