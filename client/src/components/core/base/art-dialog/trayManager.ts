/**
 * 全局弹窗托盘管理器
 * 统一管理所有最小化的 ArtDialog 实例，右下角排列展示
 */
import { ref } from 'vue'

export interface TrayItem {
  id: string
  title: string
  icon?: string
  restore: () => void
  close: () => void
}

const trayList = ref<TrayItem[]>([])

export function useTrayManager() {
  const addTray = (item: TrayItem) => {
    // 避免重复添加
    if (!trayList.value.find((t) => t.id === item.id)) {
      trayList.value.push(item)
    }
  }

  const removeTray = (id: string) => {
    const idx = trayList.value.findIndex((t) => t.id === id)
    if (idx >= 0) trayList.value.splice(idx, 1)
  }

  return { trayList, addTray, removeTray }
}
