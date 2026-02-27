# Firestore Transport Architecture

How Firestore real-time listeners (`onSnapshot`) work under the hood — from the `subscribe()` call in a React hook down to the wire protocol.

---

## Connection Model

Firestore uses a **single persistent connection** per `FirebaseApp` instance. All `onSnapshot` listeners multiplex over that one connection.

```
Our app (one browser tab):

  useFiles         → target 1 ─┐
  useSharedFiles   → target 2 ─┤
  useWorshipSongs  → target 3 ─┼── single connection ──► firestore.googleapis.com
  useNotes         → target 4 ─┤
  usePreferences   → target 5 ─┘
```

Each `onSnapshot(query, callback)` registers a **target** — a numeric ID representing that specific query. The server tracks which documents match each target. When a document changes, the server pushes updates only to targets whose queries match.

### Why One Connection?

Each connection costs a TCP handshake + TLS negotiation + Firebase Auth token validation. With 5-8 active listeners, opening separate connections would multiply that overhead. One multiplexed connection means one setup cost, shared by all listeners.

### Multi-Tab Coordination

Our app uses `persistentMultipleTabManager()` (configured in `firebase.ts:36`):

```typescript
db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
```

Only **one tab** holds the active server connection. Other tabs receive updates via **IndexedDB + BroadcastChannel**. If the primary tab closes, another tab promotes itself to primary and opens the connection.

---

## Protocol Stack

### Mobile / Server (native)

```
┌──────────────────────────────────────┐
│  gRPC                                │  Application protocol
│  Service definitions, protobuf,      │  (what to call, how to encode)
│  streaming patterns, error codes     │
├──────────────────────────────────────┤
│  HTTP/2                              │  Transport protocol
│  Framing, multiplexing (stream IDs), │  (how to deliver, how to interleave)
│  header compression (HPACK),         │
│  per-stream flow control             │
├──────────────────────────────────────┤
│  TCP + TLS                           │  Network
└──────────────────────────────────────┘
```

### Browser

Browsers use HTTP/2 for `fetch()` but don't expose raw HTTP/2 streams to JavaScript. So the web SDK uses gRPC-web over WebSocket:

```
┌──────────────────────────────────────┐
│  gRPC-web                            │  Application protocol
│  Same as gRPC: service definitions,  │  (subset of gRPC, adapted for browser)
│  protobuf, streaming, error codes    │
├──────────────────────────────────────┤
│  gRPC-web framing layer             │  Reimplements multiplexing + framing
│  (adds what WebSocket lacks)         │  on top of the raw byte pipe
├──────────────────────────────────────┤
│  WebSocket                           │  Dumb bidirectional byte pipe
│  No multiplexing, no framing,        │  (JavaScript CAN control this)
│  no compression — just a raw pipe    │
├──────────────────────────────────────┤
│  TCP + TLS                           │  Network
└──────────────────────────────────────┘
```

**Why the extra layer?** Browsers can't access raw HTTP/2 streams — `fetch()` abstracts them away. WebSocket is the only long-lived bidirectional channel JavaScript can control. gRPC-web adds multiplexing and framing on top of it.

---

## Layer Responsibilities

### HTTP/2 vs WebSocket

|                          | HTTP/2              | WebSocket          |
|--------------------------|---------------------|--------------------|
| Model                    | Request/response    | Bidirectional pipe |
| Multiplexing             | Built in            | No                 |
| Per-stream flow control  | Yes                 | No (TCP only)      |
| Header compression       | Yes (HPACK)         | No                 |
| Browser JS access        | No (hidden by fetch)| Yes                |

### gRPC over HTTP/2

gRPC is NOT the same as HTTP/2. HTTP/2 is the delivery truck; gRPC is the packaging standard. gRPC adds:

- **Service definitions** (.proto files) — typed contracts for what methods exist
- **Protobuf encoding** — binary serialization, ~3-4x smaller than JSON
- **Streaming patterns** — unary, server-stream, client-stream, bidirectional
- **Error codes** — `NOT_FOUND`, `PERMISSION_DENIED`, `UNAVAILABLE`, etc.
- **Deadlines/timeouts** — per-call timeout propagation

### What gRPC-web reimplements

| Capability              | HTTP/2 provides | WebSocket provides | gRPC-web adds |
|-------------------------|-----------------|-------------------|---------------|
| Reliable delivery       | Yes (TCP)       | Yes (TCP)         | —             |
| Connection flow control | Yes             | Yes (TCP)         | —             |
| Per-stream flow control | Yes             | No                | Skipped       |
| Framing                 | Yes             | No                | Yes           |
| Multiplexing            | Yes             | No                | Yes           |
| Header compression      | Yes (HPACK)     | No                | Skipped       |

Per-stream flow control and HPACK are skipped because Firestore messages are small (document diffs in protobuf) — TCP-level flow control is sufficient, and header compression savings are marginal.

---

## Target Lifecycle

When a React hook calls `onSnapshot`:

```
1. subscribe()
   └→ SDK registers a target on the shared connection
      └→ Server: "target 7 = query(users/uid/files)"

2. First callback fires
   ├→ WITH local cache: instantly from IndexedDB (no network needed)
   └→ WITHOUT local cache: after server round-trip (~100-500ms)

3. Document changes
   └→ Server evaluates: does this change match target 7's query?
      ├→ Yes: push change down the shared connection, tagged with target_id=7
      │       └→ Client SDK routes to the correct onSnapshot callback
      └→ No: nothing sent

4. unsub() (cleanup)
   └→ SDK sends "remove target 7" on the shared connection
      └→ Server stops tracking that query
      └→ Connection stays open for remaining targets
```

### Server-Side Routing

This is **not** fan-out (broadcasting everything to everyone). It's **targeted delivery**:

- Each client connection has N registered targets (queries)
- On document write, the server checks which targets match
- Only matching targets receive the change, only on the connections that registered them

---

## Persistence & Loading States

With `persistentLocalCache` enabled, `onSnapshot` fires the callback **twice** on mount:

1. **Immediately** — from IndexedDB cache (even if offline)
2. **After server response** — with latest data (if different from cache)

This is why hooks using the defensive subscription pattern don't need a separate `load()` call:

```typescript
// The pattern used in useFiles, useWorshipSongs, etc.
if (api.subscribe) {
  const unsub = api.subscribe((data) => {
    setFiles(data);        // fires immediately from cache
    setLoading(false);     // loading resolved — no spinner
  });
  return unsub;            // cleanup: deregisters the target
}
// Fallback: one-shot fetch + event listener (if subscribe unavailable)
```

Edge case: fresh install + no network = `onSnapshot` never fires, `loading` stays `true`. This is acceptable because Firebase Auth requires network for the initial sign-in, so the user would be blocked at the login screen before reaching this state.
