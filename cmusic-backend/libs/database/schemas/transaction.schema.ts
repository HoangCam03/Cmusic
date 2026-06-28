import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  appTransId: string; // Mã đơn hàng phía mình gửi sang ZaloPay
  zpTransId: string;  // Mã giao dịch phía ZaloPay trả về
  amount: number;
  planId: string;
  status: 'pending' | 'success' | 'failed';
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appTransId: { type: String, required: true, unique: true },
    zpTransId: { type: String, default: '' },
    amount: { type: Number, required: true },
    planId: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'success', 'failed'], 
      default: 'pending' 
    },
    paymentMethod: { type: String, default: 'zalopay' },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
