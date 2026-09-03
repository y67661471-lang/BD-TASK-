# 🚀 BD-TASK: Telegram Mini App - Watch Ads & Earn

## 📋 সম্পূর্ণ সিস্টেম ওভারভিউ

```
TELEGRAM USER
   ↓
TELEGRAM BOT
   ↓
MINI APP LOGIN
   ↓
🤖 ROBOT SECURITY CHECK
   ↓
USER PANEL
   ↓
AD / TASK
   ↓
SERVER-SIDE VERIFICATION
   ↓
🤖 FRAUD & RISK CHECK
   ↓
REWARD ENGINE
   ↓
USER WALLET
   ↓
WITHDRAW REQUEST
   ↓
🤖 WITHDRAW SECURITY CHECK
   ↓
PAYMENT QUEUE
```

---

## 🎯 মূল ফিচার

### 👤 User Panel
- 🏠 Home Dashboard
- 📺 Watch & Earn Tasks
- 💰 Wallet Management
- 👥 Referral System
- 🎁 Daily Bonus
- 📜 History & Analytics
- 💳 Withdrawal System
- 🛡️ Security Status

### 👑 Admin Panel
- 📊 Live Dashboard
- 👥 User Management
- 🤖 Security Center
- 📺 Task Management
- 💰 Reward Management
- 💳 Withdrawal Approval
- 📢 Announcement System
- ⚙️ System Settings

### 🤖 Robotic Security System (24/7 Automatic)
- **Fraud Detection**
- **Risk Score Calculation**
- **Duplicate Prevention**
- **Rate Limiting**
- **Behavioral Analysis**
- **Self-Referral Detection**
- **Abnormal Pattern Recognition**
- **Automatic Hold/Ban System**

### 💰 Reward & Payment
- Server-side Wallet (No Client-side Manipulation)
- Automatic Reward Credit
- Pending/Hold/Reject Status
- Multiple Payment Methods
- Transaction Logging

---

## 📁 Folder Structure

```
BD-TASK-/
├── server/                    # Backend (Node.js + Express)
│   ├── config/
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── telegram.js
│   ├── models/                # Database Models
│   ├── routes/
│   │   ├── user/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── task/
│   │   └── payment/
│   ├── controllers/           # Business Logic
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── security.js
│   ├── services/
│   │   ├── robot-security/    # 🤖 Robotic Security
│   │   ├── reward-engine/
│   │   ├── telegram-bot/
│   │   └── payment/
│   ├── utils/
│   ├── scripts/
│   │   ├── migrate.js
│   │   └── seed.js
│   └── index.js
├── client/                    # Frontend (Next.js + React)
│   ├── app/
│   ├── components/
│   │   ├── user/
│   │   ├── admin/
│   │   └── shared/
│   ├── pages/
│   ├── styles/
│   ├── hooks/
│   └── public/
├── docs/                      # Documentation
├── .env.example
├── .gitignore
└── README.md
```

---

## 🛠️ প্রযুক্তি Stack

| লেয়ার | প্রযুক্তি |
|------|----------|
| **Frontend** | Next.js, React, TailwindCSS |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL |
| **Cache** | Redis |
| **Bot** | Telegram Bot API |
| **Mini App** | Telegram Web Apps |
| **Security** | JWT, Encryption, Rate Limiting |
| **Hosting** | VPS/Cloud |

---

## 🚀 দ্রুত শুরু করুন

### ১. সেটআপ
```bash
# Clone করুন
git clone https://github.com/robiulbhai2766-byte/BD-TASK-.git
cd BD-TASK-

# Environment সেটআপ করুন
cp .env.example .env
# .env ফাইল এডিট করুন আপনার credentials সহ

# Dependencies ইনস্টল করুন
cd server && npm install
cd ../client && npm install
```

### ২. ডাটাবেস সেটআপ
```bash
cd server
npm run db:migrate
npm run db:seed  # Demo data লোড করুন
```

### ৩. ডেভেলপমেন্ট শুরু করুন
```bash
npm run dev
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

---

## 🔐 সিকিউরিটি আর্কিটেকচার

### 🤖 Robotic Security Checks
```
USER ACTION
    ↓
SERVER VERIFICATION
    ↓
🤖 ROBOTIC CHECK
    - Invalid Attempts
    - Duplicate Claims
    - Reused Tokens
    - Rate Limiting
    - Abnormal Patterns
    - Self-Referral
    - Fraud History
    ↓
RISK SCORE (0-100)
    ↓
AUTOMATIC DECISION
    - SAFE → ALLOW
    - WATCH → EXTRA CHECK
    - SUSPICIOUS → PENDING
    - HIGH RISK → HOLD
    - FRAUD → BAN
```

### 🛡️ Protection Layers
1. **Telegram Init-Data Verification**
2. **One-Time Task Tokens**
3. **Server-Side Wallet**
4. **Duplicate Detection**
5. **Rate Limiting**
6. **Behavioral Analysis**
7. **Audit Logging**

---

## 📊 ডাটাবেস Schema

### Core Tables
```
users
├── id, telegram_id, username
├── balance, pending_balance, held_balance
├── created_at, updated_at
└── status (active, suspended, banned)

tasks
├── id, name, provider_id, reward
├── daily_limit, cooldown
├── created_at, updated_at
└── status (active, paused, disabled)

task_claims
├── id, user_id, task_id
├── status (pending, verified, rejected, held)
├── token, completed_at
└── risk_score, robot_decision

rewards
├── id, user_id, task_id
├── amount, status
├── created_at, processed_at
└── verification_data

withdrawals
├── id, user_id, amount
├── status (pending, approved, processing, paid, rejected)
├── payment_method, transaction_id
└── created_at, processed_at

referrals
├── id, referrer_id, referred_user_id
├── reward_earned, status
└── created_at

security_events
├── id, user_id, event_type
├── details, risk_score
└── timestamp, robot_action

audit_logs
├── id, admin_id, action
├── user_id, details
└── timestamp
```

---

## 🤖 Robotic Security Algorithm

### Risk Score Calculation
```
RISK SCORE = Σ(Risk Factors × Weight)

Factors:
├── Same Task Multiple Times → +20
├── Excessive Click Rate → +25
├── Abnormal Time Pattern → +15
├── Self-Referral Detection → +30
├── Duplicate Token → +35
├── High Withdrawal Frequency → +20
├── Unusual Balance Jump → +25
└── Fraud History → +40

Ranges:
🟢 0-30: SAFE
🟡 31-50: WATCH
🟠 51-70: SUSPICIOUS
🔴 71-85: HIGH RISK
⛔ 86-100: CONFIRMED FRAUD
```

---

## 📱 API Endpoints Overview

### User Routes
```
GET  /api/user/profile
GET  /api/user/balance
GET  /api/user/tasks
POST /api/user/claim-task
GET  /api/user/history
GET  /api/user/referral-link
POST /api/user/withdraw
GET  /api/user/security-status
```

### Admin Routes
```
GET  /api/admin/dashboard
GET  /api/admin/users
POST /api/admin/create-task
GET  /api/admin/security-alerts
POST /api/admin/approve-withdrawal
GET  /api/admin/analytics
```

---

## 🧪 টেস্টিং

```bash
# Unit Tests
npm run test

# Integration Tests
npm run test:integration

# E2E Tests
npm run test:e2e
```

---

## 📖 ডকুমেন্টেশন

- [Setup Guide](./docs/SETUP.md)
- [API Documentation](./docs/API.md)
- [Security Guide](./docs/SECURITY.md)
- [Database Schema](./docs/DATABASE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

---

## 📞 সাপোর্ট

কোনো সমস্যা হলে GitHub Issues এ রিপোর্ট করুন।

---

## 📄 লাইসেন্স

MIT License - দেখুন LICENSE ফাইল

---

**🚀 Happy Coding! Made with ❤️ for Bengali Developers**
