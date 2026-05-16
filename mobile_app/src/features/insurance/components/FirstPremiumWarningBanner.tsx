import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { PremiumActivationTimeline } from '@/features/insurance/components/PremiumActivationTimeline';
import { useInsurance } from '@/features/insurance/hooks/useInsurance';
import { mapPremiumBilling, premiumStateTitle } from '@/features/insurance/mappers/premiumStatus';
import {
  COOLDOWN_DAYS,
  COOLDOWN_WAIT_LABEL,
  deriveCoverStatus,
  statusDetail,
} from '@/features/insurance/mappers/dashboardMapper';
import { useWalletSnapshot } from '@/features/wallet/hooks/useWallet';
import { formatNaira } from '@/shared/format/naira';
import { Text } from '@/shared/typography/Text';
import { useAuthStore } from '@/store/authStore';

const BRAND = '#2563eb';

export function FirstPremiumWarningBanner() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: dashboard, isLoading: coverLoading } = useInsurance();
  const { data: wallet, isLoading: walletLoading } = useWalletSnapshot();

  if (coverLoading || walletLoading || !wallet) {
    return (
      <View className="mx-5 mt-5 items-center rounded-3xl border border-brand-100 bg-brand-50 py-10">
        <ActivityIndicator color={BRAND} />
      </View>
    );
  }

  const billing = mapPremiumBilling(wallet, user);
  const coverStatus = deriveCoverStatus(wallet, user);

  if (billing.state === 'paid_this_week' && coverStatus === 'active') {
    return null;
  }

  const isCooldown = billing.state === 'cooldown';
  const hoursLeft = dashboard?.cooldownHoursLeft ?? 0;
  const planLabel = dashboard?.planLabel ?? '';
  const title = isCooldown ? 'Almost there' : premiumStateTitle(billing.state, billing.isFirstTime);

  let body: string;
  if (isCooldown) {
    body =
      dashboard?.coverJourneyExplainer ??
      statusDetail('cooldown', hoursLeft, {
        weekOneCapNaira: dashboard?.weekOneCapNaira,
        monthlyCapNaira: dashboard?.coverageCapNaira,
        weekOneEndsLabel: dashboard?.weekOneEndsLabel,
      });
  } else if (billing.state === 'paused_insufficient') {
    body = `Add ${formatNaira(billing.shortfallNaira)}, then pay ${formatNaira(billing.weeklyPremiumNaira)} to restore cover.`;
  } else if (billing.state === 'ready_to_pay') {
    body = billing.isFirstTime
      ? `Fund your wallet, then pay ${formatNaira(billing.weeklyPremiumNaira)} (${planLabel}).`
      : `Pay ${formatNaira(billing.weeklyPremiumNaira)} from your wallet to turn cover back on.`;
  } else if (billing.state === 'due_insufficient') {
    body = `Top up ${formatNaira(billing.shortfallNaira)} before your next ${formatNaira(billing.weeklyPremiumNaira)} premium.`;
  } else if (billing.state === 'due_can_pay') {
    body = `Premium ${formatNaira(billing.weeklyPremiumNaira)} due — pay now or wait for auto-debit.`;
  } else {
    body = `Pay ${formatNaira(billing.weeklyPremiumNaira)} to start: ${COOLDOWN_DAYS}-day activation (no hospitals), then ₦5,000 for your first week at hospitals, then ₦20,000 monthly.`;
  }

  const ctaLabel =
    billing.state === 'paused_insufficient' || billing.state === 'first_activation'
      ? 'Fund & pay premium'
      : billing.state === 'ready_to_pay' || billing.state === 'due_can_pay'
        ? 'Pay premium'
        : isCooldown
          ? 'Premium details'
          : 'Get started';

  const stepPill = isCooldown ? `Step 2 · ${COOLDOWN_WAIT_LABEL}` : billing.isFirstTime ? 'Step 1 · Pay premium' : 'Premium';

  return (
    <View className="mx-5 mt-5 rounded-3xl border border-brand-100 bg-brand-50 px-5 py-5">
      <View className="self-start rounded-full bg-brand-100 px-3 py-1">
        <Text className="text-[10px] font-bold uppercase tracking-wider text-brand-800">{stepPill}</Text>
      </View>

      <Text className="mt-3 text-xl font-bold tracking-tight text-neutral-900">{title}</Text>
      <Text className="mt-2 text-sm leading-relaxed text-neutral-600">{body}</Text>

      <View className="mt-4">
        <PremiumActivationTimeline coverStatus={coverStatus} hoursLeft={hoursLeft} hideTitle />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
        onPress={() => router.push('/premium' as const)}
        className="mt-5 flex-row items-center justify-center gap-1 rounded-full bg-brand-600 py-3.5 active:opacity-90"
      >
        <Text className="text-sm font-bold text-white">{ctaLabel}</Text>
        <ChevronRight size={18} color="#ffffff" />
      </Pressable>
    </View>
  );
}
