/**
 * Database Seeding Script
 * Run this to seed demo data
 */

const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const sampleTasks = [
  {
    name: 'Watch Video Ad - 30 seconds',
    description: 'Watch a 30-second advertisement and complete verification',
    reward: 0.5,
    daily_limit: 5,
    cooldown_hours: 2,
    verification_method: 'automatic',
    provider_name: 'Video Network',
    priority: 10
  },
  {
    name: 'Click & Survey',
    description: 'Click the banner and complete a short survey',
    reward: 1.0,
    daily_limit: 3,
    cooldown_hours: 4,
    verification_method: 'provider',
    provider_name: 'Survey Hub',
    priority: 8
  },
  {
    name: 'Download & Install',
    description: 'Download and install the app, complete verification',
    reward: 2.5,
    daily_limit: 2,
    cooldown_hours: 24,
    verification_method: 'manual',
    provider_name: 'App Promo',
    priority: 5
  },
  {
    name: 'Social Media Follow',
    description: 'Follow our social media account and verify',
    reward: 0.2,
    daily_limit: 10,
    cooldown_hours: 1,
    verification_method: 'automatic',
    provider_name: 'Social Network',
    priority: 15
  }
];

const sampleRules = [
  {
    rule_name: 'excessive_task_attempts',
    rule_type: 'behavior',
    condition: { tasks_per_hour: { greater_than: 20 } },
    action: 'flag',
    risk_score_impact: 15
  },
  {
    rule_name: 'rapid_completion',
    rule_type: 'behavior',
    condition: { completion_time_seconds: { less_than: 5 } },
    action: 'flag',
    risk_score_impact: 20
  },
  {
    rule_name: 'self_referral',
    rule_type: 'fraud',
    condition: { same_device_referral: true },
    action: 'block',
    risk_score_impact: 50
  },
  {
    rule_name: 'immediate_withdrawal',
    rule_type: 'payment',
    condition: { first_withdrawal_after_hours: { less_than: 1 } },
    action: 'hold',
    risk_score_impact: 15
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // 1. Create admin user
    const adminId = uuidv4();
    const adminPassword = await bcrypt.hash('admin123', 10);

    await pool.query(`
      INSERT INTO admin_users (id, name, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, [
      adminId,
      'Super Admin',
      'admin@bdtask.com',
      adminPassword,
      'super_admin'
    ]);

    console.log('✅ Admin user created');

    // 2. Create sample tasks
    for (const task of sampleTasks) {
      await pool.query(`
        INSERT INTO tasks (
          id, name, description, reward, daily_limit, cooldown_hours,
          verification_method, provider_name, status, priority
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING
      `, [
        uuidv4(),
        task.name,
        task.description,
        task.reward,
        task.daily_limit,
        task.cooldown_hours,
        task.verification_method,
        task.provider_name,
        'active',
        task.priority
      ]);
    }

    console.log('✅ Sample tasks created');

    // 3. Create security rules
    for (const rule of sampleRules) {
      await pool.query(`
        INSERT INTO security_rules (
          id, rule_name, rule_type, condition, action, risk_score_impact, is_active, priority
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (rule_name) DO NOTHING
      `, [
        uuidv4(),
        rule.rule_name,
        rule.rule_type,
        JSON.stringify(rule.condition),
        rule.action,
        rule.risk_score_impact,
        true,
        0
      ]);
    }

    console.log('✅ Security rules created');

    // 4. Create system settings
    const settings = [
      { key: 'app_name', value: { en: 'BD-TASK', bn: 'বিডি-টাস্ক' } },
      { key: 'min_withdrawal', value: 10 },
      { key: 'max_withdrawal_per_day', value: 500 },
      { key: 'fraud_threshold', value: 85 },
      { key: 'warning_threshold', value: 50 },
      { key: 'maintenance_mode', value: false }
    ];

    for (const setting of settings) {
      await pool.query(`
        INSERT INTO system_settings (id, setting_key, setting_value)
        VALUES ($1, $2, $3)
        ON CONFLICT (setting_key) DO NOTHING
      `, [
        uuidv4(),
        setting.key,
        JSON.stringify(setting.value)
      ]);
    }

    console.log('✅ System settings created');
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Admin Credentials:');
    console.log('   Email: admin@bdtask.com');
    console.log('   Password: admin123');
    console.log('\n⚠️  Please change the admin password in production!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
