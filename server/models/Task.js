/**
 * Task Model
 * Handles task-related database operations
 */

const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Task {
  /**
   * Create a new task
   */
  static async create(taskData) {
    const query = `
      INSERT INTO tasks (
        id, name, description, reward, daily_limit, cooldown_hours,
        verification_method, provider_id, provider_name, task_url,
        start_date, end_date, status, priority, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      uuidv4(),
      taskData.name,
      taskData.description || null,
      taskData.reward,
      taskData.daily_limit || 10,
      taskData.cooldown_hours || 0,
      taskData.verification_method || 'automatic',
      taskData.provider_id || null,
      taskData.provider_name || null,
      taskData.task_url || null,
      taskData.start_date || null,
      taskData.end_date || null,
      taskData.status || 'active',
      taskData.priority || 0,
      JSON.stringify(taskData.tags || [])
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get task by ID
   */
  static async getById(taskId) {
    const query = 'SELECT * FROM tasks WHERE id = $1';
    const result = await pool.query(query, [taskId]);
    return result.rows[0] || null;
  }

  /**
   * Get active tasks
   */
  static async getActiveTasks() {
    const query = `
      SELECT * FROM tasks
      WHERE status = 'active'
      AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
      AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
      ORDER BY priority DESC, created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get available tasks for user
   */
  static async getAvailableTasksForUser(userId) {
    const query = `
      SELECT t.* FROM tasks t
      LEFT JOIN task_claims tc ON t.id = tc.task_id AND tc.user_id = $1 AND tc.status = 'verified'
      WHERE t.status = 'active'
      AND (t.start_date IS NULL OR t.start_date <= CURRENT_TIMESTAMP)
      AND (t.end_date IS NULL OR t.end_date >= CURRENT_TIMESTAMP)
      AND tc.id IS NULL
      ORDER BY t.priority DESC, t.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get all tasks with pagination
   */
  static async getAllTasks(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM tasks
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Update task
   */
  static async update(taskId, updateData) {
    const allowedFields = ['name', 'description', 'reward', 'daily_limit', 'cooldown_hours', 'status', 'priority'];
    const setClause = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (setClause.length === 0) return null;

    values.push(taskId);
    const query = `UPDATE tasks SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get task statistics
   */
  static async getStatistics() {
    const query = `
      SELECT
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END) as active_tasks,
        COUNT(DISTINCT tc.id) as total_claims,
        COUNT(DISTINCT CASE WHEN tc.status = 'verified' THEN tc.id END) as verified_claims,
        COUNT(DISTINCT CASE WHEN tc.status = 'rejected' THEN tc.id END) as rejected_claims,
        COUNT(DISTINCT CASE WHEN tc.status = 'held' THEN tc.id END) as held_claims,
        COALESCE(SUM(CASE WHEN tc.status = 'verified' THEN r.amount ELSE 0 END), 0) as total_rewards_issued
      FROM tasks t
      LEFT JOIN task_claims tc ON t.id = tc.task_id
      LEFT JOIN rewards r ON tc.id = r.task_claim_id
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = Task;
