import { onboardingApi } from '../api/onboarding.api';

class OnboardingRepository {
  async saveProgress(): Promise<void> {
    return onboardingApi.saveProgress();
  }
}

export default new OnboardingRepository();
