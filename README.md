# Lazy Scholar — Retro Arcade Web App

[![Live App](https://img.shields.io/badge/Live_Demo-Render-informational?style=for-the-badge&logo=render&logoColor=46E3B7)](https://lazyscholar.onrender.com/)

"Simple games. Serious nostalgia. Smart tracking."

Lazy Scholar is a modern, responsive web application bringing back classic computing-era games with polished visuals, secure user authentication, persistent statistics, and real-time global leaderboards. It features subtle, smooth 3D elements powered by Three.js that respond to your movements and transitions.

Live Deployment: [https://lazyscholar.onrender.com/](https://lazyscholar.onrender.com/)

---

## 🕹 Game Catalog

1. **Cyber Snake**: Guide the digital snake to eat neon nodes. Avoid colliding with grid boundaries and your own expanding tail. Game speed increases dynamically as points accumulate.
2. **Neon Pong**: Deflect high-speed ball vectors back and forth. Scoring is endless, tracking consecutive paddle deflections. Ball velocity and computer AI speed scale up with each bounce.
3. **Tic-Tac-Toe**: Try your skills against an unbeatable Minimax logic processor (Hard mode), practice on Easy mode, or play a friend in Local 2-Player mode.
4. **Memory Match**: Flip grid boxes to locate matches of retro game console glyphs. Compete for the fastest completion time.

---

## 🚀 Key Features

* **3D Visual Flourish**: Full-page interactive Three.js grid floor, floating wireframe vector meshes, and glowing particle fields that dynamically rotate and translate during page navigations.
* **Low-Power Mode**: A hardware performance toggle in the navbar immediately disables WebGL rendering on low-spec/mobile devices, switching to clean CSS backdrops.
* **JWT Cookie-Based Session Auth**: Secure, stateless user sessions managed via HTTP-Only cookies to protect dashboard views and secure leaderboard entries.
* **Smart Score Validation**: Server-side validation rules screen posted points to ensure fair play before updating statistics.
* **Deduplicated Leaderboards**: Deduplicated ranking lists ensure only a player's single absolute best record shows on the top 10 list.
* **Dynamic API Routing**: Automatic API host detection routes requests to `localhost:5001` when run locally, or routes relatively in production deployments.
* **Reverse Proxy Trust**: Configured to trust upstream reverse proxies (like Render's load balancers) to ensure accurate rate-limiting based on client IPs.

---

## 🛠 Tech Stack

* **Frontend**: React (Vite-based), Tailwind CSS v4, Three.js, Lucide Icons, Canvas API, Web Audio API
* **Backend**: Node.js, Express.js
* **Database**: MongoDB (Mongoose ODM)
* **Session Auth**: JWT, Cookie-parser, Bcrypt (password hashing), Express-Rate-Limit (prevent brute force)

---

## 📦 Setup & Installation Instructions

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+ recommended)
* [MongoDB](https://www.mongodb.com/) (locally installed or Mongo Atlas URI)

### Quick Start (Local Development)

1. **Clone the Repository** and navigate to the directory:
   ```bash
   cd /Users/mac/Desktop/LazyScholar
   ```

2. **Initialize Dependencies**:
   Install root, client, and server libraries:
   ```bash
   npm run setup && npm install --prefix client
   ```

3. **Database Setup**:
   The project is preconfigured to support a local database folder `./mongodb_data`. If you have MongoDB installed locally, the root dev command will spin it up automatically.

   *For production or cloud deployments*, you can easily link a **MongoDB Atlas Cluster**. Obtain your connection string from the MongoDB Atlas console (e.g. `mongodb+srv://<username>:<password>@cluster.mongodb.net/lazy-scholar?retryWrites=true&w=majority`) and update the `MONGODB_URI` environment variable inside your `.env` configuration file.

4. **Environment Variables**:
   A `.env` file is initialized in the project root containing:
   ```env
   PORT=5001
   MONGODB_URI=mongodb://127.0.0.1:27017/lazy-scholar
   JWT_SECRET=supersecret_retrocabinet_key_1337
   NODE_ENV=development
   ```

5. **Start Development Servers**:
   Run the concurrent dev command to spin up MongoDB, the Express backend, and the React frontend:
   ```bash
   npm run dev
   ```
   *If you already have MongoDB running as a service and want to skip database creation, run:*
   ```bash
   npm run dev:nodb
   ```

6. **Play and Track**:
   * Open [http://localhost:5173/](http://localhost:5173/) in your web browser.
   * Sign up as a new player to log scores.
   * Toggle the CPU/Battery icon in the top right to enable/disable 3D Three.js rendering.

---

## 🌐 Production Deployment (Render)

This application is configured for seamless deployment on Render as a single web service.

### Deployment Strategy
1. **Frontend Build**: The client React app is built using Vite (`npm run build:client`) which generates static assets in the `/client/dist` directory.
2. **Backend Server**: The Node/Express server serves these static frontend assets when `NODE_ENV=production` is active:
   - All incoming requests that do not match `/api/*` route paths are served the static React `index.html` file, letting React Router handle routing on the client side.
3. **Single Web Service**: This avoids CORS issues and keeps hosting costs low since both client and server run within a single Render Web Service container.

### Render Configuration
* **Build Command**: `npm install && npm install --prefix client && npm run build:client && npm install --prefix server`
* **Start Command**: `npm start`
* **Environment Variables**:
  - `NODE_ENV`: `production`
  - `MONGODB_URI`: Your MongoDB Atlas Connection String
  - `JWT_SECRET`: A secure, secret key for signing JSON Web Tokens

---

## 📂 Project Structure

```
lazy-scholar/
├── client/                 # Frontend React application
│   ├── public/             # Static public assets
│   ├── src/
│   │   ├── components/     # Custom UI parts (Navbar, AuthModal)
│   │   ├── games/          # Retro game folders (Canvas / HTML rules)
│   │   │   ├── Snake/
│   │   │   ├── TicTacToe/
│   │   │   ├── Pong/
│   │   │   └── MemoryMatch/
│   │   ├── pages/          # Primary views (LandingPage, Dashboard, Leaderboards)
│   │   ├── three/          # WebGL backgrounds & Three.js camera rigs
│   │   ├── App.jsx         # App shell & router state
│   │   ├── main.jsx        # Mount entrypoint
│   │   └── index.css       # Custom HSL palette, neon glows, Tailwind imports
│   └── vite.config.js      # Vite compilation configs with Tailwind v4
├── server/                 # Express API server
│   ├── models/             # Mongoose schemas (User, ScoreLog)
│   ├── routes/             # REST endpoints (auth, user, scores)
│   ├── middleware/         # Cookie token checks
│   └── server.js           # Server initialization & DB connector
├── package.json            # Workspace controls
└── .env                    # System parameters
```
