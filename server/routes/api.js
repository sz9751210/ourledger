const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Ledger = require('../models/Ledger');
const Category = require('../models/Category');
const Expense = require('../models/Expense');

// --- Users ---
router.get('/users', async (req, res) => res.json(await User.find()));
router.post('/users', async (req, res) => res.json(await User.create(req.body)));
router.delete('/users/:id', async (req, res) => res.json(await User.findByIdAndDelete(req.params.id)));

// --- Ledgers ---
router.get('/ledgers', async (req, res) => res.json(await Ledger.find()));
router.post('/ledgers', async (req, res) => res.json(await Ledger.create(req.body)));
router.patch('/ledgers/:id', async (req, res) => res.json(await Ledger.findByIdAndUpdate(req.params.id, req.body, { new: true })));
// router.delete('/ledgers/:id', async (req, res) => res.json(await Ledger.findByIdAndDelete(req.params.id)));
router.delete('/ledgers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // 1. 先刪除該帳本下的所有支出
    await Expense.deleteMany({ ledgerId: id });
    // 2. 再刪除帳本本身
    await Ledger.findByIdAndDelete(id);
    res.json({ message: 'Ledger and associated expenses deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ledger' });
  }
});

// --- Categories ---
router.get('/categories', async (req, res) => res.json(await Category.find()));
router.post('/categories', async (req, res) => res.json(await Category.create(req.body)));
router.patch('/categories/:id', async (req, res) => res.json(await Category.findByIdAndUpdate(req.params.id, req.body, { new: true })));
router.delete('/categories/:id', async (req, res) => res.json(await Category.findByIdAndDelete(req.params.id)));

// --- Expenses ---
router.get('/expenses', async (req, res) => {
  const { ledgerId } = req.query;
  const query = ledgerId ? { ledgerId } : {};
  // 依日期降序排列
  res.json(await Expense.find(query).sort({ date: -1 }));
});
router.post('/expenses', async (req, res) => res.json(await Expense.create(req.body)));
router.patch('/expenses/:id', async (req, res) => res.json(await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true })));
router.delete('/expenses/:id', async (req, res) => res.json(await Expense.findByIdAndDelete(req.params.id)));

module.exports = router;