import { Pressable, ScrollView } from 'react-native';

import { Text } from '@/shared/typography/Text';

export type PillTab = { id: string; label: string };

type Props = {
  tabs: readonly PillTab[];
  activeId: string;
  onChange: (id: string) => void;
};

export function DashboardPillTabs({ tabs, activeId, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      className="mb-4"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(tab.id)}
            className={`rounded-full px-4 py-2.5 active:opacity-90 ${active ? 'bg-brand-600' : 'bg-neutral-100'}`}
          >
            <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-neutral-600'}`}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
