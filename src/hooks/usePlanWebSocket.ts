import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

const NO_RETRY_CODES = new Set([4001, 4003, 4004, 4005]);
export const WS_CLOSE_PENDING_JOIN = 4005;
const MAX_RECONNECT_DELAY_MS = 30_000;
const BASE_RECONNECT_DELAY_MS = 1_000;

function getWsBaseUrl(): string {
  const httpUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333';
  return httpUrl.replace(/^http/, 'ws');
}

async function getAccessToken(): Promise<string | undefined> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
}

export function usePlanWebSocket(planId: string): {
  wsCloseCode: number | null;
} {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const unmountedRef = useRef(false);
  const [wsCloseCode, setWsCloseCode] = useState<number | null>(null);

  useEffect(() => {
    unmountedRef.current = false;

    async function connect() {
      if (unmountedRef.current) return;

      const token = await getAccessToken();
      if (!token) {
        console.warn('[WS] No auth token available — skipping connection');
        return;
      }

      if (unmountedRef.current) return;

      const url = `${getWsBaseUrl()}/plans/${planId}/ws?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        attemptRef.current = 0;
        setWsCloseCode(null);
        console.info(`[WS] Connected to plan ${planId}`);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'items:changed') {
            console.info(`[WS] Received: items:changed for plan ${planId}`);
            queryClient.invalidateQueries({ queryKey: ['plan', planId] });
          }
        } catch {
          console.warn('[WS] Failed to parse message', event.data);
        }
      };

      ws.onclose = (event) => {
        wsRef.current = null;
        console.info(
          `[WS] Disconnected (code: ${event.code}, reason: "${event.reason}")`
        );

        if (unmountedRef.current) return;

        setWsCloseCode(event.code);

        if (NO_RETRY_CODES.has(event.code)) {
          console.warn(
            `[WS] Permanent close (code: ${event.code}) — not reconnecting`
          );
          return;
        }

        scheduleReconnect();
      };

      ws.onerror = () => {
        console.warn('[WS] Connection error');
      };
    }

    function scheduleReconnect() {
      if (unmountedRef.current) return;

      const delay = Math.min(
        BASE_RECONNECT_DELAY_MS * 2 ** attemptRef.current,
        MAX_RECONNECT_DELAY_MS
      );
      attemptRef.current += 1;
      console.info(
        `[WS] Reconnecting in ${delay / 1000}s (attempt ${attemptRef.current})`
      );
      reconnectTimerRef.current = setTimeout(connect, delay);
    }

    connect();

    return () => {
      unmountedRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [planId, queryClient]);

  return { wsCloseCode };
}
