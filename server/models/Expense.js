const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  currency: { type: String, required: true }, // 'TWD', 'USD' etc.
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
  paidBy: { type: String, required: true }, // User ID
  categoryId: { type: String, required: true },
  
  // 拆帳邏輯
  splitType: { 
    type: String, 
    enum: ['equal', 'exact', 'percentage', 'full_for_partner'], 
    default: 'equal' 
  },
  splits: { type: Map, of: Number }, // 儲存 { userId: amount/percent }
  beneficiaryId: String,
  
  // 附加資訊
  notes: String,
  receiptImage: String, // Base64 字串或圖片 URL
  isSettlement: { type: Boolean, default: false },
  ledgerId: { type: String, required: true } // 關聯到哪個帳本
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);