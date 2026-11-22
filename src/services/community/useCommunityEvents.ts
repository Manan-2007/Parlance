import { useEffect, useRef, useState } from "react";
import type { CommunityEvent } from "@/community/model";
import { COMMUNITY_BASE } from "./api";

export type EventsState = "connecting" | "live" | "offline";

/**
 * Follows one Community channel (feed, thread:<id>, live:<code>) with
 * server-sent events. The browser reconnects on its own after a dropped
 * connection; `state` says whether updates are arriving right now.
 */
export function useCommunityEvents(channel: string | null, onEvent: (event: CommunityEvent) => void) {
  const handler = useRef(onEvent);
  handler.current = onEvent;
  const [state, setState] = useState<EventsState>("connecting");
  const [presence, setPresence] = useState(0);

  useEffect(() => {
    if (!channel || typeof EventSource === "undefined") {
      setState("offline");
      return;
    }
    setState("connecting");
    const source = new EventSource(`${COMMUNITY_BASE}/events?channel=${encodeURIComponent(channel)}`);
    source.onopen = () => setState("live");
    source.onerror = () => setState(source.readyState === EventSource.CLOSED ? "offline" : "connecting");
    source.onmessage = (message) => {
      let event: CommunityEvent;
      try {
        event = JSON.parse(message.data) as CommunityEvent;
      } catch {
        return;
      }
      if (event.type === "presence") setPresence(event.count);
      handler.current(event);
    };
    return () => source.close();
  }, [channel]);

  return { state, presence };
}
