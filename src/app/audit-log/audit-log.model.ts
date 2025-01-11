export interface AuditLog {
  id?: number;
  userId: number;
  action: string;
  details?: string;
  timestamp?: string;
}
