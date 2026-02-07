
# Animated Biological Neuron Visual

## Overview
Transform the `NeuralBrain` component into a detailed, biologically-accurate neuron matching the reference image. The new design features extensive branching dendrites, a glowing magenta soma, a curved axon with myelin sheath segments, and premium pulsating animations.

---

## Visual Elements to Create

### 1. Soma (Cell Body)
- Central irregular star-like shape (not a circle)
- Multi-layered glow: magenta/pink inner core, purple outer halo
- Pulsating animation that breathes every 2-3 seconds
- Particle sparkles around the soma

### 2. Dendrites (Top Branches)
- 5-7 main branches extending upward and outward
- Each branch subdivides 2-3 times (tree-like fractal pattern)
- Cyan/teal color gradient from thick at base to thin at tips
- Subtle signal pulse animations traveling toward soma

### 3. Axon with Myelin Sheath
- Single thick trunk curving downward from soma
- 5-6 oval "bead" segments representing myelin sheath nodes
- Slight pink/flesh tint on sheath segments
- Gap between each segment (Nodes of Ranvier)

### 4. Axon Terminals (Bottom Branches)
- 3-4 branches splitting at axon end
- Smaller sub-branches on each terminal
- Cyan color matching dendrites
- Signal pulses traveling outward (away from soma)

---

## Animation System

```text
Animations Timeline:
├── Soma Pulse: scale 1.0 → 1.08 → 1.0 (2.5s loop)
├── Soma Glow: opacity 0.6 → 1.0 → 0.6 (3s loop)
├── Dendrite Signal: travel toward soma (1.5s, staggered)
├── Axon Signal: travel away from soma (1.2s, staggered)
└── Myelin Shimmer: subtle opacity wave (4s loop)
```

---

## Color Palette

| Element | Color |
|---------|-------|
| Soma Core | `hsl(300, 80%, 70%)` - Bright Magenta |
| Soma Glow | `hsl(280, 70%, 60%)` - Purple/Pink |
| Dendrites | `hsl(190, 90%, 65%)` - Cyan/Teal |
| Axon | `hsl(190, 80%, 60%)` - Cyan |
| Myelin Sheath | `hsl(320, 40%, 75%)` - Pale Pink |
| Signal Pulses | `hsl(180, 100%, 75%)` - Bright Cyan |

---

## Technical Implementation

### File: `src/components/NeuralBrain.tsx`

**Structure:**
```text
<svg viewBox="0 0 100 100">
  <defs>
    <!-- Filters -->
    <filter id="somaGlow">      <!-- Multi-layer magenta glow -->
    <filter id="dendriteGlow">  <!-- Subtle cyan glow -->
    <filter id="signalGlow">    <!-- Bright pulse glow -->
    
    <!-- Gradients -->
    <radialGradient id="somaGrad">    <!-- Magenta center fade -->
    <linearGradient id="dendriteGrad"> <!-- Cyan thickness fade -->
    <linearGradient id="myelinGrad">  <!-- Pink sheath gradient -->
  </defs>
  
  <!-- Layer 1: Dendrites (background) -->
  <g class="dendrites">
    <!-- 5-7 main branches with sub-branches -->
    <path d="M50 45 Q45 35 30 20" /> <!-- Branch 1 -->
    <path d="M30 20 Q25 15 15 10" /> <!-- Sub-branch 1a -->
    <!-- ... more branches -->
  </g>
  
  <!-- Layer 2: Axon trunk with myelin -->
  <g class="axon">
    <path d="M50 55 Q52 65 48 75 Q44 85 40 90" /> <!-- Main trunk -->
    <!-- Myelin segments -->
    <ellipse cx="51" cy="60" rx="3" ry="4" />
    <ellipse cx="50" cy="68" rx="3" ry="4" />
    <!-- ... more segments -->
  </g>
  
  <!-- Layer 3: Axon terminals -->
  <g class="terminals">
    <path d="M40 90 Q35 93 28 95" />
    <path d="M40 90 Q42 95 45 98" />
    <!-- ... more terminals -->
  </g>
  
  <!-- Layer 4: Soma (foreground) -->
  <g class="soma">
    <!-- Irregular star shape -->
    <path d="M50 45 L53 48 L57 46 L54 50 ..." fill="somaGrad" />
    <!-- Inner glow highlight -->
    <circle cx="48" cy="48" r="3" opacity="0.5" />
  </g>
  
  <!-- Layer 5: Signal pulses (animated) -->
  <motion.circle class="dendrite-signal" />
  <motion.circle class="axon-signal" />
</svg>
```

### Mobile Optimization
- Desktop: Full animation with signal pulses and glow filters
- Mobile: Static dendrites/axon, simplified soma pulse only (CSS)
- Reduced filter complexity on mobile for performance

---

## Files to Modify

### 1. `src/components/NeuralBrain.tsx`
Complete rewrite of both `MobileBrain` and `DesktopBrain` components:
- New dendrite branch paths (tree-like structure)
- Irregular soma shape instead of circle
- Myelin sheath segments on axon
- Updated color scheme (cyan/magenta)
- Enhanced glow filters
- Signal pulse animations on branches

---

## Performance Considerations

1. **SVG Complexity**: Use `stroke-linecap="round"` for smooth branch ends
2. **Filter Caching**: Reuse filter definitions across elements
3. **Animation Batching**: Group signal pulses with same timing
4. **Mobile Fallback**: CSS-only glow animation, no path animations

---

## Expected Result

The new neuron will:
- Look biologically accurate like the reference image
- Have a glowing magenta soma that pulses rhythmically
- Feature extensive cyan dendrite branches at top
- Include a curved axon with visible myelin sheath segments
- Show signal pulses traveling through the neural pathways
- Maintain smooth 60fps performance on desktop
- Gracefully degrade to simpler animation on mobile
