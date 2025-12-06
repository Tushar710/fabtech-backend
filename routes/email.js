const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

// Send quotation email with PDF attachment
router.post('/send-quotation', auth, async (req, res) => {
  try {
    const { 
      toEmail, 
      toName, 
      quotationNumber, 
      totalAmount, 
      validUntil, 
      pdfBase64,
      items,
      notes 
    } = req.body;

    const transporter = createTransporter();

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: toEmail,
      subject: `Quotation ${quotationNumber} - ${process.env.BUSINESS_NAME || 'FABTECH'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Quotation Details</h2>
          
          <p>Dear ${toName},</p>
          
          <p>Please find attached your quotation details:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📋 Quotation Summary</h3>
            <p><strong>Quotation Number:</strong> ${quotationNumber}</p>
            <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
            <p><strong>Valid Until:</strong> ${validUntil}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h4>Items:</h4>
            <ul>
              ${items.map(item => 
                `<li>${item.productName} - Qty: ${item.quantity} - ₹${item.totalPrice.toLocaleString()}</li>`
              ).join('')}
            </ul>
          </div>
          
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
          
          <p>For any queries, please feel free to contact us.</p>
          
          <p>Best regards,<br>
          ${process.env.BUSINESS_NAME || 'FABTECH'}</p>
        </div>
      `,
      attachments: [
        {
          filename: `Quotation_${quotationNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    
    res.json({ 
      success: true, 
      message: 'Email sent successfully with PDF attachment' 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email',
      error: error.message 
    });
  }
});

module.exports = router;
