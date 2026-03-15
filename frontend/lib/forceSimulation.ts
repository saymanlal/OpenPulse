import type { GraphNode, GraphEdge } from '@/types/graph';

export interface ForceConfig {
  chargeStrength: number;
  linkDistance: number;
  linkStrength: number;
  centerStrength: number;
  velocityDecay: number;
  alphaDecay: number;
  alphaMin: number;
}

export const FORCE_CONFIG: ForceConfig = {
  chargeStrength: -300,
  linkDistance: 5,
  linkStrength: 0.3,
  centerStrength: 0.1,
  velocityDecay: 0.4,
  alphaDecay: 0.015,
  alphaMin: 0.001,
};

export class ForceSimulation {
  private nodes: GraphNode[];
  private edges: GraphEdge[];
  private velocities: Map<string, [number, number, number]>;
  private alpha: number;
  private config: ForceConfig;

  constructor(nodes?: GraphNode[], edges?: GraphEdge[], config: ForceConfig = FORCE_CONFIG) {
    // SAFETY: guarantee arrays
    this.nodes = Array.isArray(nodes) ? nodes : [];
    this.edges = Array.isArray(edges) ? edges : [];

    this.config = config;
    this.velocities = new Map();
    this.alpha = 1.0;

    // Initialize velocities safely
    this.nodes.forEach((node) => {
      this.velocities.set(node.id, [0, 0, 0]);
    });
  }

  tick(): GraphNode[] {
    if (this.alpha < this.config.alphaMin) {
      return this.nodes;
    }

    this.applyChargeForce();
    this.applyLinkForce();
    this.applyCenterForce();

    this.nodes = this.nodes.map((node) => {
      const velocity = this.velocities.get(node.id) || [0, 0, 0];

      const decayedVelocity: [number, number, number] = [
        velocity[0] * (1 - this.config.velocityDecay),
        velocity[1] * (1 - this.config.velocityDecay),
        velocity[2] * (1 - this.config.velocityDecay),
      ];

      const newPosition: [number, number, number] = [
        node.position[0] + decayedVelocity[0] * this.alpha,
        node.position[1] + decayedVelocity[1] * this.alpha,
        node.position[2] + decayedVelocity[2] * this.alpha,
      ];

      this.velocities.set(node.id, decayedVelocity);

      return {
        ...node,
        position: newPosition,
      };
    });

    this.alpha *= 1 - this.config.alphaDecay;

    return this.nodes;
  }

  private applyChargeForce() {
    const { chargeStrength } = this.config;

    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeA = this.nodes[i];
        const nodeB = this.nodes[j];

        const dx = nodeB.position[0] - nodeA.position[0];
        const dy = nodeB.position[1] - nodeA.position[1];
        const dz = nodeB.position[2] - nodeA.position[2];

        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        const force = chargeStrength / (distance * distance);

        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        const fz = (dz / distance) * force;

        const velA = this.velocities.get(nodeA.id) || [0, 0, 0];
        const velB = this.velocities.get(nodeB.id) || [0, 0, 0];

        this.velocities.set(nodeA.id, [
          velA[0] - fx,
          velA[1] - fy,
          velA[2] - fz,
        ]);

        this.velocities.set(nodeB.id, [
          velB[0] + fx,
          velB[1] + fy,
          velB[2] + fz,
        ]);
      }
    }
  }

  private applyLinkForce() {
    const { linkDistance, linkStrength } = this.config;

    this.edges.forEach((edge) => {
      const source = this.nodes.find((n) => n.id === edge.source);
      const target = this.nodes.find((n) => n.id === edge.target);

      if (!source || !target) return;

      const dx = target.position[0] - source.position[0];
      const dy = target.position[1] - source.position[1];
      const dz = target.position[2] - source.position[2];

      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      const force = (distance - linkDistance) * linkStrength;

      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;
      const fz = (dz / distance) * force;

      const velSource = this.velocities.get(source.id) || [0, 0, 0];
      const velTarget = this.velocities.get(target.id) || [0, 0, 0];

      this.velocities.set(source.id, [
        velSource[0] + fx,
        velSource[1] + fy,
        velSource[2] + fz,
      ]);

      this.velocities.set(target.id, [
        velTarget[0] - fx,
        velTarget[1] - fy,
        velTarget[2] - fz,
      ]);
    });
  }

  private applyCenterForce() {
    const { centerStrength } = this.config;

    if (this.nodes.length === 0) return;

    let cx = 0;
    let cy = 0;
    let cz = 0;

    this.nodes.forEach((node) => {
      cx += node.position[0];
      cy += node.position[1];
      cz += node.position[2];
    });

    cx /= this.nodes.length;
    cy /= this.nodes.length;
    cz /= this.nodes.length;

    this.nodes.forEach((node) => {
      const vel = this.velocities.get(node.id) || [0, 0, 0];

      this.velocities.set(node.id, [
        vel[0] - cx * centerStrength,
        vel[1] - cy * centerStrength,
        vel[2] - cz * centerStrength,
      ]);
    });
  }

  isStable(): boolean {
    return this.alpha < this.config.alphaMin;
  }

  getAlpha(): number {
    return this.alpha;
  }
}