# 使用輕量級 Node 映像檔
FROM node:18-alpine

# 設定工作目錄
WORKDIR /app

# 複製 package.json 並安裝依賴
COPY package*.json ./
RUN npm install

# 複製其餘程式碼
COPY . .

# 暴露端口
EXPOSE 5000

# 啟動指令
CMD ["npm", "start"]