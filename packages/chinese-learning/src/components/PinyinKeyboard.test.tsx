import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PinyinKeyboard from './PinyinKeyboard';
import { createRef } from 'react';

describe('PinyinKeyboard', () => {
  it('renders toggle button', () => {
    const ref = createRef<HTMLInputElement>();
    const onInsert = vi.fn();
    render(<PinyinKeyboard inputRef={ref} onInsert={onInsert} />);
    expect(screen.getByTestId('pinyin-keyboard-toggle')).toBeInTheDocument();
  });

  it('keyboard is hidden by default', () => {
    const ref = createRef<HTMLInputElement>();
    const onInsert = vi.fn();
    render(<PinyinKeyboard inputRef={ref} onInsert={onInsert} />);
    expect(screen.queryByTestId('pinyin-keyboard-keys')).not.toBeInTheDocument();
  });

  it('toggles keyboard visibility', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLInputElement>();
    const onInsert = vi.fn();
    render(<PinyinKeyboard inputRef={ref} onInsert={onInsert} />);

    await user.click(screen.getByTestId('pinyin-keyboard-toggle'));
    expect(screen.getByTestId('pinyin-keyboard-keys')).toBeInTheDocument();

    await user.click(screen.getByTestId('pinyin-keyboard-toggle'));
    expect(screen.queryByTestId('pinyin-keyboard-keys')).not.toBeInTheDocument();
  });

  it('calls onInsert with clicked character', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLInputElement>();
    const onInsert = vi.fn();
    render(<PinyinKeyboard inputRef={ref} onInsert={onInsert} />);

    await user.click(screen.getByTestId('pinyin-keyboard-toggle'));
    await user.click(screen.getByTestId('pinyin-key-\u0101'));
    expect(onInsert).toHaveBeenCalledWith('\u0101');
  });

  it('shows all tone groups when visible', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLInputElement>();
    const onInsert = vi.fn();
    render(<PinyinKeyboard inputRef={ref} onInsert={onInsert} />);

    await user.click(screen.getByTestId('pinyin-keyboard-toggle'));

    // Check one from each group
    expect(screen.getByTestId('pinyin-key-\u0101')).toBeInTheDocument();
    expect(screen.getByTestId('pinyin-key-\u0113')).toBeInTheDocument();
    expect(screen.getByTestId('pinyin-key-\u012b')).toBeInTheDocument();
    expect(screen.getByTestId('pinyin-key-\u014d')).toBeInTheDocument();
    expect(screen.getByTestId('pinyin-key-\u016b')).toBeInTheDocument();
    expect(screen.getByTestId('pinyin-key-\u01d6')).toBeInTheDocument();
  });
});
