const nodemailer = require('nodemailer');
const ALLOWED_ORIGIN = 'https://reworkqualityleonisystem.netlify.app';

/**
 * API Route: /api/test-email
 * Method: GET or POST
 * Purpose: Test email functionality
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  try {
    console.log('🧪 Testing email functionality...');

    // Create Gmail transporter with direct credentials
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'fatimzahraelhansali@gmail.com',
        pass: 'zovc fdrx wqsj ugsb'
      }
    });

    // Test email content
    const mailOptions = {
      from: 'fatimzahraelhansali@gmail.com',
      to: 'mehdifadil2103@gmail.com',
      subject: 'Test Email - Quality App API System',
      text: 'This is a test email from the Quality App API server. If you receive this, the email system is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; text-align: center;">
            <h2 style="color: #155724; margin: 0 0 15px 0;">✅ Test Email Successful</h2>
            <p style="margin: 0; font-size: 16px; color: #155724;">
              Your Quality App API server is working correctly!
            </p>
            <p style="margin: 15px 0 0 0; font-size: 14px; color: #155724;">
              Email sent at: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `
    };

    // Send test email
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully:', result.messageId);

    return res.status(200).json({
      success: true,
      message: 'Test email sent successfully!',
      emailId: result.messageId,
      sentTo: 'lamiaa.ityel@leoni.com',
      sentFrom: 'fatimzahraelhansali@gmail.com',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test email failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
