-- ==========================================
-- BD-TASK DATABASE SCHEMA
-- ==========================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    username VARCHAR(100) UNIQUE,
    avatar_url TEXT,
    available_balance DECIMAL(15, 2) DEFAULT 0.00,
    pending_balance DECIMAL(15, 2) DEFAULT 0.00,
    held_balance DECIMAL(15, 2) DEFAULT 0.00,
    total_earned DECIMAL(15, 2) DEFAULT 0.00,
    total_withdrawn DECIMAL(15, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, banned
    risk_score INT DEFAULT 0,
    last_activity_at TIMESTAMP,
    device_fingerprint VARCHAR(255),
    ip_address INET,
    country VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_telegram_id ON users(telegram_id);
CREATE INDEX idx_status ON users(status);
CREATE INDEX idx_risk_score ON users(risk_score);

-- 2. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin', -- super_admin, admin, moderator, support
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_email ON admin_users(email);
CREATE INDEX idx_admin_role ON admin_users(role);

-- 3. TELEGRAM SESSIONS TABLE
CREATE TABLE IF NOT EXISTS telegram_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    telegram_id BIGINT NOT NULL,
    init_data TEXT NOT NULL,
    is_valid BOOLEAN DEFAULT true,
    expires_at TIMESTAMP NOT NULL,
    device_info JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_user ON telegram_sessions(user_id);
CREATE INDEX idx_session_telegram ON telegram_sessions(telegram_id);

-- 4. TASKS TABLE
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    reward DECIMAL(10, 2) NOT NULL,
    daily_limit INT DEFAULT 10,
    cooldown_hours INT DEFAULT 0,
    verification_method VARCHAR(50) DEFAULT 'automatic', -- automatic, manual, provider
    provider_id VARCHAR(100),
    provider_name VARCHAR(100),
    task_url TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active', -- active, paused, disabled, archived
    priority INT DEFAULT 0,
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_status ON tasks(status);
CREATE INDEX idx_task_provider ON tasks(provider_id);

-- 5. TASK CLAIMS TABLE (User's task attempts)
CREATE TABLE IF NOT EXISTS task_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'started', -- started, pending, verified, rejected, held, cancelled
    token VARCHAR(255) UNIQUE NOT NULL,
    token_expires_at TIMESTAMP NOT NULL,
    is_token_used BOOLEAN DEFAULT false,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    verified_at TIMESTAMP,
    reward_amount DECIMAL(10, 2),
    risk_score INT DEFAULT 0,
    verification_method VARCHAR(50),
    retry_count INT DEFAULT 0,
    provider_response JSONB,
    rejection_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_claim_user ON task_claims(user_id);
CREATE INDEX idx_claim_task ON task_claims(task_id);
CREATE INDEX idx_claim_status ON task_claims(status);
CREATE INDEX idx_claim_token ON task_claims(token);
CREATE UNIQUE INDEX idx_user_task_single ON task_claims(user_id, task_id) WHERE status = 'verified';

-- 6. REWARDS TABLE
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_claim_id UUID REFERENCES task_claims(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    reward_type VARCHAR(50) DEFAULT 'task', -- task, referral, bonus, adjustment
    status VARCHAR(20) DEFAULT 'pending', -- pending, available, held, reversed, rejected
    reason TEXT,
    robot_decision VARCHAR(50),
    audit_log JSONB DEFAULT '{}',
    hold_reason VARCHAR(255),
    hold_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reward_user ON rewards(user_id);
CREATE INDEX idx_reward_status ON rewards(status);
CREATE INDEX idx_reward_type ON rewards(reward_type);

-- 7. WALLET TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- credit, debit, hold, release
    amount DECIMAL(15, 2) NOT NULL,
    balance_before DECIMAL(15, 2),
    balance_after DECIMAL(15, 2),
    reference_id UUID,
    description TEXT,
    status VARCHAR(20) DEFAULT 'completed', -- completed, pending, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallet_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_type ON wallet_transactions(transaction_type);

-- 8. WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- bkash, nagad, paypal, crypto
    payment_method_detail JSONB NOT NULL, -- phone, address, etc.
    status VARCHAR(30) DEFAULT 'pending', -- pending, approved, processing, paid, rejected, cancelled
    risk_score INT DEFAULT 0,
    robot_decision VARCHAR(50),
    verification_note TEXT,
    payment_gateway_id VARCHAR(100),
    payment_confirmation_id VARCHAR(100),
    processed_at TIMESTAMP,
    paid_at TIMESTAMP,
    hold_reason VARCHAR(255),
    hold_until TIMESTAMP,
    rejection_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_withdrawal_user ON withdrawals(user_id);
CREATE INDEX idx_withdrawal_status ON withdrawals(status);

-- 9. PAYMENT METHODS TABLE
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    method_detail JSONB NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    is_primary BOOLEAN DEFAULT false,
    verification_code VARCHAR(50),
    verification_code_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_user ON payment_methods(user_id);

-- 10. REFERRALS TABLE
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    reward_amount DECIMAL(10, 2),
    reward_status VARCHAR(20) DEFAULT 'pending', -- pending, earned, paid, reversed
    is_valid BOOLEAN DEFAULT true,
    invalid_reason VARCHAR(255),
    referee_first_task_at TIMESTAMP,
    referee_first_withdrawal_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referral_referrer ON referrals(referrer_id);
CREATE INDEX idx_referral_referee ON referrals(referee_id);
CREATE INDEX idx_referral_code ON referrals(referral_code);

-- 11. RISK SCORES TABLE
CREATE TABLE IF NOT EXISTS risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INT NOT NULL,
    level VARCHAR(20), -- safe, watch, suspicious, high_risk, fraud
    factors JSONB DEFAULT '{}',
    decision VARCHAR(50), -- allow, verify, hold, block, ban
    robot_checks JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_risk_user ON risk_scores(user_id);
CREATE INDEX idx_risk_score ON risk_scores(score);

-- 12. SECURITY EVENTS TABLE
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- login, suspicious_activity, failed_verification, fraud_detected
    severity VARCHAR(20) DEFAULT 'info', -- info, warning, critical
    description TEXT,
    ip_address INET,
    device_info JSONB,
    action_taken VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_user ON security_events(user_id);
CREATE INDEX idx_security_type ON security_events(event_type);

-- 13. SECURITY RULES TABLE
CREATE TABLE IF NOT EXISTS security_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    rule_type VARCHAR(50), -- behavior, payment, account, fraud
    condition JSONB NOT NULL,
    action VARCHAR(50) NOT NULL, -- allow, flag, hold, block, ban
    risk_score_impact INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    priority INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- 15. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50), -- reward, withdrawal, alert, info
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_user ON notifications(user_id);
CREATE INDEX idx_notification_read ON notifications(is_read);

-- 16. SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'open', -- open, replied, resolved, closed
    priority VARCHAR(20) DEFAULT 'normal',
    assigned_to UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX idx_ticket_user ON support_tickets(user_id);
CREATE INDEX idx_ticket_status ON support_tickets(status);

-- 17. SUPPORT TICKET REPLIES TABLE
CREATE TABLE IF NOT EXISTS ticket_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_type VARCHAR(20), -- user, admin
    sender_id UUID,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reply_ticket ON ticket_replies(ticket_id);

-- 18. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES admin_users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_setting_key ON system_settings(setting_key);

-- 19. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, maintenance, alert, promotion
    target_audience VARCHAR(50) DEFAULT 'all', -- all, users, admins
    is_active BOOLEAN DEFAULT true,
    show_popup BOOLEAN DEFAULT false,
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    created_by UUID NOT NULL REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcement_active ON announcements(is_active);

-- 20. AD VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS ad_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_claim_id UUID NOT NULL REFERENCES task_claims(id) ON DELETE CASCADE,
    verification_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verification_method VARCHAR(50),
    provider_confirmation BOOLEAN DEFAULT false,
    provider_response JSONB,
    is_verified BOOLEAN DEFAULT false,
    verification_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verification_claim ON ad_verifications(task_claim_id);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_users_created ON users(created_at DESC);
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);
CREATE INDEX idx_rewards_created ON rewards(created_at DESC);
CREATE INDEX idx_claims_created ON task_claims(created_at DESC);
CREATE INDEX idx_withdrawals_created ON withdrawals(created_at DESC);

-- TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_tasks_updated BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_claims_updated BEFORE UPDATE ON task_claims
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_rewards_updated BEFORE UPDATE ON rewards
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_withdrawals_updated BEFORE UPDATE ON withdrawals
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
