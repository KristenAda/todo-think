<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

  type EyeConfig = {
    id: string;
    size: number;
    offsetX: number;
    offsetY: number;
    travel: number;
    lift: number;
    angle: number;
    /** 相对眼眶中心的静态视线偏移（px）：俯视、斜视 */
    biasX?: number;
    biasY?: number;
  };

  type BlobExpression = 'neutral' | 'alert' | 'soft' | 'sweet' | 'sly';

  type BlobConfig = {
    id: string;
    width: number;
    height: number;
    radius: string;
    bottom: number;
    left: number;
    z: number;
    tilt: number;
    bobDelay: number;
    bobDuration: number;
    color: string;
    expression: BlobExpression;
    hoverLift: number;
    hoverRotate: number;
    hoverScale: number;
    eyes: EyeConfig[];
  };

  type BlobMotionState = {
    x: number;
    y: number;
    rotate: number;
    scale: number;
    depth: number;
    smile: number;
    smirk: number;
    accentTilt: number;
    accentScale: number;
  };

  // 绘制顺序：背景层(左二橙、右二蓝) → 前景层(中、左一、右一)。z：橙1 蓝2 中8 左一9 右一11
  const blobs: BlobConfig[] = [
    {
      id: 'blob-tall',
      color: '#F2C4A8',
      width: 114,
      height: 292,
      radius: '57px 57px 13px 13px',
      bottom: 18,
      left: 98,
      z: 1,
      tilt: 0.32,
      bobDelay: -1.4,
      bobDuration: 3.85,
      expression: 'alert',
      hoverLift: 4,
      hoverRotate: 1.4,
      hoverScale: 0.01,
      eyes: [
        {
          id: 'left',
          size: 27,
          offsetX: 26,
          offsetY: 58,
          travel: 4.8,
          lift: 0.5,
          angle: 0,
          biasX: 0,
          biasY: 5.4
        },
        {
          id: 'right',
          size: 27,
          offsetX: 60,
          offsetY: 60,
          travel: 4.8,
          lift: 0.5,
          angle: 0,
          biasX: 0,
          biasY: 5.4
        }
      ]
    },
    {
      id: 'blob-mid',
      color: '#9DADB8',
      width: 104,
      height: 214,
      radius: '52px 52px 12px 12px',
      bottom: 20,
      left: 210,
      z: 2,
      tilt: 0.2,
      bobDelay: -0.2,
      bobDuration: 4,
      expression: 'soft',
      hoverLift: 5,
      hoverRotate: 1.8,
      hoverScale: 0.015,
      eyes: [
        {
          id: 'left',
          size: 20,
          offsetX: 21,
          offsetY: 54,
          travel: 3.8,
          lift: 0,
          angle: 0,
          biasX: -3.6,
          biasY: 0.2
        },
        {
          id: 'right',
          size: 20,
          offsetX: 56,
          offsetY: 55,
          travel: 3.8,
          lift: 0,
          angle: 0,
          biasX: -3.2,
          biasY: 0.2
        }
      ]
    },
    {
      id: 'blob-tiny',
      color: '#FCFAF5',
      width: 56,
      height: 86,
      radius: '28px 28px 10px 10px',
      bottom: 24,
      left: 160,
      z: 8,
      tilt: 0.06,
      bobDelay: -2.05,
      bobDuration: 3.25,
      expression: 'sweet',
      hoverLift: 6,
      hoverRotate: 2,
      hoverScale: 0.03,
      eyes: [
        {
          id: 'left',
          size: 8,
          offsetX: 12,
          offsetY: 30,
          travel: 1.8,
          lift: 0,
          angle: 0,
          biasX: 0,
          biasY: -2.6
        },
        {
          id: 'right',
          size: 8,
          offsetX: 34,
          offsetY: 30,
          travel: 1.8,
          lift: 0,
          angle: 0,
          biasX: 0,
          biasY: -2.6
        }
      ]
    },
    {
      id: 'blob-front',
      color: '#F2C8B8',
      width: 130,
      height: 144,
      radius: '56% 56% 40% 40% / 50% 50% 20% 20%',
      bottom: 19,
      left: 244,
      z: 11,
      tilt: 0.1,
      bobDelay: -1.65,
      bobDuration: 3.5,
      expression: 'sly',
      hoverLift: 7,
      hoverRotate: 2.4,
      hoverScale: 0.025,
      eyes: [
        {
          id: 'left',
          size: 18,
          offsetX: 24,
          offsetY: 46,
          travel: 3.8,
          lift: 0,
          angle: 0,
          biasX: -3.4,
          biasY: 0.3
        },
        {
          id: 'right',
          size: 18,
          offsetX: 84,
          offsetY: 47,
          travel: 3.8,
          lift: 0,
          angle: 0,
          biasX: -3,
          biasY: 0.2
        }
      ]
    },
    {
      id: 'blob-back',
      color: '#9E9189',
      width: 82,
      height: 126,
      radius: '41px 41px 13px 13px',
      bottom: 26,
      left: 86,
      z: 9,
      tilt: -0.55,
      bobDelay: -0.75,
      bobDuration: 4.15,
      expression: 'neutral',
      hoverLift: 8,
      hoverRotate: -2.8,
      hoverScale: 0.02,
      eyes: [
        {
          id: 'left',
          size: 8,
          offsetX: 24,
          offsetY: 58,
          travel: 1.4,
          lift: 0,
          angle: 0,
          biasX: 1.4,
          biasY: -2.4
        },
        {
          id: 'right',
          size: 8,
          offsetX: 48,
          offsetY: 58,
          travel: 1.4,
          lift: 0,
          angle: 0,
          biasX: 1.8,
          biasY: -2.2
        }
      ]
    }
  ];

  const sceneRef = ref<HTMLElement | null>(null);
  const pointer = reactive({ x: 0, y: 0 });
  const eyeOpenness = reactive<Record<string, number>>({});
  const pupilOffsets = reactive<Record<string, { x: number; y: number }>>({});
  const blobMotion = reactive<Record<string, BlobMotionState>>({});
  const eyeElements = new Map<string, HTMLElement>();
  const timerBuckets = new Map<string, number[]>();
  const pointerTarget = { x: 0, y: 0 };
  const stageMotion = reactive({
    glowX: 50,
    glowY: 48,
    shadowX: 0,
    shadowY: 0,
    shadowScale: 1,
    shadowOpacity: 0.18
  });
  let pointerFrame = 0;

  for (const blob of blobs) {
    blobMotion[blob.id] = {
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
      depth: 0,
      smile: blob.expression === 'sweet' ? 0.32 : 0,
      smirk: blob.expression === 'sly' ? 0.62 : 0,
      accentTilt: 0,
      accentScale: 1
    };

    for (const eye of blob.eyes) {
      const key = `${blob.id}:${eye.id}`;
      eyeOpenness[key] = 1;
      pupilOffsets[key] = { x: 0, y: 0 };
    }
  }

  const sceneStyles = computed(() => {
    return {
      '--group-glow-x': `${stageMotion.glowX}%`,
      '--group-glow-y': `${stageMotion.glowY}%`,
      '--group-shadow-x': `${stageMotion.shadowX}px`,
      '--group-shadow-y': `${stageMotion.shadowY}px`,
      '--group-shadow-scale': `${stageMotion.shadowScale}`,
      '--group-shadow-opacity': `${stageMotion.shadowOpacity}`
    };
  });

  const stageStyles = computed(() => {
    const rect = sceneRef.value?.getBoundingClientRect();
    const scale = rect ? Math.min(rect.width / 560, rect.height / 400) : 1;

    return {
      transform: `translate(-50%, -50%) scale(${scale})`
    };
  });

  const blobStyles = computed(() => {
    return Object.fromEntries(
      blobs.map((blob) => {
        const motion = blobMotion[blob.id];
        return [
          blob.id,
          {
            '--blob-tilt': `${blob.tilt}deg`,
            '--blob-delay': `${blob.bobDelay}s`,
            '--blob-duration': `${blob.bobDuration}s`,
            '--hover-x': `${motion.x}px`,
            '--hover-y': `${motion.y}px`,
            '--hover-rotate': `${motion.rotate}deg`,
            '--hover-scale': `${motion.scale}`,
            '--hover-depth': `${motion.depth}px`,
            '--smile-open': `${motion.smile}`,
            '--smirk-open': `${motion.smirk}`,
            '--accent-tilt': `${motion.accentTilt}deg`,
            '--accent-scale': `${motion.accentScale}`
          }
        ];
      })
    );
  });

  function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }

  function registerTimer(bucket: string, timer: number) {
    const existing = timerBuckets.get(bucket) ?? [];
    existing.push(timer);
    timerBuckets.set(bucket, existing);
  }

  function getEyeKey(blobId: string, eyeId: string) {
    return `${blobId}:${eyeId}`;
  }

  function setEyeRef(blobId: string, eyeId: string, element: unknown) {
    const key = getEyeKey(blobId, eyeId);
    if (element instanceof globalThis.HTMLElement) {
      eyeElements.set(key, element);
      return;
    }
    eyeElements.delete(key);
  }

  function setEyeOpenness(blobId: string, eyeId: string, openness: number) {
    eyeOpenness[getEyeKey(blobId, eyeId)] = openness;
  }

  function setBlobEyeOpenness(blobId: string, openness: number) {
    const blob = blobs.find((item) => item.id === blobId);
    if (!blob) return;

    for (const eye of blob.eyes) {
      setEyeOpenness(blobId, eye.id, openness);
    }
  }

  function updatePointer(clientX: number, clientY: number) {
    pointerTarget.x = clientX;
    pointerTarget.y = clientY;
    schedulePointerUpdate();
  }

  function schedulePointerUpdate() {
    if (pointerFrame) return;

    pointerFrame = window.requestAnimationFrame(() => {
      pointerFrame = 0;
      pointer.x = pointerTarget.x;
      pointer.y = pointerTarget.y;
      updatePointerEffects();
    });
  }

  function cancelPointerUpdate() {
    if (!pointerFrame) return;

    window.cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
  }

  function syncPointer(clientX: number, clientY: number) {
    cancelPointerUpdate();
    pointerTarget.x = clientX;
    pointerTarget.y = clientY;
    pointer.x = clientX;
    pointer.y = clientY;
    updatePointerEffects();
  }

  function updatePointerEffects() {
    updatePupils();
    updateStageMotion();
    updateBlobInteractions();
  }

  function updatePupils() {
    const pupilGain = 0.118;

    for (const blob of blobs) {
      for (const eye of blob.eyes) {
        if (eye.travel <= 0) continue;

        const key = getEyeKey(blob.id, eye.id);
        const element = eyeElements.get(key);
        if (!element) continue;

        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = pointer.x - centerX;
        const dy = pointer.y - centerY;
        const angle = Math.atan2(dy, dx);
        const distance = Math.min(eye.travel, Math.hypot(dx, dy) * pupilGain);

        // 瞳孔相对身体有更大活动范围，主要承担「视线跟随」
        pupilOffsets[key].x = Math.cos(angle) * distance + (eye.biasX ?? 0);
        pupilOffsets[key].y = Math.sin(angle) * distance + (eye.biasY ?? 0);
      }
    }
  }

  function updateStageMotion() {
    const rect = sceneRef.value?.getBoundingClientRect();
    if (!rect) return;

    const normalizedX = clamp(((pointer.x - rect.left) / rect.width - 0.5) * 2, -1.2, 1.2);
    const normalizedY = clamp(((pointer.y - rect.top) / rect.height - 0.5) * 2, -1.1, 1.1);
    const intensity = clamp(Math.hypot(normalizedX, normalizedY) / 1.5, 0, 1);

    stageMotion.glowX = 50 + normalizedX * 5;
    stageMotion.glowY = 46 + normalizedY * 4;
    stageMotion.shadowX = -normalizedX * 12;
    stageMotion.shadowY = normalizedY * 4 + 12;
    stageMotion.shadowScale = 1 + intensity * 0.06;
    stageMotion.shadowOpacity = 0.14 + intensity * 0.06;
  }

  function updateBlobInteractions() {
    for (const blob of blobs) {
      const motion = blobMotion[blob.id];
      if (!motion) continue;

      motion.x = 0;
      motion.y = 0;
      motion.rotate = 0;
      motion.scale = 1;
      motion.depth = 0;

      motion.smile = blob.expression === 'sweet' ? 0.32 : 0;
      motion.smirk = blob.expression === 'sly' ? 0.62 : 0;

      motion.accentTilt = 0;
      motion.accentScale = 1;
    }
  }

  function runBlink(blobId: string) {
    setBlobEyeOpenness(blobId, 0.08);

    const reopen = window.setTimeout(() => {
      setBlobEyeOpenness(blobId, 1);
    }, 170);
    registerTimer(blobId, reopen);

    if (Math.random() > 0.74) {
      const doubleBlink = window.setTimeout(() => {
        setBlobEyeOpenness(blobId, 0.08);

        const secondReopen = window.setTimeout(() => {
          setBlobEyeOpenness(blobId, 1);
        }, 120);
        registerTimer(blobId, secondReopen);
      }, 260);

      registerTimer(blobId, doubleBlink);
    }
  }

  function scheduleBlink(blobId: string, baseDelay: number) {
    const timer = window.setTimeout(
      () => {
        runBlink(blobId);
        scheduleBlink(blobId, 2200);
      },
      baseDelay + Math.random() * 2600
    );

    registerTimer(blobId, timer);
  }

  function clearTimers() {
    for (const timers of timerBuckets.values()) {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    }
    timerBuckets.clear();
  }

  function resetToCenter() {
    const rect = sceneRef.value?.getBoundingClientRect();
    if (!rect) return;

    syncPointer(rect.left + rect.width / 2, rect.top + rect.height * 0.42);
  }

  function handlePointerMove(event: PointerEvent) {
    updatePointer(event.clientX, event.clientY);
  }

  onMounted(async () => {
    await nextTick();

    resetToCenter();
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('resize', resetToCenter);
    window.addEventListener('blur', resetToCenter);

    blobs.forEach((blob, index) => {
      scheduleBlink(blob.id, 1200 + index * 420);
    });
  });

  onBeforeUnmount(() => {
    cancelPointerUpdate();
    clearTimers();
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('resize', resetToCenter);
    window.removeEventListener('blur', resetToCenter);
  });
</script>

<template>
  <div ref="sceneRef" class="blob-scene" :style="sceneStyles">
    <div class="blob-stage" :style="stageStyles">
      <div class="blob-orb orb-left" />
      <div class="blob-orb orb-right" />

      <div
        v-for="blob in blobs"
        :key="blob.id"
        class="blob"
        :class="`blob--${blob.expression}`"
        :style="[
          blobStyles[blob.id],
          {
            width: `${blob.width}px`,
            height: `${blob.height}px`,
            left: `${blob.left}px`,
            bottom: `${blob.bottom}px`,
            zIndex: blob.z,
            '--blob-skin': blob.color
          }
        ]"
      >
        <div
          class="blob-body"
          :style="{
            borderRadius: blob.radius,
            backgroundColor: blob.color
          }"
        >
          <div
            v-if="blob.expression === 'sly'"
            class="cheek-blush cheek-blush--right"
            aria-hidden="true"
          />

          <div v-if="blob.expression === 'soft'" class="eyebrow-pair" aria-hidden="true">
            <span class="eyebrow eyebrow--left" />
            <span class="eyebrow eyebrow--right" />
          </div>

          <template v-for="eye in blob.eyes" :key="eye.id">
            <div
              class="eye-orbit"
              :class="{
                'eye-orbit--alert': blob.expression === 'alert',
                'eye-orbit--petite': blob.expression === 'sweet'
              }"
              :style="{
                left: `${eye.offsetX}px`,
                top: `${eye.offsetY}px`,
                width: `${eye.size}px`,
                height: `${eye.size * 0.94}px`,
                transform: `translateY(${eye.lift}px) rotate(${eye.angle}deg)`
              }"
            >
              <div
                class="eye-shell"
                :class="{
                  'eye-shell--soft': blob.expression === 'soft',
                  'eye-shell--alert': blob.expression === 'alert'
                }"
                :style="{
                  '--eye-open': `${eyeOpenness[`${blob.id}:${eye.id}`]}`
                }"
                :ref="(el) => setEyeRef(blob.id, eye.id, el)"
              >
                <div
                  class="pupil"
                  :style="{
                    '--pupil-x': `${pupilOffsets[`${blob.id}:${eye.id}`].x}px`,
                    '--pupil-y': `${pupilOffsets[`${blob.id}:${eye.id}`].y}px`
                  }"
                />
              </div>
            </div>
          </template>

          <div v-if="blob.expression === 'neutral'" class="mouth mouth--neutral" />
          <div v-if="blob.expression === 'alert'" class="mouth mouth--alert" />
          <div v-if="blob.expression === 'soft'" class="mouth mouth--frown" />
          <div v-if="blob.expression === 'sweet'" class="mouth mouth--sweet" />
          <div v-if="blob.expression === 'sly'" class="mouth mouth--sly" />
        </div>

        <div v-if="blob.id === 'blob-front'" class="blob-feet" aria-hidden="true">
          <span class="blob-foot blob-foot--left" />
          <span class="blob-foot blob-foot--right" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .blob-scene {
    --group-glow-x: 50%;
    --group-glow-y: 46%;
    --group-shadow-x: 0px;
    --group-shadow-y: 12px;
    --group-shadow-scale: 1;
    --group-shadow-opacity: 0.18;
    position: relative;
    isolation: isolate;
    overflow: visible;
    display: grid;
    place-items: center;
    width: min(100%, 560px);
    height: 100%;
    min-height: 320px;
    pointer-events: auto;
  }

  .blob-scene::before {
    content: '';
    position: absolute;
    inset: 10% 8% 16%;
    border-radius: 999px;
    background: radial-gradient(
      circle at var(--group-glow-x) var(--group-glow-y),
      color-mix(in srgb, var(--el-color-primary-light-9) 88%, transparent) 0%,
      color-mix(in srgb, var(--el-color-primary-light-8) 26%, transparent) 38%,
      transparent 72%
    );
    filter: blur(48px);
    transform: translate(var(--group-shadow-x), calc(var(--group-shadow-y) - 22px))
      scale(var(--group-shadow-scale));
    opacity: 0.88;
    pointer-events: none;
  }

  .blob-scene::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: 12%;
    width: min(92%, 300px);
    height: 48px;
    border-radius: 999px;
    background: radial-gradient(
      ellipse 72% 48% at 50% 50%,
      color-mix(in srgb, var(--el-color-primary) 8%, transparent) 0%,
      color-mix(in srgb, var(--el-color-primary) 3%, transparent) 55%,
      transparent 78%
    );
    filter: blur(22px);
    transform: translateX(-50%) translate(var(--group-shadow-x), var(--group-shadow-y))
      scale(var(--group-shadow-scale));
    opacity: var(--group-shadow-opacity);
    pointer-events: none;
  }

  .blob-stage {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 560px;
    height: 400px;
    transform-origin: center center;
    will-change: transform;
  }

  .blob-orb {
    position: absolute;
    border-radius: 50%;
    background: color-mix(in srgb, var(--el-color-primary-light-8) 72%, transparent);
    filter: blur(1px);
    opacity: 0.9;
  }

  .orb-left {
    left: 106px;
    bottom: 14px;
    width: 18px;
    height: 18px;
  }

  .orb-right {
    right: 42px;
    top: 240px;
    width: 20px;
    height: 20px;
  }

  .blob {
    position: absolute;
    transform: translate3d(var(--hover-x, 0px), var(--hover-y, 0px), var(--hover-depth, 0px))
      rotate(calc(var(--hover-rotate, 0deg) + var(--accent-tilt, 0deg)))
      scale(calc(var(--hover-scale, 1) * var(--accent-scale, 1)));
    will-change: transform;
  }

  .blob::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -18px;
    width: 82%;
    height: 22px;
    transform: translateX(-50%);
    border-radius: 50%;
    background: radial-gradient(
      ellipse 100% 100% at 50% 40%,
      rgba(55, 44, 40, 0.14) 0%,
      rgba(55, 44, 40, 0.06) 42%,
      transparent 72%
    );
    filter: blur(20px);
    opacity: 0.48;
    pointer-events: none;
  }

  .blob-body {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    isolation: isolate;
    background-image: linear-gradient(
      182deg,
      rgba(255, 255, 255, 0.22) 0%,
      rgba(255, 255, 255, 0.05) 34%,
      transparent 52%,
      rgba(32, 28, 26, 0.07) 100%
    );
    box-shadow:
      inset 0 -36px 56px rgba(72, 58, 50, 0.055),
      inset 16px 26px 52px rgba(255, 255, 255, 0.38),
      inset -14px -30px 48px rgba(0, 0, 0, 0.042),
      0 26px 52px rgba(56, 44, 40, 0.045),
      0 6px 18px rgba(56, 44, 40, 0.03);
    animation: blob-breathe var(--blob-duration, 3.8s) ease-in-out infinite;
    animation-delay: var(--blob-delay, 0s);
    transform-origin: center bottom;
  }

  .blob-body::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    opacity: 0.042;
    pointer-events: none;
    z-index: 1;
    mix-blend-mode: multiply;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23a)'/%3E%3C/svg%3E");
  }

  .eye-orbit {
    position: absolute;
    overflow: visible;
    z-index: 2;
    animation: eye-perk 4.4s ease-in-out infinite;
  }

  .cheek-blush {
    position: absolute;
    z-index: 1;
    pointer-events: none;
    border-radius: 50%;
    filter: blur(0.5px);
  }

  .cheek-blush--right {
    right: 7%;
    top: 42%;
    width: 28%;
    height: 20%;
    background: radial-gradient(
      ellipse 82% 72% at 50% 50%,
      color-mix(in srgb, #ff9eb0 42%, transparent) 0%,
      color-mix(in srgb, #ffc4d0 18%, transparent) 48%,
      transparent 76%
    );
    filter: blur(1.2px);
    opacity: 0.82;
  }

  .eyebrow-pair {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
  }

  .eyebrow {
    position: absolute;
    width: 19px;
    height: 2.5px;
    border-radius: 2px;
    background: rgba(34, 42, 58, 0.48);
    box-shadow: 0 0.5px 0 rgba(255, 255, 255, 0.12);
  }

  .eyebrow--left {
    left: 18px;
    top: 42px;
    width: 14px;
    height: 1.5px;
    transform: rotate(-4deg);
    opacity: 0.36;
  }

  .eyebrow--right {
    left: 47px;
    top: 42px;
    width: 13px;
    height: 1.5px;
    transform: rotate(4deg);
    opacity: 0.36;
  }

  .eye-orbit--petite {
    animation-duration: 6s;
  }

  .eye-orbit--alert {
    animation-duration: 5.2s;
  }

  .eye-shell--soft {
    box-shadow:
      inset -2px -3px 4px rgba(0, 0, 0, 0.1),
      0 4px 6px rgba(0, 0, 0, 0.08),
      inset 0 4px 0 rgba(255, 255, 255, 0.2);
  }

  .eye-shell--alert {
    box-shadow:
      inset -2px -3px 4px rgba(0, 0, 0, 0.1),
      0 5px 7px rgba(0, 0, 0, 0.09),
      inset 0 0 0 0.5px rgba(255, 255, 255, 0.28);
  }

  .eye-shell {
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 1;
    border-radius: 999px;
    background: radial-gradient(circle at 36% 28%, #ffffff 0 18%, #fafaf4 19% 68%, #ecece4 100%);
    border: none;
    box-shadow:
      inset -2px -3px 4px rgba(0, 0, 0, 0.1),
      0 4px 6px rgba(0, 0, 0, 0.08);
    transform-origin: center center;
    transform: scaleY(var(--eye-open, 1)) translateY(calc((1 - var(--eye-open, 1)) * 1px));
    transition: transform 120ms ease;
  }

  .pupil {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 33%;
    height: 37%;
    border-radius: 48% 52% 50% 50%;
    background: radial-gradient(
      circle at 34% 34%,
      #545454 0 14%,
      #232323 15% 58%,
      #0f0f11 58% 100%
    );
    transform: translate(calc(-50% + var(--pupil-x, 0px)), calc(-50% + var(--pupil-y, 0px)));
    transition: transform 72ms cubic-bezier(0.2, 0.9, 0.2, 1.12);
  }

  .pupil::after {
    content: '';
    position: absolute;
    left: 18%;
    top: 14%;
    width: 24%;
    height: 24%;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.74);
  }

  .blob-feet {
    position: absolute;
    left: 50%;
    bottom: 10px;
    z-index: 4;
    display: flex;
    justify-content: center;
    gap: 22px;
    transform: translateX(-50%);
    pointer-events: none;
  }

  .blob-foot {
    width: 15px;
    height: 10px;
    border-radius: 50%;
    background: linear-gradient(
      168deg,
      color-mix(in srgb, var(--blob-skin) 82%, #1e1410) 0%,
      color-mix(in srgb, var(--blob-skin) 100%, #fff5f0) 58%
    );
    box-shadow:
      inset 0 2px 3px rgba(255, 255, 255, 0.2),
      0 5px 12px rgba(42, 32, 30, 0.07);
    opacity: 0.94;
  }

  .mouth {
    position: absolute;
    z-index: 2;
    pointer-events: none;
  }

  .mouth--neutral {
    left: 50%;
    top: 70%;
    width: 12px;
    height: 1.5px;
    transform: translateX(-50%);
    border-radius: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(32, 26, 22, 0.45) 14%,
      rgba(32, 26, 22, 0.62) 50%,
      rgba(32, 26, 22, 0.45) 86%,
      transparent 100%
    );
    box-shadow: 0 0.5px 0 rgba(255, 255, 255, 0.08);
    opacity: 0.88;
  }

  .mouth--alert {
    left: 50%;
    top: 51%;
    width: 9px;
    height: 14px;
    transform: translate(-50%, -8%);
    border-radius: 50%;
    background: radial-gradient(ellipse 100% 100% at 38% 28%, #4a4a4e 0 38%, #1a1a1e 55% 100%);
    box-shadow:
      inset 0 -3px 4px rgba(0, 0, 0, 0.45),
      inset 0 2px 2px rgba(255, 255, 255, 0.12),
      0 2px 5px rgba(0, 0, 0, 0.14);
  }

  .mouth--alert::after {
    content: '';
    position: absolute;
    left: 22%;
    top: 18%;
    width: 28%;
    height: 16%;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.22);
  }

  .mouth--frown {
    left: 50%;
    top: 58%;
    width: 13px;
    height: 5px;
    transform: translateX(-50%);
    border-radius: 12px 12px 0 0;
    border-top: 2px solid rgba(48, 54, 64, 0.34);
    opacity: 0.9;
    box-shadow: 0 -0.5px 0 rgba(255, 255, 255, 0.12);
  }

  .mouth--sweet {
    left: 50%;
    top: calc(50% + 18px);
    width: calc(11px + var(--smile-open, 0.32) * 8px);
    height: calc(4px + var(--smile-open, 0.32) * 3px);
    transform: translateX(-50%);
    border-bottom: 2px solid rgba(88, 78, 72, 0.24);
    border-radius: 0 0 50% 50% / 0 0 100% 100%;
    opacity: calc(0.52 + var(--smile-open, 0.32) * 0.32);
    transition:
      width 200ms ease,
      height 200ms ease,
      opacity 200ms ease;
  }

  .mouth--sly {
    left: 50%;
    top: calc(50% + 22px);
    width: calc(16px + var(--smirk-open, 0.62) * 11px);
    height: calc(5px + var(--smirk-open, 0.62) * 3.5px);
    transform: translateX(-50%);
    border-bottom: 2px solid rgba(88, 68, 62, 0.3);
    border-radius: 0 0 48% 48% / 0 0 100% 100%;
    opacity: calc(0.68 + var(--smirk-open, 0.62) * 0.3);
    transition:
      width 200ms ease,
      height 200ms ease,
      opacity 200ms ease;
  }

  @keyframes blob-breathe {
    0%,
    100% {
      transform: translateY(0) rotate(var(--blob-tilt, 0deg));
    }
    50% {
      transform: translateY(-4px) rotate(var(--blob-tilt, 0deg));
    }
  }

  @keyframes eye-perk {
    0%,
    100% {
      translate: 0 0;
    }
    48% {
      translate: 0 -1px;
    }
  }

  @media (max-width: 720px) {
    .blob-scene {
      min-height: 280px;
    }
    .blob-scene::after {
      width: 220px;
    }
  }
</style>
