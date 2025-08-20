// Gmail API service for fetching emails
import { CardData } from './types';

export interface GmailMessage {
    id: string;
    threadId: string;
    labelIds: string[];
    snippet: string;
    historyId: string;
    internalDate: string;
    payload?: {
        headers: Array<{
            name: string;
            value: string;
        }>;
        parts?: Array<{
            mimeType: string;
            filename?: string;
        }>;
    };
}

export interface GmailMessagesResponse {
    messages: GmailMessage[];
    nextPageToken?: string;
    resultSizeEstimate: number;
}

// Interface for sending emails
export interface SendEmailRequest {
    to: string;
    subject: string;
    body: string;
    threadId?: string; // For replies
    inReplyTo?: string; // Message ID being replied to
}

export interface SendEmailResponse {
    id: string;
    threadId: string;
    labelIds: string[];
}

// Send email via Gmail API
export async function sendGmailEmail(accessToken: string, emailData: SendEmailRequest): Promise<SendEmailResponse> {
    try {
        // Create email in RFC 2822 format
        const emailContent = createEmailContent(emailData);
        
        // Encode the email content in base64
        const encodedEmail = btoa(unescape(encodeURIComponent(emailContent))).replace(/\+/g, '-').replace(/\//g, '_');
        
        const response = await fetch(
            'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    raw: encodedEmail,
                    threadId: emailData.threadId // Include threadId for replies
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gmail API Error:', errorData);
            throw new Error(`Failed to send email: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error sending Gmail email:', error);
        throw error;
    }
}

// Create email content in RFC 2822 format
function createEmailContent(emailData: SendEmailRequest): string {
    const date = new Date().toUTCString();
    const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@gmail.com>`;
    
    let headers = [
        `From: me`,
        `To: ${emailData.to}`,
        `Subject: ${emailData.subject}`,
        `Date: ${date}`,
        `Message-ID: ${messageId}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        `Content-Transfer-Encoding: 7bit`,
    ];

    // Add reply headers if this is a reply
    if (emailData.inReplyTo) {
        headers.push(`In-Reply-To: ${emailData.inReplyTo}`);
        headers.push(`References: ${emailData.inReplyTo}`);
    }

    const emailContent = headers.join('\r\n') + '\r\n\r\n' + emailData.body;
    return emailContent;
}

// Fetch Gmail messages
export async function fetchGmailMessages(accessToken: string, maxResults: number = 20): Promise<GmailMessage[]> {
    try {
        console.log('🔍 Fetching Gmail messages with maxResults:', maxResults);
        console.log('🔑 Access token length:', accessToken.length);
        
        const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;
        console.log('🌐 Gmail API URL:', url);
        
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
            },
        });

        console.log('📡 Gmail API response status:', response.status);
        console.log('📡 Gmail API response ok:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Gmail API error response:', errorText);
            throw new Error(`Failed to fetch Gmail messages: ${response.status} - ${errorText}`);
        }

        const data: GmailMessagesResponse = await response.json();
        console.log('✅ Gmail API response data:', data);
        console.log('📧 Number of messages received:', data.messages?.length || 0);
        
        return data.messages || [];
    } catch (error) {
        console.error('❌ Error fetching Gmail messages:', error);
        throw error;
    }
}

// Fetch detailed message information
export async function fetchGmailMessageDetail(accessToken: string, messageId: string): Promise<GmailMessage> {
    try {
        const response = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch message detail: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching message detail:', error);
        throw error;
    }
}

// Convert Gmail message to CardData format
export function convertGmailMessageToCardData(message: GmailMessage): CardData {
    const headers = message.payload?.headers || [];
    
    const getHeaderValue = (name: string): string => {
        const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
        return header?.value || '';
    };

    const from = getHeaderValue('from');
    const subject = getHeaderValue('subject');
    const date = getHeaderValue('date');
    
    // Parse sender name and email
    let senderName = '';
    let senderEmail = '';
    
    if (from) {
        const match = from.match(/(.*?)\s*<(.+?)>/);
        if (match) {
            senderName = match[1].trim();
            senderEmail = match[2].trim();
        } else {
            senderEmail = from.trim();
            senderName = senderEmail.split('@')[0];
        }
    }

    // Parse date
    const dateObj = new Date(date);
    const dateColumn = dateObj.toISOString().split('T')[0];
    const timeColumn = dateObj.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });

    // Count attachments
    const attachmentCount = message.payload?.parts?.filter(part => 
        part.filename && part.filename.length > 0
    ).length || 0;

    return {
        id: message.id,
        sender_name: senderName,
        sender_email: senderEmail,
        date_column: dateColumn,
        time_column: timeColumn,
        email_title: subject,
        email_summary: message.snippet,
        attachment_ct: attachmentCount
    };
}

// Fetch and convert Gmail messages to CardData
export async function fetchGmailEmailsAsCards(accessToken: string, maxResults: number = 20): Promise<CardData[]> {
    try {
        console.log('🔄 Starting fetchGmailEmailsAsCards with maxResults:', maxResults);
        
        const messages = await fetchGmailMessages(accessToken, maxResults);
        console.log('📧 Messages fetched, converting to cards...');
        
        const cardDataPromises = messages.map(async (message, index) => {
            console.log(`🔄 Converting message ${index + 1}/${messages.length}:`, message.id);
            const detailedMessage = await fetchGmailMessageDetail(accessToken, message.id);
            const cardData = convertGmailMessageToCardData(detailedMessage);
            console.log(`✅ Converted message ${index + 1}:`, cardData.email_title);
            return cardData;
        });
        
        const cardData = await Promise.all(cardDataPromises);
        console.log('✅ All messages converted to cards:', cardData.length);
        
        return cardData;
    } catch (error) {
        console.error('❌ Error fetching Gmail emails as cards:', error);
        throw error;
    }
}
