// Email Service for sending automated alerts via API server
// This service calls the Next.js API server to send real emails

export interface EmailAlert {
  operatorName: string;
  defectCount: number;
  defectType: string;
  timestamp: Date;
}

// API server configuration
const API_SERVER_URL = process.env.NODE_ENV === 'production' 
  ? 'https://qualityapp-v2.vercel.app/api'
  : 'http://localhost:3001/api';

// Track sent alerts to avoid duplicates
const sentAlerts = new Map<string, Set<number>>();

const toISO = (t: any): string => {
  try {
    // If no timestamp provided, use current date
    if (!t) return new Date().toISOString();
    
    // If already a valid Date object
    if (t instanceof Date) {
      return isNaN(t.getTime()) ? new Date().toISOString() : t.toISOString();
    }
    
    // If it's a Firestore Timestamp
    if (typeof t?.toDate === 'function') {
      const d = t.toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
    }
    
    // If it's a string or number, try to parse it
    if (typeof t === 'string' || typeof t === 'number') {
      const d = new Date(t);
      return !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
    }
    
    // For any other case, return current date
    return new Date().toISOString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return new Date().toISOString();
  }
};

/**
 * Email service that integrates with the Next.js API server
 * Sends real emails via Gmail SMTP through the API server
 */

export const emailService = {
  /**
   * Send email alert based on defect count via API server
   * @param alert - Alert information
   * @returns Promise<boolean> - Success status
   */
  async sendAlert(alert: EmailAlert): Promise<boolean> {
    const { operatorName, defectCount, defectType, timestamp } = alert;
    
    // Create unique key for this operator
    const alertKey = operatorName;
    
    // Initialize set for this operator if not exists
    if (!sentAlerts.has(alertKey)) {
      sentAlerts.set(alertKey, new Set());
    }
    
    const sentLevels = sentAlerts.get(alertKey)!;
    
    // Determine which alert level should be sent based on defect count
    let alertLevel: number | null = null;
    
    if (defectCount >= 7 && !sentLevels.has(7)) {
      alertLevel = 7;
    } else if (defectCount >= 5 && !sentLevels.has(5)) {
      alertLevel = 5;
    } else if (defectCount >= 3 && !sentLevels.has(3)) {
      alertLevel = 3;
    }
    
    // If no alert needs to be sent, return
    if (!alertLevel) {
      console.log(`📧 No alert needed for ${operatorName} with ${defectCount} defects (already sent or threshold not crossed)`);
      return false;
    }
    
    try {
      console.log(`📧 Sending Level ${alertLevel} alert for ${operatorName} via API server...`);
      
      // Call the API server to send the email
      const response = await fetch(`${API_SERVER_URL}/api/alert-operator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operateurNom: operatorName,
          nombreOccurrences: defectCount,
          previousOccurrences: defectCount - 1,
          defectType: defectType,
          timestamp: toISO(timestamp)
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API server responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Level ${alertLevel} email sent successfully for ${operatorName}`);
        console.log(`📧 Email ID: ${result.emailId}`);
        console.log(`📧 Escalation Level: ${result.escalationLevel}`);
        if (result.recipients) {
          console.log(`📧 Recipients: ${result.recipients}`);
        }
        
        // Mark this level as sent
        sentLevels.add(alertLevel);
        
        return true;
      } else {
        console.error('❌ API server returned error:', result.error);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error calling API server for email alert:', error);
      
      // Fallback: Log the alert details for debugging
      console.log('\n' + '='.repeat(80));
      console.log('📧 EMAIL ALERT (API FAILED - LOGGED ONLY)');
      console.log('='.repeat(80));
      console.log(`Operator: ${operatorName}`);
      console.log(`Defect Count: ${defectCount}`);
      console.log(`Defect Type: ${defectType}`);
      console.log(`Alert Level: ${alertLevel}`);
      console.log(`Timestamp: ${timestamp.toLocaleString('fr-FR')}`);
      console.log(`API URL: ${API_SERVER_URL}/api/alert-operator`);
      console.log(`Error: ${error}`);
      console.log('='.repeat(80) + '\n');
      
      return false;
    }
  },
  
  /**
   * Test the API server connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_SERVER_URL}/api/test-email`);
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ API server connection test successful');
        return true;
      } else {
        console.error('❌ API server test failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ API server connection failed:', error);
      return false;
    }
  },
  
  /**
   * Get API server URL
   */
  getApiUrl(): string {
    return API_SERVER_URL;
  },
  
  /**
   * Reset sent alerts (useful for testing)
   */
  resetAlerts(): void {
    sentAlerts.clear();
    console.log('🔄 Email alert tracking reset');
  }
};
