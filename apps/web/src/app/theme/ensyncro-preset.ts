import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

/**
 * Ensyncro design tokens — the single source of truth for the locked charcoal
 * green palette (PRD §10). Built on PrimeNG's Aura preset; every colour the app
 * uses resolves from here through PrimeNG's `--p-*` CSS variables and the
 * tailwindcss-primeui utilities (`bg-primary`, `text-surface-500`, …), so no
 * component hardcodes a hex value.
 *
 * Locked palette:
 *   #2C2C2A  text / dark surfaces (charcoal)   → surface.900
 *   #1F6D3B  accent (green)                     → primary.500
 *   #F6F5F1  page background (bone)             → surface.50
 *   #FFFFFF  cards                              → surface.0
 *   #E1DFD6  borders (sand)                     → surface.200
 *   #7A7870  secondary text (stone)            → surface.500
 */

/** Green scale built around the locked accent #1F6D3B (= 500). */
const green = {
  50: '#ecf6f0',
  100: '#d0e8da',
  200: '#a3d1b8',
  300: '#6fb691',
  400: '#3f9569',
  500: '#1f6d3b',
  600: '#1a5f34',
  700: '#164e2b',
  800: '#123f23',
  900: '#0e321c',
  950: '#071c10',
};

/** Warm neutral scale spanning bone → sand → stone → charcoal. */
const surface = {
  0: '#ffffff',
  50: '#f6f5f1',
  100: '#eceae3',
  200: '#e1dfd6',
  300: '#cfccc0',
  400: '#a8a498',
  500: '#7a7870',
  600: '#5f5d56',
  700: '#47453f',
  800: '#34322d',
  900: '#2c2c2a',
  950: '#1c1c1a',
};

export const EnsyncroPreset = definePreset(Aura, {
  semantic: {
    primary: green,
    colorScheme: {
      light: {
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.700}',
          focusColor: '{primary.800}',
        },
        surface,
        content: {
          background: '{surface.0}',
          hoverBackground: '{surface.50}',
          borderColor: '{surface.200}',
          color: '{surface.900}',
          hoverColor: '{surface.900}',
        },
        text: {
          color: '{surface.900}',
          hoverColor: '{surface.950}',
          mutedColor: '{surface.500}',
          hoverMutedColor: '{surface.600}',
        },
        formField: {
          background: '{surface.0}',
          disabledBackground: '{surface.100}',
          filledBackground: '{surface.50}',
          borderColor: '{surface.200}',
          hoverBorderColor: '{surface.300}',
          focusBorderColor: '{primary.500}',
          color: '{surface.900}',
          disabledColor: '{surface.400}',
          placeholderColor: '{surface.500}',
          floatLabelColor: '{surface.500}',
          iconColor: '{surface.500}',
        },
      },
    },
  },
});
