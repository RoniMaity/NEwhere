# NEwhere

> Work from NEwhere. Access anything, from anywhere.

---

## What is this?

You have a laptop at your hostel. You're sitting in college with your MacBook. You want to use that hostel machine — see its screen, type on it, click around — as if you were sitting right in front of it.

That's NEwhere. It's like TeamViewer or AnyDesk but open source, free, and built by us.

---

## The problem with existing tools

TeamViewer and AnyDesk work, but they're closed source, paid for serious use, and not built for developers. We want something we fully own and can self-host.

---

## How it works (simple version)

```
You (college MacBook)  ←───── internet ─────→  Your hostel machine
     [NEwhere Client]                           [NEwhere Host]
```

- Your hostel machine runs a small background program (the Host)
- You open the Client app on your MacBook
- The Host gets a short code like `ABC-123` and a password
- You enter that code + password in the Client
- Boom — you see your hostel screen and can control it

The two machines talk directly to each other (peer-to-peer). The only thing that lives on our server is the "hey, connect these two machines" part. After that the server steps out.

---

## What we're building (in order)

- [ ] The signaling server — helps two machines find each other
- [ ] Screen streaming — host sends its screen to the client live
- [ ] Input forwarding — client sends mouse and keyboard events to the host
- [ ] The Electron client app — the UI you open on your machine
- [ ] Passwords and security — protect sessions
- [ ] User accounts and saved devices — log in, see your machines (later)

---

## Tech we're using and why

| What | Tool | Why |
|---|---|---|
| Language | TypeScript | Strong types, same language everywhere |
| Desktop app | Electron + React + Tailwind | Cross-platform GUI, fast to build |
| WebSocket server | `ws` | Simple, fast, no bloat |
| Peer-to-peer video | `node-datachannel` | WebRTC for Node.js, actually works without painful setup |
| Screen capture | `screenshot-desktop` | One line of code, works on Linux/Mac/Windows |
| Mouse & keyboard control | `@nut-tree/nut-js` | Simulates input on any OS |
| Session ID generation | `nanoid` | Makes short unique codes like `ABC-123` |
| Password hashing | `bcryptjs` | Keeps passwords safe, pure JS so no build pain |
| Message validation | `zod` | Makes sure messages between machines are the right shape |
| Logging | `pino` | Fast logs so we can see what's happening |
| Monorepo | Turborepo + pnpm | All three apps live in one repo |

---

## Folder structure

```
NEwhere/
├── apps/
│   ├── server/     → the cloud middleman (helps machines find each other)
│   ├── host/       → runs on the machine being accessed
│   └── client/     → the Electron app you open to connect
├── packages/
│   └── shared/     → types and constants used by all three apps
├── docs/           → these docs
└── turbo.json
```

---

## Build phases

| Phase | What gets built | Status |
|---|---|---|
| 1 | Monorepo setup + shared types | ✅ Done |
| 2 | Signaling server (no database yet, sessions live in memory) | ✅ Done |
| 3 | Host agent — connects to server, captures screen, sets up WebRTC | ✅ Done |
| 4 | Client app — connects, receives stream, shows it on screen | ✅ Done |
| 5 | Input forwarding — mouse and keyboard control | ✅ Done |
| 6 | Session passwords and basic security | ✅ Done |
| 7 | Database + user accounts + saved devices | ✅ Done |
| 8 | Polish, clipboard sync, file transfer | ✅ Done |
| 9 | OOP architecture realignment to class diagram spec | ✅ Done |

> We're currently at: **Phase 9 complete. E2E verified.**
> 
> Stack: Electron client (`pnpm dev:all`) + Express signaling server (port 8080) + Host agent (NEWHERE_PASSWORD env)
> Architecture: Strict Singleton/Controller/Service/Repository/Factory/Interface OOP layers per `classDiagram.md`