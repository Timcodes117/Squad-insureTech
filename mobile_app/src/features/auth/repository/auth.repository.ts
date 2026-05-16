import { authApi } from '../api/auth.api';
import { persistAuthSession, registerAndPersist } from '../services/authSession';
import type { AuthSession, RegisterPayload, RegisterResult, RequestOtpResult } from '../types/auth.types';
import type { BackendUser } from '@/types/backend';

class AuthRepository {
  async requestOtp(identifier: string, password: string): Promise<RequestOtpResult> {
    return authApi.requestOtp(identifier, password);
  }

  async verifyOtp(identifier: string, code: string): Promise<AuthSession> {
    const session = await authApi.verifyOtp(identifier, code);
    await persistAuthSession(session);
    return session;
  }

  async register(payload: RegisterPayload): Promise<RegisterResult> {
    return registerAndPersist(payload);
  }

  async getMe(): Promise<BackendUser> {
    return authApi.getMe();
  }
}

export default new AuthRepository();
