"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function DepthField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const currentCanvas = canvasRef.current;
    if (!currentCanvas) return;
    const canvasElement: HTMLCanvasElement = currentCanvas;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const lowPower = reduceMotion || isMobile || deviceMemory <= 4;
    const renderer = new THREE.WebGLRenderer({ canvas: canvasElement, alpha: true, antialias: !lowPower });
    renderer.setPixelRatio(lowPower ? 1 : Math.min(window.devicePixelRatio, 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 7);

    const group = new THREE.Group();
    scene.add(group);

    const ambientLight = new THREE.AmbientLight(0xdffff8, 0.56);
    scene.add(ambientLight);

    const pointerLight = new THREE.PointLight(0x7ff0db, 2.8, 9);
    pointerLight.position.set(1.2, 1.1, 2.4);
    scene.add(pointerLight);

    const rimLight = new THREE.PointLight(0xd6f46d, 1.2, 10);
    rimLight.position.set(-2.6, -1.8, 2.1);
    scene.add(rimLight);

    const membraneSegments = lowPower ? { x: 20, y: 12 } : { x: 36, y: 20 };
    const membraneGeometry = new THREE.PlaneGeometry(8.3, 4.9, membraneSegments.x, membraneSegments.y);
    const membranePositions = membraneGeometry.attributes.position as THREE.BufferAttribute;
    const membraneBase = new Float32Array(membranePositions.array as Float32Array);
    const membraneMaterial = new THREE.MeshStandardMaterial({
      color: 0x74e8d2,
      emissive: 0x0f4e47,
      emissiveIntensity: 0.24,
      metalness: 0.04,
      roughness: 0.42,
      transparent: true,
      opacity: 0.31,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const membrane = new THREE.Mesh(membraneGeometry, membraneMaterial);
    membrane.position.set(0.62, -0.08, -1.18);
    membrane.rotation.x = -0.14;
    group.add(membrane);

    const wireGeometry = new THREE.PlaneGeometry(8.35, 4.95, 20, 12);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0xb4fff1,
      transparent: true,
      opacity: 0.09,
      wireframe: true,
      depthWrite: false
    });
    const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
    wireMesh.position.copy(membrane.position);
    wireMesh.rotation.copy(membrane.rotation);
    group.add(wireMesh);

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xd6f46d,
      transparent: true,
      opacity: 0.18,
      depthWrite: false
    });
    const rings = [1.15, 1.86].map((radius, index) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.008, 6, lowPower ? 32 : 48), ringMaterial.clone());
      ring.position.set(1.5 - index * 0.36, -0.38 + index * 0.15, -0.74 - index * 0.08);
      ring.rotation.set(0.86 + index * 0.08, 0.12, -0.22);
      group.add(ring);
      return ring;
    });

    const particleCount = lowPower ? 56 : 136;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const positions = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3);

    for (let index = 0; index < particleCount; index += 1) {
      const normalized = (index + 0.5) / particleCount;
      const radius = Math.sqrt(normalized) * 3.75;
      const angle = index * goldenAngle;
      const wobble = Math.sin(index * 0.41) * 0.16;
      const baseIndex = index * 3;
      basePositions[baseIndex] = Math.cos(angle) * (radius + wobble);
      basePositions[baseIndex + 1] = Math.sin(angle) * (radius * 0.64 + wobble * 0.5);
      basePositions[baseIndex + 2] = Math.cos(angle * 1.7) * 0.54 + ((index % 17) - 8) * 0.018;
      positions[baseIndex] = basePositions[baseIndex];
      positions[baseIndex + 1] = basePositions[baseIndex + 1];
      positions[baseIndex + 2] = basePositions[baseIndex + 2];
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#158f7d"),
      size: 0.042,
      transparent: true,
      opacity: 0.66,
      depthWrite: false
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    const curveMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue("--cyan").trim() || "#4976ba"),
      transparent: true,
      opacity: 0.22
    });
    const curves: THREE.Line[] = [];

    const curveCount = lowPower ? 3 : 4;
    const curvePointCount = lowPower ? 28 : 36;
    for (let lineIndex = 0; lineIndex < curveCount; lineIndex += 1) {
      const points = Array.from({ length: curvePointCount }, (_, pointIndex) => {
        const t = pointIndex / (curvePointCount - 1);
        const x = (t - 0.5) * 7.2;
        const y = Math.sin(t * Math.PI * 2 + lineIndex * 0.65) * 0.62 + (lineIndex - 3) * 0.24;
        const z = Math.cos(t * Math.PI * 3 + lineIndex) * 0.32;
        return new THREE.Vector3(x, y, z);
      });
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, curveMaterial.clone());
      curves.push(line);
      group.add(line);
    }

    const pointer = { x: 0.9, y: 0.46, active: false };
    const smoothedPointer = new THREE.Vector2(pointer.x, pointer.y);
    const pointerTarget = new THREE.Vector2(pointer.x, pointer.y);
    let frame = 0;
    let idleTimer = 0;
    let isVisible = document.visibilityState === "visible";
    let lastInteraction = performance.now();

    function queueRender(delay = 0) {
      if (reduceMotion || !isVisible || frame || idleTimer) return;
      if (delay > 0) {
        idleTimer = window.setTimeout(() => {
          idleTimer = 0;
          frame = window.requestAnimationFrame(render);
        }, delay);
        return;
      }
      frame = window.requestAnimationFrame(render);
    }

    function resize() {
      const rect = canvasElement.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function handlePointerMove(event: PointerEvent) {
      const width = Math.max(1, window.innerWidth);
      const height = Math.max(1, window.innerHeight);
      pointer.x = (event.clientX / width - 0.5) * 7.4;
      pointer.y = -(event.clientY / height - 0.5) * 4.2;
      pointer.active = true;
      lastInteraction = performance.now();
      if (idleTimer) {
        window.clearTimeout(idleTimer);
        idleTimer = 0;
      }
      queueRender();
    }

    function smoothstep(edge0: number, edge1: number, value: number) {
      const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
    }

    function render(time = 0) {
      frame = 0;
      if (!isVisible) return;

      pointerTarget.set(pointer.x, pointer.y);
      smoothedPointer.lerp(pointerTarget, 0.08);
      group.rotation.y = smoothedPointer.x * 0.06 + Math.sin(time * 0.00016) * 0.08;
      group.rotation.x = -smoothedPointer.y * 0.04 + Math.cos(time * 0.00012) * 0.04;
      particles.rotation.z = time * 0.000035;
      let totalInfluence = 0;

      pointerLight.position.set(smoothedPointer.x * 0.42, smoothedPointer.y * 0.52, 2.8);

      for (let vertexIndex = 0; vertexIndex < membranePositions.count; vertexIndex += 1) {
        const baseIndex = vertexIndex * 3;
        const baseX = membraneBase[baseIndex];
        const baseY = membraneBase[baseIndex + 1];
        const distance = Math.hypot(baseX + membrane.position.x - smoothedPointer.x, baseY + membrane.position.y - smoothedPointer.y);
        const influence = 1 - smoothstep(0.18, 2.16, distance);
        const flow = Math.sin(time * 0.0011 + baseX * 1.9 + baseY * 1.4) * 0.08;
        const ripple = Math.sin(distance * 7.4 - time * 0.0042) * influence * 0.24;
        membranePositions.setX(vertexIndex, baseX + (smoothedPointer.x - baseX) * influence * 0.035);
        membranePositions.setY(vertexIndex, baseY + (smoothedPointer.y - baseY) * influence * 0.028);
        membranePositions.setZ(vertexIndex, membraneBase[baseIndex + 2] + flow + ripple + influence * 0.5);
      }

      membranePositions.needsUpdate = true;

      for (let index = 0; index < particleCount; index += 1) {
        const baseIndex = index * 3;
        const baseX = basePositions[baseIndex];
        const baseY = basePositions[baseIndex + 1];
        const baseZ = basePositions[baseIndex + 2];
        const distance = Math.hypot(baseX - smoothedPointer.x, baseY - smoothedPointer.y);
        const influence = pointer.active ? 1 - smoothstep(0.12, 2.15, distance) : 0.08;
        const wave = Math.sin(time * 0.0012 + index * 0.37) * 0.052;
        totalInfluence += influence;
        positions[baseIndex] = baseX + (smoothedPointer.x - baseX) * influence * 0.18 + wave;
        positions[baseIndex + 1] = baseY + (smoothedPointer.y - baseY) * influence * 0.18 + Math.cos(time * 0.001 + index) * 0.034;
        positions[baseIndex + 2] = baseZ + influence * 0.72;
      }

      particleGeometry.attributes.position.needsUpdate = true;
      particleMaterial.opacity = Math.min(0.92, 0.46 + totalInfluence / particleCount * 1.4);
      particleMaterial.size = Math.min(0.074, 0.035 + totalInfluence / particleCount * 0.09);

      curves.forEach((line, index) => {
        line.position.x = Math.sin(time * 0.00024 + index) * 0.08;
        line.position.y = smoothedPointer.y * 0.032 * (index - 3);
        const material = Array.isArray(line.material) ? line.material[0] : line.material;
        material.opacity = 0.18 + Math.min(0.24, Math.abs(smoothedPointer.x) * 0.032);
      });

      rings.forEach((ring, index) => {
        const material = Array.isArray(ring.material) ? ring.material[0] : ring.material;
        ring.scale.setScalar(1 + Math.sin(time * 0.001 + index) * 0.08 + totalInfluence / particleCount * 0.46);
        ring.rotation.z += 0.0015 + index * 0.0006;
        material.opacity = 0.12 + totalInfluence / particleCount * 0.32;
      });

      membraneMaterial.opacity = Math.min(0.54, 0.27 + totalInfluence / particleCount * 0.42);
      wireMaterial.opacity = Math.min(0.18, 0.06 + totalInfluence / particleCount * 0.18);
      renderer.render(scene, camera);
      const timeSinceInteraction = time - lastInteraction;
      if (timeSinceInteraction < 5000) queueRender(timeSinceInteraction > 1500 ? 220 : 0);
    }

    function handleVisibilityChange() {
      isVisible = document.visibilityState === "visible";
      if (!isVisible) {
        window.cancelAnimationFrame(frame);
        window.clearTimeout(idleTimer);
        frame = 0;
        idleTimer = 0;
        return;
      }
      lastInteraction = performance.now();
      queueRender();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvasElement);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    resize();
    render();

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(idleTimer);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      membraneGeometry.dispose();
      membraneMaterial.dispose();
      wireGeometry.dispose();
      wireMaterial.dispose();
      rings.forEach((ring) => {
        ring.geometry.dispose();
        if (Array.isArray(ring.material)) ring.material.forEach((material) => material.dispose());
        else ring.material.dispose();
      });
      particleGeometry.dispose();
      particleMaterial.dispose();
      curves.forEach((line) => {
        line.geometry.dispose();
        if (Array.isArray(line.material)) line.material.forEach((material) => material.dispose());
        else line.material.dispose();
      });
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className={`pointer-events-auto h-full w-full ${className}`} aria-hidden="true" />;
}
