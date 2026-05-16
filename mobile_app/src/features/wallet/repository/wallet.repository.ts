import { walletApi, type WithdrawBody } from '../api/wallet.api';
import { mapWalletSnapshot, type WalletView } from '../mappers/walletMapper';
import type { WithdrawableResponse } from '@/types/backend';
import type { WalletSnapshot } from '@/types/backend';

class WalletRepository {
  async getWalletSnapshot(): Promise<WalletSnapshot> {
    return walletApi.getWallet();
  }

  async getWallet(): Promise<WalletView> {
    const snapshot = await walletApi.getWallet();
    return mapWalletSnapshot(snapshot);
  }

  async getWithdrawable(): Promise<WithdrawableResponse> {
    return walletApi.getWithdrawable();
  }

  async withdraw(body: WithdrawBody): Promise<unknown> {
    return walletApi.withdraw(body);
  }
}

export default new WalletRepository();
