<!-- 彩色头像，根据性别显示不同图标 -->
<template>
  <div class="color-avatar" :style="avatarStyle">
    <img :src="genderIcon" :width="iconSize" :height="iconSize" alt="avatar" />
  </div>
</template>

<script setup lang="ts">
  import maleIcon from '@/assets/icons/avatar-male.svg'
  import femaleIcon from '@/assets/icons/avatar-female.svg'

  interface Props {
    name?: string
    gender?: string
    size?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    name: '',
    gender: '',
    size: 32
  })

  // 背景色方案，根据 name 哈希稳定选取
  const COLORS = [
    '#6366f1', '#ec4899', '#10b981', '#f59e0b',
    '#ef4444', '#3b82f6', '#a855f7', '#14b8a6',
    '#f97316', '#22c55e'
  ]

  const bgColor = computed(() => {
    const str = props.name || ''
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return COLORS[Math.abs(hash) % COLORS.length]
  })

  const isFemale = computed(() => props.gender === '女')
  const genderIcon = computed(() => isFemale.value ? femaleIcon : maleIcon)
  const iconSize = computed(() => Math.round(props.size * 0.82))

  const avatarStyle = computed(() => ({
    width: `${props.size}px`,
    height: `${props.size}px`,
    background: bgColor.value,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0',
  }))
</script>
