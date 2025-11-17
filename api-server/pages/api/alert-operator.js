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

    // Check if alert should be sent based on defect thresholds
    let alertLevel = null;
    let emailResult = null;

    // Determine which threshold was crossed
    if (nombreOccurrences >= 7 && previousOccurrences < 7) {
      alertLevel = 7;
    } else if (nombreOccurrences >= 5 && previousOccurrences < 5) {
      alertLevel = 5;
    } else if (nombreOccurrences >= 3 && previousOccurrences < 3) {
      alertLevel = 3;
    }

    if (alertLevel) {
      console.log(`🚨 ALERT TRIGGERED: ${operateurNom} reached ${alertLevel} defects! (Level ${alertLevel} escalation)`);

      // Send email alert for the appropriate level
      emailResult = await sendEscalationAlert(operateurNom, nombreOccurrences, alertLevel);

      // Log success
      console.log(`✅ Level ${alertLevel} alert sent successfully for ${operateurNom}`);

      return res.status(200).json({
        success: true,
        message: `Level ${alertLevel} escalation alert sent for operator ${operateurNom}`,
        emailId: emailResult.messageId,
        operator: operateurNom,
        defectCount: nombreOccurrences,
        escalationLevel: alertLevel,
        recipients: getEmailConfigForLevel(alertLevel, operateurNom).recipients,
        timestamp: new Date().toISOString()
      });

    } else {
      console.log(`✅ No alert needed. Occurrences: ${nombreOccurrences} (no threshold crossed)`);
      
      return res.status(200).json({
        success: true,
        message: 'No alert needed - no threshold crossed',
        operator: operateurNom,
        defectCount: nombreOccurrences,
        previousCount: previousOccurrences,
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
 * Send escalation alert based on defect level
 */
async function sendEscalationAlert(operatorName, defectCount, level) {
  try {
    console.log(`📧 Sending Level ${level} escalation alert for operator: ${operatorName}`);

    // Get email configuration based on escalation level
    const emailConfig = getEmailConfigForLevel(level, operatorName);

    const mailOptions = {
      from: 'fatimzahraelhansali@gmail.com',
      to: emailConfig.recipients,
      subject: emailConfig.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #dc3545;">
              <h1 style="color: #dc3545; margin: 0; font-size: 24px;">⚠️ ESCALATION NIVEAU ${level}</h1>
              <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 14px;">Système de Gestion Qualité - Notification Automatique</p>
            </div>

            <!-- Alert Level Badge -->
            <div style="text-align: center; margin-bottom: 25px;">
              <span style="background-color: ${level === 7 ? '#dc3545' : level === 5 ? '#fd7e14' : '#ffc107'}; 
                           color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 16px;">
                ${defectCount} Défauts Internes
              </span>
            </div>

            <!-- Main Content -->
            <div style="background-color: #f8f9fa; border-left: 4px solid #dc3545; padding: 20px; margin-bottom: 25px;">
              ${emailConfig.message}
            </div>

            <!-- Operator Info -->
            <div style="background-color: #e9ecef; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; font-weight: bold; color: #495057; width: 150px;">Opérateur:</td>
                  <td style="padding: 5px 0; color: #495057;">${operatorName}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold; color: #495057;">Nombre de défauts:</td>
                  <td style="padding: 5px 0; color: #dc3545; font-weight: bold; font-size: 18px;">${defectCount}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold; color: #495057;">Niveau d'escalation:</td>
                  <td style="padding: 5px 0; color: #495057;">Niveau ${level}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold; color: #495057;">Date et heure:</td>
                  <td style="padding: 5px 0; color: #495057;">${new Date().toLocaleString('fr-FR')}</td>
                </tr>
              </table>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="font-size: 12px; color: #6c757d; margin: 0;">
                Notification automatique générée par le Système de Gestion Qualité<br>
                LEONI Wiring Systems - ${new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>

          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Level ${level} email sent successfully:`, result.messageId);
    console.log(`📧 Recipients: ${emailConfig.recipients}`);

    return result;
  } catch (error) {
    console.error(`❌ Error sending Level ${level} email:`, error);
    throw error;
  }
}

/**
 * Get email configuration based on escalation level
 */
function getEmailConfigForLevel(level, operatorName) {
  const configs = {
    3: {
      recipients: 'mehdifadil2103@gmail.com',
      subject: `RE: Notification – Sensibilisation opérateur ${operatorName} – 3 défauts internes_Escalation_Niveau 1`,
      message: `
        Bonjour,<br><br>
        L'opérateur <strong>${operatorName}</strong> a atteint <strong>3 défauts internes</strong> aujourd'hui.<br><br>
        Conformément à notre procédure, une sensibilisation sur terrain est requise, incluant :<br>
        • Une reformation immédiate par le formateur ligne,<br>
        • Un entretien avec le Shift Leader, l'agent qualité, et le coordinateur formateur,<br>
        • La signature d'un engagement écrit par l'opérateur.<br><br>
        Merci de planifier cette action dans les plus brefs délais.<br><br>
        Cordialement,<br>
        <strong>Service qualité</strong>
      `
    },
    5: {
      recipients: 'mehdifadil2103@gmail.com',
      subject: `RE: Notification – Sensibilisation opérateur ${operatorName} – 5 défauts internes_Escalation_Niveau 2`,
      message: `
        Bonjour,<br><br>
        L'opérateur <strong>${operatorName}</strong> a atteint <strong>5 défauts internes</strong> aujourd'hui.<br><br>
        Il doit être orienté vers l'École de formation pour une requalification, incluant :<br>
        • Un test de vigilance validé par l'agent qualité,<br>
        • Un entretien avec le responsable segment, le responsable qualité, et le coordinateur formateur,<br>
        • La signature d'un engagement écrit par l'opérateur.<br><br>
        Merci de coordonner cette requalification rapidement.<br><br>
        Cordialement,<br>
        <strong>Service qualité</strong>
      `
    },
    7: {
      recipients: 'mehdifadil2103@gmail.com',
      subject: `RE: Notification – Sensibilisation opérateur ${operatorName} – 7 défauts internes_Escalation_Niveau 3`,
      message: `
        Bonjour,<br><br>
        L'opérateur <strong>${operatorName}</strong> a atteint <strong>7 défauts internes</strong> aujourd'hui.<br><br>
        Une 2ème requalification à l'École de formation est requise, accompagnée de :<br>
        • Un entretien avec le PSM, le Responsable Qualité Site, le Responsable Formation École, et le Head of HR,<br>
        • Une décision à prendre :<br>
        &nbsp;&nbsp;→ Si l'opérateur montre un engagement clair → 3ème chance accordée,<br>
        &nbsp;&nbsp;→ Sinon → réorientation ou fin de contrat.<br><br>
        Merci de traiter ce dossier avec attention et diligence.<br><br>
        Cordialement,<br>
        <strong>Service qualité</strong>
      `
    }
  };

  return configs[level] || configs[3]; // Default to level 3 if level not found
}
