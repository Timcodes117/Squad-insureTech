import { profileApi } from '../api/profile.api';
import type { ProfileBundle } from '../api/profile.api';

class ProfileRepository {
  async getProfileBundle(): Promise<ProfileBundle> {
    return profileApi.getProfileBundle();
  }
}

export default new ProfileRepository();
