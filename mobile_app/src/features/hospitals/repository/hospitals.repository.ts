import { hospitalsApi } from '../api/hospitals.api';
import type { HospitalVerificationRequest, HospitalVerificationResult } from '../types/hospitals.types';

class HospitalsRepository {
  async verifyCoverage(payload: HospitalVerificationRequest): Promise<HospitalVerificationResult> {
    return hospitalsApi.verifyCoverage(payload);
  }
}

export default new HospitalsRepository();
