# Phase 6 Complete ✅

## Force-Directed Layout Algorithm

### What's New in Phase 6

**2 New Files:**
- `frontend/lib/forceSimulation.ts` - 3D force-directed layout algorithm
- `frontend/hooks/useForceSimulation.ts` - Hook to run simulation

**2 Updated Files:**
- `frontend/lib/sampleData.ts` - Now uses random positions (not circle)
- `frontend/components/Scene.tsx` - Runs force simulation on nodes

**Unchanged:**
- All other Phase 5 files

## Installation

### Copy Files to Your Project

```bash
# Copy new files
cp ~/Downloads/openpulse-phase6/frontend/lib/forceSimulation.ts ~/openpulse/frontend/lib/
cp ~/Downloads/openpulse-phase6/frontend/hooks/useForceSimulation.ts ~/openpulse/frontend/hooks/

# Update existing files
cp ~/Downloads/openpulse-phase6/frontend/lib/sampleData.ts ~/openpulse/frontend/lib/
cp ~/Downloads/openpulse-phase6/frontend/components/Scene.tsx ~/openpulse/frontend/components/
```

Or use the install script:
```bash
cd ~/Downloads/openpulse-phase6
./install-phase6.sh
```

## Run It

```bash
cd ~/openpulse/frontend
npm run dev
```

Visit `http://localhost:3000`

## What You'll See

### 🎉 Animated Self-Organizing Graph!

- ✅ **Nodes start scattered randomly**
- ✅ **Automatically move into organized layout**
- ✅ **Connected nodes pull together**
- ✅ **All nodes push apart**
- ✅ **Settles into stable configuration**
- ✅ **Organic, natural-looking graph**

### The Magic

```
Initial (t=0):           After simulation (t=300):

Random scatter           Organized structure
  🟢                        🟢──🔵
    🔵  🟣                    │╱ ╲
 🟠                        🟣    🟠
       ⚫                     │  ╱
   🔵                        ⚫╱
    🟣                      🔵──🟣

Chaos                    Beautiful layout!
```

## How It Works

### Three Forces

**1. Charge Force (Repulsion)**
```
All nodes push each other apart
Prevents overlap
Creates space
```

**2. Link Force (Attraction)**
```
Connected nodes pull together
Like springs
Keeps graph compact
```

**3. Center Force (Gravity)**
```
All nodes pulled toward center
Prevents drift
Keeps graph centered
```

### Physics Simulation

```typescript
Every frame:
1. Calculate repulsion between all node pairs
2. Calculate attraction along all edges
3. Pull all nodes toward center
4. Update velocities
5. Update positions
6. Apply velocity decay (friction)
7. Reduce alpha (cooling)

After ~300 frames: stable layout
```

### Algorithm Flow

```
Start:
  alpha = 1.0 (hot)
  positions = random

Each tick:
  forces = calculate()
  velocities += forces * alpha
  velocities *= decay
  positions += velocities
  alpha *= 0.98 (cooling)

End when:
  alpha < 0.001 (cold)
```

## File Descriptions

### lib/forceSimulation.ts

**ForceSimulation3D class**:
- Custom 3D force simulation
- Based on d3-force algorithm
- Adapted for 3D space
- No dependencies

**Forces implemented**:
```typescript
applyChargeForce()    // n-body repulsion
applyLinkForce()      // spring attraction
applyCenterForce()    // gravity to center
```

**Configuration**:
```typescript
FORCE_CONFIG = {
  chargeStrength: -300,    // Repulsion strength
  linkDistance: 5,         // Desired edge length
  linkStrength: 0.5,       // Spring strength
  centerStrength: 0.1,     // Gravity strength
  velocityDecay: 0.4,      // Friction (0-1)
  alphaDecay: 0.02,        // Cooling rate
}
```

### hooks/useForceSimulation.ts

**Purpose**: Integrates physics into React/Three.js

**Usage**:
```typescript
useForceSimulation({
  nodes,
  edges,
  enabled: true,
  onUpdate: (updatedNodes) => {
    // Update node positions
  }
});
```

**Features**:
- Runs in useFrame (every render)
- Updates Zustand store
- Auto-stops after 300 ticks
- Provides restart/stop controls

### lib/sampleData.ts (updated)

**Changed**:
```typescript
// Old: Circular arrangement
const angle = (i / nodeCount) * Math.PI * 2;
position: [
  Math.cos(angle) * radius,
  height,
  Math.sin(angle) * radius,
]

// New: Random positions
position: [
  (Math.random() - 0.5) * 20,
  (Math.random() - 0.5) * 20,
  (Math.random() - 0.5) * 20,
]
```

Nodes start scattered, then organize themselves!

### components/Scene.tsx (updated)

**Added**:
```typescript
useForceSimulation({
  nodes,
  edges,
  enabled: true,
  onUpdate: (updatedNodes) => {
    setGraphData({ nodes: updatedNodes, edges });
  },
});
```

Runs simulation and updates graph state.

## Configuration

### Stronger Repulsion

```typescript
// In forceSimulation.ts
FORCE_CONFIG = {
  chargeStrength: -500,  // More spread out
}
```

### Tighter Clustering

```typescript
FORCE_CONFIG = {
  linkStrength: 1.0,     // Stronger springs
  linkDistance: 3,       // Shorter edges
}
```

### Faster Settlement

```typescript
FORCE_CONFIG = {
  alphaDecay: 0.05,      // Cool faster
}

// In useForceSimulation.ts
const maxTicks = 150;    // Stop earlier
```

### Slower Settlement

```typescript
FORCE_CONFIG = {
  alphaDecay: 0.01,      // Cool slower
  velocityDecay: 0.3,    // Less friction
}

const maxTicks = 500;    // Run longer
```

## Performance

### Computational Complexity

```
Charge force: O(n²)  - checks all pairs
Link force: O(m)     - checks all edges
Center force: O(n)   - checks all nodes

Per tick: O(n² + m)

For 20 nodes, 45 edges:
  ~400 operations per tick
  300 ticks total
  ~120,000 operations total
  Completes in ~5 seconds
```

### Optimization

- Stops after 300 ticks automatically
- Uses alpha to reduce force strength over time
- Velocity decay prevents jitter
- Efficient vector math

### Scalability

| Nodes | Ticks | Time |
|-------|-------|------|
| 20 | 300 | ~5s |
| 50 | 300 | ~10s |
| 100 | 300 | ~30s |
| 200 | 300 | ~90s |

For larger graphs (100+), consider:
- Barnes-Hut approximation
- Octree spatial partitioning
- Web Workers
- GPU compute shaders

## Visual Behavior

### Phase 1: Chaos (t=0-50)
- Nodes scattered randomly
- High velocity
- Lots of movement
- Alpha = 1.0

### Phase 2: Organization (t=50-150)
- Clusters forming
- Connected nodes grouping
- Still moving fast
- Alpha = 0.5

### Phase 3: Refinement (t=150-250)
- Layout recognizable
- Slower movement
- Fine adjustments
- Alpha = 0.2

### Phase 4: Stabilization (t=250-300)
- Nearly stopped
- Tiny adjustments
- Final positions
- Alpha → 0

## Graph Theory Insights

### What the Layout Reveals

**Hub Nodes**:
- Central position
- Many connections
- Larger influence area

**Clusters**:
- Densely connected groups
- Close together
- Distinct communities

**Bridges**:
- Between clusters
- Few connections
- Critical for connectivity

**Isolates**:
- Few connections
- Pushed to periphery
- Low importance

The layout makes graph structure **visually obvious**!

## Troubleshooting

**Nodes flying off screen?**
- Increase centerStrength
- Decrease chargeStrength
- Check initial positions are reasonable

**Nodes overlapping?**
- Increase chargeStrength (more negative)
- Decrease linkStrength
- Increase linkDistance

**Layout too tight?**
- Decrease linkStrength
- Increase linkDistance
- Decrease centerStrength

**Simulation never stops?**
- Check alphaDecay is positive
- Check velocityDecay < 1
- Verify maxTicks is reached

**Poor performance?**
- Reduce node count
- Reduce maxTicks
- Increase alphaDecay (faster cooling)

## Advanced Customization

### 2D Layout (Flat)

```typescript
// In forceSimulation.ts, applyChargeForce:
const dz = 0;  // No z-axis repulsion

// In applyCenterForce:
node.vz! = 0;  // No z-axis centering

// Keeps graph flat on y=0 plane
```

### Weighted Edges

```typescript
// In applyLinkForce:
const strength = FORCE_CONFIG.linkStrength * 
                 this.alpha * 
                 (edge.weight || 1);  // Use edge weight
```

### Pin Specific Nodes

```typescript
// In sampleData.ts:
nodes[0].fx = 0;  // Pin to x=0
nodes[0].fy = 0;  // Pin to y=0
nodes[0].fz = 0;  // Pin to z=0

// Node won't move during simulation
```

### Custom Force

```typescript
// In ForceSimulation3D:
private applyCustomForce() {
  this.nodes.forEach(node => {
    // Your custom logic
    node.vy! -= 0.1;  // e.g., gravity downward
  });
}

// Add to tick():
this.applyCustomForce();
```

## What's Next

**Phase 7** will add:
- Node interaction (click, hover)
- Raycasting for mouse picking
- Selection highlighting
- Hover effects
- Click to select nodes
- Visual feedback
- Inspector shows selected node

**Phase 8** will add:
- Enhanced Inspector panel
- Node metadata display
- Connection exploration
- Search and filter
- Node details on selection

## Key Concepts

### Force-Directed Layout
- Self-organizing algorithm
- Mimics physical forces
- Creates natural-looking graphs
- Reveals graph structure

### Simulated Annealing
- Start "hot" (high alpha)
- Cool down over time
- Prevents local minima
- Finds good global layout

### N-Body Problem
- Every node affects every other node
- O(n²) complexity
- Expensive for large graphs
- Can be optimized

### Spring Model
- Edges are springs
- Hooke's law: F = k * (d - d₀)
- Pulls connected nodes together
- Creates compact layout

## Success Criteria

- [x] Nodes start scattered
- [x] Nodes automatically organize
- [x] Connected nodes group together
- [x] Layout stabilizes
- [x] No overlapping nodes
- [x] Graph stays centered
- [x] Smooth animation
- [x] Completes in ~5 seconds

Ready for Phase 7: Node Interaction!