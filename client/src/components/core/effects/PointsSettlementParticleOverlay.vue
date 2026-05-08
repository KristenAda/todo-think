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
        style="
          filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.08))
            drop-shadow(0 2px 4px rgba(0, 0, 0, 0.04));
        "
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
  import * as THREE from 'three';
  import { mittBus } from '@/utils/sys'; // 请替换为你实际的 event bus 路径

  defineOptions({ name: 'PointsSettlementParticleOverlay' });

  const active = ref(false);
  const canvasRef = ref<HTMLCanvasElement | null>(null);

  // B端清爽风：降低粒子密度，缩短动画时长，避免喧宾夺主
  const PARTICLE_COUNT = 1200;
  const DURATION_SEC = 1.6;

  let raf = 0;
  let cleanupFn: (() => void) | null = null;

  function stopActiveScene(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    geometry: THREE.BufferGeometry,
    material: THREE.ShaderMaterial,
    shockwaveGeo?: THREE.BufferGeometry,
    shockwaveMat?: THREE.Material
  ) {
    cancelAnimationFrame(raf);
    geometry.dispose();
    material.dispose();
    if (shockwaveGeo) shockwaveGeo.dispose();
    if (shockwaveMat) shockwaveMat.dispose();
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
    camera.lookAt(0, 0, 0);

    // ==========================================
    // 1. 构建轻盈流体粒子系统
    // ==========================================
    const aStart = new Float32Array(PARTICLE_COUNT * 3);
    const aPhase = new Float32Array(PARTICLE_COUNT);
    const aHue = new Float32Array(PARTICLE_COUNT);
    const aSize = new Float32Array(PARTICLE_COUNT);
    const positionStub = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // 粒子从屏幕中下方散开生成，模拟从内容区向上飞入总计分板
      const angle = Math.random() * Math.PI * 2;
      const radius = 100 + Math.random() * 300;
      aStart[i * 3] = Math.cos(angle) * radius;
      aStart[i * 3 + 1] = -halfH * 0.5 + Math.sin(angle) * radius * 0.5;
      aStart[i * 3 + 2] = -100 + Math.random() * 300;

      aPhase[i] = Math.random();
      aHue[i] = Math.random();
      // 尺寸更加克制，像精致的水珠
      aSize[i] = 2.0 + Math.random() * 4.0;
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

      // 平滑的三次贝塞尔曲线
      vec3 cubicBezier(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
        float u = 1.0 - t;
        float tt = t * t;
        float uu = u * u;
        float uuu = uu * u;
        float ttt = tt * t;
        return uuu * p0 + 3.0 * uu * t * p1 + 3.0 * u * tt * p2 + ttt * p3;
      }

      void main() {
        // 延时与时间归一化
        float delay = aPhase * 0.4; 
        float dur = uDuration * (0.6 + aPhase * 0.4);
        float t = clamp((uTime - delay) / dur, 0.0, 1.0);
        
        // 丝滑的缓动函数 (EaseInOutCubic)
        float easeT = t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;

        vec3 A = aStartPx;
        vec3 D = uTargetPx;
        
        // 向上漂浮然后汇聚的控制点
        vec3 B = A + vec3(sin(aPhase * 10.0) * 150.0, 200.0 + aPhase * 100.0, 100.0);
        vec3 C = D + vec3(cos(aPhase * 10.0) * 100.0, -100.0, 0.0);

        vec3 pos = cubicBezier(A, B, C, D, easeT);
        
        vHue = aHue;
        
        // 柔和的淡入与干脆的淡出
        float fadeIn = smoothstep(0.0, 0.15, t);
        float fadeOut = 1.0 - smoothstep(0.85, 1.0, t);
        
        // 整体透明度保持在 0.85 左右，增加通透感
        vAlpha = fadeIn * fadeOut * 0.85;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // 近大远小透视
        float perspectiveScale = 400.0 / -mvPosition.z;
        gl_PointSize = aSize * perspectiveScale;
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
        
        // 裁剪成完美的圆形
        if (dist > 0.5) discard;
        
        // 极高精度的边缘抗锯齿（Smoothstep），在白底上极其重要
        float alphaEdge = smoothstep(0.5, 0.45, dist);
        
        vec3 color = mix(uColorA, uColorB, vHue);
        
        // 给粒子中心加一点微弱的亮色，模拟玻璃球的反光
        vec3 finalColor = mix(color, vec3(1.0), smoothstep(0.3, 0.0, dist) * 0.3);
        
        gl_FragColor = vec4(finalColor, alphaEdge * vAlpha);
      }
    `;

    // 清新调色盘：
    // 加分：翠绿 (Emerald) 到 天蓝 (Sky Blue)
    // 扣分：琥珀黄 (Amber) 到 珊瑚红 (Rose)
    const colorA = isNegative ? 0xf59e0b : 0x10b981;
    const colorB = isNegative ? 0xf43f5e : 0x0ea5e9;

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
      // 必须使用 NormalBlending，让颜色真实的遮挡背景，而不是叠加变白
      blending: THREE.NormalBlending
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // ==========================================
    // 2. 清水涟漪式的触达反馈 (Soft Ripple)
    // ==========================================
    const shockwaveGeo = new THREE.PlaneGeometry(120, 120);
    const shockwaveMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDuration: { value: DURATION_SEC },
        uBaseColor: { value: new THREE.Color(colorB) } // 涟漪使用主色调
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;
        uniform float uTime;
        uniform float uDuration;
        uniform vec3 uBaseColor;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv - 0.5;
          float dist = length(uv) * 2.0;
          
          float triggerTime = uDuration * 0.65; // 在大批粒子到达时触发
          float waveT = clamp((uTime - triggerTime) / (uDuration * 0.35), 0.0, 1.0);
          
          if (waveT <= 0.0 || waveT >= 1.0) discard;

          float radius = waveT;
          float thickness = 0.08 * (1.0 - waveT); // 涟漪扩散时变细
          
          float ring = smoothstep(radius - thickness, radius, dist) * (1.0 - smoothstep(radius, radius + thickness, dist));
          
          // 轻盈的透明度
          float alpha = ring * (1.0 - waveT) * 0.6;
          
          gl_FragColor = vec4(uBaseColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    const shockwaveMesh = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    shockwaveMesh.position.set(tx, ty, -10);
    scene.add(shockwaveMesh);

    // ==========================================
    // 3. 渲染循环
    // ==========================================
    const clock = new THREE.Clock();
    const maxRun = DURATION_SEC + 0.2;

    const doneDispose = () => {
      window.removeEventListener('resize', onResize);
      stopActiveScene(renderer, scene, geometry, material, shockwaveGeo, shockwaveMat);
      active.value = false;
      cleanupFn = null;
    };

    const tick = () => {
      const t = clock.getElapsedTime();
      material.uniforms.uTime.value = t;
      shockwaveMat.uniforms.uTime.value = t;

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
        const ntx = r.left + r.width / 2 - hw;
        const nty = hh - (r.top + r.height / 2);
        material.uniforms.uTargetPx.value.set(ntx, nty, 0);
        shockwaveMesh.position.set(ntx, nty, -10);
      }
    };

    window.addEventListener('resize', onResize);

    cleanupFn = doneDispose;
    raf = requestAnimationFrame(tick);
  }

  function onBus(payload: {
    settlementId: string;
    taskId: number;
    taskTitle: string | null;
    earnedPoints: number;
    totalPoints: number;
  }) {
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
    /* 保持鼠标穿透，不阻断用户操作 */
    pointer-events: none;
  }
</style>
