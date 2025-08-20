export interface CardData {
    id: string;
    sender_name: string;
    sender_email: string;
    date_column: string;
    time_column: string;
    email_title: string;
    email_summary: string;
    attachment_ct: number;
}

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface SwipeAction {
    direction: SwipeDirection;
    cardId: string;
    timestamp: number;
} 