import '@testing-library/jest-dom';
import { vi } from 'vitest';

if (typeof Element !== 'undefined' && !Element.prototype.getAnimations) {
  Element.prototype.getAnimations = () => [];
}

import '../src/i18n';

vi.mock('../src/contexts/useLanguage', () => ({
  useLanguage: () => ({
    language: 'en' as const,
    setLanguage: vi.fn(),
  }),
}));

vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children: unknown }) => children,
  Map: () => null,
  AdvancedMarker: () => null,
  Pin: () => null,
  useMapsLibrary: () => null,
  useApiIsLoaded: () => false,
}));

vi.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      }),
      signInWithOAuth: vi.fn().mockResolvedValue({
        data: { provider: 'google', url: '' },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      refreshSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'No session' },
      }),
      updateUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));
