import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { scrollToElementSlowly } from '../slow-scroll.js';

describe('scrollToElementSlowly', () => {
  let originalWindow;
  let originalDocument;
  let originalPerformance;
  let rafCallbacks;

  beforeEach(() => {
    vi.useFakeTimers();
    rafCallbacks = [];
    originalWindow = globalThis.window;
    originalDocument = globalThis.document;
    originalPerformance = globalThis.performance;

    globalThis.document = {
      documentElement: { clientHeight: 800 },
    };
    globalThis.window = {
      innerHeight: 800,
      pageYOffset: 10,
      scrollY: 10,
      matchMedia: () => ({ matches: false }),
      requestAnimationFrame: (callback) => {
        rafCallbacks.push(callback);
        return rafCallbacks.length;
      },
      scrollTo: vi.fn(),
      setTimeout,
    };
    globalThis.performance = { now: () => 100 };
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
    globalThis.performance = originalPerformance;
    vi.useRealTimers();
  });

  it('waits before starting a measured scroll animation', () => {
    const element = {
      getBoundingClientRect: () => ({ top: 200, height: 40 }),
      scrollIntoView: vi.fn(),
    };

    scrollToElementSlowly(element, { delayMs: 1000, durationMs: 1800 });

    vi.advanceTimersByTime(999);
    expect(rafCallbacks).toHaveLength(0);
    expect(window.scrollTo).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(rafCallbacks).toHaveLength(1);

    rafCallbacks.shift()(100);
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 10, behavior: 'auto' });

    rafCallbacks.shift()(1900);
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 210, behavior: 'auto' });
  });

  it('uses an instant scroll after the delay for reduced motion users', () => {
    const element = {
      getBoundingClientRect: () => ({ top: 200, height: 40 }),
      scrollIntoView: vi.fn(),
    };
    window.matchMedia = () => ({ matches: true });

    scrollToElementSlowly(element, { delayMs: 250, block: 'center' });
    vi.advanceTimersByTime(250);

    expect(element.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'center',
    });
    expect(rafCallbacks).toHaveLength(0);
  });
});

