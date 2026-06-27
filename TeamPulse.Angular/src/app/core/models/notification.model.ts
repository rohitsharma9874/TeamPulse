export interface AppNotification {
  id: string;
  type: 'task_assigned' | 'deadline_approaching';
  message: string;
  taskId: string | null;
  isRead: boolean;
  createdAt: string;
}
