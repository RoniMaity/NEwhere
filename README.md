# NEwhere

![NEwhere Architecture](erDiagram.md) <!-- Example placeholder for architecture diagrams if exported as images later -->

**NEwhere** is a high-performance, strictly Object-Oriented remote desktop application built entirely on modern web technologies. It achieves ultra-low latency desktop streaming over direct Peer-to-Peer (P2P) connections via WebRTC data channels — completely avoiding heavy video encoding pipelines in favor of high-throughput JPEG frame streams. 

Coupled with an ultra-minimal Notion-inspired UI, NEwhere delivers a simple, elegant desktop management experience natively across macOS, Windows, and Linux.

---

## 🏗 System Architecture

The project is structured as a robust **pnpm monorepo** containing three major applications:

1. **Host Agent (`apps/host`)**
   - A completely headless, lightweight Node.js daemon.
   - Constantly captures OS-level screenshots and pipes them into a WebRTC datachannel.
   - Listens for remote Keyboard/Mouse coordinate signals to simulate hardware input locally.
   - Designed using a strict **Factory/Dependency Injection Pattern** to abstract OS-specific screen capturers (macOS, Windows, Linux).
2. **Client App (`apps/client`)**
   - A native Electron application built using React and Vite.
   - Connects to the signaling server, performs P2P NAT-traversal handshakes, and establishes a direct Datachannel bound to a native Canvas rendering context.
   - Orchestrates DOM-level synthetic events (MouseMove, KeyPress) converting them into scaled coordinate systems.
3. **Signaling & API Server (`apps/server`)**
   - Express/WebSocket-based central server for coordinating WebRTC NAT handshakes (ICE Candidates/SDP offers).
   - Manages state via an in-memory repository bridging into a persistent PostgreSQL/SQLite backend (Prisma).
   - Includes robust session management and JWT authentication.

---

## 🚀 Features

- **Blazing Fast Networking:** Utilizes purely raw `RTCDataChannel` streams (Node-Datachannel & WebRTC) for frame delivery avoiding VP8/H.264 encoder lag.
- **Cross-Platform:** Native support via `NutJS` and OS-specific binary screen abstractions.
- **Notion Aesthetic:** Ultra-minimalist UX design paradigm utilizing pure greyscale bounds natively responding to frameless window dragging.
- **Secure by Default:** AES-256 WebRTC encryption over P2P, Bcrypt-hashed password session protection, and optional cloud JWT accounts for transparent device linking.
- **File Transfer & Clipboard Sync:** Integrated file chunking mechanics through parallel WebRTC channels alongside native text-clipboard synchronization pipelines.

---

## 💻 OS Requirements & Prerequisites

Because NEwhere interacts directly with low-level OS hardware interfaces for input and screen capture, certain dependencies are required depending on your host machine.

### Node & Package Variables (All OS)
- **Node.js**: v20 or higher (v24 recommended).
- **Package Manager**: `pnpm` (`npm install -g pnpm`)
- **Python/C++ Toolchain**: For compiling native Node addons (like `node-datachannel`).

### 🍏 macOS
- **Permissions**: The Host agent requires explicit **Screen Recording** and **Accessibility** permissions (to simulate mouse/keyboard).
- **Capture Native**: Relies safely on macOS native `screencapture`.

### 🪟 Windows
- **Dependencies**: None.
- **Capture Native**: Works directly utilizing native PowerShell/GDI screen hooks. 
- *Note:* If running the Host terminal as non-admin, UAC prompts on the host cannot be interacted with remotely. Run the host terminal as Administrator for full control.

### 🐧 Linux (Ubuntu / Debian)
NEwhere runs elegantly on X11 desktop environments.
- **Dependencies**: NutJS (for input simulation) and `screenshot-desktop` require `libxtst-dev`, `xdotool`, and `scrot`.
  ```bash
  sudo apt-get update
  sudo apt-get install -y libxtst-dev build-essential xdotool scrot gnome-screenshot
  ```
- *Note on Wayland:* Native Wayland environments heavily restrict generic screen capture protocols and simulated inputs. It is heavily recommended to use an X11 session when running the NEwhere Host agent.

---

## 🛠 Installation & Usage

1. **Clone and Install everything:**
   ```bash
   git clone https://github.com/RoniMaity/NEwhere.git newhere
   cd newhere
   pnpm install
   ```

2. **Start the Signaling & API Server:**
   ```bash
   cd apps/server
   pnpm dev
   # Runs locally on ports 8080. Update `VITE_SERVER_URL` in the client if hosting remotely.
   ```

3. **Start the Host Agent (The Machine you want to control):**
   ```bash
   cd apps/host
   pnpm build
   
   # Set a password for incoming guest connections
   NEWHERE_PASSWORD=secret123 node dist/index.js
   ```

4. **Launch the Client App (The Machine you are controlling from):**
   ```bash
   cd apps/client
   
   # Launches the Vite dev server inside a native Electron frame
   pnpm dev:all
   ```

---

## 🔐 Deployment Phase 7 (Database)

NEwhere operates fully in-memory out-of-the-box (Phase 1-6). If you wish to enable **Phase 7** (Accounts, Device saving, and persistent Dashboards):

1. Switch into `packages/db`.
2. Configure your `.env` connection string.
3. Run `npx prisma db push` to synchronize the schema (generates the `USER`, `DEVICE`, and `SESSION` relations).

---

## 📜 Development Notes & Architecture Standards

NEwhere strictly abides by an **Object-Oriented Programming (OOP) architecture** as detailed in `classDiagram.md`. 
When contributing:
- Always utilize constructor Dependency Injection.
- Handlers in the API must be heavily abstracted over isolated `*Controller.ts` and `*Service.ts` boundaries.
- Never place UI rendering logic adjacent to Synthetic `InputCapture` dispatchers. Use the `ClientApp` orchestrator logic classes.

---
*Built as a concept of High-Performance Agentic WebRTC Architectures natively deployed over Electron.*
