# SpaceLink 🚀

**SpaceLink** is a modern, cross-platform desktop dashboard for monitoring **Starlink** satellite internet connections. Built with **Electron**, **React**, and **Vite**, it provides real-time telemetry, obstruction mapping, and speed testing in a sleek, "Deep Space" themed interface.

![SpaceLink Dashboard Screenshot](https://via.placeholder.com/800x450.png?text=SpaceLink+Dashboard+Preview)

## ✨ Features

- **Real-time Status**: Monitor uptime, ping, signal-to-noise ratio (SNR), and throughput (Download/Upload).
- **Sky Map Visualization**: Interactive map showing satellite positions and obstruction wedges relative to your dish.
- **Speedtest Integration**: Built-in LibreSpeed client for accurate connection testing without leaving the app.
- **Local History**: Tracks latency and speed stats over time.
- **System Controls**: Reboot, Stow, and Unstow your Starlink dish directly from the UI.
- **Cross-Platform**: Designed for Windows (tested), macOS, and Linux.

## 🛠️ Tech Stack

- **Frontend**: React (v19), Recharts (History), Vanilla CSS (Design System).
- **Backend (Electron)**: gRPC (Starlink API), SQLite (Local DB), Axios (TLE Data).
- **Build Tool**: Vite, Electron Builder.

## 🚀 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/GnuFelice/SpaceLink.git
   cd SpaceLink
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run in Development Mode**:
   ```bash
   npm run dev
   ```
   *Note: Requires a Starlink dish reachable on local network (default IP: 192.168.100.1) or will fallback to Mock Data.*

4. **Build for Production**:
   
   - **Windows** (Default):
     ```bash
     npm run build
     ```
   - **macOS** (DMG):
     ```bash
     npm run build:mac
     ```
   - **Linux** (AppImage, Deb):
     ```bash
     npm run build:linux
     ```
   - **All Platforms**:
     ```bash
     npm run build:all
     ```
   The installers will be generated in the `release/` directory.

   > **Note for macOS:** Building on Windows produces an unsigned `.dmg`. Users will need to right-click -> Open to bypass security warnings. For a fully signed app, build on a Mac with a developer certificate.

## 📡 Starlink API

SpaceLink communicates directly with the Starlink hardware using gRPC. It auto-detects your location from the dish to rendering the satellite map accurately.

## ⚠️ Note on Windows Security

When installing, you might see a **"Windows protected your PC"** (SmartScreen) warning. This happens because the application is not code-signed with a paid certificate ($$$).

To install:
1. Click **"More Info"** (Ulteriori informazioni).
2. Click **"Run Anyway"** (Esegui comunque).

This is normal for open-source hobby projects.

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---
*Created by [GnuFelice](https://github.com/GnuFelice)*
