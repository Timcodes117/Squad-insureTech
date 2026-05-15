import { X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, TextInput, View } from 'react-native';

import { MOCK_MEMBER_PROFILE } from '@/features/profile/constants/mockMemberProfile';
import { NIGERIAN_BANKS } from '@/features/wallet/constants/nigerianBanks';
import { RegistrationSelect } from '@/features/auth/registration/RegistrationSelect';
import { useLinkedPayoutAccountStore } from '@/features/wallet/store/linkedPayoutAccountStore';
import { Text } from '@/shared/typography/Text';

type Props = {
  visible: boolean;
  onClose: () => void;
  onLinked?: () => void;
};

const BANK_OPTIONS = NIGERIAN_BANKS.map((b) => ({ value: b.code, label: b.name }));

export function ConnectBankModal({ visible, onClose, onLinked }: Props) {
  const saveAccount = useLinkedPayoutAccountStore((s) => s.saveAccount);
  const existing = useLinkedPayoutAccountStore((s) => s.account);

  const [bankCode, setBankCode] = useState<string | null>(existing?.bankCode ?? null);
  const [accountNumber, setAccountNumber] = useState(existing?.accountNumber ?? '');
  const [resolving, setResolving] = useState(false);
  const [resolvedName, setResolvedName] = useState<string | null>(existing?.accountName ?? null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setBankCode(existing?.bankCode ?? null);
    setAccountNumber(existing?.accountNumber ?? '');
    setResolvedName(existing?.accountName ?? null);
    setSaved(false);
    setResolving(false);
  }, [visible, existing]);

  const digits = accountNumber.replace(/\D/g, '').slice(0, 10);
  const canResolve = Boolean(bankCode) && digits.length === 10;
  const canSave = canResolve && Boolean(resolvedName?.trim());

  const selectedBank = useMemo(() => NIGERIAN_BANKS.find((b) => b.code === bankCode), [bankCode]);

  const resolveName = () => {
    if (!canResolve) {
      return;
    }
    setResolving(true);
    setResolvedName(null);
    setTimeout(() => {
      setResolvedName(MOCK_MEMBER_PROFILE.name);
      setResolving(false);
    }, 900);
  };

  const save = async () => {
    if (!selectedBank || !resolvedName?.trim() || digits.length !== 10) {
      return;
    }
    await saveAccount({
      bankCode: selectedBank.code,
      bankName: selectedBank.name,
      accountNumber: digits,
      accountName: resolvedName.trim(),
    });
    setSaved(true);
    onLinked?.();
  };

  const close = () => {
    setSaved(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable className="flex-1 justify-end bg-black/45" onPress={close}>
        <Pressable className="max-h-[90%] rounded-t-3xl bg-white px-5 pb-8 pt-5" onPress={(e) => e.stopPropagation()}>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-neutral-900">
              {existing ? 'Update payout account' : 'Connect bank account'}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} hitSlop={10}>
              <X size={22} color="#525252" />
            </Pressable>
          </View>

          {!saved ? (
            <>
              <Text className="text-sm leading-relaxed text-neutral-600">
                Withdrawals go to this account. We verify the name matches your BetaHealth profile (demo).
              </Text>

              <View className="mt-5 gap-4">
                <RegistrationSelect
                  label="Bank"
                  required
                  value={bankCode}
                  options={BANK_OPTIONS}
                  onChange={setBankCode}
                  accessibilityLabel="Select bank"
                />

                <View className="gap-1.5">
                  <Text className="text-sm font-medium text-neutral-800">
                    Account number<Text className="text-brand-600">*</Text>
                  </Text>
                  <TextInput
                    value={accountNumber}
                    onChangeText={(t) => {
                      setAccountNumber(t.replace(/\D/g, '').slice(0, 10));
                      setResolvedName(null);
                    }}
                    keyboardType="number-pad"
                    placeholder="10-digit NUBAN"
                    placeholderTextColor="#a3a3a3"
                    className="min-h-[52px] rounded-xl border border-neutral-200 bg-white px-3 text-base text-neutral-900"
                    accessibilityLabel="Account number"
                  />
                </View>

                {resolvedName ? (
                  <View className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <Text className="text-xs font-semibold uppercase text-emerald-800">Account name</Text>
                    <Text className="mt-1 text-base font-semibold text-emerald-900">{resolvedName}</Text>
                  </View>
                ) : null}

                {!resolvedName ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={!canResolve || resolving}
                    onPress={resolveName}
                    className={`items-center rounded-xl border py-3.5 active:opacity-90 ${
                      !canResolve || resolving ? 'border-neutral-200 bg-neutral-100' : 'border-brand-200 bg-brand-50'
                    }`}
                  >
                    {resolving ? (
                      <ActivityIndicator color="#2563eb" />
                    ) : (
                      <Text
                        className={`font-semibold ${!canResolve ? 'text-neutral-400' : 'text-brand-700'}`}
                      >
                        Verify account name
                      </Text>
                    )}
                  </Pressable>
                ) : null}
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={!canSave}
                onPress={() => void save()}
                className={`mt-6 items-center rounded-full py-4 active:opacity-90 ${!canSave ? 'bg-neutral-200' : 'bg-brand-600'}`}
              >
                <Text className={`font-semibold ${!canSave ? 'text-neutral-500' : 'text-white'}`}>Save payout account</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text className="text-sm leading-relaxed text-neutral-600">
                {selectedBank?.name} · •••• {digits.slice(-4)} is ready for withdrawals.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={close}
                className="mt-6 items-center rounded-full bg-brand-600 py-4 active:opacity-90"
              >
                <Text className="font-semibold text-white">Done</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
