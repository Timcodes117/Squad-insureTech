export type PaymentIntent = {
  id: string;
  status: 'draft' | 'pending' | 'completed' | 'failed';
};
