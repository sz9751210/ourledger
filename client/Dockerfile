# --- 第一階段：建構環境 (Builder) ---
FROM node:18-alpine as builder

WORKDIR /app

# 複製 package.json 安裝依賴
COPY package*.json ./
RUN npm install

# 複製原始碼
COPY . .

# 設定環境變數 (這是建構時需要的，確保 API 指向正確)
# 注意：在瀏覽器端，API 還是要指向使用者的 localhost (因為 Docker 內部網路對瀏覽器不可見)
ENV VITE_API_URL=http://localhost:5050/api
# 如果你是用 Create React App，請改用 REACT_APP_API_URL

# 開始編譯 (會產生 dist 或 build 資料夾)
RUN npm run build

# --- 第二階段：生產環境 (Nginx) ---
FROM nginx:alpine

# 複製我們剛寫好的 nginx 設定檔到容器內
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 從第一階段複製編譯好的靜態檔案到 Nginx 資料夾
# 注意：Vite 預設輸出是 /app/dist，如果是 Create React App 則是 /app/build
# 請確認你的專案是用哪種工具，這裡預設寫 dist (Vite)
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]