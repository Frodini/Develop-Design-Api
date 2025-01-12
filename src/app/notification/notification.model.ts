export interface Notification {
  id?: number;
  recipientId: number;
  message: string;
  read?: boolean;
  createdAt?: string;
}
