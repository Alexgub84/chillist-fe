type AuthErrorListener = () => void;

const listeners = new Set<AuthErrorListener>();

export function onAuthError(cb: AuthErrorListener) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function emitAuthError() {
  listeners.forEach((cb) => cb());
}
