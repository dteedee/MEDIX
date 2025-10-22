export interface NotificationDto{
    title: string;
    message: string;
    type: string;
    createdAt: string;
}

export interface NotificationMetadata{
    isAllRead: boolean;
    notifications: NotificationDto[];
}