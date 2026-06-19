import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, CreateUserRequest, UpdateProfileRequest } from '../models/user.model';
import { Task, TaskRequest } from '../models/task.model';
import { TaskDocument } from '../models/task-document.model';
import { MemberDocument } from '../models/member-document.model';
import { PaymentTransaction, CreatePaymentTransactionRequest } from '../models/payment-transaction.model';
import { Activity, LogActivityRequest } from '../models/activity.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/user`);
  }

  createUser(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.base}/user`, request);
  }

  updateUser(id: string, request: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.base}/user/${id}`, request);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/user/${id}`);
  }

  // Tasks
  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.base}/task`);
  }

  getTask(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.base}/task/${id}`);
  }

  createTask(request: TaskRequest): Observable<Task> {
    return this.http.post<Task>(`${this.base}/task`, request);
  }

  updateTask(id: string, request: TaskRequest): Observable<Task> {
    return this.http.put<Task>(`${this.base}/task/${id}`, request);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/task/${id}`);
  }

  // Activity
  getActivities(): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.base}/activity`);
  }

  logActivity(request: LogActivityRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/activity`, request);
  }

  // Attachments
  getAttachments(taskId: string): Observable<TaskDocument[]> {
    return this.http.get<TaskDocument[]>(`${this.base}/attachment/task/${taskId}`);
  }

  uploadAttachment(taskId: string, file: File): Observable<TaskDocument> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<TaskDocument>(`${this.base}/attachment/${taskId}`, form);
  }

  downloadAttachment(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/attachment/${id}/download`, { responseType: 'blob' });
  }

  deleteAttachment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/attachment/${id}`);
  }

  // Member documents
  getMemberDocuments(userId: string): Observable<MemberDocument[]> {
    return this.http.get<MemberDocument[]>(`${this.base}/member-document/user/${userId}`);
  }

  uploadMemberDocument(userId: string, file: File, documentType: string): Observable<MemberDocument> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<MemberDocument>(`${this.base}/member-document/${userId}?documentType=${encodeURIComponent(documentType)}`, form);
  }

  downloadMemberDocument(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/member-document/${id}/download`, { responseType: 'blob' });
  }

  deleteMemberDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/member-document/${id}`);
  }

  // Payment transactions
  getPaymentTransactions(taskId: string): Observable<PaymentTransaction[]> {
    return this.http.get<PaymentTransaction[]>(`${this.base}/payment-transaction/task/${taskId}`);
  }

  createPaymentTransaction(taskId: string, req: CreatePaymentTransactionRequest): Observable<PaymentTransaction> {
    return this.http.post<PaymentTransaction>(`${this.base}/payment-transaction/${taskId}`, req);
  }

  deletePaymentTransaction(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/payment-transaction/${id}`);
  }

  // Password reset
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/auth/reset-password`, { token, newPassword });
  }
}
