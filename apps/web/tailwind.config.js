const primeui = require('tailwindcss-primeui');

/**
 * Tailwind is used for layout on the PrimeNG-migrated screens; colours come
 * from the tailwindcss-primeui utilities, which are bound to the PrimeNG theme
 * tokens (see src/app/theme/ensyncro-preset.ts) so nothing is hardcoded.
 *
 * Preflight (Tailwind's global CSS reset) is disabled on purpose: the app is
 * migrating screen by screen, and a global reset would restyle the pages that
 * still use the legacy hand-written CSS. PrimeNG components ship their own
 * baseline, and styles.css sets the small amount of global base we need.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  corePlugins: {
    preflight: false,
  },
  plugins: [primeui],
};
