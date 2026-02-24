type AuthChangeCallback = (event: string, session: MockSession | null) => void;

interface MockUser {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
  app_metadata: Record<string, unknown>;
  aud: string;
  role: string;
}

interface MockSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: MockUser;
}

const STORAGE_KEY = 'mock-auth-session';
const listeners: Set<AuthChangeCallback> = new Set();

function makeFakeJwt(email: string, userId: string): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      email,
      role: 'authenticated',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  );
  return `${header}.${payload}.mock-signature`;
}

function buildSession(
  email: string,
  appMetadata: Record<string, unknown> = {}
): MockSession {
  const userId = crypto.randomUUID();
  return {
    access_token: makeFakeJwt(email, userId),
    refresh_token: `mock-refresh-${userId}`,
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: userId,
      email,
      user_metadata: { full_name: email.split('@')[0] },
      app_metadata: appMetadata,
      aud: 'authenticated',
      role: 'authenticated',
    },
  };
}

function saveSession(session: MockSession | null) {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function loadSession(): MockSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function notify(event: string, session: MockSession | null) {
  listeners.forEach((cb) => cb(event, session));
}

export const mockAuth = {
  async getSession() {
    const session = loadSession();
    return { data: { session }, error: null };
  },

  async signUp({ email }: { email: string; password: string }) {
    const session = buildSession(email);
    saveSession(session);
    notify('SIGNED_IN', session);
    return { data: { session, user: session.user }, error: null };
  },

  async signInWithPassword({ email }: { email: string; password: string }) {
    const session = buildSession(email);
    saveSession(session);
    notify('SIGNED_IN', session);
    return { data: { session, user: session.user }, error: null };
  },

  async signInWithOAuth(_options: {
    provider: string;
    options?: { redirectTo?: string };
  }) {
    const session = buildSession('google-user@mock.dev');
    saveSession(session);
    notify('SIGNED_IN', session);
    return {
      data: { provider: _options.provider, url: '' },
      error: null,
    };
  },

  async updateUser({ data }: { data: Record<string, unknown> }) {
    const session = loadSession();
    if (!session) {
      return {
        data: { user: null },
        error: { message: 'Not authenticated' },
      };
    }
    session.user.user_metadata = { ...session.user.user_metadata, ...data };
    saveSession(session);
    notify('USER_UPDATED', session);
    return { data: { user: session.user }, error: null };
  },

  async signOut() {
    saveSession(null);
    notify('SIGNED_OUT', null);
    return { error: null };
  },

  onAuthStateChange(callback: AuthChangeCallback) {
    listeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            listeners.delete(callback);
          },
        },
      },
    };
  },
};
