import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COVERAGE_EXCLUDED, COVERAGE_INCLUDED } from '@/features/insurance/constants/coverageCatalog';
import { Card } from '@/shared/ui/Card';
import { Text } from '@/shared/typography/Text';

export default function CoverageScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-2">
          <Text className="text-xs font-semibold uppercase tracking-wide text-brand-700">BetaHealth</Text>
          <Text className="mt-1 text-2xl font-black tracking-tight text-neutral-900">Coverage</Text>
          <Text className="mt-2 text-base leading-relaxed text-neutral-600">
            Primary-care focus for informal workers—predictable bills, not catastrophic surgery (MVP).
          </Text>
        </View>

        <View className="mt-6 px-5">
          <Card className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
            <Text className="text-base font-bold text-brand-900">Included</Text>
            <View className="mt-3 gap-2">
              {COVERAGE_INCLUDED.map((line) => (
                <Text key={line} className="text-sm leading-relaxed text-neutral-800">
                  • {line}
                </Text>
              ))}
            </View>
          </Card>
        </View>

        <View className="mt-4 px-5">
          <Card className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <Text className="text-base font-bold text-neutral-900">Not included (MVP)</Text>
            <View className="mt-3 gap-2">
              {COVERAGE_EXCLUDED.map((line) => (
                <Text key={line} className="text-sm leading-relaxed text-neutral-600">
                  • {line}
                </Text>
              ))}
            </View>
          </Card>
        </View>

        <View className="mt-6 px-5">
          <Card className="rounded-2xl border border-neutral-200 bg-white p-4">
            <Text className="text-base font-bold text-neutral-900">Monthly limit</Text>
            <Text className="mt-2 text-sm leading-relaxed text-neutral-600">
              ₦20,000 per member per rolling 30-day window from your registration date. Amounts shown in the app are demo
              values until the backend is connected.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
