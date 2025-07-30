import PlannedPayment from "../models/PlannedPayment.js";

class ReminderSystem {
    // Get all payments that need reminders
    async getPaymentsDueForReminders() {
        try {
            const now = new Date();
            const currentMonth = now.toISOString().slice(0, 7);
            const currentDay = now.getDate();

            // Find active payments
            const activePayments = await PlannedPayment.find({ 
                isActive: true 
            }).populate('user', 'name email');

            const reminders = [];

            for (const payment of activePayments) {
                // Skip if payment is already settled this month
                if (!payment.isDueThisMonth()) {
                    continue;
                }

                if (payment.paymentType === 'income') {
                    // Income reminders: on due date and daily after
                    if (payment.needsIncomeReminder()) {
                        const daysOverdue = Math.max(0, currentDay - payment.dueDay);
                        reminders.push({
                            payment: payment,
                            reminderType: 'income',
                            daysOverdue: daysOverdue,
                            message: daysOverdue === 0 
                                ? `Income reminder: Your income "${payment.title}" of ${this.formatCurrency(payment.amount)} is due today. Have you received it?`
                                : `Income reminder: Your income "${payment.title}" of ${this.formatCurrency(payment.amount)} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue. Have you received it?`
                        });
                    }
                } else {
                    // Expense reminders: existing logic (3 days and 1 day before)
                    const daysUntilDue = payment.dueDay - currentDay;
                    
                    // Check for first reminder (3 days before)
                    if (daysUntilDue <= 3 && daysUntilDue > 1) {
                        const needsFirstReminder = !payment.remindersSent.firstReminderSent || 
                                                 payment.remindersSent.month !== currentMonth;
                        
                        if (needsFirstReminder) {
                            reminders.push({
                                payment: payment,
                                reminderType: 'first',
                                daysUntilDue: daysUntilDue,
                                message: `Reminder: Your payment "${payment.title}" of ${this.formatCurrency(payment.amount)} is due in ${daysUntilDue} days (${payment.dueDay}th)`
                            });
                        }
                    }

                    // Check for second reminder (1 day before)
                    if (daysUntilDue <= 1 && daysUntilDue >= 0) {
                        const needsSecondReminder = !payment.remindersSent.secondReminderSent || 
                                                  payment.remindersSent.month !== currentMonth;
                        
                        if (needsSecondReminder) {
                            reminders.push({
                                payment: payment,
                                reminderType: 'second',
                                daysUntilDue: daysUntilDue,
                                message: daysUntilDue === 0 
                                    ? `Final reminder: Your payment "${payment.title}" of ${this.formatCurrency(payment.amount)} is due today!`
                                    : `Final reminder: Your payment "${payment.title}" of ${this.formatCurrency(payment.amount)} is due tomorrow!`
                            });
                        }
                    }
                }
            }

            return reminders;
        } catch (error) {
            console.error('Error getting payments due for reminders:', error);
            throw error;
        }
    }

    // Mark reminder as sent
    async markReminderSent(paymentId, reminderType) {
        try {
            const payment = await PlannedPayment.findById(paymentId);
            if (!payment) {
                throw new Error('Payment not found');
            }

            const currentMonth = new Date().toISOString().slice(0, 7);
            
            if (reminderType === 'first') {
                payment.remindersSent.firstReminderSent = new Date();
            } else if (reminderType === 'second') {
                payment.remindersSent.secondReminderSent = new Date();
            } else if (reminderType === 'income') {
                payment.remindersSent.incomeReminderSent = new Date();
            }
            
            payment.remindersSent.month = currentMonth;
            await payment.save();

            return payment;
        } catch (error) {
            console.error('Error marking reminder as sent:', error);
            throw error;
        }
    }

    // Send reminder (placeholder for email/notification service)
    async sendReminder(reminder) {
        try {
            // TODO: Integrate with email service (e.g., SendGrid, Nodemailer)
            // TODO: Integrate with push notification service
            
            console.log(`[REMINDER] ${reminder.reminderType.toUpperCase()}: ${reminder.message}`);
            console.log(`[REMINDER] User: ${reminder.payment.user.name} (${reminder.payment.user.email})`);
            
            // Mark reminder as sent
            await this.markReminderSent(reminder.payment._id, reminder.reminderType);
            
            return {
                success: true,
                message: `${reminder.reminderType} reminder sent successfully`,
                sentTo: reminder.payment.user.email
            };
        } catch (error) {
            console.error('Error sending reminder:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Process all pending reminders
    async processReminders() {
        try {
            const reminders = await this.getPaymentsDueForReminders();
            console.log(`[REMINDER SYSTEM] Found ${reminders.length} reminders to process`);

            const results = [];
            for (const reminder of reminders) {
                const result = await this.sendReminder(reminder);
                results.push({
                    paymentId: reminder.payment._id,
                    paymentTitle: reminder.payment.title,
                    reminderType: reminder.reminderType,
                    ...result
                });
            }

            return {
                success: true,
                processedCount: results.length,
                results: results
            };
        } catch (error) {
            console.error('Error processing reminders:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Helper method to format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'MYR'
        }).format(amount);
    }

    // Get overdue payments
    async getOverduePayments() {
        try {
            const activePayments = await PlannedPayment.find({ 
                isActive: true 
            }).populate('user', 'name email');

            const overduePayments = activePayments.filter(payment => payment.isOverdue());
            
            return overduePayments.map(payment => ({
                ...payment.toObject(),
                status: payment.getStatus(),
                daysOverdue: new Date().getDate() - payment.dueDay
            }));
        } catch (error) {
            console.error('Error getting overdue payments:', error);
            throw error;
        }
    }
}

export default new ReminderSystem();

/*
USAGE EXAMPLE FOR BACKGROUND JOBS:

// Using node-cron for scheduling
import cron from 'node-cron';
import ReminderSystem from './utils/reminderSystem.js';

// Run reminder check daily at 9:00 AM
cron.schedule('0 9 * * *', async () => {
    console.log('Running daily reminder check...');
    const result = await ReminderSystem.processReminders();
    console.log('Reminder check completed:', result);
});

// Or manually trigger reminders:
app.get('/api/admin/process-reminders', async (req, res) => {
    const result = await ReminderSystem.processReminders();
    res.json(result);
});
*/ 