// Mock for epubjs used by digital-library BookReader
export default function ePub() {
  return {
    renderTo: () => ({ on: () => {}, display: () => Promise.resolve() }),
    destroy: () => {},
    locations: { generate: () => Promise.resolve() },
    loaded: { navigation: Promise.resolve({ toc: [] }) },
  };
}
