import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import type { NotificationDisplay } from '@/features/notifications/api/notifications.api';
import { Text } from '@/shared/typography/Text';

const BRAND = '#2563eb';

const toneMeta: Record<
  NotificationDisplay['tone'],
  { Icon: typeof Info; iconColor: string; tag: string; tagBg: string; tagText: string }
> = {
  info: { Icon: Info, iconColor: BRAND, tag: 'Update', tagBg: 'bg-brand-50', tagText: 'text-brand-700' },
  success: { Icon: CheckCircle2, iconColor: '#059669', tag: 'Success', tagBg: 'bg-emerald-50', tagText: 'text-emerald-700' },
  warning: { Icon: AlertCircle, iconColor: '#d97706', tag: 'Action', tagBg: 'bg-amber-50', tagText: 'text-amber-800' },
};

type Props = {
  item: NotificationDisplay;
  bordered?: boolean;
  onPress?: () => void;
};

export function NotificationRow({ item, bordered = false, onPress }: Props) {
  const { Icon, iconColor, tag, tagBg, tagText } = toneMeta[item.tone];

  const content = (
    <View className={`flex-row gap-3 py-3.5 ${bordered ? 'border-b border-neutral-100' : ''}`}>
      <View className="h-11 w-11 items-center justify-center rounded-full bg-neutral-100">
        <Icon size={20} color={iconColor} />
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-start justify-between gap-2">
          <Text className="flex-1 text-sm font-semibold text-neutral-900">{item.title}</Text>
          <View className={`rounded-full px-2 py-0.5 ${tagBg}`}>
            <Text className={`text-[10px] font-semibold ${tagText}`}>{tag}</Text>
          </View>
        </View>
        <Text className="mt-1 text-sm leading-relaxed text-neutral-600">{item.body}</Text>
        <Text className="mt-1.5 text-xs text-neutral-400">
          {item.dayLabel} · {item.timeLabel}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-70">
        {content}
      </Pressable>
    );
  }

  return content;
}
