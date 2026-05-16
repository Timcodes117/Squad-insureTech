import { useCallback, useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';

const BRAND = '#2563eb';

/** Pull-to-refresh control wired to one or more async refetch handlers. */
export function usePullToRefresh(onRefresh: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={() => void handleRefresh()}
        tintColor={BRAND}
        colors={[BRAND]}
        progressBackgroundColor="#ffffff"
      />
    ),
    [refreshing, handleRefresh],
  );

  return { refreshing, refreshControl, onRefresh: handleRefresh };
}

/** Run multiple refetch promises in parallel (e.g. wallet + transactions). */
export async function refetchAll(...tasks: Array<() => Promise<unknown>>): Promise<void> {
  await Promise.all(tasks.map((task) => task()));
}
