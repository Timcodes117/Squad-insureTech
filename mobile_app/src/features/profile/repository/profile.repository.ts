import { profileApi } from '../api/profile.api';
import type { UserProfile } from '../types/profile.types';

class ProfileRepository {
  async getProfile(): Promise<UserProfile> {
    return profileApi.getProfile();
  }
}

export default new ProfileRepository();
