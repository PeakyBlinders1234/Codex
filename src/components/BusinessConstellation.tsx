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

    const renderer = new THREE.WebGLRenderer({ canvas: canvasElement, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
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
      mesh.position.copy(positions.get(node.id) ?? new THREE.Vector3());
      mesh.scale.setScalar(nodeSize(node));
      mesh.userData.nodeId = node.id;
      group.add(mesh);

      return { node, mesh, material, baseSize: nodeSize(node) };
    });

    const linkMaterials: THREE.LineBasicMaterial[] = [];
    model.links.forEach((link) => {
      const source = positions.get(link.source);
      const target = positions.get(link.target);
      if (!source || !target) return;

      const geometry = new THREE.BufferGeometry().setFromPoints([source, target]);
      const material = new THREE.LineBasicMaterial({
        color: 0x8ab6aa,
        transparent: true,
        opacity: 0.08 + link.strength * 0.16
      });
      linkMaterials.push(material);
      group.add(new THREE.Line(geometry, material));
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let frame = 0;

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
      raycaster.setFromCamera(pointer, camera);

      const hit = raycaster.intersectObjects(nodeRecords.map((record) => record.mesh))[0];
      const nodeId = hit?.object.userData.nodeId as string | undefined;
      return nodeRecords.find((record) => record.node.id === nodeId)?.node ?? null;
    }

    function handlePointerMove(event: PointerEvent) {
      const node = pick(event);
      const nextId = node?.id ?? null;
      if (nextId !== hoverRef.current) {
        hoverRef.current = nextId;
        setHoveredNodeId(nextId);
        canvasElement.style.cursor = nextId ? "pointer" : "default";
      }
    }

    function handlePointerLeave() {
      hoverRef.current = null;
      setHoveredNodeId(null);
      canvasElement.style.cursor = "default";
    }

    function handleClick(event: PointerEvent) {
      const node = pick(event);
      if (node) onSelectRef.current(node);
    }

    function animate(time: number) {
      group.rotation.y = Math.sin(time * 0.00018) * 0.22;
      group.rotation.x = Math.cos(time * 0.00014) * 0.08;

      nodeRecords.forEach((record, index) => {
        const active =
          record.node.id === selectedRef.current ||
          record.node.id === hoverRef.current ||
          (selectedMetricId ? record.node.linkedMetricId === selectedMetricId : false);
        const pulse = 1 + Math.sin(time * 0.002 + index) * 0.055;
        record.mesh.scale.setScalar(record.baseSize * pulse * (active ? 1.28 : 1));
        record.material.emissiveIntensity = active ? 0.82 : 0.18;
        record.material.opacity = active ? 1 : record.node.type === "scenario" ? 0.94 : 0.82;
      });

      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(hostElement);
    canvasElement.addEventListener("pointermove", handlePointerMove);
    canvasElement.addEventListener("pointerleave", handlePointerLeave);
    canvasElement.addEventListener("pointerdown", handleClick);
    resize();
    frame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      canvasElement.removeEventListener("pointermove", handlePointerMove);
      canvasElement.removeEventListener("pointerleave", handlePointerLeave);
      canvasElement.removeEventListener("pointerdown", handleClick);
      sphereGeometry.dispose();
      nodeRecords.forEach((record) => record.material.dispose());
      linkMaterials.forEach((material) => material.dispose());
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
