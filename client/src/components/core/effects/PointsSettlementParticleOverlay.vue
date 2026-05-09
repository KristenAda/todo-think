<template>
  <Teleport to="body">
    <div
      v-show="active"
      class="points-settlement-fx pointer-events-none fixed inset-0 z-[110000]"
      aria-hidden="true"
    >
      <canvas
        ref="canvasRef"
        class="h-full w-full"
        style="filter: drop-shadow(0 4px 12px rgba(0, 212, 255, 0.2))"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
  import * as THREE from 'three';
  import { mittBus } from '@/utils/sys';

  defineOptions({ name: 'PointsSettlementParticleOverlay' });

  const active = ref(false);
  const canvasRef = ref<HTMLCanvasElement | null>(null);

  // 粒子数量保持适中，追求质量而非数量
  const PARTICLE_COUNT = 1600;
  const DURATION_SEC = 2.4; // 稍微拉长时长，让过程更优雅

  let raf = 0;
  let cleanupFn: (() => void) | null = null;

  function stopActiveScene(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    geometry: THREE.BufferGeometry,
    material: THREE.ShaderMaterial
  ) {
    cancelAnimationFrame(raf);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    scene.clear();
  }

  function playEffect(payload: { earnedPoints: number }) {
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
      tx = r.left + r.width / 2 - halfW;
      ty = halfH - (r.top + r.height / 2);
    } else {
      tx = halfW * 0.4;
      ty = halfH * 0.4;
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
    camera.lookAt(0, 0, 0);

    // ==========================================
    // 构建：星光汇聚系统
    // ==========================================
    const aStart = new Float32Array(PARTICLE_COUNT * 3);
    const aPhase = new Float32Array(PARTICLE_COUNT);
    const aHue = new Float32Array(PARTICLE_COUNT);
    const aSize = new Float32Array(PARTICLE_COUNT);
    const positionStub = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 200 + Math.random() * 400;
      aStart[i * 3] = Math.cos(angle) * radius;
      aStart[i * 3 + 1] = -200 + Math.sin(angle) * radius * 0.6;
      aStart[i * 3 + 2] = -100 + Math.random() * 200;

      aPhase[i] = Math.random();
      aHue[i] = Math.random();
      // 显著提升粒子基础大小，增强“星光”体量感
      aSize[i] = 4.0 + Math.random() * 8.0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positionStub, 3));
    geometry.setAttribute('aStartPx', new THREE.BufferAttribute(aStart, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
    geometry.setAttribute('aHue', new THREE.BufferAttribute(aHue, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));

    const vertexShader = `
      attribute vec3 aStartPx;
      attribute float aPhase;
      attribute float aHue;
      attribute float aSize;
      
      uniform vec3 uTargetPx;
      uniform float uTime;
      uniform float uDuration;
      
      varying float vHue;
      varying float vAlpha;
      varying float vScale;

      void main() {
        float delay = aPhase * 0.6; 
        float dur = uDuration * (0.6 + aPhase * 0.4);
        float t = clamp((uTime - delay) / dur, 0.0, 1.0);
        
        // 核心：平滑的吸入曲线，解决速度过快导致的割裂感
        // 使用 Sine 缓动让后段速度变得可控且平滑
        float easeT = 1.0 - cos((t * 3.14159) * 0.5);

        vec3 A = aStartPx;
        vec3 D = uTargetPx;
        
        // 控制点模拟向上漂浮的动感
        vec3 B = A + vec3(0.0, 300.0, 100.0);
        vec3 C = D + vec3(sin(aPhase * 6.28) * 150.0, -200.0, 0.0);

        // 三次贝塞尔曲线
        float invT = 1.0 - easeT;
        vec3 pos = invT * invT * invT * A + 3.0 * invT * invT * easeT * B + 3.0 * invT * easeT * easeT * C + easeT * easeT * easeT * D;
        
        vHue = aHue;
        
        // 动画逻辑优化：
        // 1. 缓慢淡入
        float fadeIn = smoothstep(0.0, 0.2, t);
        // 2. 在最后 10% 的行程中开始平滑缩小，消除“砸”入感
        vScale = 1.0 - smoothstep(0.9, 1.0, t);
        vAlpha = fadeIn * vScale;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // 星光闪烁：基于时间的周期性缩放
        float twinkle = 0.8 + 0.4 * sin(uTime * 12.0 + aPhase * 100.0);
        gl_PointSize = aSize * vScale * twinkle * (400.0 / -mvPosition.z);
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying float vHue;
      varying float vAlpha;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float dist = length(uv); 
        if (dist > 0.5) discard;
        
        // 星光质感：中间极亮核心 + 柔和边缘
        float core = smoothstep(0.25, 0.0, dist);
        float glow = smoothstep(0.5, 0.1, dist);
        
        vec3 color = mix(uColorA, uColorB, vHue);
        // 核心混合白色，提升在日间模式下的亮度
        vec3 finalColor = mix(color, vec3(1.0), core * 0.8);
        
        gl_FragColor = vec4(finalColor, glow * vAlpha);
      }
    `;

    // 适配日间模式的高级星光配色：冰蓝与天青
    const colorA = isNegative ? 0xf43f5e : 0x00d4ff;
    const colorB = isNegative ? 0xfb7185 : 0xe0f2fe;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTargetPx: { value: new THREE.Vector3(tx, ty, 0) },
        uTime: { value: 0 },
        uDuration: { value: DURATION_SEC },
        uColorA: { value: new THREE.Color(colorA) },
        uColorB: { value: new THREE.Color(colorB) }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const clock = new THREE.Clock();
    const maxRun = DURATION_SEC + 0.5;

    const doneDispose = () => {
      window.removeEventListener('resize', onResize);
      stopActiveScene(renderer, scene, geometry, material);
      active.value = false;
      cleanupFn = null;
    };

    const tick = () => {
      const t = clock.getElapsedTime();
      material.uniforms.uTime.value = t;
      renderer.render(scene, camera);
      if (t < maxRun) {
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
        material.uniforms.uTargetPx.value.set(
          r.left + r.width / 2 - hw,
          hh - (r.top + r.height / 2),
          0
        );
      }
    };

    window.addEventListener('resize', onResize);
    cleanupFn = doneDispose;
    raf = requestAnimationFrame(tick);
  }

  function onBus(payload: { earnedPoints: number; [key: string]: any }) {
    nextTick(() => playEffect({ earnedPoints: payload.earnedPoints }));
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
