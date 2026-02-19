import { useState } from 'react';
import { useTranslation } from '@mycircle/shared';

interface PinyinKeyboardProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInsert: (char: string) => void;
}

const TONE_GROUPS = [
  ['\u0101', '\u00e1', '\u01ce', '\u00e0'],
  ['\u0113', '\u00e9', '\u011b', '\u00e8'],
  ['\u012b', '\u00ed', '\u01d0', '\u00ec'],
  ['\u014d', '\u00f3', '\u01d2', '\u00f2'],
  ['\u016b', '\u00fa', '\u01d4', '\u00f9'],
  ['\u01d6', '\u01d8', '\u01da', '\u01dc'],
];

export default function PinyinKeyboard({ inputRef, onInsert }: PinyinKeyboardProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const handleInsert = (char: string) => {
    onInsert(char);
    inputRef.current?.focus();
  };

  return (
    <div data-testid="pinyin-keyboard">
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="text-xs text-blue-600 dark:text-blue-400 hover:underline mb-1"
        data-testid="pinyin-keyboard-toggle"
      >
        {t('chinese.pinyinKeyboard')} {visible ? '\u25b2' : '\u25bc'}
      </button>
      {visible && (
        <div
          className="flex flex-wrap gap-1 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-x-auto"
          data-testid="pinyin-keyboard-keys"
        >
          {TONE_GROUPS.map((group, gi) => (
            <div key={gi} className="flex gap-0.5">
              {group.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => handleInsert(char)}
                  className="px-2 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                  data-testid={`pinyin-key-${char}`}
                >
                  {char}
                </button>
              ))}
              {gi < TONE_GROUPS.length - 1 && (
                <span className="text-gray-300 dark:text-gray-500 self-center mx-0.5">|</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
