import { Building2, Check, Clock, Wallet } from 'lucide-react-native';
import { View } from 'react-native';

import {
  COOLDOWN_WAIT_LABEL,
  WEEK_ONE_CAP_NAIRA,
  type CoverStatus,
} from '@/features/insurance/mappers/dashboardMapper';
import { formatNaira } from '@/shared/format/naira';
import { Text } from '@/shared/typography/Text';

const BRAND_BG = 'bg-brand-600';
const BRAND_BORDER = 'border-brand-600';

type StepVisualState = 'completed' | 'current' | 'upcoming';

type StepProps = {
  label: string;
  subtitle?: string;
  state: StepVisualState;
  icon: 'wallet' | 'clock' | 'hospital';
};

type CaptionAlign = 'left' | 'center' | 'right';

function StepIcon({ icon, state }: { icon: StepProps['icon']; state: StepVisualState }) {
  const color = state === 'upcoming' ? '#94a3b8' : '#ffffff';
  const size = 20;
  switch (icon) {
    case 'wallet':
      return <Wallet size={size} color={color} />;
    case 'clock':
      return <Clock size={size} color={color} />;
    default:
      return <Building2 size={size} color={color} />;
  }
}

function StepBubble({ state, icon }: Pick<StepProps, 'state' | 'icon'>) {
  const filled = state === 'completed' || state === 'current';
  return (
    <View
      className={`h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 ${
        filled ? `${BRAND_BG} ${BRAND_BORDER}` : 'border-neutral-200 bg-white'
      }`}
    >
      {state === 'completed' ? (
        <Check size={22} color="#ffffff" strokeWidth={2.5} />
      ) : (
        <StepIcon icon={icon} state={state} />
      )}
    </View>
  );
}

function StepCaption({ label, subtitle, state, align }: Pick<StepProps, 'label' | 'subtitle' | 'state'> & { align: CaptionAlign }) {
  const filled = state === 'completed' || state === 'current';
  const alignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';
  return (
    <>
      <Text
        className={`text-[11px] font-semibold leading-tight ${filled ? 'text-brand-800' : 'text-neutral-400'} ${alignClass}`}
        numberOfLines={2}
      >
        {label}
      </Text>
      {subtitle ? (
        <Text className={`mt-1 text-[10px] font-medium text-brand-600 ${alignClass}`} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </>
  );
}

function ConnectorSegment({ complete }: { complete: boolean }) {
  return (
    <View className={`h-1 shrink-0 flex-1 rounded-full ${complete ? 'bg-brand-600' : 'bg-brand-200'}`} />
  );
}

type Props = {
  coverStatus: CoverStatus;
  hoursLeft?: number;
  /** Hide outer title for tighter layouts */
  hideTitle?: boolean;
};

function stepState(complete: boolean, current: boolean): StepVisualState {
  if (complete) {
    return 'completed';
  }
  if (current) {
    return 'current';
  }
  return 'upcoming';
}

export function PremiumActivationTimeline({ coverStatus, hoursLeft = 0, hideTitle = false }: Props) {
  const isAwaiting = coverStatus === 'awaiting_funding';
  const isCooldown = coverStatus === 'cooldown';
  const isActive = coverStatus === 'active';

  const payComplete = isCooldown || isActive;
  const waitComplete = isActive;

  const s1 = stepState(payComplete, isAwaiting);
  const s2 = stepState(waitComplete, isCooldown && !waitComplete);
  const s3 = stepState(false, isActive);

  const waitSubtitle = isCooldown && hoursLeft > 0 ? `${hoursLeft}h left` : undefined;
  const hospitalSubtitle = isCooldown
    ? `${formatNaira(WEEK_ONE_CAP_NAIRA)} 1st week`
    : isActive
      ? 'Visits on'
      : undefined;

  return (
    <View className={hideTitle ? '' : 'px-1 pb-1 pt-1'}>
      {!hideTitle ? (
        <Text className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Path to hospital cover
        </Text>
      ) : null}

      {/* Icons + connectors share one row so lines sit flush between bubbles and align to vertical centers */}
      <View className="flex-row items-center">
        <View className="min-w-0 flex-1 flex-row items-center justify-end">
          <StepBubble state={s1} icon="wallet" />
        </View>
        <ConnectorSegment complete={payComplete} />
        <View className="min-w-0 flex-1 flex-row items-center justify-center">
          <StepBubble state={s2} icon="clock" />
        </View>
        <ConnectorSegment complete={waitComplete} />
        <View className="min-w-0 flex-1 flex-row items-center justify-start">
          <StepBubble state={s3} icon="hospital" />
        </View>
      </View>

      {/* Captions mirror the same five columns so text stays under each node */}
      <View className="mt-2 flex-row">
        <View className="min-w-0 flex-1 items-end px-0.5">
          <StepCaption label="Pay premium" state={s1} align="right" />
        </View>
        <View className="min-w-0 flex-1" />
        <View className="min-w-0 flex-1 items-center px-0.5">
          <StepCaption label={COOLDOWN_WAIT_LABEL} subtitle={waitSubtitle} state={s2} align="center" />
        </View>
        <View className="min-w-0 flex-1" />
        <View className="min-w-0 flex-1 items-start px-0.5">
          <StepCaption label="Visit hospital" subtitle={hospitalSubtitle} state={s3} align="left" />
        </View>
      </View>
    </View>
  );
}
