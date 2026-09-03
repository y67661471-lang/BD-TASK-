# 🎯 BD-TASK | Telegram Mini App - Watch Ads & Earn

## 📋 Overview

সম্পূর্ণ **Telegram Mini App** সিস্টেম যেখানে ব্যবহারকারীরা বিজ্ঞাপন দেখে আয় করতে পারবে। এটি একটি সম্পূর্ণ প্ল্যাটফর্ম যা নিম্নোক্ত বৈশিষ্ট্য সমর্থন করে:

### ✨ প্রধান বৈশিষ্ট্য

- ✅ **Telegram Mini App Integration** - সরাসরি টেলিগ্রাম থেকে অ্যাক্সেস করুন
- ✅ **User Management System** - প্রোফাইল, টাস্ক, ওয়ালেট, রেফারেল
- ✅ **Earning System** - বিজ্ঞাপন দেখে আয় করুন
- ✅ **Referral Program** - বন্ধুদের আমন্ত্রণ জানান এবং উপার্জন করুন
- ✅ **Security System** - টোকেন ভেরিফিকেশন এবং ফ্রড ডিটেকশন
- ✅ **Withdrawal System** - স্বয়ংক্রিয় পেমেন্ট প্রসেসিং
- ✅ **Admin Dashboard** - সম্পূর্ণ নিয়ন্ত্রণ এবং লাইভ মনিটরিং

---

## 🚀 দ্রুত শুরু করুন

### প্রয়োজনীয় প্রয়োজনীয়তা

- **Node.js** v16+
- **npm** v8+
- **Telegram Bot Token** (@BotFather থেকে পান)

### ইনস্টলেশন

```bash
# রিপোজিটরি ক্লোন করুন
git clone https://github.com/y67661471-lang/BD-TASK-.git
cd BD-TASK-

# ডিপেন্ডেন্সি ইনস্টল করুন
npm install

# পরিবেশ ভেরিয়েবল সেটআপ করুন
cp .env.example .env
# আপনার শংসাপত্র দিয়ে .env সম্পাদনা করুন

# ডেভেলপমেন্ট সার্ভার শুরু করুন
npm run dev
```

---

## 📁 প্রজেক্ট স্ট্রাকচার

```
BD-TASK-/
├── index.js                     # মূল সার্ভার ফাইল
├── package.json                 # ডিপেন্ডেন্সি এবং স্ক্রিপ্ট
├── .env                          # পরিবেশ ভেরিয়েবল
├── .env.example                  # উদাহরণ এনভায়রনমেন্ট ফাইল
├── .gitignore                    # গিট ইগনোর ফাইল
├── README.md                     # এই ফাইল
│
├── src/
│   ├── telegram/
│   │   ├── botHandler.js         # বট ইভেন্ট হ্যান্ডলার
│   │   └── webhookSetup.js       # ওয়েবহুক কনফিগারেশন
│   │
│   ├── services/
│   │   └── notificationService.js # নোটিফিকেশন সেবা
│   │
│   ├── events/
│   │   └── eventEmitter.js       # ইভেন্ট ইমিটার
│   │
│   ├── models/
│   │   └── userModel.js          # ইউজার ডাটাবেস মডেল
│   │
│   └── routes/
│       └── index.js              # API রুট এবং এন্ডপয়েন্ট
│
├── data/
│   └── users.json                # ইউজার ডাটাবেস (JSON)
│
└── logs/
    └── bot.log                   # লগ ফাইল
```

---

## 🔌 API এন্ডপয়েন্ট

### ✅ স্বাস্থ্য পরীক্ষা

```bash
GET /health
```

**রেসপন্স:**
```json
{
  "status": "Server is running! 🚀",
  "timestamp": "2026-09-03T...",
  "botName": "BDTASK"
}
```

### 📊 সার্ভার স্ট্যাটাস

```bash
GET /status
```

### 👤 ইউজার ম্যানেজমেন্ট

#### নতুন ইউজার তৈরি করুন
```bash
POST /api/user
Content-Type: application/json

{
  "userId": "123456789",
  "userName": "test_user",
  "firstName": "Test User"
}
```

#### ইউজার তথ্য পান
```bash
GET /api/user/:userId
```

#### ব্যালেন্স আপডেট করুন
```bash
POST /api/user/:userId/balance
Content-Type: application/json

{
  "amount": 500
}
```

#### রেফারেল যুক্ত করুন
```bash
POST /api/referral/:userId
Content-Type: application/json

{
  "referralId": "987654321"
}
```

### 📈 পরিসংখ্যান

#### সমস্ত ইউজার দেখুন
```bash
GET /api/users/all
```

#### ইউজার পরিসংখ্যান
```bash
GET /api/stats/users
```

---

## 🤖 টেলিগ্রাম বট কমান্ড

| কমান্ড | বিবরণ |
|--------|--------|
| `/start` | বট শুরু করুন এবং নিবন্ধন করুন |
| `/status` | বর্তমান অবস্থা দেখুন |
| `/balance` | আপনার ব্যালেন্স দেখুন |
| `/help` | সাহায্য এবং তথ্য পান |

---

## ⚙️ কনফিগারেশন (.env ফাইল)

```bash
# টেলিগ্রাম কনফিগারেশন
TELEGRAM_BOT_TOKEN=আপনার_বট_টোকেন
TELEGRAM_BOT_USERNAME=@আপনার_বট_ইউজারনেম
TELEGRAM_BOT_NAME=BDTASK

# সার্ভার কনফিগারেশন
PORT=3000
NODE_ENV=development
WEBHOOK_URL=https://yourdomain.com/webhook

# ডাটাবেস
DB_PATH=./data/users.json

# লগিং
LOG_LEVEL=info
LOG_FILE=./logs/bot.log
```

---

## 🛠️ উন্নয়ন কমান্ড

```bash
# ডেভেলপমেন্ট মোডে চালান (auto-restart সহ)
npm run dev

# প্রোডাকশনে চালান
npm start

# টেস্ট চালান
npm test

# লিন্ট চেক করুন
npm run lint
```

---

## 📦 ডিপেন্ডেন্সি

| প্যাকেজ | সংস্করণ | উদ্দেশ্য |
|---------|---------|----------|
| express | ^4.18.2 | ওয়েব ফ্রেমওয়ার্ক |
| dotenv | ^16.0.3 | এনভায়রনমেন্ট ভেরিয়েবল |
| node-telegram-bot-api | ^0.61.0 | টেলিগ্রাম ইন্টিগ্রেশন |
| axios | ^1.4.0 | HTTP ক্লায়েন্ট |

---

## 🔐 নিরাপত্তা

- ✅ পরিবেশ ভেরিয়েবল সুরক্ষিত রাখুন
- ✅ সংবেদনশীল তথ্য `.gitignore` এ রাখুন
- ✅ নিয়মিত আপডেট এবং প্যাচ প্রয়োগ করুন
- ✅ ইনপুট ভ্যালিডেশন সর্বদা করুন

---

## 📝 লাইসেন্স

MIT License - বিস্তারিত জন্য LICENSE ফাইল দেখুন

---

## 🤝 অবদান রাখুন

অবদান স্বাগত জানাই! প্রথমে CONTRIBUTING.md পড়ুন।

---

## 📞 সহায়তা

যেকোনো সমস্যা বা প্রশ্নের জন্য একটি GitHub issue খুলুন।

---

## 📊 প্রজেক্ট তথ্য

| তথ্য | বিবরণ |
|------|--------|
| **সংস্করণ** | 1.0.0 |
| **শেষ আপডেট** | 2026-09-03 |
| **ভাষা** | JavaScript (Node.js) |
| **লাইসেন্স** | MIT |
| **টেলিগ্রাম বট** | @BDTASK53_bot |

---

**✨ Happy Coding! আপনার BDTASK বট এখন চালুর জন্য প্রস্তুত! 🚀**
