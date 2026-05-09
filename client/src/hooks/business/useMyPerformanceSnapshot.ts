import { ref, onMounted } from 'vue';
import { fetchPerformanceStats } from '@/api/task';

/**
 * 拉取当前登录用户在效能统计 roster 中的一行（含 compositeTier / subScores，队内归一化口径与效能页一致）。
 */
export function useMyPerformanceSnapshot(
  extraParams?: () => Partial<Api.Task.PerformancePageParams>
) {
  const stat = ref<Api.Task.PerformanceStat | null>(null);
  const loading = ref(false);

  async function refresh() {
    loading.value = true;
    try {
      const res = await fetchPerformanceStats({
        pickSelf: true,
        page: 1,
        pageSize: 1,
        ...extraParams?.()
      });
      stat.value = res.list?.[0] ?? null;
    } catch {
      stat.value = null;
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => void refresh());

  return { stat, loading, refresh };
}
