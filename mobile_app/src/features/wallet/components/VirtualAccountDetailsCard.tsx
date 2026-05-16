import * as Clipboard from 'expo-clipboard';
import { Building2, Copy, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, Share, View } from 'react-native';

import { buildFundDetailsMessage } from '@/features/wallet/utils/fundDetails';
import { Text } from '@/shared/typography/Text';

const BRAND = '#2563eb';

type Props = {
  accountNumber: string;
  bankName: string;
  /** Beneficiary name on transfer — usually member full name from profile */
  accountName?: string | null;
  helperText?: string;
};

export function VirtualAccountDetailsCard({ accountNumber, bankName, accountName, helperText }: Props) {
  const [copied, setCopied] = useState(false);
  const hasAccount = Boolean(accountNumber?.trim() && accountNumber !== '—');

  const fundMessage = hasAccount
    ? buildFundDetailsMessage({ accountNumber, bankName, accountName })
    : '';

  const shareDetails = async () => {
    if (!hasAccount) {
      return;
    }
    try {
      await Share.share({
        message: fundMessage,
        title: 'BetaHealth fund details',
      });
    } catch {
      // dismissed
    }
  };

  const copyAccountNumber = async () => {
    if (!hasAccount) {
      return;
    }
    await Clipboard.setStringAsync(accountNumber.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAllDetails = async () => {
    if (!hasAccount) {
      return;
    }
    await Clipboard.setStringAsync(fundMessage);
    Alert.alert('Copied', 'Fund details copied to clipboard.');
  };

  return (
    <View className="rounded-2xl bg-neutral-100 px-4 py-4">
      {helperText ? <Text className="mb-3 text-sm leading-relaxed text-neutral-600">{helperText}</Text> : null}

      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
          <Building2 size={22} color={BRAND} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-xs font-medium text-neutral-500">Bank</Text>
          <Text className="mt-0.5 text-base font-semibold text-neutral-900">{bankName || '—'}</Text>

          <Text className="mt-3 text-xs font-medium text-neutral-500">Account number</Text>
          <Text className="mt-0.5 text-lg font-bold tracking-wide text-neutral-900">{accountNumber}</Text>

          {accountName?.trim() ? (
            <>
              <Text className="mt-3 text-xs font-medium text-neutral-500">Account name (use on transfer)</Text>
              <Text className="mt-0.5 text-sm font-semibold text-neutral-800">{accountName.trim()}</Text>
            </>
          ) : null}
        </View>
      </View>

      {hasAccount ? (
        <View className="mt-4 flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copy account number"
            onPress={() => void copyAccountNumber()}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-brand-600 py-3 active:opacity-90"
          >
            <Copy size={18} color="#ffffff" />
            <Text className="text-sm font-semibold text-white">{copied ? 'Copied' : 'Copy number'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share fund details"
            onPress={() => void shareDetails()}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-brand-600 bg-white py-3 active:opacity-90"
          >
            <Share2 size={18} color={BRAND} />
            <Text className="text-sm font-semibold text-brand-700">Share</Text>
          </Pressable>
        </View>
      ) : null}

      {hasAccount ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Copy all fund details"
          onPress={() => void copyAllDetails()}
          className="mt-2 py-1 active:opacity-70"
        >
          <Text className="text-center text-xs font-medium text-brand-700">Copy all details</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
