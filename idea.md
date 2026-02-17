# ◈ NEwhere — Project Idea

> *Work from NEwhere. Access anything, from anywhere.*

---

## ◆ What is NEwhere?

NEwhere is an open-source, cross-platform remote desktop application that lets you fully access and control any computer — Linux, macOS, or Windows — from any other computer, over the internet, in real time.

Whether you're sitting in college with your MacBook and want to use your Linux machine back in your hostel, or you're on Omarchy and need to control a Mac — NEwhere makes it feel like you're sitting right in front of it.

---

## ◆ The Problem It Solves

Students and developers often own multiple machines running different operating systems. Carrying all of them everywhere is not possible. Tools like TeamViewer and AnyDesk exist but are:
- Closed source
- Paid for advanced features
- Not built for developers who want to own and self-host their infra

NEwhere is built by a developer, for developers — open source, self-hostable, and fully cross-platform.

---

## ◆ Real World Use Case

```
You (college) ──────────────────────────────── Your hostel room
   MacBook                                        Omarchy (Linux)
   [NEwhere Client]  ←──── internet ────→  [NEwhere Host Agent]

You see your full Omarchy desktop on your Mac.
You type, click, use it — exactly as if you're there.
Meanwhile your Mac is still fully usable — NEwhere runs in a window.
```

---

## ◆ Key Features

### MVP (Must Have)
- [x] Real-time screen streaming from host to client
- [x] Full keyboard and mouse input forwarding
- [x] Cross-platform: Linux <-> Mac <-> Windows (any direction)
- [x] Peer-to-peer connection via WebRTC (low latency)
- [x] Signaling server to connect machines across the internet
- [x] Unique session ID system (like RustDesk)
- [x] Password-protected sessions
- [x] End-to-end encrypted stream

### V2 (Nice to Have)
- [ ] Clipboard sharing (copy on one machine, paste on another)
- [ ] File transfer between machines
- [ ] Multi-monitor support
- [ ] User accounts & saved devices
- [ ] Mobile client (iOS / Android)
- [ ] Audio streaming from remote machine

### Future
- [ ] Multi-seat (multiple people access the same machine independently)
- [ ] Session recording
- [ ] Chat during session

---

## ◆ System Overview

NEwhere has 3 main components:

| Component | What it does |
|---|---|
| **NEwhere Server** | Signaling server on the cloud — helps two machines find each other |
| **NEwhere Host** | Agent running on the machine being accessed (your hostel machine) |
| **NEwhere Client** | Electron app you open on your current machine (your college Mac) |

---

## ◆ Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (all components) |
| Desktop App | Electron + React + TailwindCSS |
| Signaling Server | Node.js + WebSocket (`ws`) |
| Peer Connection | WebRTC (`wrtc` / `node-webrtc`) |
| Screen Capture | `screenshot-desktop` / native APIs |
| Input Simulation | `@nut-tree/nut-js` |
| Auth & Security | JWT + bcrypt + WebRTC DTLS encryption |
| Monorepo | Turborepo |
| Deployment | Railway / Render (free tier) |

---

## ◆ Architecture Principles

- **OOP throughout** — encapsulation, abstraction, inheritance, polymorphism
- **Clean layered backend** — Controllers → Services → Repositories
- **Design patterns** — Observer (events), Singleton (connection manager), Strategy (encoder selection), Factory (session creation)
- **Self-hostable** — anyone can run their own NEwhere server
- **Security first** — no unencrypted data ever leaves either machine

---

## ◆ Monorepo Structure

```
NEwhere/
├── apps/
│   ├── server/        # Signaling + relay server
│   ├── host/          # Host agent (runs on remote machine)
│   └── client/        # Electron desktop app
├── packages/
│   └── shared/        # Shared types, utils, constants
├── docs/              # All diagrams and documentation
└── turbo.json
```

---

## ◆ Development Phases

| Phase | Description |
|---|---|
| Phase 1 | Signaling Server — WebSocket room & session management |
| Phase 2 | Screen Streaming — Capture, encode, stream via WebRTC |
| Phase 3 | Input Forwarding — Mouse & keyboard relay |
| Phase 4 | Electron Client — Full desktop app with UI |
| Phase 5 | Security — Auth, encryption, session passwords |
| Phase 6 | Polish — Latency optimization, clipboard, file transfer |