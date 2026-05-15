import { walletApi } from '../api/wallet.api';
import type { VirtualAccountDetails, WalletBalance } from '../types/wallet.types';

class WalletRepository {
  async getWallet(): Promise<WalletBalance> {
    return walletApi.getWallet();
  }

  async getVirtualAccount(): Promise<VirtualAccountDetails> {
    return walletApi.getVirtualAccount();
  }
}

export default new WalletRepository();
