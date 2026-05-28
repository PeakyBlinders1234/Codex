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
    const renderer = new THREE.WebGLRenderer({ canvas: canvasElement, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 7);

    const group = new THREE.Group();
    scene.add(group);

    const particleCount = window.innerWidth < 768 ? 70 : 150;
    const positions = new Float32Array(particleCount * 3);

    for (let index = 0; index < particleCount; index += 1) {
      const angle = index * 1.618;
      const radius = 0.55 + (index % 19) * 0.17;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = Math.sin(angle * 0.86) * radius * 0.58;
      positions[index * 3 + 2] = ((index % 31) - 15) * 0.075;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#158f7d"),
      size: 0.035,
      transparent: true,
      opacity: 0.58,
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

    for (let lineIndex = 0; lineIndex < 5; lineIndex += 1) {
      const points = Array.from({ length: 52 }, (_, pointIndex) => {
        const t = pointIndex / 51;
        const x = (t - 0.5) * 6.1;
        const y = Math.sin(t * Math.PI * 2 + lineIndex * 0.65) * 0.52 + (lineIndex - 2) * 0.28;
        const z = Math.cos(t * Math.PI * 3 + lineIndex) * 0.32;
        return new THREE.Vector3(x, y, z);
      });
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, curveMaterial.clone());
      curves.push(line);
      group.add(line);
    }

    const pointer = { x: 0, y: 0 };
    let frame = 0;

    function resize() {
      const rect = canvasElement.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = canvasElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    }

    function render(time = 0) {
      group.rotation.y = pointer.x * 0.12 + Math.sin(time * 0.00016) * 0.08;
      group.rotation.x = -pointer.y * 0.08 + Math.cos(time * 0.00012) * 0.04;
      particles.rotation.z = time * 0.000035;
      curves.forEach((line, index) => {
        line.position.x = Math.sin(time * 0.00024 + index) * 0.08;
      });
      renderer.render(scene, camera);
      if (!reduceMotion) frame = window.requestAnimationFrame(render);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvasElement);
    canvasElement.addEventListener("pointermove", handlePointerMove);
    resize();
    render();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      canvasElement.removeEventListener("pointermove", handlePointerMove);
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
