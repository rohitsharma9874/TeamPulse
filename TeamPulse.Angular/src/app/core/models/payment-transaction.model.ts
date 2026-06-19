export interface PaymentTransaction {
  id: string;
  taskId: string;
  amount: number;
  paymentMethod: string;
  notes: string;
  paidOn: string;
  recordedBy: string;
}

export interface CreatePaymentTransactionRequest {
  amount: number;
  paymentMethod: string;
  notes: string;
  paidOn?: string;
}

export const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'Other'];
