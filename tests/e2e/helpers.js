// Seed the byoa-solutions localStorage entry once per Playwright context.
// addInitScript re-runs on every navigation (including reloads), so we use a
// sessionStorage flag to make the seed idempotent — the seed only applies on
// the first page load, not on subsequent reloads. sessionStorage is wiped
// between Playwright contexts (one per test), so each test still gets a fresh
// seed.
export async function seedProgress(page, entries) {
  await page.addInitScript((data) => {
    try {
      if (!sessionStorage.getItem('__test_seeded')) {
        localStorage.setItem('byoa-solutions', JSON.stringify(data));
        sessionStorage.setItem('__test_seeded', '1');
      }
    } catch {}
  }, entries);
}

// Wipe all byoa-* localStorage keys before the first navigation. Same
// idempotent pattern: clear once per context, then leave state alone so
// reload-after-Run tests can observe their own saves.
export async function clearProgress(page) {
  await page.addInitScript(() => {
    try {
      if (!sessionStorage.getItem('__test_cleared')) {
        localStorage.removeItem('byoa-solutions');
        localStorage.removeItem('byoa-vim-enabled');
        localStorage.removeItem('byoa-number-format');
        sessionStorage.setItem('__test_cleared', '1');
      }
    } catch {}
  });
}
