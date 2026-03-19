#!/usr/bin/env python3
"""Generate a compact clustered demo graph for OpenPulse."""

from __future__ import annotations

import json
import math
import random
from pathlib import Path

NODE_TYPES = ['repository', 'library', 'api', 'service', 'database', 'server']
NODE_COUNT = 120
CLUSTERS = 6
SEED = 16016


def create_cluster_center(cluster_index: int) -> list[float]:
    angle = (cluster_index / CLUSTERS) * math.tau
    return [
        round(math.cos(angle) * 10, 2),
        round(((cluster_index % 3) - 1) * 3.6, 2),
        round(math.sin(angle) * 10, 2),
    ]


def create_node(cluster_index: int, node_index: int, rng: random.Random, center: list[float]) -> dict:
    angle = ((node_index % 20) / 20) * math.tau
    radius = 1.8 + rng.random() * 2.8
    is_root = cluster_index == 0 and node_index == 0
    node_id = 'demo/repository' if is_root else f'pkg-{cluster_index}-{node_index}'
    return {
        'id': node_id,
        'label': node_id,
        'type': 'repository' if is_root else NODE_TYPES[(cluster_index + node_index) % len(NODE_TYPES)],
        'position': [
            round(center[0] + math.cos(angle) * radius, 2),
            round(center[1] + (rng.random() - 0.5) * 2.5, 2),
            round(center[2] + math.sin(angle) * radius, 2),
        ],
        'riskScore': round(0.18 + rng.random() * 0.68, 2),
        'size': round(1 + rng.random() * 1.2, 2),
        'metadata': {'cluster': cluster_index, 'source': 'demo'},
    }


def build_dataset() -> dict:
    rng = random.Random(SEED)
    nodes_per_cluster = NODE_COUNT // CLUSTERS
    nodes = []
    edges = []
    cluster_roots = []

    for cluster_index in range(CLUSTERS):
        center = create_cluster_center(cluster_index)
        for node_index in range(nodes_per_cluster):
            node = create_node(cluster_index, node_index, rng, center)
            nodes.append(node)
            if node_index == 0:
                cluster_roots.append(node['id'])

    for index, target_id in enumerate(cluster_roots[1:]):
        edges.append({'id': f'backbone-{index}', 'source': cluster_roots[0], 'target': target_id, 'weight': 1})

    for cluster_index in range(CLUSTERS):
        cluster_nodes = nodes[cluster_index * nodes_per_cluster : (cluster_index + 1) * nodes_per_cluster]
        root_id = cluster_nodes[0]['id']
        for index in range(1, len(cluster_nodes)):
            current = cluster_nodes[index]
            parent = cluster_nodes[max(0, index - 1 - (index % 3))]
            edges.append(
                {
                    'id': f'cluster-{cluster_index}-{index}',
                    'source': root_id if index % 4 == 0 else parent['id'],
                    'target': current['id'],
                    'weight': 1,
                }
            )
        for index in range(2, len(cluster_nodes), 5):
            edges.append(
                {
                    'id': f'cross-{cluster_index}-{index}',
                    'source': cluster_nodes[index - 2]['id'],
                    'target': cluster_nodes[index]['id'],
                    'weight': 0.6,
                }
            )

    return {'nodes': nodes, 'edges': edges}


def main() -> None:
    project_root = Path(__file__).resolve().parents[1]
    output_file = project_root / 'docs' / 'demo_dataset.json'
    dataset = build_dataset()
    output_file.write_text(json.dumps(dataset, indent=2), encoding='utf-8')
    print(f"Generated {len(dataset['nodes'])} nodes and {len(dataset['edges'])} edges")
    print(f'Saved demo dataset to: {output_file}')


if __name__ == '__main__':
    main()
