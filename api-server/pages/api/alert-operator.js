const nodemailer = require('nodemailer');

// Create Gmail transporter with direct credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'fatimzahraelhansali@gmail.com',
    pass: 'zovc fdrx wqsj ugsb'
  }
});

/**
 * API Route: /api/alert-operator
 * Method: POST
 * Purpose: Send email alert when operator exceeds defect threshold
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    console.log('🔍 Received alert request:', JSON.stringify(req.body, null, 2));

    // Extract data from request body
    const { 
      operateurNom, 
      nombreOccurrences, 
      previousOccurrences = 0,
      operatorId 
    } = req.body;

    // Validate required fields
    if (!operateurNom || typeof nombreOccurrences !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: operateurNom, nombreOccurrences'
      });
    }

    console.log(`👤 Operator: ${operateurNom}`);
    console.log(`📊 Previous occurrences: ${previousOccurrences}`);
    console.log(`📊 Current occurrences: ${nombreOccurrences}`);

    // Check if alert should be sent (threshold crossed from <=3 to >3)
    if (nombreOccurrences > 3 && previousOccurrences <= 3) {
      console.log(`🚨 ALERT TRIGGERED: ${operateurNom} exceeded 3 defects!`);

      // Send email alert
      const emailResult = await sendEmailAlert(operateurNom, nombreOccurrences);

      // Log success
      console.log(`✅ Alert sent successfully for ${operateurNom}`);

      return res.status(200).json({
        success: true,
        message: `Alert sent for operator ${operateurNom}`,
        emailId: emailResult.messageId,
        operator: operateurNom,
        defectCount: nombreOccurrences,
        timestamp: new Date().toISOString()
      });

    } else {
      console.log(`✅ No alert needed. Occurrences: ${nombreOccurrences} (threshold not crossed)`);
      
      return res.status(200).json({
        success: true,
        message: 'No alert needed - threshold not crossed',
        operator: operateurNom,
        defectCount: nombreOccurrences,
        threshold: 3,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Error processing alert:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Send email alert using Gmail SMTP
 */
async function sendEmailAlert(operatorName, defectCount) {
  try {
    console.log(`📧 Sending email alert for operator: ${operatorName}`);

    const mailOptions = {
      from: 'fatimzahraelhansali@gmail.com',
      to: 'feetyer53@gmail.com',
      subject: 'Operator Defect Alert',
      text: `The operator ${operatorName} has exceeded 3 defects. Immediate action is required.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #721c24; margin: 0 0 15px 0;">⚠️ Operator Defect Alert</h2>
            <p style="margin: 0; font-size: 16px; color: #721c24;">
              <strong>Immediate attention required!</strong>
            </p>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #856404;">Operator Name:</td>
                <td style="padding: 8px 0; color: #856404;">${operatorName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #856404;">Total Defects:</td>
                <td style="padding: 8px 0; color: #856404; font-weight: bold; font-size: 18px;">${defectCount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #856404;">Alert Threshold:</td>
                <td style="padding: 8px 0; color: #856404;">3 defects</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #856404;">Alert Time:</td>
                <td style="padding: 8px 0; color: #856404;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <h3 style="color: #0c5460; margin: 0 0 10px 0;">📋 Action Required</h3>
            <p style="margin: 0; color: #0c5460;">
              This operator has exceeded the defect threshold and requires immediate attention from the quality control team.
            </p>
          </div>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #dee2e6;">
          
          <p style="font-size: 12px; color: #6c757d; text-align: center; margin: 0;">
            This is an automated alert from the Quality Management System<br>
            Generated on ${new Date().toLocaleString()}
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);

    return result;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}
