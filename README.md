
<div align="center">

  <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2000&auto=format&fit=crop" alt="HouseGram Banner" width="100%" style="border-radius: 10px; object-fit: cover; height: 300px;">

  <h1 style="font-size: 3rem; margin-top: 20px;">🏠 HouseGram</h1>

  <p>
    <strong>The Pixel-Perfect, Secure, and Fluid Messaging Experience.</strong>
  </p>

  <p>
    <a href="#-getting-started">🚀 Getting Started</a> •
    <a href="#-features">✨ Features</a> •
    <a href="#-tech-stack">🛠 Tech Stack</a> •
    <a href="#-contributing">🤝 Contributing</a>
  </p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
  </p>

</div>

---

<details>
<summary style="font-size: 1.5em; font-weight: bold; cursor: pointer;">🇷🇺 Нажмите, чтобы читать на русском (Russian Version)</summary>

<br>

<div align="center">
  <h2>👋 Добро пожаловать в HouseGram</h2>
  <p><strong>HouseGram</strong> — это веб-мессенджер нового поколения, созданный для того, чтобы повторить плавность и функциональность премиальных нативных приложений. </p>
</div>

### ✨ Ключевые особенности

*   🎨 **Потрясающий UI/UX**: Глубокая темная тема, анимации 60 FPS и адаптивный дизайн.
*   🚀 **Мгновенная связь**: Сообщения доставляются моментально благодаря Firestore.
*   🎤 **Голос и Медиа**: Запись голосовых сообщений с визуализацией волн, отправка фото и видео без сжатия.
*   🏀 **Интерактивные Эмодзи**: Отправьте 🏀, 🎲 или 🎯, чтобы увидеть 3D-анимацию и сыграть с другом!
*   🔒 **Безопасность**: Установите код-пароль на вход и двухфакторную аутентификацию (2FA).
*   🛡 **Админ-панель**: Специальный режим "God Mode" для управления пользователями.

### 🚀 Установка и запуск

1.  **Клонируйте репозиторий:**
    ```bash
    git clone https://github.com/yourusername/housegram.git
    cd housegram
    ```
2.  **Установите зависимости:**
    ```bash
    npm install
    ```
3.  **Настройте Firebase:**
    *   Создайте проект в Firebase Console.
    *   Скопируйте конфиг в файл `firebase.ts`.
4.  **Запустите:**
    ```bash
    npm start
    ```

</details>

---

## 👋 Introduction

**HouseGram** brings the fluidity of native apps to the web. Built with **React** and **Tailwind CSS**, it features a sleek dark-themed interface, real-time synchronization, and a suite of interactive features that bring your conversations to life.

> *Whether you're sending voice messages, sharing 4K media, or playing with interactive 3D emojis, HouseGram ensures your experience is fast, secure, and delightful.*

---

## ✨ Features

<table>
  <tr>
    <td width="50%">
      <h3>🎨 Stunning UI/UX</h3>
      <ul>
        <li><strong>Deep Dark Mode:</strong> Optimized for eye comfort.</li>
        <li><strong>Fluid Animations:</strong> 60 FPS transitions.</li>
        <li><strong>Responsive:</strong> Works on all screen sizes.</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🚀 Real-Time Speed</h3>
      <ul>
        <li><strong>Instant Messaging:</strong> Powered by Firestore.</li>
        <li><strong>Live Status:</strong> Online / Typing indicators.</li>
        <li><strong>Smart Notifications:</strong> Push support.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🎤 Rich Media</h3>
      <ul>
        <li><strong>Voice Messages:</strong> Visual waveforms.</li>
        <li><strong>4K Sharing:</strong> No compression limits.</li>
        <li><strong>Video Avatars:</strong> Animated profile pictures.</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🔒 Privacy First</h3>
      <ul>
        <li><strong>Passcode Lock:</strong> Local session PIN.</li>
        <li><strong>2FA Support:</strong> Email recovery.</li>
        <li><strong>Admin Mode:</strong> "God Mode" for control.</li>
      </ul>
    </td>
  </tr>
</table>

### 🏀 Interactive Emojis
HouseGram supports physics-based animations. Send a single emoji to trigger:
*   🏀 **Basketball**: Shoots a hoop. Can you get a swish?
*   🎲 **Dice**: Rolls a random 3D dice (1-6).
*   🎯 **Dart**: Throws a dart at the target.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v16+)
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/housegram.git
    cd housegram
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the app**
    ```bash
    npm start
    ```

4.  **Open in Browser**
    Visit `http://localhost:3000` to start chatting!

---

## 📖 User Guide

1.  **Create an Account**: Launch the app and select **"Sign Up"**.
2.  **Personalize**: Go to **Settings > My Profile**. Tap your avatar to upload a video or photo.
3.  **Chat**: Tap the **Pencil Icon** (✏️) to find users globally.
4.  **Secure**: Navigate to **Privacy** to enable the Passcode Lock.

---

## 🛠 Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS |
| **Icons** | Lucide React |
| **Backend** | Firebase (Firestore, Auth, Storage) |
| **State** | React Context API |
| **Build** | Vite / Create React App |

---

<div align="center">

  <h3>🤝 Contributing</h3>
  <p>Contributions make the open-source community amazing. Any contributions you make are <strong>greatly appreciated</strong>.</p>

  <p>
    <a href="https://github.com/yourusername/housegram/issues">Report Bug</a> •
    <a href="https://github.com/yourusername/housegram/issues">Request Feature</a>
  </p>

  <p>Made with ❤️ by the HouseGram Team</p>
  <p>© 2026 HouseGram Inc.</p>

</div>
