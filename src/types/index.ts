export type ToolId = 
  | 'merge-pdf'
  | 'split-pdf'
  | 'compress-pdf'
  | 'pdf-to-img'
  | 'img-to-pdf'
  | 'pdf-to-word'
  | 'word-to-pdf'
  | 'image-convert';

export type PlanType = 'free' | 'pro_monthly' | 'pro_annual' | 'enterprise';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'pro' | 'admin';
  plan: PlanType;
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'none';
  subscriptionPeriodEnd?: string;
  stripeCustomerId?: string;
  createdAt: string;
  dailyConversionsCount: number;
  lastConversionDate: string; // YYYY-MM-DD
  isBanned?: boolean;
}

export interface ConversionRecord {
  id: string;
  userId: string;
  userEmail: string;
  toolId: ToolId;
  toolName: string;
  inputFileName: string;
  inputFileSize: number;
  outputFileName: string;
  outputFileSize: number;
  savingsPercent?: number;
  status: 'completed' | 'processing' | 'failed';
  timestamp: string;
  downloadUrl?: string;
  blob?: Blob;
}

export interface ToolMeta {
  id: ToolId;
  title: string;
  badge?: string;
  shortDescription: string;
  longDescription: string;
  acceptedFormats: string[];
  acceptedMimeTypes: string;
  maxFiles: number;
  category: 'pdf' | 'convert' | 'image';
  icon: string;
  color: string;
}

export interface StripeInvoice {
  id: string;
  date: string;
  amount: number;
  planName: string;
  status: 'paid' | 'pending' | 'refunded';
  invoicePdfUrl?: string;
  paymentMethod: string;
}
