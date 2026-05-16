import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  Bell,
  Briefcase,
  Calendar,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  Phone,
  QrCode,
  Shield,
  User,
  Users,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { usePullToRefresh, refetchAll } from '@/core/hooks/usePullToRefresh';
import { useRefreshMemberSession } from '@/core/hooks/useRefreshMemberSession';
import { ActivityIndicator, Image, Linking, Pressable, View } from 'react-native';

import { logout } from '@/features/auth/services/authSession';
import { MemberQrModal } from '@/features/profile/components/MemberQrModal';
import { ReportIssueModal } from '@/features/profile/components/ReportIssueModal';
import { useProfile } from '@/features/profile/hooks/useProfile';
import {
  DashboardScreenShell,
  DashboardSectionHeader,
  DashboardSettingRow,
  DashboardSurfaceCard,
  DASHBOARD,
} from '@/shared/ui/dashboard';
import { Button } from '@/shared/ui/Button';
import { Text } from '@/shared/typography/Text';

const AVATAR = require('../../../../assets/woman.jpg');
const ICON_SIZE = 20;

export default function ProfileScreen() {
  const router = useRouter();
  const refreshSession = useRefreshMemberSession();
  const { data: bundle, isLoading, refetch } = useProfile();
  const profile = bundle?.profile;

  const onRefresh = useCallback(
    () => refetchAll(refreshSession, () => refetch()),
    [refreshSession, refetch],
  );
  const { refreshControl } = usePullToRefresh(onRefresh);
  const [qrOpen, setQrOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const callSupport = () => {
    if (profile?.supportPhoneE164) {
      void Linking.openURL(`tel:${profile.supportPhoneE164}`);
    }
  };

  const onSignOut = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <DashboardScreenShell
      title="Profile"
      showNotification
      onNotificationPress={() => router.push('/(tabs)/notifications')}
      refreshControl={refreshControl}
    >
      {isLoading ? (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color={DASHBOARD.primary} />
        </View>
      ) : null}
      <View className="mb-5 flex-row items-center gap-4 px-5">
        <Image
          source={AVATAR}
          className="h-[72px] w-[72px] rounded-full border-2 border-neutral-200 bg-neutral-100"
          accessibilityIgnoresInvertColors
        />
        <View className="flex-1">
          <Text className="text-2xl font-black text-neutral-900">{profile?.name ?? '—'}</Text>
          <Text className="mt-1 text-sm text-neutral-500">Member since {profile?.memberSince ?? '—'}</Text>
          <View className="mt-2 flex-row items-center gap-1.5">
            <Shield size={14} color={DASHBOARD.primary} />
            <Text className="text-sm font-semibold text-brand-700">Verified member</Text>
          </View>
        </View>
      </View>

      <DashboardSurfaceCard variant="dark" className="mb-6 p-5">
        <View className="flex-row items-start justify-between">
          <View className="rounded-full border border-white/20 px-3 py-1">
            <Text className="text-[10px] font-semibold uppercase tracking-wide text-white/80">Health wallet ID</Text>
          </View>
          <Shield size={20} color="#ffffff" />
        </View>
        <Text className="mt-4 text-xl font-bold text-white">{profile?.plan ?? '—'}</Text>
        <Text className="mt-1 text-sm text-white/70">{profile?.premium ?? ''}</Text>
        <View className="mt-5 flex-row gap-8 border-t border-white/10 pt-4">
          <View>
            <Text className="text-xs text-white/50">Policy</Text>
            <Text className="mt-0.5 text-sm font-semibold text-white">{profile?.policyId ?? '—'}</Text>
          </View>
          <View>
            <Text className="text-xs text-white/50">Cover cap</Text>
            <Text className="mt-0.5 text-sm font-semibold text-white">{profile?.cap ?? '—'}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/coverage')}
          className="mt-5 flex-row items-center justify-between rounded-2xl border border-white/20 px-4 py-3 active:bg-white/10"
        >
          <Text className="text-sm font-semibold text-white">View coverage details</Text>
          <ChevronRight size={18} color="#ffffff" />
        </Pressable>
      </DashboardSurfaceCard>

      <DashboardSectionHeader title="Account" />
      <View className="mb-6">
        <DashboardSettingRow
          icon={<User size={ICON_SIZE} color={DASHBOARD.primary} />}
          title="Personal details"
          subtitle={profile?.name ?? '—'}
        />
        <DashboardSettingRow
          icon={<Phone size={ICON_SIZE} color={DASHBOARD.primary} />}
          title="Phone number"
          subtitle={profile?.phone ?? '—'}
        />
        <DashboardSettingRow
          icon={<Calendar size={ICON_SIZE} color={DASHBOARD.primary} />}
          title="Date of birth"
          subtitle={profile?.dateOfBirth ?? '—'}
        />
        <DashboardSettingRow
          icon={<Users size={ICON_SIZE} color={DASHBOARD.primary} />}
          title="Gender"
          subtitle={profile?.gender ?? '—'}
        />
        <DashboardSettingRow
          icon={<Briefcase size={ICON_SIZE} color={DASHBOARD.primary} />}
          title="Occupation"
          subtitle={profile?.occupation ?? '—'}
        />
        <DashboardSettingRow
          icon={<QrCode size={ICON_SIZE} color={DASHBOARD.primary} />}
          title="Member QR code"
          subtitle="Show at hospital check-in"
          onPress={() => setQrOpen(true)}
          isLast
        />
      </View>

      <DashboardSectionHeader title="Your plan" />
      <View className="mb-6">
        <DashboardSettingRow
          icon={<CreditCard size={ICON_SIZE} color={DASHBOARD.primary} />}
          title="Coverage & wallet"
          subtitle="Limits and virtual account"
          onPress={() => router.push('/(tabs)/coverage')}
        />
        <DashboardSettingRow
          icon={<FileText size={ICON_SIZE} color={DASHBOARD.primary} />}
          title="Activity"
          subtitle="Payments and claims history"
          onPress={() => router.push('/(tabs)/transactions')}
          isLast
        />
      </View>

      <DashboardSectionHeader title="Support" />
      <View className="mb-4 px-5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Call customer support ${profile?.supportPhoneDisplay ?? ''}`}
          onPress={callSupport}
          className="flex-row items-center gap-3 rounded-2xl bg-brand-600 px-4 py-4 active:opacity-90"
        >
          <View className="h-11 w-11 items-center justify-center rounded-full bg-white/20">
            <Phone size={ICON_SIZE} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-white">Call customer support</Text>
            <Text className="mt-0.5 text-sm text-white/85">{profile?.supportPhoneDisplay ?? ''}</Text>
          </View>
        </Pressable>
      </View>
      <View className="mb-8">
        <DashboardSettingRow
          icon={<AlertTriangle size={ICON_SIZE} color={DASHBOARD.primary} />}
          title="Report an issue"
          subtitle="Payments, cover, or app problems"
          onPress={() => setReportOpen(true)}
        />
        <DashboardSettingRow
          icon={<HelpCircle size={ICON_SIZE} color={DASHBOARD.primary} />}
          title="Help & voice guide"
          subtitle="How to use BetaHealth"
        />
        <DashboardSettingRow
          icon={<Bell size={ICON_SIZE} color={DASHBOARD.primary} />}
          title="Alerts"
          subtitle="Claims and wallet updates"
          onPress={() => router.push('/(tabs)/notifications')}
          isLast
        />
      </View>

      <View className="px-5">
        <Button title="Sign out" variant="destructive" onPress={() => void onSignOut()} />
      </View>

      <MemberQrModal
        visible={qrOpen}
        onClose={() => setQrOpen(false)}
        qrPayload={bundle?.card?.qrPayload}
        qrCodeDataUrl={bundle?.card?.qrCodeDataUrl}
        membershipNumber={bundle?.card?.membershipNumber ?? profile?.policyId}
        memberName={profile?.name}
      />
      <ReportIssueModal visible={reportOpen} onClose={() => setReportOpen(false)} />
    </DashboardScreenShell>
  );
}
