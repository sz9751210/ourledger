# 📒 OurLedger 共同帳本

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB)
![Node](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-339933)
![Docker](https://img.shields.io/badge/deploy-Docker-2496ED)

**OurLedger** 是一款現代化、結合 AI 技術的記帳與分帳應用程式，專為解決團體旅遊、室友分租或情侶共同生活中的財務管理難題而設計。

擁有精美的深色模式介面，並整合 Google Gemini AI 技術，提供智慧分類與收據掃描功能，讓記帳變得輕鬆又有趣。

## ✨ 核心功能

- **💰 靈活分帳**: 支援 **百分比**、**指定金額** 或 **多人平分** 等多種分帳方式。
- **🤖 AI 智慧輔助**:
  - **收據掃描**: 上傳收據照片，AI 自動辨識金額、日期與商家名稱。
  - **智慧分類**: 輸入支出描述，AI 自動推薦最合適的分類。
  - **財務洞察**: 根據您的消費紀錄，提供個人化的財務分析建議。
- **📚 多帳本管理**: 可針對不同情境建立獨立帳本（例如：「家庭支出」、「日本旅遊」）。
- **📊 互動圖表**: 提供「每日支出趨勢」與「分類圓餅圖」，清楚掌握金錢流向。
- **🌗 深色模式**: 支援舒適的深色主題，夜間記帳不刺眼。
- **🌍 雙語支援**: 完整支援 **繁體中文** 與 **英文** 介面。
- **💸 債務結算**: 「結清帳務」功能自動計算誰該給誰多少錢，簡化還款流程。

## 🛠️ 技術架構

- **前端**: React, TypeScript, Vite, Tailwind CSS, Recharts
- **後端**: Node.js, Express, Mongoose
- **資料庫**: MongoDB
- **AI 服務**: Google Gemini API
- **基礎設施**: Docker, Docker Compose, Nginx

## 🚀 快速開始

我們建議使用 Docker Compose 來快速啟動專案。

### 事前準備

- 請確保電腦已安裝 [Docker](https://www.docker.com/get-started) 與 [Docker Compose](https://docs.docker.com/compose/install/)。
- 申請 Google Gemini API Key ([前往申請](https://aistudio.google.com/))。

### 安裝步驟

1. **複製專案**
   ```bash
   git clone https://github.com/yourusername/ourledger.git
   cd ourledger
   ```

2. **設定環境變數**
   複製範例設定檔並填入您的 API Key：
   ```bash
   cp .env.example .env
   # 編輯 .env 檔案並填入 VITE_GEMINI_API_KEY
   ```

3. **啟動應用程式**
   使用 `make` 指令快速啟動：
   ```bash
   make up
   ```
   或者使用標準 Docker Compose 指令：
   ```bash
   docker-compose up -d
   ```

4. **開始使用**
   打開瀏覽器並前往：`http://localhost:8080`

## 📂 專案結構

```bash
ourledger/
├── client/                 # React 前端
│   ├── src/
│   │   ├── components/     # UI 元件
│   │   ├── services/       # API 與 AI 服務邏輯
│   │   ├── App.tsx         # 主程式邏輯
│   │   └── locales.ts      # 多語言翻譯檔
│   └── Dockerfile
├── server/                 # Express 後端
│   ├──models/              # Mongoose 資料模型 (User, Ledger, Expense)
│   ├── routes/             # API路由
│   └── index.js            # 伺服器入口點
├── docker-compose.yaml     # 容器編排設定
└── Makefile                # 常用指令捷徑
```

## ⌨️ 開發指令

| 指令 | 說明 |
|---------|-------------|
| `make up` | 背景啟動所有服務 |
| `make down` | 停止並移除服務 |
| `make logs` | 查看即時日誌 |
| `make shell-server` | 進入後端容器 Shell |
| `make shell-client` | 進入前端容器 Shell |

## 📄 授權條款

本專案採用 MIT 授權條款 - 詳情請參閱 [LICENSE](LICENSE) 檔案。
