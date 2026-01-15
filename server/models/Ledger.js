const mongoose = require('mongoose');

const LedgerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: 'trip' },
  members: [{ type: String }] // 這裡存 User ID 字串
}, { timestamps: true });

LedgerSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) { delete ret._id; }
});

module.exports = mongoose.model('Ledger', LedgerSchema);