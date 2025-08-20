import { CardData } from '../types';

export interface CardDataWithStatus extends CardData {
    status: 'unread' | 'read' | 'new';
}

export const mockCards: CardDataWithStatus[] = [
    {
        id: '1',
        sender_name: 'Netflix',
        sender_email: 'no-reply@netflix.com',
        date_column: 'Monday, June 6',
        time_column: '9:41',
        email_title: 'Your Subscription Renewal',
        email_summary: 'Your Netflix subscription will be renewed in 3 days. New movies and shows have been added to your watchlist.',
        attachment_ct: 1,
        status: 'new',
    },
    {
        id: '2',
        sender_name: 'LinkedIn',
        sender_email: 'updates@linkedin.com',
        date_column: 'Tuesday, June 7',
        time_column: '10:15',
        email_title: '5 New Connection Requests',
        email_summary: 'You have 5 new connection requests and 12 people viewed your profile this week. Update your skills to get noticed.',
        attachment_ct: 0,
        status: 'unread',
    },
    {
        id: '3',
        sender_name: 'Amazon',
        sender_email: 'shipment-tracking@amazon.com',
        date_column: 'Wednesday, June 8',
        time_column: '14:30',
        email_title: 'Your Order Has Shipped!',
        email_summary: 'Your order has been shipped! Track your package delivery. Estimated arrival: Tomorrow by 8 PM.',
        attachment_ct: 2,
        status: 'read',
    },
    {
        id: '4',
        sender_name: 'Bank Alert',
        sender_email: 'alerts@bank.com',
        date_column: 'Thursday, June 9',
        time_column: '08:05',
        email_title: 'Security Alert: New Device Login',
        email_summary: 'Security Alert: We detected a login attempt from a new device. If this was not you, please secure your account immediately.',
        attachment_ct: 1,
        status: 'unread',
    },
    {
        id: '5',
        sender_name: 'GitHub',
        sender_email: 'noreply@github.com',
        date_column: 'Friday, June 10',
        time_column: '16:20',
        email_title: 'Weekly Digest',
        email_summary: 'Weekly digest: You have 3 new stars on your repositories and 2 pull requests awaiting your review.',
        attachment_ct: 3,
        status: 'read',
    },
]; 