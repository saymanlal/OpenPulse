import type { GraphNode, GraphEdge } from '@/types/graph';

interface SimulationNode extends GraphNode {
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
}

const FORCE_CONFIG = {
  chargeStrength: -300,
  linkDistance: 5,
  linkStrength: 0.5,
  centerStrength: 0.1,
  velocityDecay: 0.4,
  alphaDecay: 0.02,
  alphaMin: 0.001,
};

export class ForceSimulation3D {
  private nodes: SimulationNode[];
  private edges: GraphEdge[];
  private alpha: number = 1;
  private alphaTarget: number = 0;

  constructor(nodes: GraphNode[], edges: GraphEdge[]) {
    this.nodes = nodes.map(node => ({
      ...node,
      vx: 0,
      vy: 0,
      vz: 0,
    }));
    this.edges = edges;
  }

  tick(): boolean {
    // Apply forces
    this.applyChargeForce();
    this.applyLinkForce();
    this.applyCenterForce();

    // Update positions
    this.nodes.forEach(node => {
      if (node.fx === null || node.fx === undefined) {
        node.vx! *= FORCE_CONFIG.velocityDecay;
        node.position[0] += node.vx!;
      }
      if (node.fy === null || node.fy === undefined) {
        node.vy! *= FORCE_CONFIG.velocityDecay;
        node.position[1] += node.vy!;
      }
      if (node.fz === null || node.fz === undefined) {
        node.vz! *= FORCE_CONFIG.velocityDecay;
        node.position[2] += node.vz!;
      }
    });

    // Update alpha
    this.alpha += (this.alphaTarget - this.alpha) * FORCE_CONFIG.alphaDecay;

    return this.alpha > FORCE_CONFIG.alphaMin;
  }

  private applyChargeForce() {
    const strength = FORCE_CONFIG.chargeStrength * this.alpha;

    for (let i = 0; i < this.nodes.length; i++) {
      const nodeA = this.nodes[i];
      
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeB = this.nodes[j];

        const dx = nodeB.position[0] - nodeA.position[0];
        const dy = nodeB.position[1] - nodeA.position[1];
        const dz = nodeB.position[2] - nodeA.position[2];

        let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distance === 0) distance = 0.01;

        const force = strength / (distance * distance);

        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        const fz = (dz / distance) * force;

        nodeA.vx! -= fx;
        nodeA.vy! -= fy;
        nodeA.vz! -= fz;

        nodeB.vx! += fx;
        nodeB.vy! += fy;
        nodeB.vz! += fz;
      }
    }
  }

  private applyLinkForce() {
    const nodeMap = new Map(this.nodes.map(node => [node.id, node]));

    this.edges.forEach(edge => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);

      if (!source || !target) return;

      const dx = target.position[0] - source.position[0];
      const dy = target.position[1] - source.position[1];
      const dz = target.position[2] - source.position[2];

      let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distance === 0) distance = 0.01;

      const strength = FORCE_CONFIG.linkStrength * this.alpha;
      const force = (distance - FORCE_CONFIG.linkDistance) * strength;

      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;
      const fz = (dz / distance) * force;

      source.vx! += fx;
      source.vy! += fy;
      source.vz! += fz;

      target.vx! -= fx;
      target.vy! -= fy;
      target.vz! -= fz;
    });
  }

  private applyCenterForce() {
    const strength = FORCE_CONFIG.centerStrength * this.alpha;

    this.nodes.forEach(node => {
      node.vx! -= node.position[0] * strength;
      node.vy! -= node.position[1] * strength;
      node.vz! -= node.position[2] * strength;
    });
  }

  getNodes(): GraphNode[] {
    return this.nodes;
  }

  restart() {
    this.alpha = 1;
  }

  stop() {
    this.alpha = 0;
  }
}