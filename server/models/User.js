const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: String,
  avatar: String,
}, { timestamps: true });

// 自動將 _id 轉為 id，並移除 __v
UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) { delete ret._id; }
});

module.exports = mongoose.model('User', UserSchema);