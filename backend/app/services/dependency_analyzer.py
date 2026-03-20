"""Dependency analysis service for building graph from package.json."""
from typing import Dict, Any


class DependencyAnalyzer:
    """Analyzes package.json and builds dependency graph."""

    @staticmethod
    def parse_package_json(package_data: dict) -> Dict[str, Any]:
        """Parse package.json and extract dependencies.
        
        Args:
            package_data: Parsed package.json content
            
        Returns:
            Graph data with nodes and edges
        """
        nodes = []
        edges = []
        node_id_map = {}
        
        # Get project name
        project_name = package_data.get("name", "unknown-project")
        
        # Create root node for the project
        root_id = "node-0"
        nodes.append({
            "id": root_id,
            "label": project_name,
            "type": "repository",
            "position": [0, 0, 0],
            "riskScore": 0.0,
            "metadata": {
                "name": project_name,
                "version": package_data.get("version", "unknown"),
                "isRoot": True,
            }
        })
        node_id_map[project_name] = root_id
        
        # Get dependencies (direct only for Phase 16)
        dependencies = package_data.get("dependencies", {})
        dev_dependencies = package_data.get("devDependencies", {})
        
        # Combine all dependencies
        all_deps = {**dependencies, **dev_dependencies}
        
        # Create nodes for each dependency
        node_counter = 1
        for dep_name, dep_version in all_deps.items():
            dep_id = f"node-{node_counter}"
            
            # Determine node type
            is_dev = dep_name in dev_dependencies
            node_type = "library"
            
            nodes.append({
                "id": dep_id,
                "label": dep_name,
                "type": node_type,
                "position": [
                    (node_counter % 10 - 5) * 5,
                    ((node_counter // 10) % 10 - 5) * 5,
                    ((node_counter // 100) - 2) * 5
                ],
                "riskScore": 0.5,  # Default risk score
                "metadata": {
                    "name": dep_name,
                    "version": dep_version,
                    "isDev": is_dev,
                }
            })
            
            node_id_map[dep_name] = dep_id
            
            # Create edge from root to dependency
            edges.append({
                "id": f"edge-{node_counter - 1}",
                "source": root_id,
                "target": dep_id,
                "weight": 1.0,
            })
            
            node_counter += 1
        
        return {
            "nodes": nodes,
            "edges": edges,
            "metadata": {
                "projectName": project_name,
                "totalDependencies": len(all_deps),
                "directDependencies": len(dependencies),
                "devDependencies": len(dev_dependencies),
            }
        }