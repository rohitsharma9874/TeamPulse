export type KanbanStage =
  | 'new'
  | 'refinement'
  | 'ready'
  | 'in-progress'
  | 'review'
  | 'complete';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string; // userId
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: string;  // KanbanStage | 'pending' (legacy)
  deadline?: string;
  clientContact?: string;
  billing?: string;
  paymentStatus?: 'N/A' | 'Pending' | 'Partly Paid' | 'Paid';
  remarks?: string;
  createdBy?: string;
  completedAt?: string;
}

export interface TaskRequest {
  title?: string;
  description?: string;
  assignee?: string;
  priority?: string;
  status?: string;
  deadline?: string;
  clientContact?: string;
  billing?: string;
  paymentStatus?: string;
  remarks?: string;
}

export const PRIORITY_ORDER: Record<string, number> = {
  Urgent: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};
