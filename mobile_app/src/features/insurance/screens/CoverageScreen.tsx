import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { usePullToRefresh, refetchAll } from '@/core/hooks/usePullToRefresh';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Check, ChevronRight, Shield, X } from 'lucide-react-native';

import { useAuthenticatedQueryEnabled } from '@/core/auth/useAuthenticatedQuery';
import { koboToNaira } from '@/core/api/kobo';
import { COVERAGE_EXCLUDED, COVERAGE_INCLUDED } from '@/features/insurance/constants/coverageCatalog';
import { claimsApi } from '@/features/insurance/api/claims.api';
import { useInsurance } from '@/features/insurance/hooks/useInsurance';
import { statusDetail, statusHeadline } from '@/features/insurance/mappers/dashboardMapper';
import {
  DashboardPillTabs,
  DashboardScreenShell,
  DashboardSurfaceCard,
  DASHBOARD,
} from '@/shared/ui/dashboard';
import { formatNaira } from '@/shared/format/naira';
import { Text } from '@/shared/typography/Text';

const TABS = [
  { id: 'included', label: 'Included' },
  { id: 'excluded', label: 'Not included' },
  { id: 'limits', label: 'Limits' },
] as const;

function CoverageListItem({ text, included }: { text: string; included: boolean }) {
  return (
    <View className="flex-row gap-3 border-b border-neutral-100 py-3.5 last:border-0">
      <View className={`mt-0.5 h-6 w-6 items-center justify-center rounded-full ${included ? 'bg-brand-50' : 'bg-neutral-100'}`}>
        {included ? <Check size={14} color={DASHBOARD.primary} /> : <X size={14} color="#737373" />}
      </View>
      <Text className={`flex-1 text-sm leading-relaxed ${included ? 'text-neutral-800' : 'text-neutral-600'}`}>{text}</Text>
    </View>
  );
}

export default function CoverageScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<string>('included');
  const enabled = useAuthenticatedQueryEnabled();
  const { data: dashboard, isLoading, refetch: refetchInsurance } = useInsurance();

  const { data: claimsPage, refetch: refetchClaims } = useQuery({
    queryKey: ['claims'],
    queryFn: () => claimsApi.list(1, 10),
    enabled,
  });

  const onRefresh = useCallback(
    () => refetchAll(() => refetchInsurance(), () => refetchClaims()),
    [refetchInsurance, refetchClaims],
  );
  const { refreshControl } = usePullToRefresh(onRefresh);

  const coverStatus = dashboard?.coverStatus ?? 'awaiting_funding';
  const displayRemainingNaira = dashboard?.displayRemainingNaira ?? dashboard?.coverageRemainingNaira ?? 0;
  const displayCapNaira = dashboard?.displayCapNaira ?? dashboard?.coverageCapNaira ?? 20_000;
  const coverageCapNaira = dashboard?.coverageCapNaira ?? 20_000;
  const coverageProgressPct = dashboard?.coverageProgressPct ?? 0;
  const cooldownHoursLeft = dashboard?.cooldownHoursLeft ?? 0;
  const planLabel = dashboard?.planLabel ?? '';
  const resetHint = dashboard?.resetHint ?? '';
  const weekOneCapNaira = dashboard?.weekOneCapNaira ?? 5_000;
  const weekOnePeriodCapApplies = dashboard?.weekOnePeriodCapApplies ?? false;
  const weekOneEndsLabel = dashboard?.weekOneEndsLabel ?? null;

  const recentClaims = claimsPage?.items ?? [];

  return (
    <DashboardScreenShell title="Coverage" subtitle="Hospital help on your plan" refreshControl={refreshControl}>
      {isLoading ? (
        <View className="items-center py-12">
          <ActivityIndicator size="large" color={DASHBOARD.primary} />
        </View>
      ) : (
        <DashboardSurfaceCard variant="dark" className="mb-6 p-5">
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="text-sm font-medium text-white/70">Starter Shield</Text>
              <Text className="mt-0.5 text-xs text-white/50">{planLabel}</Text>
            </View>
            <Shield size={22} color="#ffffff" />
          </View>

          <Text className="mt-6 text-sm text-white/60">{dashboard?.coverCardTitle ?? 'Cover remaining'}</Text>
          <Text className="mt-1 text-4xl font-black tracking-tight text-white">{formatNaira(displayRemainingNaira)}</Text>
          <Text className="mt-1 text-sm leading-snug text-white/50">{dashboard?.coverCardSubtitle ?? `of ${formatNaira(displayCapNaira)} monthly hospital help`}</Text>

          <View className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/15">
            <View className="h-full rounded-full bg-brand-500" style={{ width: `${coverageProgressPct}%` }} />
          </View>

          <View className="mt-4 self-start rounded-full bg-white/10 px-3 py-1.5">
            <Text className="text-xs font-semibold uppercase tracking-wide text-white">
              {statusHeadline(coverStatus, weekOnePeriodCapApplies)}
            </Text>
          </View>
          <Text className="mt-3 text-sm leading-relaxed text-white/75">
            {statusDetail(coverStatus, cooldownHoursLeft, {
              weekOnePeriodCapApplies,
              weekOneCapNaira,
              weekOneEndsLabel,
              monthlyCapNaira: coverageCapNaira,
            })}
          </Text>
          <Text className="mt-2 text-xs text-white/45">{dashboard?.coverJourneyExplainer ?? resetHint}</Text>
          {coverStatus === 'awaiting_funding' ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/premium')}
              className="mt-5 flex-row items-center justify-center rounded-2xl bg-white px-4 py-3 active:opacity-90"
            >
              <Text className="text-sm font-bold text-brand-700">Pay first premium</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/partner-hospitals')}
            className="mt-5 flex-row items-center justify-between rounded-2xl border border-white/20 px-4 py-3 active:bg-white/10"
          >
            <Text className="text-sm font-semibold text-white">Find partner hospitals</Text>
            <ChevronRight size={18} color="#ffffff" />
          </Pressable>
        </DashboardSurfaceCard>
      )}

      <DashboardPillTabs tabs={TABS} activeId={tab} onChange={setTab} />

      <View className="px-5">
        {tab === 'included' ? (
          <DashboardSurfaceCard variant="default" className="!mx-0 p-5">
            <Text className="mb-1 text-base font-bold text-neutral-900">What’s included</Text>
            <Text className="mb-4 text-sm text-neutral-500">Primary care covered on Starter Shield</Text>
            {COVERAGE_INCLUDED.map((line) => (
              <CoverageListItem key={line} text={line} included />
            ))}
          </DashboardSurfaceCard>
        ) : null}

        {tab === 'excluded' ? (
          <DashboardSurfaceCard variant="default" className="!mx-0 p-5">
            <Text className="mb-1 text-base font-bold text-neutral-900">Not in this plan</Text>
            <Text className="mb-4 text-sm text-neutral-500">Referrals and higher-level care are out of scope for MVP</Text>
            {COVERAGE_EXCLUDED.map((line) => (
              <CoverageListItem key={line} text={line} included={false} />
            ))}
          </DashboardSurfaceCard>
        ) : null}

        {tab === 'limits' ? (
          <DashboardSurfaceCard variant="default" className="!mx-0 p-5">
            <Text className="text-sm font-medium text-neutral-500">Monthly limit</Text>
            <Text className="mt-1 text-3xl font-black text-neutral-900">{formatNaira(coverageCapNaira)}</Text>
            <View className="mt-4 gap-3">
              <View className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Rolling window</Text>
                <Text className="mt-1 text-sm leading-relaxed text-neutral-700">
                  Per member every 30 days from registration—not calendar month.
                </Text>
              </View>
              <View className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Week one cap</Text>
                <Text className="mt-1 text-sm leading-relaxed text-neutral-700">
                  For the first 7 days after your first premium, hospital help is limited to {formatNaira(weekOneCapNaira)}{' '}
                  in total across all visits (fraud protection for new members). After that window—and your 3-day
                  activation wait—your full {formatNaira(coverageCapNaira)} monthly pool applies.
                </Text>
              </View>
            </View>
            {recentClaims.length > 0 ? (
              <View className="mt-6">
                <Text className="mb-2 text-sm font-bold text-neutral-900">Recent claims</Text>
                {recentClaims.map((claim) => (
                  <View key={claim.id} className="border-b border-neutral-100 py-3">
                    <Text className="text-sm font-semibold text-neutral-900">{claim.treatmentType}</Text>
                    <Text className="mt-0.5 text-xs text-neutral-500">
                      {formatNaira(koboToNaira(claim.amount))} · {claim.status}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </DashboardSurfaceCard>
        ) : null}
      </View>
    </DashboardScreenShell>
  );
}
