#!/usr/bin/env python3
"""Phase 15 demo dataset generator for OpenPulse.

Creates a deterministic graph with 200 nodes and 400 edges.
"""

from __future__ import annotations

import json
import random
from pathlib import Path

NODE_TYPES = [
    "service",
    "library",
    "repository",
    "database",
    "api",
    "server",
    "ip",
    "threat",
    "vulnerability",
]

NODE_COUNT = 200
EDGE_COUNT = 400
SEED = 15015


def build_dataset() -> dict:
    rng = random.Random(SEED)
    nodes: list[dict] = []

    for index in range(NODE_COUNT):
        nodes.append(
            {
                "id": f"node-{index}",
                "label": f"Node {index}",
                "type": rng.choice(NODE_TYPES),
                "position": [
                    round((rng.random() - 0.5) * 30, 3),
                    round((rng.random() - 0.5) * 30, 3),
                    round((rng.random() - 0.5) * 30, 3),
                ],
                "riskScore": round(rng.random(), 3),
                "metadata": {
                    "index": index,
                    "generatedBy": "scripts/demo_data_generator.py",
                },
            }
        )

    edges: list[dict] = []
    edge_pairs: set[tuple[int, int]] = set()

    while len(edges) < EDGE_COUNT:
        source = rng.randrange(0, NODE_COUNT)
        target = rng.randrange(0, NODE_COUNT)

        if source == target:
            continue

        pair = (source, target)
        if pair in edge_pairs:
            continue

        edge_pairs.add(pair)
        edges.append(
            {
                "id": f"edge-{len(edges)}",
                "source": f"node-{source}",
                "target": f"node-{target}",
                "weight": round(0.1 + rng.random() * 0.9, 3),
            }
        )

    return {"nodes": nodes, "edges": edges}


def main() -> None:
    project_root = Path(__file__).resolve().parents[1]
    output_file = project_root / "docs" / "demo_dataset.json"

    data = build_dataset()
    output_file.write_text(json.dumps(data, indent=2), encoding="utf-8")

    print(f"Generated {len(data['nodes'])} nodes and {len(data['edges'])} edges")
    print(f"Saved demo dataset to: {output_file}")


if __name__ == "__main__":
    main()
