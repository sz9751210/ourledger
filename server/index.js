const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5050;

// 增加 JSON 大小限制以支援圖片上傳
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// 連接 MongoDB
// 注意：在 Docker Compose 中，主機名稱會是 service name，這裡我們取名為 "mongo"
const MONGO_URI = process.env.MONGO_URI || 'mongodb://ledger_mongo:27017/ledger_db';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected to:', MONGO_URI))
  .catch(err => console.error('MongoDB Connection Error:', err));

// 掛載路由
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});