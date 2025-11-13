// Email Service for sending automated alerts
// Note: In production, this should use a backend API to send emails securely

export interface EmailAlert {
  operatorName: string;
  defectCount: number;
  defectType: string;
  timestamp: Date;
}

// Email addresses for different alert levels
const EMAIL_ADDRESSES = {
  level3: 'alert.level3@example.com', // 3 defects - Yellow alert
  level5: 'alert.level5@example.com', // 5 defects - Orange alert
  level7: 'alert.level7@example.com', // 7 defects - Red alert
};

// Track sent alerts to avoid duplicates
const sentAlerts = new Map<string, Set<number>>();

/**
 * Generate email details based on alert level
 */
function getAlertDetails(level: number, operatorName: string, defectType: string, defectCount: number, timestamp: Date) {
  const formattedDate = timestamp.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (level === 3) {
    return {
      subject: `⚠️ Alerte Qualité Niveau 1 - ${operatorName}`,
      level: 'NIVEAU 1 - ATTENTION (3 défauts)',
      priority: 'MOYENNE',
      body: `
Bonjour,

Une alerte qualité de niveau 1 a été déclenchée pour l'opérateur suivant :

📋 INFORMATIONS DE L'ALERTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Opérateur        : ${operatorName}
Type de défaut   : ${defectType}
Nombre de défauts: ${defectCount}
Date et heure    : ${formattedDate}
Niveau d'alerte  : ⚠️ ATTENTION (Jaune)

📌 ACTIONS REQUISES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Entretien avec superviseur/technicien qualité
✓ Notification à l'école pour supervision
✓ Analyse des causes racines
✓ Plan d'action correctif à mettre en place

Veuillez prendre les mesures nécessaires dans les plus brefs délais.

Cordialement,
Système de Gestion Qualité
      `
    };
  } else if (level === 5) {
    return {
      subject: `🟠 Alerte Qualité Niveau 2 - ${operatorName} - ACTION URGENTE`,
      level: 'NIVEAU 2 - ÉLEVÉ (5 défauts)',
      priority: 'HAUTE',
      body: `
Bonjour,

Une alerte qualité de niveau 2 (ÉLEVÉ) a été déclenchée pour l'opérateur suivant :

📋 INFORMATIONS DE L'ALERTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Opérateur        : ${operatorName}
Type de défaut   : ${defectType}
Nombre de défauts: ${defectCount}
Date et heure    : ${formattedDate}
Niveau d'alerte  : 🟠 ÉLEVÉ (Orange)

⚠️ ACTIONS REQUISES URGENTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Entretien immédiat avec responsable de secteur
✓ Entretien avec responsable qualité secteur
✓ Notification pour requalification de l'opérateur
✓ Analyse approfondie des causes
✓ Mise en place d'un plan d'action correctif renforcé
✓ Suivi quotidien pendant 1 semaine

Cette situation nécessite une attention immédiate et des mesures correctives renforcées.

Cordialement,
Système de Gestion Qualité
      `
    };
  } else if (level === 7) {
    return {
      subject: `🔴 ALERTE QUALITÉ CRITIQUE - ${operatorName} - INTERVENTION IMMÉDIATE REQUISE`,
      level: 'NIVEAU 3 - CRITIQUE (7 défauts)',
      priority: 'CRITIQUE',
      body: `
Bonjour,

⚠️ UNE ALERTE QUALITÉ CRITIQUE (NIVEAU 3) A ÉTÉ DÉCLENCHÉE ⚠️

📋 INFORMATIONS DE L'ALERTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Opérateur        : ${operatorName}
Type de défaut   : ${defectType}
Nombre de défauts: ${defectCount}
Date et heure    : ${formattedDate}
Niveau d'alerte  : 🔴 CRITIQUE (Rouge)

🚨 ACTIONS IMMÉDIATES OBLIGATOIRES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Entretien IMMÉDIAT avec Plant Section Manager
✓ Entretien avec responsable qualité section
✓ Notification pour 2ème requalification obligatoire
✓ Décision sur la continuité de l'opérateur au poste
✓ Audit complet du processus
✓ Analyse des impacts sur la production
✓ Mise en place d'un plan d'action correctif d'urgence
✓ Suivi quotidien renforcé pendant 2 semaines minimum

⚠️ CETTE SITUATION NÉCESSITE UNE INTERVENTION IMMÉDIATE DE LA DIRECTION ⚠️

Merci de traiter cette alerte en priorité absolue.

Cordialement,
Système de Gestion Qualité
      `
    };
  }

  return {
    subject: 'Alerte Qualité',
    level: 'INCONNU',
    priority: 'INCONNUE',
    body: 'Alerte qualité détectée.'
  };
}

export const emailService = {
  /**
   * Send email alert based on defect count
   * @param alert - Alert information
   * @returns Promise<boolean> - Success status
   */
  async sendAlert(alert: EmailAlert): Promise<boolean> {
    const { operatorName, defectCount, defectType, timestamp } = alert;
    
    // Create unique key for this operator and defect type
    const alertKey = `${operatorName}-${defectType}`;
    
    // Initialize set for this operator if not exists
    if (!sentAlerts.has(alertKey)) {
      sentAlerts.set(alertKey, new Set());
    }
    
    const sentLevels = sentAlerts.get(alertKey)!;
    
    // Determine which email to send based on defect count
    let emailAddress: string | null = null;
    let alertLevel: number | null = null;
    
    if (defectCount >= 7 && !sentLevels.has(7)) {
      emailAddress = EMAIL_ADDRESSES.level7;
      alertLevel = 7;
    } else if (defectCount >= 5 && !sentLevels.has(5)) {
      emailAddress = EMAIL_ADDRESSES.level5;
      alertLevel = 5;
    } else if (defectCount >= 3 && !sentLevels.has(3)) {
      emailAddress = EMAIL_ADDRESSES.level3;
      alertLevel = 3;
    }
    
    // If no email needs to be sent, return
    if (!emailAddress || !alertLevel) {
      return false;
    }
    
    try {
      // In production, this would call a backend API
      // For now, we'll just log the email that would be sent
      
      // Get alert details based on level
      const alertDetails = getAlertDetails(alertLevel, operatorName, defectType, defectCount, timestamp);
      
      console.log('\n' + '='.repeat(80));
      console.log('📧 EMAIL ALERT SENT');
      console.log('='.repeat(80));
      console.log(`To: ${emailAddress}`);
      console.log(`Subject: ${alertDetails.subject}`);
      console.log(`Alert Level: ${alertDetails.level}`);
      console.log(`Priority: ${alertDetails.priority}`);
      console.log('-'.repeat(80));
      console.log('EMAIL BODY:');
      console.log('-'.repeat(80));
      console.log(alertDetails.body);
      console.log('='.repeat(80) + '\n');
      
      // Mark this level as sent
      sentLevels.add(alertLevel);
      
      return true;
    } catch (error) {
      console.error('Error sending email alert:', error);
      return false;
    }
  },
  
  /**
   * Update email addresses for alert levels
   * @param level - Alert level (3, 5, or 7)
   * @param email - Email address
   */
  updateEmailAddress(level: 3 | 5 | 7, email: string): void {
    if (level === 3) {
      EMAIL_ADDRESSES.level3 = email;
    } else if (level === 5) {
      EMAIL_ADDRESSES.level5 = email;
    } else if (level === 7) {
      EMAIL_ADDRESSES.level7 = email;
    }
  },
  
  /**
   * Get current email addresses
   */
  getEmailAddresses() {
    return { ...EMAIL_ADDRESSES };
  },
  
  /**
   * Reset sent alerts (useful for testing)
   */
  resetAlerts(): void {
    sentAlerts.clear();
  }
};
