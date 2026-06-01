"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Activity, AlertTriangle, CheckCircle2, CircleDot, RadioTower } from "lucide-react";
import type { ConstellationModel, ConstellationNode } from "@/types";

const typeLabel = {
  scenario: "场景",
  metric: "指标",
  alert: "预警",
  action: "行动"
};

const typeIcon = {
  scenario: Activity,
  metric: CircleDot,
  alert: AlertTriangle,
  action: RadioTower
};

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function nodeColor(node: ConstellationNode) {
  if (node.type === "scenario") return 0xbbe7db;
  if (node.priority === "P0" || node.status === "risk") return 0xd76f7d;
  if (node.priority === "P1" || node.status === "watch") return 0xd6b95c;
  if (node.type === "action") return 0x7da0cf;
  return 0x46a795;
}

function nodeTone(node: ConstellationNode) {
  if (node.priority === "P0" || node.status === "risk") return "border-rose-300/50 bg-rose-300/10 text-danger";
  if (node.priority === "P1" || node.status === "watch") return "border-amber-300/45 bg-amber-300/10 text-warning";
  if (node.type === "action") return "border-sky-300/40 bg-sky-300/10 text-cyan";
  return "border-teal-300/40 bg-teal-300/10 text-accent";
}

function nodeSize(node: ConstellationNode) {
  if (node.type === "scenario") return 0.34;
  if (node.priority === "P0") return 0.24;
  if (node.priority === "P1" || node.status === "risk") return 0.2;
  if (node.type === "metric") return 0.18;
  return 0.15;
}

function getNodePosition(node: ConstellationNode, index: number, groups: Record<string, ConstellationNode[]>) {
  if (node.type === "scenario") return new THREE.Vector3(0, 0, 0);

  const group = groups[node.type] ?? [];
  const groupIndex = Math.max(0, group.findIndex((item) => item.id === node.id));
  const count = Math.max(1, group.length);
  const angle = (groupIndex / count) * Math.PI * 2 + index * 0.07;

  if (node.type === "metric") {
    return new THREE.Vector3(Math.cos(angle) * 1.7, Math.sin(angle) * 1.05, Math.sin(angle * 1.4) * 0.35);
  }

  if (node.type === "alert") {
    return new THREE.Vector3(Math.cos(angle + 0.35) * 2.35, Math.sin(angle + 0.35) * 1.42, Math.cos(angle) * 0.6);
  }

  return new THREE.Vector3(Math.cos(angle - 0.2) * 2.9, Math.sin(angle - 0.2) * 1.72, Math.sin(angle) * 0.86);
}

export function BusinessConstellation({
  model,
  selectedNodeId,
  selectedMetricId,
  onSelectNode
}: {
  model: ConstellationModel;
  selectedNodeId: string | null;
  selectedMetricId: string | null;
  onSelectNode: (node: ConstellationNode) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const selectedRef = useRef<string | null>(selectedNodeId);
  const hoverRef = useRef<string | null>(null);
  const onSelectRef = useRef(onSelectNode);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const activeNode = useMemo(() => {
    return model.nodes.find((node) => node.id === hoveredNodeId) ?? model.nodes.find((node) => node.id === selectedNodeId) ?? model.nodes[0];
  }, [hoveredNodeId, model.nodes, selectedNodeId]);

  useEffect(() => {
    selectedRef.current = selectedNodeId;
  }, [selectedNodeId]);

  useEffect(() => {
    onSelectRef.current = onSelectNode;
  }, [onSelectNode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;

    if (!canvas || !host) return;
    const canvasElement = canvas;
    const hostElement = host;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const lowPower = reduceMotion || isMobile || deviceMemory <= 4;
    const renderer = new THREE.WebGLRenderer({ canvas: canvasElement, alpha: true, antialias: !lowPower });
    renderer.setPixelRatio(lowPower ? 1 : Math.min(window.devicePixelRatio, 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
    camera.position.set(0, 0, 6.4);

    const group = new THREE.Group();
    scene.add(group);
    scene.add(new THREE.AmbientLight(0xf7fff9, 0.72));

    const keyLight = new THREE.PointLight(0xbbe7db, 2.2, 10);
    keyLight.position.set(1.6, 2.8, 4.4);
    scene.add(keyLight);

    const glowLight = new THREE.PointLight(0xd6f46d, 0.7, 9);
    glowLight.position.set(-2.6, -1.8, 3.2);
    scene.add(glowLight);

    const groups = model.nodes.reduce<Record<string, ConstellationNode[]>>((acc, node) => {
      acc[node.type] = [...(acc[node.type] ?? []), node];
      return acc;
    }, {});
    const positions = new Map<string, THREE.Vector3>();
    model.nodes.forEach((node, index) => positions.set(node.id, getNodePosition(node, index, groups)));

    const sphereGeometry = new THREE.SphereGeometry(1, lowPower ? 14 : 20, lowPower ? 12 : 16);
    const haloGeometry = new THREE.TorusGeometry(1, 0.018, 6, lowPower ? 28 : 40);
    const nodeRecords = model.nodes.map((node) => {
      const color = new THREE.Color(nodeColor(node));
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.18,
        metalness: 0.12,
        roughness: 0.52,
        transparent: true,
        opacity: node.type === "scenario" ? 0.96 : 0.88
      });
      const mesh = new THREE.Mesh(sphereGeometry, material);
      const basePosition = (positions.get(node.id) ?? new THREE.Vector3()).clone();
      mesh.position.copy(basePosition);
      mesh.scale.setScalar(nodeSize(node));
      mesh.userData.nodeId = node.id;
      group.add(mesh);

      const haloMaterial = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.1,
        depthWrite: false
      });
      const halo = new THREE.Mesh(haloGeometry, haloMaterial);
      halo.position.copy(basePosition);
      halo.rotation.set(Math.PI * 0.5, 0, 0);
      halo.scale.setScalar(nodeSize(node) * 2.3);
      group.add(halo);

      return { node, mesh, material, halo, haloMaterial, baseSize: nodeSize(node), basePosition };
    });

    const nodeMeshes = nodeRecords.map((record) => record.mesh);
    const recordById = new Map(nodeRecords.map((record) => [record.node.id, record]));
    const adjacency = new Map<string, Set<string>>();
    model.links.forEach((link) => {
      adjacency.set(link.source, (adjacency.get(link.source) ?? new Set()).add(link.target));
      adjacency.set(link.target, (adjacency.get(link.target) ?? new Set()).add(link.source));
    });

    const linkRecords: Array<{
      line: THREE.Line;
      material: THREE.LineBasicMaterial;
      baseOpacity: number;
      source: string;
      target: string;
      sourceRecord: (typeof nodeRecords)[number];
      targetRecord: (typeof nodeRecords)[number];
    }> = [];
    model.links.forEach((link) => {
      const sourceRecord = recordById.get(link.source);
      const targetRecord = recordById.get(link.target);
      if (!sourceRecord || !targetRecord) return;

      const geometry = new THREE.BufferGeometry().setFromPoints([sourceRecord.basePosition, targetRecord.basePosition]);
      const baseOpacity = 0.08 + link.strength * 0.16;
      const material = new THREE.LineBasicMaterial({
        color: 0x8ab6aa,
        transparent: true,
        opacity: baseOpacity
      });
      const line = new THREE.Line(geometry, material);
      linkRecords.push({ line, material, baseOpacity, source: link.source, target: link.target, sourceRecord, targetRecord });
      group.add(line);
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pointerWorld = new THREE.Vector2();
    let pointerActive = false;
    let frame = 0;
    let idleTimer = 0;
    let pickFrame = 0;
    let pendingPointerEvent: PointerEvent | null = null;
    let isVisible = document.visibilityState === "visible";
    let lastInteraction = performance.now();

    function queueRender(delay = 0) {
      if (reduceMotion || !isVisible || frame || idleTimer) return;
      if (delay > 0) {
        idleTimer = window.setTimeout(() => {
          idleTimer = 0;
          frame = window.requestAnimationFrame(animate);
        }, delay);
        return;
      }
      frame = window.requestAnimationFrame(animate);
    }

    function resize() {
      const rect = hostElement.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function pick(event: PointerEvent) {
      const rect = canvasElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      pointerWorld.set(pointer.x * 3.35, pointer.y * 2.05);
      pointerActive = true;
      lastInteraction = performance.now();
      raycaster.setFromCamera(pointer, camera);

      const hit = raycaster.intersectObjects(nodeMeshes, false)[0];
      const nodeId = hit?.object.userData.nodeId as string | undefined;
      return nodeId ? recordById.get(nodeId)?.node ?? null : null;
    }

    function handlePointerMove(event: PointerEvent) {
      pendingPointerEvent = event;
      if (pickFrame) return;
      pickFrame = window.requestAnimationFrame(() => {
        pickFrame = 0;
        if (!pendingPointerEvent) return;
        const node = pick(pendingPointerEvent);
        pendingPointerEvent = null;
        const nextId = node?.id ?? null;
        if (nextId !== hoverRef.current) {
          hoverRef.current = nextId;
          setHoveredNodeId(nextId);
          canvasElement.style.cursor = nextId ? "pointer" : "default";
        }
        if (idleTimer) {
          window.clearTimeout(idleTimer);
          idleTimer = 0;
        }
        queueRender();
      });
    }

    function handlePointerLeave() {
      hoverRef.current = null;
      pointerActive = false;
      lastInteraction = performance.now();
      setHoveredNodeId(null);
      canvasElement.style.cursor = "default";
      queueRender();
    }

    function handleClick(event: PointerEvent) {
      const node = pick(event);
      if (node) onSelectRef.current(node);
      queueRender();
    }

    function animate(time: number) {
      frame = 0;
      if (!isVisible) return;
      const focusedNodeId = hoverRef.current ?? selectedRef.current;
      group.rotation.y = pointer.x * 0.1 + Math.sin(time * 0.00018) * 0.22;
      group.rotation.x = -pointer.y * 0.06 + Math.cos(time * 0.00014) * 0.08;

      nodeRecords.forEach((record, index) => {
        const active =
          record.node.id === selectedRef.current ||
          record.node.id === hoverRef.current ||
          (selectedMetricId ? record.node.linkedMetricId === selectedMetricId : false);
        const connected = focusedNodeId ? Boolean(adjacency.get(focusedNodeId)?.has(record.node.id)) : false;
        const proximityDistance = pointerActive ? Math.hypot(record.basePosition.x - pointerWorld.x, record.basePosition.y - pointerWorld.y) : 3.6;
        const proximity = pointerActive ? 1 - smoothstep(0.18, 1.55, proximityDistance) : 0;
        const pulse = 1 + Math.sin(time * 0.002 + index) * 0.055;
        const pull = proximity * (record.node.type === "scenario" ? 0.08 : 0.2);
        record.mesh.position.set(
          record.basePosition.x + (pointerWorld.x - record.basePosition.x) * pull,
          record.basePosition.y + (pointerWorld.y - record.basePosition.y) * pull,
          record.basePosition.z + proximity * 0.42 + Math.sin(time * 0.0015 + index) * 0.026
        );
        record.mesh.scale.setScalar(record.baseSize * pulse * (active ? 1.42 : connected ? 1.18 : 1 + proximity * 0.42));
        record.material.emissiveIntensity = active ? 1.2 : connected ? 0.62 : 0.2 + proximity * 0.82;
        record.material.opacity = active ? 1 : connected ? 0.96 : record.node.type === "scenario" ? 0.94 : 0.82 + proximity * 0.12;
        record.halo.position.copy(record.mesh.position);
        record.halo.rotation.z += 0.002 + proximity * 0.01;
        record.halo.scale.setScalar(record.baseSize * (active ? 3.7 : connected ? 3.05 : 2.35 + proximity * 2.1));
        record.haloMaterial.opacity = active ? 0.42 : connected ? 0.26 : 0.08 + proximity * 0.34;
      });

      linkRecords.forEach((record) => {
        const related = Boolean(focusedNodeId) && (record.source === focusedNodeId || record.target === focusedNodeId);
        const source = record.sourceRecord.mesh.position;
        const target = record.targetRecord.mesh.position;
        const positionAttribute = record.line.geometry.attributes.position as THREE.BufferAttribute;
        positionAttribute.setXYZ(0, source.x, source.y, source.z);
        positionAttribute.setXYZ(1, target.x, target.y, target.z);
        positionAttribute.needsUpdate = true;
        const midpointX = (source.x + target.x) / 2;
        const midpointY = (source.y + target.y) / 2;
        const proximity = pointerActive ? 1 - smoothstep(0.12, 1.72, Math.hypot(midpointX - pointerWorld.x, midpointY - pointerWorld.y)) : 0;
        record.material.opacity = related ? Math.min(0.72, record.baseOpacity + 0.34 + proximity * 0.18) : record.baseOpacity + proximity * 0.2;
        record.material.color.setHex(related || proximity > 0.18 ? 0x65d9c9 : 0x8ab6aa);
      });

      renderer.render(scene, camera);
      const timeSinceInteraction = time - lastInteraction;
      if (timeSinceInteraction < 5000) queueRender(timeSinceInteraction > 1600 ? 260 : 0);
    }

    function handleVisibilityChange() {
      isVisible = document.visibilityState === "visible";
      if (!isVisible) {
        window.cancelAnimationFrame(frame);
        window.cancelAnimationFrame(pickFrame);
        window.clearTimeout(idleTimer);
        frame = 0;
        pickFrame = 0;
        idleTimer = 0;
        return;
      }
      lastInteraction = performance.now();
      queueRender();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(hostElement);
    canvasElement.addEventListener("pointermove", handlePointerMove);
    canvasElement.addEventListener("pointerleave", handlePointerLeave);
    canvasElement.addEventListener("pointerdown", handleClick);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    resize();
    animate(performance.now());

    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(pickFrame);
      window.clearTimeout(idleTimer);
      resizeObserver.disconnect();
      canvasElement.removeEventListener("pointermove", handlePointerMove);
      canvasElement.removeEventListener("pointerleave", handlePointerLeave);
      canvasElement.removeEventListener("pointerdown", handleClick);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      sphereGeometry.dispose();
      haloGeometry.dispose();
      nodeRecords.forEach((record) => {
        record.material.dispose();
        record.haloMaterial.dispose();
      });
      linkRecords.forEach((record) => record.material.dispose());
      group.traverse((object: THREE.Object3D) => {
        if (object instanceof THREE.Line) object.geometry.dispose();
      });
      renderer.dispose();
    };
  }, [model, selectedMetricId]);

  return (
    <section className="constellation-shell relative overflow-hidden rounded-lg">
      <div className="absolute inset-x-8 top-6 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-70" />
      <div className="relative z-10 flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Interactive Data Field</p>
          <h2 className="mt-2 text-xl font-semibold text-ink">AI 数据场景</h2>
          <p className="mt-1 max-w-lg text-xs leading-5 text-muted">指标、预警和行动任务被组织成同一张关系网络，用空间层级解释业务状态。</p>
        </div>
        <div className="hidden rounded-full border border-accent bg-[rgba(var(--accent-rgb),0.12)] px-3 py-1 text-xs text-accent sm:block">
          {model.nodes.length} 个节点 · {model.links.length} 条关系
        </div>
      </div>

      <div ref={hostRef} className="relative z-0 hidden h-[480px] min-w-0 md:block">
        <canvas ref={canvasRef} className="h-full w-full" aria-label="业务星图 3D 可视化" />
      </div>

      <div className="relative z-10 grid gap-2 px-4 pb-4 md:hidden">
        {model.nodes.map((node) => {
          const Icon = typeIcon[node.type];
          const active = node.id === selectedNodeId;

          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelectNode(node)}
              className={`flex min-h-[64px] items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${nodeTone(node)} ${active ? "ring-1 ring-accent" : ""}`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{node.label}</span>
                <span className="block truncate text-xs opacity-80">{node.value ?? typeLabel[node.type]}</span>
              </span>
            </button>
          );
        })}
      </div>

      {activeNode ? (
        <div className="relative z-20 mx-4 mb-4 rounded-lg border border-line bg-[rgba(var(--panel-rgb),0.76)] p-4 backdrop-blur-xl md:absolute md:bottom-4 md:left-4 md:mx-0 md:w-[360px]">
          <div className="flex items-center justify-between gap-3">
            <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${nodeTone(activeNode)}`}>{typeLabel[activeNode.type]}</span>
            <span className="text-xs text-muted">{activeNode.value ?? activeNode.priority ?? activeNode.status}</span>
          </div>
          <h3 className="mt-3 line-clamp-2 text-base font-semibold text-ink">{activeNode.label}</h3>
          <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted">{activeNode.description}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-accent">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            已同步到指标、预警和行动详情
          </div>
        </div>
      ) : null}
    </section>
  );
}
