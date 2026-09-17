# mochi-can-t-study


MochiCan'tStudy is a modern study companion platform designed to help users build better learning habits through a combination of productivity tools, virtual companionship, community interaction, and realtime collaboration.

The platform combines a virtual pet experience with study tracking, focus sessions, goals, community rooms, and live co-study environments to make learning more engaging and consistent.

---

## ✨ Features

### 🐾 Virtual Study Companion

* Interactive virtual pet that grows with user progress
* Encourages consistent study habits
* Tracks learning activities and achievements

### 📚 Study Management

* Create and manage study tasks
* Set daily learning goals
* Track focus sessions
* Monitor study progress and analytics

### ⏱️ Focus Sessions

* Pomodoro-style study sessions
* Session tracking
* Productivity insights
* Personal study history

### 🏠 Study Rooms

Collaborate with other learners in realtime:

* Create and join study rooms
* Live presence tracking
* Shared study timer
* Realtime chat
* Audio/video study sessions
* Host controls (mute/remove participants)

Powered by:

* Firebase Realtime features
* LiveKit video infrastructure

### 🌎 Community Rooms

A social learning environment with:

* Communities
* Posts
* Blogs
* Discussions
* Live chat
* Moderation features

---

# 🏗️ Tech Stack

## Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Axios
* Framer Motion
* Firebase SDK
* LiveKit Client
* Recharts
* MediaPipe
* Rive animations

## Backend

* Java 21
* Spring Boot 3.5
* Spring Web
* Spring Data JPA
* Spring Security
* Hibernate
* MySQL
* Flyway Database Migration
* Firebase Authentication

## Realtime Services

* Firebase Firestore
* LiveKit WebRTC

---

# 📂 Project Structure

```
react-spring-app/
│
├── frontend/        # React application
│
├── backend/         # Spring Boot REST API
│
├── firebase/        # Firebase configuration
│
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Make sure you have installed:

* Node.js 18+
* Java JDK 21
* Maven
* MySQL
* Firebase project credentials

---

# 🎨 Frontend Setup

Navigate to frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

The frontend will start with Vite.

---

# ⚙️ Backend Setup

Navigate to backend:

```bash
cd backend
```

Configure database settings:

```
src/main/resources/application.properties
```

Example:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/mochi_db
spring.datasource.username=root
spring.datasource.password=your_password
```

Run backend:

```bash
mvn spring-boot:run
```

Backend will start as a Spring Boot REST API.

---

# 🔥 Firebase Setup

1. Create a Firebase project
2. Enable Authentication
3. Configure Firestore
4. Add Firebase service account credentials

Place your Firebase configuration according to the backend Firebase setup instructions.

---

# 🎥 LiveKit Setup (Optional)

For realtime video study rooms:

Create LiveKit credentials:

```
livekit.api-key
livekit.api-secret
livekit.ws-url
```

Add them to:

```
application-local.properties
```

Without LiveKit configuration, normal application features will continue working.

---

# 🔌 API Modules

The backend provides APIs for:

* User authentication
* User profiles
* Tasks
* Study sessions
* Goals
* Community management
* Posts and comments
* Study rooms
* Room analytics
* Video token generation

---

# 🧪 Testing

Frontend:

```bash
npm run test
```

Backend:

```bash
mvn test
```

---

# 📸 Screenshots of the important applications

~Cat Home

<img width="1870" height="901" alt="image" src="https://github.com/user-attachments/assets/777661fa-fc27-4143-b93e-d634b24778e6" /> 

---



~Study Room

<img width="1902" height="905" alt="image" src="https://github.com/user-attachments/assets/f0657163-4bd9-43a0-af96-b05f20b26152" /> 

---



~FlashCard

<img width="1862" height="902" alt="image" src="https://github.com/user-attachments/assets/4da288ba-c9e3-4c6a-a128-d927601a4c77" />


---

~Shop

<img width="1866" height="896" alt="image" src="https://github.com/user-attachments/assets/d9a42f6d-8afb-404a-ab6a-02aaf9d7d8f3" /> 








---




# 🤝 Contributing

Contributions are welcome!

Steps:

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/new-feature
```

3. Commit changes

```bash
git commit -m "Add new feature"
```

4. Push branch

```bash
git push origin feature/new-feature
```

5. Create a Pull Request

---

# 📄 License

This project is developed for educational and research purposes.

---

# 👨‍💻 Author

**Samia Tasmim & 
Mujna Sabihat**

Built with ❤️ using React, Spring Boot, Firebase, and modern web technologies.

Live Deploy Link- https://mochi-cce66.web.app/login


