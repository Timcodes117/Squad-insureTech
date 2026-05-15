import { authApi } from '../api/auth.api';
import type { AuthSession } from '../types/auth.types';

class AuthRepository {
  async login(): Promise<AuthSession> {
    return authApi.login();
  }

  async register(): Promise<AuthSession> {
    return authApi.register();
  }

  async verifyOtp(): Promise<AuthSession> {
    return authApi.verifyOtp();
  }
}

export default new AuthRepository();
