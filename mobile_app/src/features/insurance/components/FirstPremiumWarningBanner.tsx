import { useRouter } from 'expo-router';
import { Building2, ChevronRight, Clock, Wallet } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { MOCK_DASHBOARD, type MockCoverStatus } from '@/features/insurance/constants/mockDashboard';
import { Text } from '@/shared/typography/Text';

const BRAND = '#2563eb';
const COOLDOWN_HOURS = 72;

type StepProps = {
  label: string;
  step: number;
  done: boolean;
  active: boolean;
  icon: ReactNode;
};

function TimelineStep({ label, step, done, active, icon }: StepProps) {
  return (
    <View className="flex-1 items-center">
      <View
        className={`h-11 w-11 items-center justify-center rounded-2xl border-2 border-brand-600 ${
          done ? 'bg-emerald-50' : active ? 'bg-brand-600' : 'bg-white'
        }`}
      >
        {done || active ? icon : <Text className="text-sm font-bold text-brand-600">{step}</Text>}
      </View>
      <Text
        className={`mt-2 text-center text-[10px] font-semibold leading-tight ${
          done ? 'text-emerald-700' : active ? 'text-brand-700' : 'text-neutral-400'
        }`}
      >
        {label}
      </Text>
    </View>
  );
}

function StepConnector({ filled }: { filled: boolean }) {
  return (
    <View className="mt-5 h-0.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
      {filled ? <View className="h-full w-full rounded-full bg-emerald-400" /> : null}
    </View>
  );
}

function bannerContent(status: MockCoverStatus, hoursLeft: number, planLabel: string) {
  if (status === 'active') {
    return null;
  }

  if (status === 'cooldown') {
    const elapsed = COOLDOWN_HOURS - hoursLeft;
    const progress = Math.min(1, Math.max(0, elapsed / COOLDOWN_HOURS));

    return {
      pill: 'Step 2 of 3',
      pillClass: 'bg-emerald-100',
      pillTextClass: 'text-emerald-800',
      title: '72-hour wait in progress',
      body: `Your premium is confirmed. Hospital visits open ${COOLDOWN_HOURS} hours after payment — about ${hoursLeft} hours to go.`,
      showPayCta: false,
      steps: { payDone: true, waitActive: true, visitDone: false },
      progress,
      hoursLeft,
      connector1Filled: true,
    };
  }

  return {
    pill: 'Step 1 of 3',
    pillClass: 'bg-brand-100',
    pillTextClass: 'text-brand-800',
    title: 'Pay your first premium',
    body: `Activate cover with your first payment (${planLabel}), then wait ${COOLDOWN_HOURS} hours before visiting any partner hospital.`,
    showPayCta: true,
    steps: { payDone: false, waitActive: false, visitDone: false },
    progress: 0,
    hoursLeft: 0,
    connector1Filled: false,
  };
}

export function FirstPremiumWarningBanner() {
  const router = useRouter();
  const { coverStatus, cooldownHoursLeft, planLabel } = MOCK_DASHBOARD;

  const content = bannerContent(coverStatus, cooldownHoursLeft, planLabel);
  if (!content) {
    return null;
  }

  const { payDone } = content.steps;
  const isAwaiting = coverStatus === 'awaiting_funding';
  const isCooldown = coverStatus === 'cooldown';

  return (
    <View className="mx-5 mt-5 overflow-hidden rounded-3xl border border-brand-100 bg-brand-50 px-5 py-5">
      <View className={`self-start rounded-full px-3 py-1 ${content.pillClass}`}>
        <Text className={`text-[10px] font-bold uppercase tracking-wider ${content.pillTextClass}`}>{content.pill}</Text>
      </View>

      <Text className="mt-3 text-xl font-bold tracking-tight text-neutral-900">{content.title}</Text>
      <Text className="mt-2 text-sm leading-relaxed text-neutral-600">{content.body}</Text>

      {isCooldown ? (
        <View className="mt-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-xs font-medium text-neutral-500">Time until hospital access</Text>
            <Text className="text-xs font-bold text-brand-700">{content.hoursLeft}h remaining</Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-white">
            <View className="h-full rounded-full bg-brand-600" style={{ width: `${content.progress * 100}%` }} />
          </View>
        </View>
      ) : null}

      <View className="mt-5">
        <Text className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Premium → wait → hospital
        </Text>
        <View className="flex-row items-start">
          <TimelineStep
            step={1}
            label="Pay premium"
            done={payDone}
            active={isAwaiting}
            icon={<Wallet size={18} color={payDone ? '#059669' : '#ffffff'} />}
          />
          <StepConnector filled={content.connector1Filled} />
          <TimelineStep
            step={2}
            label="72h wait"
            done={false}
            active={isCooldown}
            icon={<Clock size={18} color={isCooldown ? '#ffffff' : payDone ? '#059669' : '#a3a3a3'} />}
          />
          <StepConnector filled={false} />
          <TimelineStep
            step={3}
            label="Visit hospital"
            done={false}
            active={false}
            icon={<Building2 size={18} color="#a3a3a3" />}
          />
        </View>
      </View>

      {content.showPayCta ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pay your first premium"
          onPress={() => router.push('/(tabs)/wallet')}
          className="mt-5 flex-row items-center justify-center gap-1 rounded-full bg-brand-600 py-3.5 active:opacity-90"
        >
          <Text className="text-sm font-bold text-white">Pay your first premium</Text>
          <ChevronRight size={18} color="#ffffff" />
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/coverage')}
          className="mt-4 flex-row items-center justify-center gap-1 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-brand-700">View cover status</Text>
          <ChevronRight size={16} color={BRAND} />
        </Pressable>
      )}
    </View>
  );
}
