import User from '../models/D1User.js';

class CreditService {
  /**
   * Get user credit information
   */
  static async getUserCredits(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user.credits;
    } catch (error) {
      throw new Error(`Error fetching user credits: ${error.message}`);
    }
  }

  /**
   * Add credits to user
   */
  static async addCredits(userId, amount, reason = '') {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (amount <= 0) {
        throw new Error('Amount must be positive');
      }

      user.credits += amount;
      await user.save();

      // Record credit operation log
      this.logCreditOperation(userId, 'add', amount, reason);

      return user.credits;
    } catch (error) {
      throw new Error(`Error adding credits: ${error.message}`);
    }
  }

  /**
   * Deduct user credits
   */
  static async deductCredits(userId, amount, reason = '') {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (amount <= 0) {
        throw new Error('Amount must be positive');
      }

      if (user.credits < amount) {
        throw new Error('Insufficient credits');
      }

      user.credits -= amount;
      await user.save();

      // Record credit operation log
      this.logCreditOperation(userId, 'deduct', amount, reason);

      return user.credits;
    } catch (error) {
      throw new Error(`Error deducting credits: ${error.message}`);
    }
  }

  /**
   * Set user credits (direct setting)
   */
  static async setCredits(userId, amount, reason = '') {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (amount < 0) {
        throw new Error('Amount must be non-negative');
      }

      const oldCredits = user.credits;
      user.credits = amount;
      await user.save();

      // Record credit operation log
      this.logCreditOperation(userId, 'set', amount, reason, oldCredits);

      return {
        credits: user.credits,
        previousCredits: oldCredits
      };
    } catch (error) {
      throw new Error(`Error setting credits: ${error.message}`);
    }
  }

  /**
   * Check if user has sufficient credits
   */
  static async checkSufficientCredits(userId, requiredAmount) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        sufficient: user.credits >= requiredAmount,
        available: user.credits,
        required: requiredAmount
      };
    } catch (error) {
      throw new Error(`Error checking credits: ${error.message}`);
    }
  }

  /**
   * Record credit operation log
   */
  static logCreditOperation(userId, operation, amount, reason = '', previousAmount = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      userId,
      operation,
      amount,
      reason,
      timestamp,
      previousAmount
    };

    // In actual project, this should be logged to database
    console.log('Credit operation:', logEntry);
  }
}

export default CreditService;