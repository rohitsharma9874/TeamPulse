export interface TaskDocument {
  id: string;
  taskId: string;
  originalName: string;
  contentType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}
