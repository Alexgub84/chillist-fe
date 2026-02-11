# Toast Notifications

The app uses [react-hot-toast](https://github.com/timolins/react-hot-toast) for non-blocking notifications. The `<Toaster>` is mounted once in the root layout ([`src/routes/__root.tsx`](../src/routes/__root.tsx)), so toasts are available app-wide.

## Showing error messages

Use `toast.error()` when an operation fails (e.g. API mutation). Prefer the shared error helper so messages are consistent and user-friendly:

```typescript
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../core/error-utils';

try {
  await someMutation.mutateAsync(payload);
  // success handling
} catch (err) {
  const { title, message } = getApiErrorMessage(
    err instanceof Error ? err : new Error(String(err))
  );
  toast.error(`${title}: ${message}`);
}
```

`getApiErrorMessage()` (from `src/core/error-utils.ts`) maps API status codes and common errors to `{ title, message, canRetry }`. Use it so users see clear, consistent error text instead of raw API messages.

## Other toast types

- **Success:** `toast.success('Item updated')`
- **Loading (dismiss later):** `const id = toast.loading('Saving…');` then `toast.success('Saved', { id })` or `toast.error('Failed', { id })`
- **Custom duration:** `toast('Message', { duration: 2000 })`
- **Promise-based:** `toast.promise(myPromise, { loading: 'Saving…', success: 'Saved', error: 'Failed' })`

## Defaults (root layout)

- Position: `top-right`
- Default duration: 4 seconds
- Error duration: 5 seconds; red-tinted style
- Success: green-tinted style

To change global behavior, edit the `<Toaster>` props in `src/routes/__root.tsx`.
