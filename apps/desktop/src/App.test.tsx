import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from './lib/theme';
import { OnlineProvider } from './lib/api';
import { App } from './App';

/**
 * Regression test for CRIT-01: the React root (`main.tsx`) must wrap the app
 * in `ThemeProvider` and `OnlineProvider`. Rendering `App` inside those
 * providers mirrors production wiring and must mount without throwing.
 */
describe('App mount', () => {
  it('mounts without throwing when wrapped in providers', () => {
    // jsdom does not implement `window.matchMedia`, which `ThemeProvider`
    // reads to detect the system theme. Stub it so the provider initializes.
    window.matchMedia = (() => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as (query: string) => MediaQueryList;

    const { container } = render(
      <ThemeProvider>
        <OnlineProvider>
          <App />
        </OnlineProvider>
      </ThemeProvider>
    );
    expect(container).toBeInstanceOf(HTMLElement);
  });
});
