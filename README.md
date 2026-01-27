# 📒 OurLedger

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB)
![Node](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-339933)
![Docker](https://img.shields.io/badge/deploy-Docker-2496ED)

**OurLedger** is a modern, AI-powered expense tracking and bill splitting application designed to make managing shared finances effortless. Whether you're splitting bills with roommates, tracking travel expenses with friends, or managing your personal budget, OurLedger helps you stay organized.

Featuring a beautiful, dark-mode ready UI and powered by Google Gemini AI for smart categorization and receipt scanning.

## ✨ Key Features

- **💰 Smart Bill Splitting**: Easily split bills by **Percentage**, **Exact Amount**, or **Equally**.
- **🤖 AI-Powered**:
  - **Receipt Scanning**: Upload a receipt and let Gemini AI extract amount, date, and merchant.
  - **Auto Suggest**: AI suggests the best category for your expenses based on description.
  - **Financial Insights**: Get personalized AI analysis of your spending habits.
- **📚 Multi-Ledger Support**: Create and manage distinct ledgers for different groups (e.g., "Home", "Trip to Japan").
- **📊 Interactive Stats**: Visualize your writing with "Daily Trends" and "Category Distribution" charts.
- **🌗 Dark Mode**: Sleek dark mode support for comfortable viewing at night.
- **🌍 Internationalization**: Fully localized for **English** and **Traditional Chinese (繁體中文)**.
- **💸 Settlement**: "Settle Up" feature calculates who owes whom, simplifying debt repayment.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts
- **Backend**: Node.js, Express, Mongoose
- **Database**: MongoDB
- **AI Service**: Google Gemini API
- **Infrastructure**: Docker, Docker Compose, Nginx

## 🚀 Getting Started

The easiest way to run OurLedger is using Docker Compose.

### Prerequisites

- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/) installed.
- A Google Gemini API Key (get one [here](https://aistudio.google.com/)).

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ourledger.git
   cd ourledger
   ```

2. **Configure Environment Variables**
   Copy the example environment file and add your API key:
   ```bash
   cp .env.example .env
   # Edit .env and paste your VITE_GEMINI_API_KEY
   ```

3. **Start the Application**
   Use `make` to start everything:
   ```bash
   make up
   ```
   Or standard Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. **Access the App**
   Open your browser and visit: `http://localhost:8080`

## 📂 Project Structure

```bash
ourledger/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components
│   │   ├── services/       # API & AI Services
│   │   ├── App.tsx         # Main App Logic
│   │   └── locales.ts      # i18n Translations
│   └── Dockerfile
├── server/                 # Express Backend
│   ├──models/              # Mongoose Models (User, Ledger, Expense)
│   ├── routes/             # API Routes
│   └── index.js            # Server Entry Point
├── docker-compose.yaml     # Container Orchestration
└── Makefile                # Command Shortcuts
```

## ⌨️ Development Commands

| Command | Description |
|---------|-------------|
| `make up` | Start all services in background |
| `make down` | Stop all services |
| `make logs` | View real-time logs |
| `make shell-server` | Access backend container shell |
| `make shell-client` | Access frontend container shell |

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
