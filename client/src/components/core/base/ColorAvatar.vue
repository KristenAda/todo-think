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

  /** 无照片时：男/女各固定一色，避免按姓名随机 */
  const MALE_BG = '#3b82f6'
  const FEMALE_BG = '#ec4899'

  const bgColor = computed(() =>
    props.gender === '女' ? FEMALE_BG : MALE_BG
  )

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
