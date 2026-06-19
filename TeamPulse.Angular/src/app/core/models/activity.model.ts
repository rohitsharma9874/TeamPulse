export interface Activity {
  id: string;
  userId: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface LogActivityRequest {
  entityType: string;
  entityId: string;
  action: string;
  target?: string;
  oldValue?: string;
}
