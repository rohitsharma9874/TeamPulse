export interface MemberDocument {
  id: string;
  userId: string;
  documentType: string;
  originalName: string;
  contentType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

export const DOCUMENT_TYPES = [
  'Aadhar Card',
  'PAN Card',
  'Passport',
  'Voter ID',
  'Driving Licence',
  'Address Proof',
  'Qualification Certificate',
  'Experience Letter',
  'Other',
];
