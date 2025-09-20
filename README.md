# ⛳ Vector Golf – 3D Mini Golf Game

### 🎮 Game Overview

Vector Golf is a browser-based 3D mini-golf game built using Three.js and TypeScript. The game allows players to aim, adjust shot power, and putt a golf ball through multiple holes with realistic physics, scoring, and smooth camera controls. This project brings together game design, physics simulation, and web technologies to deliver a fun and interactive mini-golf experience directly in your browser.

### ✨ Features

* **🏞️ 3D Course Environment** – Beautifully rendered mini-golf holes with slopes, obstacles, and terrain.
* **⚪ Interactive Golf Ball** – Realistic Movement with friction and momentum physics.
* **🎯 Aim & Power Control** – Drag or hold controls to set direction and strength.
* **📸 Dynamic Camera** – Orbit, zoom, and pan for better visibility of the course.
* **📝 Score Tracking** – Keeps track of strokes and hole numbers.
* **🚩 Multi-Level Gameplay** – Navigate through 6 unique and challenging courses, each with a distinct layout.
* **🖥️ User Interface** – Clean UI showing hole number, stroke count, and controls.
* **⛰️ Complex Terrain** – Face a variety of challenging environments, including steep ramps, gentle slopes, and curved surfaces.
* **🎵 Sound effects** - Enhances the gameplay experience with dynamic sound effects, realistic physics, and polished graphics.
* **🔐 User Authentication** – Allows players to create profiles and log in to save their progress and scores.
* **💾 Persistent Score Saving** – Utilizes Supabase to securely save and load player scores and progress.

---

### 🕹️ Gameplay

**Objective:**
Complete each golf hole by getting the ball into the cup in as few strokes as possible.

**Rules:**

* Each strike adds 1 stroke to your score.
* A hole is complete when the ball lands inside the cup.
* Move to the next hole until all levels are finished.
* Your score is tracked across holes and saved to your profile.

**Controls**

| Action | Control |
| :--- | :--- |
| **Aim ball** | Move mouse / drag on screen |
| **Set power** | Hold & drag (longer = stronger shot) |
| **Shoot ball** | Release mouse / touch |
| **Camera orbit** | Drag right mouse button |
| **Zoom** | Scroll wheel / pinch gesture |

---

### Demo Video : 
https://youtu.be/YReTVumvNHw?si=aJJyvZhBvchOk-ED

### 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Three.js** | 3D rendering engine |
| **TypeScript** | Core programming language |
| **Next.js** | App framework |
| **Tailwind CSS / PostCSS** | UI styling |
| **Supabase** | Authentication & Score Saving |
| **Node.js + npm** | Build & package management |

---

### 🚀 Installation & Setup

1.  **Clone the Repository**

    ```bash
    git clone [https://github.com/Udit-H/CloneFest-Week-3.git](https://github.com/Udit-H/CloneFest-Week-3.git)
    cd CloneFest-Week-3
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Set Up Supabase**
    Create a new project in your Supabase account and set up the necessary tables (e.g., `scores`). Configure your Supabase API URL and public key as environment variables in a `.env.local` file at the root of your project:

    ```
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

4.  **Run Development Server**

    ```bash
    npm run dev
    ```

    Now open `http://localhost:3000` in your browser.

---

### 🙏 Credits

This game is inspired by and built with contributions from the open-source community. A special thank you for the core mechanics and inspiration from the open-source game **Open Golf**.
