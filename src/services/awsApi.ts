// AWS API Service for Email Swipe Backend
const AWS_API_BASE_URL = 'https://zila8yci2b.execute-api.us-east-1.amazonaws.com/dev';

export interface EmailData {
  id: string;
  subject: string;
  sender: string;
  snippet: string;
  date: string;
  labels: string[];
  isRead: boolean;
  threadId: string;
}

export interface StoreEmailRequest {
  userId: string;
  emails: EmailData[];
}

export interface FetchEmailRequest {
  userId: string;
  limit?: number;
  startKey?: any;
}

export interface FetchEmailResponse {
  emails: EmailData[];
  lastEvaluatedKey?: any;
}

export class AwsApiService {
  private baseUrl: string;

  constructor(baseUrl: string = AWS_API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Store emails in DynamoDB via AWS Lambda
   */
  async storeEmails(userId: string, emails: EmailData[]): Promise<{ message: string; count: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          emails,
        } as StoreEmailRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Emails stored successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error storing emails:', error);
      throw error;
    }
  }

  /**
   * Fetch emails from DynamoDB via AWS Lambda
   */
  async fetchEmails(userId: string, limit: number = 50, startKey?: any): Promise<FetchEmailResponse> {
    try {
      // Build query parameters for GET request
      const params = new URLSearchParams({
        userId,
        limit: limit.toString(),
      });
      
      if (startKey) {
        params.append('startKey', JSON.stringify(startKey));
      }

      const response = await fetch(`${this.baseUrl}/emails?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Emails fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching emails:', error);
      throw error;
    }
  }

  /**
   * Convert Gmail API response to our email data format
   */
  convertGmailToEmailData(gmailMessages: any[]): EmailData[] {
    return gmailMessages.map(message => ({
      id: message.id,
      subject: message.subject || 'No Subject',
      sender: message.sender || 'Unknown',
      snippet: message.snippet || '',
      date: message.date || new Date().toISOString(),
      labels: message.labels || [],
      isRead: message.isRead || false,
      threadId: message.threadId || '',
    }));
  }

  /**
   * Store Gmail emails in AWS backend
   */
  async storeGmailEmails(userId: string, gmailMessages: any[]): Promise<void> {
    const emailData = this.convertGmailToEmailData(gmailMessages);
    await this.storeEmails(userId, emailData);
  }
}

// Export a default instance
export const awsApiService = new AwsApiService();
