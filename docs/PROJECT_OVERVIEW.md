# 📊 BD-TASK | সম্পূর্ণ প্রজেক্ট ওভারভিউ

## 🎯 মূল লক্ষ্য

টেলিগ্রাম ব্যবহারকারীদের জন্য একটি **সম্পূর্ণ বিজ্ঞাপন দেখে আয় প্ল্যাটফর্ম** যেখানে:

✅ ব্যবহারকারীরা বিজ্ঞাপন দেখে অর্থ অর্জন করেন  
✅ অ্যাডমিন সম্পূর্ণ নিয়ন্ত্রণ পান  
✅ প্রতিটি অ্যাকশন স্বয়ংক্রিয়ভাবে যাচাই করা হয়  
✅ জালিয়াতি ধরা পড়ে এবং ব্লক করা হয়  

---

## 🔄 সম্পূর্ণ ফ্লো

```
┌─────────────────────────────────────────────────────────────┐
│                    TELEGRAM USER                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   TELEGRAM BOT                              │
│           (/start → Open Mini App)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              MINI APP LOGIN SCREEN                          │
│        (Telegram Init Data Verification)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│          🤖 ROBOTIC PRE-CHECK                               │
│  - Session validation                                       │
│  - User history check                                       │
│  - Device fingerprinting                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
          ┌──────────┼──────────┐
          │          │          │
      SAFE │       WATCH │    SUSPICIOUS
          │          │          │
          ↓          ↓          ↓
     [ALLOW]   [EXTRA CHECK]  [MONITOR]
          │          │          │
          └──────────┼──────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              USER PANEL (HOME)                              │
│  - Profile                                                  │
│  - Balance (Available, Pending, Held)                       │
│  - Available Tasks/Ads                                      │
│  - Daily Bonus                                              │
│  - Notifications                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
          ┌──────────┼──────────���
          │          │          │
      WATCH ADS│   REFERRAL│   WALLET
          │          │          │
          ↓          ↓          ↓
     [TASKS]  [EARN]      [WITHDRAW]
```

---

## 🎬 WATCH ADS & EARN FLOW

```
USER CLICKS "START TASK"
           ↓
    🤖 PRE-CHECK
    - User risk score
    - Daily limit check
    - Task eligibility
           ↓
   ┌─SAFE──┬─SUSPICIOUS─┬─HIGH RISK┐
   │       │            │          │
   ↓       ↓            ↓          ↓
[ALLOW] [MONITOR] [VERIFY]    [BLOCK]
   │       │            │          │
   └───────┼────────────┼──────────┘
           ↓
GENERATE UNIQUE TOKEN
    (Single-use, Expiry)
           ↓
 SEND TASK LINK TO PROVIDER
    (with verification token)
           ↓
USER COMPLETES TASK
    (watches ad/completes action)
           ↓
 PROVIDER VERIFIES COMPLETION
    (returns status)
           ↓
🤖 SERVER-SIDE VERIFICATION
    - Token validation
    - Completion confirmation
    - Provider verification
           ↓
🤖 FINAL ROBOT CHECK
    - Duplicate detection
    - Timing analysis
    - Behavior pattern
    - Fraud indicators
           ↓
    ┌─SAFE─┬─PENDING─┬─HOLD──┬─REJECT┐
    │      │         │       │       │
    ↓      ↓         ↓       ↓       ↓
 [CREDIT] [WAIT] [VERIFY] [REVIEW] [DENY]
    │      │         │       │       │
    └──────┼─────────┴───────┴───────┘
           ↓
    💰 ADD TO BALANCE
    (Pending or Available)
           ↓
NOTIFY USER
```

---

## 💳 WITHDRAWAL FLOW

```
USER CLICKS "WITHDRAW"
           ↓
    ENTER AMOUNT
           ↓
SELECT PAYMENT METHOD
    (bKash, Nagad, etc.)
           ↓
🤖 WITHDRAWAL ROBOT
    ├─ Balance Verification
    ├─ Minimum Check
    ├─ Risk Score Check
    ├─ Duplicate Detection
    ├─ Fraud History
    └─ Withdrawal Pattern
           ↓
    ┌─SAFE─┬─SUSPICIOUS─┬─FRAUD────┐
    │      │            │          │
    ↓      ↓            ↓          ↓
 [APPROVE] [HOLD]  [MANUAL REVIEW] [REJECT]
    │      │            │          │
    └──────┼────────────┴──────────┘
           ↓
    PAYMENT QUEUE
           ↓
    PROCESS PAYMENT
    (via payment gateway)
           ↓
    PAYMENT CONFIRMATION
           ↓
    NOTIFY USER
```

---

## 🤖 ROBOTIC SECURITY SYSTEM

### Risk Score Calculation

```
RISK_SCORE = 0

// User Behavior
IF (excessive_task_attempts) → +15
IF (rapid_completion) → +20
IF (suspicious_timing) → +10
IF (abnormal_pattern) → +15

// Account Status
IF (new_account) → +10
IF (unverified_email) → +5
IF (previous_fraud) → +50
IF (low_device_trust) → +10

// Withdrawal Patterns
IF (immediate_withdrawal) → +15
IF (max_amount_requested) → +10
IF (multiple_methods) → +8

// Referral Activity
IF (self_referral) → +40
IF (bulk_referrals) → +20
IF (fake_referrals) → +50

FINAL_RISK_SCORE = Σ
```

### Decision Matrix

```
🟢 0-30:   SAFE          → ALLOW
🟡 31-50:  WATCH         → EXTRA VERIFICATION
🟠 51-70:  SUSPICIOUS    → PENDING
🔴 71-85:  HIGH RISK     → HOLD
⛔ 86-100: CONFIRMED     → BLOCK/BAN
```

---

## 📊 DATABASE ENTITIES

### users
```
id (UUID)
telgram_id (BIGINT, UNIQUE)
first_name
last_name
username
avatar_url
available_balance (DECIMAL)
pending_balance (DECIMAL)
held_balance (DECIMAL)
total_earned (DECIMAL)
total_withdrawn (DECIMAL)
status (active, suspended, banned)
risk_score (INT)
created_at
updated_at
```

### tasks
```
id (UUID)
name
reward (DECIMAL)
daily_limit (INT)
cooldown_hours (INT)
verification_method
start_date
end_date
status (active, paused, disabled)
created_at
```

### task_claims
```
id (UUID)
user_id (FK)
task_id (FK)
status (started, pending, verified, rejected, held)
token (UNIQUE)
started_at
completed_at
verified_at
reward_amount
risk_score
verification_method
retry_count
```

### rewards
```
id (UUID)
user_id (FK)
task_claim_id (FK)
amount
status (pending, available, held, reversed)
reason
audit_log
created_at
```

### withdrawals
```
id (UUID)
user_id (FK)
amount
payment_method
status (pending, approved, processing, paid, rejected)
risk_score
verification_note
payment_gateway_id
processed_at
```

---

## 🔐 Security Checks

### 1. Telegram Auth Verification
- Init data validation
- Signature verification
- Expiry check

### 2. One-Time Token
- Unique per task
- Single use only
- Time expiry

### 3. Duplicate Protection
- Same user + same task = only one reward
- Token reuse prevention
- Double-claim detection

### 4. Rate Limiting
- Max tasks per hour
- Max completion per day
- Cooldown enforcement

### 5. Behavioral Analysis
- Timing patterns
- Device fingerprinting
- Geolocation tracking
- Click patterns

### 6. Withdrawal Security
- Balance verification
- Risk assessment
- Fraud history
- Payment method validation

---

## 👥 User Roles

### Users
- View tasks
- Complete tasks
- Earn rewards
- Withdraw
- Refer friends

### Admin
- Manage tasks
- Monitor security
- View analytics
- Process withdrawals
- Ban/restrict users
- View audit logs

### Support Staff
- Handle tickets
- Manual verification
- User support
- Issue resolution

---

## 🚀 Technology Stack

- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL + Redis
- **Frontend:** React.js + Tailwind CSS
- **Bot:** Telegram Bot API
- **Mini App:** Telegram Web Apps
- **Authentication:** JWT + Telegram Auth
- **Deployment:** Docker + VPS/Cloud

---

**সবকিছু তৈরি এবং প্রস্তুত!** ✅
