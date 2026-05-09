<template>
  <Teleport to="body">
    <div
      v-show="active"
      class="points-settlement-fx pointer-events-none fixed inset-0 z-[110000]"
      aria-hidden="true"
    >
      <canvas
        ref="canvasRef"
        class="h-full w-full absolute inset-0"
        style="filter: drop-shadow(0 4px 12px rgba(0, 212, 255, 0.25))"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
  import * as THREE from 'three';
  import { mittBus } from '@/utils/sys'; // 请替换为你的 event bus 路径

  defineOptions({ name: 'PointsSettlementParticleOverlay' });

  const active = ref(false);
  const canvasRef = ref<HTMLCanvasElement | null>(null);

  // 粒子数量：保证星河的丰满度
  const PARTICLE_COUNT = 1500;

  // ⏱️ 重新编排的“河流”时间轴 (总计约 3.2 秒)
  const TIME_APPEAR = 0.8; // 前 0.8 秒：粒子在屏幕中间缓缓浮现、悬浮
  const TIME_STAGGER = 0.8; // 0.8 ~ 1.6 秒：粒子排队依次出发（形成河流）
  const TIME_FLOW = 1.2; // 每个粒子的飞行时间：1.2 秒（足够缓慢优雅）
  // 也就是说：最晚出发的粒子在 1.6秒出发，飞行 1.2秒，在 2.8秒 时所有粒子完美消失。

  let raf = 0;
  let cleanupFn: (() => void) | null = null;

  function stopActiveScene(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    geos: THREE.BufferGeometry[],
    mats: THREE.Material[]
  ) {
    cancelAnimationFrame(raf);
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    renderer.dispose();
    scene.clear();
  }

  function playEffect(payload: { earnedPoints: number; totalPoints: number }) {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const isNegative = payload.earnedPoints < 0;

    if (cleanupFn) {
      cleanupFn();
      cleanupFn = null;
    }

    active.value = true;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const halfW = width / 2;
    const halfH = height / 2;

    const targetEl = document.querySelector('[data-points-chip-target]') as HTMLElement | null;
    let tx: number, ty: number;

    if (targetEl) {
      const r = targetEl.getBoundingClientRect();
      // 精准计算 DOM 的物理中心
      const screenX = r.left + r.width / 2;
      const screenY = r.top + r.height / 2;
      tx = screenX - halfW;
      ty = halfH - screenY;
    } else {
      tx = 0;
      ty = 0;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 2000);
    camera.position.z = 500;

    // 清新明亮的流体色系
    const colorA = isNegative ? 0xf43f5e : 0x00d4ff; // 亮粉 / 天青蓝
    const colorB = isNegative ? 0xffb3c6 : 0x90e0ef; // 浅粉 / 冰晶蓝

    // ==========================================
    // 构建：中心 3/5 区域的星河粒子
    // ==========================================
    const pGeo = new THREE.BufferGeometry();
    const pStart = new Float32Array(PARTICLE_COUNT * 3);
    const pPhase = new Float32Array(PARTICLE_COUNT);
    const pHue = new Float32Array(PARTICLE_COUNT);
    const pSize = new Float32Array(PARTICLE_COUNT);
    const pPos = new Float32Array(PARTICLE_COUNT * 3);

    // 占据屏幕宽高的 60% (3/5)
    const spreadX = width * 0.3;
    const spreadY = height * 0.3;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r_dist = Math.sqrt(Math.random());

      // 在屏幕正中心生成
      pStart[i * 3] = Math.cos(angle) * spreadX * r_dist;
      pStart[i * 3 + 1] = Math.sin(angle) * spreadY * r_dist;
      pStart[i * 3 + 2] = -100 + Math.random() * 200;

      pPhase[i] = Math.random();
      pHue[i] = Math.random();
      pSize[i] = 4.0 + Math.random() * 6.0;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('aStartPx', new THREE.BufferAttribute(pStart, 3));
    pGeo.setAttribute('aPhase', new THREE.BufferAttribute(pPhase, 1));
    pGeo.setAttribute('aHue', new THREE.BufferAttribute(pHue, 1));
    pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSize, 1));

    const pMat = new THREE.ShaderMaterial({
      uniforms: {
        uTargetPx: { value: new THREE.Vector3(tx, ty, 0) },
        uTime: { value: 0 },
        uTimeAppear: { value: TIME_APPEAR },
        uTimeStagger: { value: TIME_STAGGER },
        uTimeFlow: { value: TIME_FLOW },
        uColorA: { value: new THREE.Color(colorA) },
        uColorB: { value: new THREE.Color(colorB) }
      },
      vertexShader: `
        attribute vec3 aStartPx;
        attribute float aPhase;
        attribute float aHue;
        attribute float aSize;
        
        uniform vec3 uTargetPx;
        uniform float uTime;
        uniform float uTimeAppear;
        uniform float uTimeStagger;
        uniform float uTimeFlow;
        
        varying float vHue;
        varying float vAlpha;

        vec3 cubicBezier(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
          float u = 1.0 - t;
          float tt = t * t;
          float uu = u * u;
          float uuu = uu * u;
          float ttt = tt * t;
          return uuu * p0 + 3.0 * uu * t * p1 + 3.0 * u * tt * p2 + ttt * p3;
        }

        void main() {
          // 阶段一：所有粒子缓慢出现并悬浮 (0.0 ~ 0.8s)
          float tAppear = clamp(uTime / uTimeAppear, 0.0, 1.0);
          
          // 悬浮呼吸动画
          vec3 drift = vec3(
            sin(uTime * 1.5 + aPhase * 20.0) * 30.0,
            cos(uTime * 1.2 + aPhase * 15.0) * 30.0,
            sin(uTime * 2.0 + aPhase * 10.0) * 20.0
          );
          vec3 A = aStartPx + drift;
          vec3 D = uTargetPx;

          // 阶段二：排队汇成河流 (延时出发)
          float delay = uTimeAppear + aPhase * uTimeStagger;
          float tFlow = clamp((uTime - delay) / uTimeFlow, 0.0, 1.0);
          
          // 平滑的缓出曲线 (EaseInOutCubic)，流体感极佳
          float easeFlow = tFlow < 0.5 ? 4.0 * tFlow * tFlow * tFlow : 1.0 - pow(-2.0 * tFlow + 2.0, 3.0) / 2.0;

          // ======= 构建宏大的“河流”路径 =======
          vec3 dir = D - A;
          vec3 perp = vec3(-dir.y, dir.x, 0.0);
          float dist = length(dir);
          
          // 统一向外侧弯曲形成一束水流
          if (dist > 0.0) {
            perp = normalize(perp) * dist * 0.35; 
          }
          // 给水流增加一定的厚度与错落感
          vec3 noise = vec3(sin(aPhase * 43.0), cos(aPhase * 17.0), sin(aPhase * 29.0)) * 60.0;
          
          vec3 B = A + dir * 0.2 + perp + noise + vec3(0.0, 0.0, 100.0);
          vec3 C = A + dir * 0.8 + perp * 0.6 + noise + vec3(0.0, 0.0, 50.0);

          vec3 pos = cubicBezier(A, B, C, D, easeFlow);
          
          vHue = aHue;
          
          // 透明度与尺寸逻辑：
          float alphaAppear = smoothstep(0.0, 1.0, tAppear);
          // 在完全抵达终点前 (90%~100%) 渐渐消失，避免生硬撞击
          float alphaFlow = 1.0 - smoothstep(0.9, 1.0, tFlow); 
          
          vAlpha = alphaAppear * alphaFlow;
          
          float scale = alphaAppear * (1.0 - smoothstep(0.85, 1.0, tFlow));
          float twinkle = 0.8 + 0.4 * sin(uTime * 12.0 + aPhase * 100.0);

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          gl_PointSize = aSize * scale * twinkle * (400.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        precision mediump float;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        varying float vHue;
        varying float vAlpha;

        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float dist = length(uv); 
          if (dist > 0.5) discard;
          
          float core = smoothstep(0.3, 0.0, dist);
          float glow = smoothstep(0.5, 0.1, dist);
          
          vec3 color = mix(uColorA, uColorB, vHue);
          vec3 finalColor = mix(color, vec3(1.0), core * 0.9);
          
          gl_FragColor = vec4(finalColor, glow * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    const pMesh = new THREE.Points(pGeo, pMat);
    scene.add(pMesh);

    const clock = new THREE.Clock();
    let hasNotifiedRoll = false;

    const doneDispose = () => {
      window.removeEventListener('resize', onResize);
      stopActiveScene(renderer, scene, [pGeo], [pMat]);
      active.value = false;
      cleanupFn = null;
    };

    const tick = () => {
      const t = clock.getElapsedTime();
      pMat.uniforms.uTime.value = t;

      renderer.render(scene, camera);

      // ✨ 极其严谨的时空逻辑：
      // TIME_APPEAR (0.8) + TIME_STAGGER (0.8) + TIME_FLOW (1.2) = 2.8s
      // 绝对确保在 t = 2.85 秒时，最后一颗粒子都已经死透了。
      // 这个时候我们才发射事件，通知你原本的业务面板开始滚动数字！
      if (t >= 2.85 && !hasNotifiedRoll) {
        hasNotifiedRoll = true;

        // 👉 在你的业务组件（如 Header 积分余额处）监听此事件
        // 然后执行你原有的数字滚动动画（如 VueUse 的 useTransition）
        mittBus.emit('pointsParticleHitTarget', {
          earnedPoints: payload.earnedPoints,
          totalPoints: payload.totalPoints
        });
      }

      // 给特效留出彻底渲染完毕的时间，3.2秒后卸载 Canvas
      if (t < 3.2) {
        raf = requestAnimationFrame(tick);
      } else {
        doneDispose();
      }
    };

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const hw = w / 2;
      const hh = h / 2;
      camera.left = -hw;
      camera.right = hw;
      camera.top = hh;
      camera.bottom = -hh;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);

      const tel = document.querySelector('[data-points-chip-target]') as HTMLElement | null;
      if (tel) {
        const r = tel.getBoundingClientRect();
        const screenX = r.left + r.width / 2;
        const screenY = r.top + r.height / 2;
        pMat.uniforms.uTargetPx.value.set(screenX - hw, hh - screenY, 0);
      }
    };

    window.addEventListener('resize', onResize);
    cleanupFn = doneDispose;
    raf = requestAnimationFrame(tick);
  }

  function onBus(payload: { earnedPoints: number; totalPoints: number }) {
    if (typeof payload.totalPoints === 'number' && typeof payload.earnedPoints === 'number') {
      nextTick(() =>
        playEffect({
          earnedPoints: payload.earnedPoints,
          totalPoints: payload.totalPoints
        })
      );
    }
  }

  onMounted(() => {
    mittBus.on('pointsSettlement', onBus);
  });

  onBeforeUnmount(() => {
    mittBus.off('pointsSettlement', onBus);
    cleanupFn?.();
  });
</script>

<style scoped>
  .points-settlement-fx {
    pointer-events: none;
    background: transparent;
  }
</style>
