const DEFAULT_DELAY_MS = 1000;
const DEFAULT_DURATION_MS = 1800;

function prefersReducedMotion() {
  return Boolean(
    window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getTargetY(element, block) {
  const rect = element.getBoundingClientRect();
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

  if (block === 'center') {
    return scrollY + rect.top - viewportHeight / 2 + rect.height / 2;
  }

  return scrollY + rect.top;
}

export function scrollToElementSlowly(
  element,
  { delayMs = DEFAULT_DELAY_MS, durationMs = DEFAULT_DURATION_MS, block = 'start' } = {}
) {
  if (!element) return;

  window.setTimeout(() => {
    if (prefersReducedMotion() || typeof window.requestAnimationFrame !== 'function') {
      element.scrollIntoView({ behavior: 'auto', block });
      return;
    }

    const startY = window.scrollY || window.pageYOffset || 0;
    const targetY = getTargetY(element, block);
    const distance = targetY - startY;
    const startedAt = performance.now();

    function step(now) {
      const progress = Math.min((now - startedAt) / durationMs, 1);
      const nextY = startY + distance * easeInOutCubic(progress);
      window.scrollTo({ top: nextY, behavior: 'auto' });

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    }

    window.requestAnimationFrame(step);
  }, delayMs);
}

