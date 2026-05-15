import { paymentsApi } from '../api/payments.api';
import type { PaymentIntent } from '../types/payments.types';

class PaymentsRepository {
  async createTopUpIntent(): Promise<PaymentIntent> {
    return paymentsApi.createTopUpIntent();
  }
}

export default new PaymentsRepository();
