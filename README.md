# 🌟 ReviseHub

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/Faizan-9077/reviseHub.svg)](https://github.com/Faizan-9077/reviseHub/commits)
[![Open Issues](https://img.shields.io/github/issues/Faizan-9077/reviseHub.svg)](https://github.com/Faizan-9077/reviseHub/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/Faizan-9077/reviseHub.svg)](https://github.com/Faizan-9077/reviseHub/pulls)
[![Stack](https://img.shields.io/badge/Stack-MERN-brightgreen)](https://github.com/Faizan-9077/reviseHub)
[![Auth](https://img.shields.io/badge/Auth-JWT-blue)](https://github.com/Faizan-9077/reviseHub)
[![Responsive](https://img.shields.io/badge/Responsive-Yes-success)](https://github.com/Faizan-9077/reviseHub)
[![JavaScript](https://img.shields.io/badge/JavaScript-99.2%25-yellow)](https://github.com/Faizan-9077/reviseHub)

---

## Overview

**ReviseHub** is a modern, intuitive study management web app built on the **MERN stack** (MongoDB, Express.js, React, Node.js). It empowers students to organize notes, plan study sessions, track progress, and more.

---

## Screenshots

<div align="center">
  <b>Dashboard</b> &nbsp;&nbsp;&nbsp;&nbsp; <b>Notes Page</b><br>
  <img src="https://github.com/Faizan-9077/reviseHub/blob/main/frontend/src/assets/DashBoardPage.png?raw=true" alt="Dashboard Screenshot" style="height:320px; width:48%; object-fit:cover;"/>
  <img src="https://github.com/Faizan-9077/reviseHub/blob/main/frontend/src/assets/NotesPage.png?raw=true" alt="Notes Screenshot" style="height:320px; width:48%; object-fit:cover;"/>
  <br><br>
  <b>Planner Page</b> &nbsp;&nbsp;&nbsp;&nbsp; <b>Progress Page</b><br>
  <img src="https://github.com/Faizan-9077/reviseHub/blob/main/frontend/src/assets/PlannerPage.png?raw=true" alt="Planner Screenshot" style="height:320px; width:48%; object-fit:cover;"/>
  <img src="https://github.com/Faizan-9077/reviseHub/blob/main/frontend/src/assets/ProgressPage.png?raw=true" alt="Progress Screenshot" style="height:320px; width:48%; object-fit:cover;"/>
</div>

---

[🌐 **Live Demo**](https://revise-hub.vercel.app/) *(click to try now!)*

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Local Development URLs](#local-development-urls)
- [Deployment](#deployment)
- [Usage Guide](#usage-guide)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
- [FAQ](#faq)

---

## Features

- **Dashboard** – Overview of progress, tasks, and recent activities
- **Notes Management** – Organize study resources with **Cloudinary storage**
- **Study Planner** – Add/manage tasks, track deadlines, maintain consistency
- **Progress Tracker** – Visualize performance and study trends
- **Revision Tracker** – Monitor revision frequency
- **Authentication** – Secure JWT-based login & password reset
- **Responsive UI** – Optimized for desktop, tablet, and mobile

---

## Tech Stack

| Category           | Technologies                        |
| ------------------ | ----------------------------------- |
| **Frontend**       | React.js, Vite, CSS3                |
| **Backend**        | Node.js, Express.js                 |
| **Database**       | MongoDB (Mongoose)                  |
| **Authentication** | JWT (JSON Web Token)                |
| **File Storage**   | Cloudinary                          |
| **Hosting**        | Vercel (Frontend), Render (Backend) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14+ recommended)
- [MongoDB](https://www.mongodb.com/) (local or cloud, e.g. Atlas)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Faizan-9077/reviseHub.git
   cd reviseHub
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   # or
   yarn install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   # or
   yarn install
   ```

4. **Configure environment variables**  
   Copy `.env.example` to `.env` in the backend folder, then update values:
   ```
   MONGO_URI=your-mongodb-connection-string
   JWT_SECRET=your-secret-key
   PORT=5000
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

5. **Start the backend server**
   ```bash
   cd ../backend
   npm run dev
   # or
   yarn dev
   ```
   > The backend runs at [http://localhost:5000](http://localhost:5000)

6. **Start the frontend**
   ```bash
   cd ../frontend
   npm run dev
   # or
   yarn dev
   ```
   > The frontend runs at [http://localhost:5173](http://localhost:5173)

---

## Local Development URLs

| Service          | URL                                            |
| ---------------- | ---------------------------------------------- |
| **Backend API**  | [http://localhost:5000](http://localhost:5000) |
| **Frontend App** | [http://localhost:5173](http://localhost:5173) |

---

## Deployment

| Service                   | Environment | URL                                                                              |
| ------------------------- | ----------- | -------------------------------------------------------------------------------- |
| **Backend API (Render)**  | Production  | [https://revisehub-backend.onrender.com](https://revisehub-backend.onrender.com) |
| **Frontend App (Vercel)** | Production  | [https://revise-hub.vercel.app/](https://revise-hub.vercel.app/)                 |
| **Backend (Local Dev)**   | Development | [http://localhost:5000](http://localhost:5000)                                   |
| **Frontend (Local Dev)**  | Development | [http://localhost:5173](http://localhost:5173)                                   |

---

## Usage Guide

1. **Register or Login** to access features
2. **Manage Notes** – Upload, tag, and organize notes
3. **Plan Tasks** – Add study tasks, set priorities
4. **Track Progress** – Monitor completion stats
5. **Reset Password** – Securely recover access anytime

---

## Contributing

Contributions are welcome! Please:

1. Fork this repository
2. Create a feature branch
   ```bash
   git checkout -b feature/your-feature
   ```
3. Commit changes
   ```bash
   git commit -m "Add your feature"
   ```
4. Push & submit a Pull Request 🚀

> Please write [clear commit messages](https://chris.beams.io/posts/git-commit/) and add tests for new features.

---

## License

Licensed under the [MIT License](LICENSE).

---

## Contact

👤 **Faizan**  
🔗 [GitHub](https://github.com/Faizan-9077)  
📧 *For queries or collaboration, open an issue!*

---

## FAQ

**Q:** Why is my Cloudinary upload failing?  
**A:** Check your `.env` for correct Cloudinary credentials.

**Q:** How do I report a bug?  
**A:** [Open an issue](https://github.com/Faizan-9077/reviseHub/issues).

---

> “Learn smarter, revise better — with ReviseHub.”

---
