const ScheduledMessage = require('../models/ScheduledMessage');
const MessageTemplate = require('../models/MessageTemplate');
const Lead = require('../models/Lead');

class LeadLifecycleMessaging {
  
  // 1. Welcome message when new lead is captured
  static async sendWelcomeMessage(leadId) {
    try {
      const lead = await Lead.findById(leadId);
      if (!lead || !lead.phone) return;

      // Get the latest active welcome template (user's custom template)
      let welcomeTemplate = await MessageTemplate.findOne({ 
        category: 'welcome',
        isActive: true
      }).sort({ updatedAt: -1 }); // Get the most recently updated template

      if (!welcomeTemplate) {
        welcomeTemplate = await MessageTemplate.create({
          name: 'Default Welcome Message',
          description: 'Default welcome message for new leads',
          content: 'नमस्कार {name} जी! आपकी {service} की inquiry के लिए धन्यवाद। हमारी team जल्द ही आपसे संपर्क करेगी। किसी भी जानकारी के लिए हमसे संपर्क करें।',
          variables: ['name', 'service'],
          category: 'welcome',
          isActive: true
        });
      }

      // Schedule welcome message immediately
      const messageContent = await this.generateMessageContent(welcomeTemplate, lead);
      
      await ScheduledMessage.create({
        leadId: leadId,
        templateId: welcomeTemplate._id,
        phoneNumber: this.formatPhoneNumber(lead.phone),
        message: messageContent,
        scheduledFor: new Date(), // Send immediately
        priority: 'high',
        messageType: 'welcome'
      });

      console.log(`✅ Welcome message scheduled for lead: ${lead.name}`);
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  }

  // 2. Assignment notification when lead is assigned to employee
  static async sendAssignmentNotification(leadId, employeeName) {
    try {
      const lead = await Lead.findById(leadId);
      if (!lead || !lead.phone) return;

      // Get the latest active assignment template (user's custom template)
      let assignmentTemplate = await MessageTemplate.findOne({ 
        category: 'assignment',
        isActive: true
      }).sort({ updatedAt: -1 }); // Get the most recently updated template

      if (!assignmentTemplate) {
        assignmentTemplate = await MessageTemplate.create({
          name: 'Default Assignment Notification',
          description: 'Default message sent when lead is assigned to employee',
          content: 'नमस्कार {name} जी! आपकी {service} की inquiry के लिए हमारे {employeeName} आज आपसे संपर्क करेंगे। कृपया call का इंतजार करें।',
          variables: ['name', 'service', 'employeeName'],
          category: 'assignment',
          isActive: true
        });
      }

      // Schedule assignment notification
      const messageContent = await this.generateMessageContent(assignmentTemplate, lead, { employeeName });
      
      await ScheduledMessage.create({
        leadId: leadId,
        templateId: assignmentTemplate._id,
        phoneNumber: this.formatPhoneNumber(lead.phone),
        message: messageContent,
        scheduledFor: new Date(), // Send immediately
        priority: 'high',
        messageType: 'assignment'
      });

      console.log(`✅ Assignment notification scheduled for lead: ${lead.name}`);
    } catch (error) {
      console.error('Error sending assignment notification:', error);
    }
  }

  // 3. Follow-up reminder messages based on scheduled dates
  static async sendFollowUpReminder(leadId, followUpDate, employeeName) {
    try {
      const lead = await Lead.findById(leadId);
      if (!lead || !lead.phone) return;

      // Get the latest active reminder template (user's custom template)
      let reminderTemplate = await MessageTemplate.findOne({ 
        category: 'reminder',
        isActive: true
      }).sort({ updatedAt: -1 }); // Get the most recently updated template

      if (!reminderTemplate) {
        reminderTemplate = await MessageTemplate.create({
          name: 'Default Follow-up Reminder',
          description: 'Default reminder message for scheduled follow-ups',
          content: 'नमस्कार {name} जी! आपकी {service} की inquiry के लिए हमारे {employeeName} आज आपसे संपर्क करेंगे। कृपया call receive करें।',
          variables: ['name', 'service', 'employeeName'],
          category: 'reminder',
          isActive: true
        });
      }

      // Schedule reminder for follow-up date
      const messageContent = await this.generateMessageContent(reminderTemplate, lead, { employeeName });
      
      await ScheduledMessage.create({
        leadId: leadId,
        templateId: reminderTemplate._id,
        phoneNumber: this.formatPhoneNumber(lead.phone),
        message: messageContent,
        scheduledFor: new Date(followUpDate),
        priority: 'medium',
        messageType: 'follow-up'
      });

      console.log(`✅ Follow-up reminder scheduled for lead: ${lead.name} on ${followUpDate}`);
    } catch (error) {
      console.error('Error sending follow-up reminder:', error);
    }
  }

  // 4. Missed call follow-up message
  static async sendMissedCallFollowUp(leadId, nextCallDate, employeeName) {
    try {
      const lead = await Lead.findById(leadId);
      if (!lead || !lead.phone) return;

      // Get the latest active missed-call template (user's custom template)
      let missedCallTemplate = await MessageTemplate.findOne({ 
        category: 'missed-call',
        isActive: true
      }).sort({ updatedAt: -1 }); // Get the most recently updated template

      if (!missedCallTemplate) {
        missedCallTemplate = await MessageTemplate.create({
          name: 'Default Missed Call Follow-up',
          description: 'Default message for missed call follow-up',
          content: 'नमस्कार {name} जी! हमने आपसे संपर्क करने की कोशिश की थी। हमारे {employeeName} अगली बार {nextDate} को आपसे संपर्क करेंगे। कृपया call receive करें।',
          variables: ['name', 'employeeName', 'nextDate'],
          category: 'missed-call',
          isActive: true
        });
      }

      // Format next call date
      const nextDateFormatted = new Date(nextCallDate).toLocaleDateString('hi-IN');
      
      // Schedule missed call follow-up
      const messageContent = await this.generateMessageContent(
        missedCallTemplate, 
        lead, 
        { employeeName, nextDate: nextDateFormatted }
      );
      
      await ScheduledMessage.create({
        leadId: leadId,
        templateId: missedCallTemplate._id,
        phoneNumber: this.formatPhoneNumber(lead.phone),
        message: messageContent,
        scheduledFor: new Date(), // Send immediately
        priority: 'medium',
        messageType: 'missed-call'
      });

      console.log(`✅ Missed call follow-up scheduled for lead: ${lead.name}`);
    } catch (error) {
      console.error('Error sending missed call follow-up:', error);
    }
  }

  // Helper function to generate message content with variables
  static async generateMessageContent(template, lead, extraVars = {}) {
    let content = template.content;
    
    // Default variables
    const variables = {
      name: lead.name || 'Customer',
      company: lead.company || 'your company',
      service: lead.title || 'our services',
      phone: lead.phone || '',
      email: lead.email || '',
      budget: lead.budget || 'your budget',
      source: lead.source || 'website',
      ...extraVars
    };
    
    // Replace all variables in the content
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      content = content.replace(regex, variables[key]);
    });
    
    return content;
  }

  // Helper function to format phone number
  static formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned; // Add India country code
    }
    
    return cleaned;
  }
}

module.exports = LeadLifecycleMessaging;
