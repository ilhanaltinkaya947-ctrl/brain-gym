/**
 * PatternHunter.ts — Mini-Game 1: Find the Odd One Out
 *
 * Mechanic:
 * - 4x4 grid (16 cells) of colored circles
 * - 15 are one color, 1 is a different color (hue-shifted)
 * - Player taps the odd one to score 100pts
 * - 7 second time limit
 *
 * Effect House Setup:
 * - Attach this script component to the "PatternHunterContainer" SceneObject
 * - Create 16 child SceneObjects named "cell_0" through "cell_15"
 *   each with an Image component (circle shape)
 * - Touch is handled globally — we compute which cell was tapped
 *   based on normalized screen coordinates and known grid layout
 *
 * Communication:
 * - GameController calls globalThis.axonFilter.startPatternHunter()
 * - This script calls globalThis.axonFilter.onGameComplete(points, passed)
 */

declare var globalThis: any;

// ============================================================
// COLOR PAIRS — base + odd variant (hue-shifted 30-40 degrees)
// ============================================================

interface ColorPair {
  name: string;
  base: APJS.Color;
  odd: APJS.Color;
}

const COLOR_PAIRS: ColorPair[] = [
  {
    name: 'Cyan vs Magenta',
    base: new APJS.Color(0.0, 0.83, 1.0, 1.0),
    odd: new APJS.Color(0.83, 0.0, 1.0, 1.0),
  },
  {
    name: 'Green vs Yellow',
    base: new APJS.Color(0.0, 0.85, 0.35, 1.0),
    odd: new APJS.Color(0.85, 0.85, 0.0, 1.0),
  },
  {
    name: 'Orange vs Red',
    base: new APJS.Color(1.0, 0.55, 0.0, 1.0),
    odd: new APJS.Color(1.0, 0.2, 0.2, 1.0),
  },
  {
    name: 'Purple vs Blue',
    base: new APJS.Color(0.6, 0.2, 0.9, 1.0),
    odd: new APJS.Color(0.2, 0.4, 0.9, 1.0),
  },
];

const COL_GOLD = new APJS.Color(1.0, 0.84, 0.0, 1.0);
const COL_GREEN_FLASH = new APJS.Color(0.0, 0.85, 0.35, 0.3);
const COL_RED_FLASH = new APJS.Color(1.0, 0.2, 0.2, 0.3);
const COL_TIMER_RED = new APJS.Color(1.0, 0.2, 0.2, 1.0);
const COL_TIMER_CYAN = new APJS.Color(0.0, 0.83, 1.0, 1.0);

// ============================================================
// GRID LAYOUT for touch hit-testing
// The 4x4 grid is centered on screen.
// We define the grid bounds in normalized screen coordinates (0-1).
// These values should match the scene layout.
// ============================================================

const GRID_COLS = 4;
const GRID_ROWS = 4;
const GRID_SIZE = 16;
const GAME_DURATION = 7.0;

// Grid bounds in normalized screen coords (0,0 = top-left, 1,1 = bottom-right)
// Adjust these to match your Effect House scene layout
const GRID_LEFT = 0.1;
const GRID_RIGHT = 0.9;
const GRID_TOP = 0.25;
const GRID_BOTTOM = 0.75;

// ============================================================
// SCRIPT COMPONENT
// ============================================================

@component()
export class PatternHunter extends APJS.BasicScriptComponent {

  // Scene object references
  private cells: (APJS.SceneObject | null)[] = [];
  private feedbackOverlay: APJS.SceneObject | null = null;

  // State
  private isActive: boolean = false;
  private timer: number = 0;
  private oddCellIndex: number = -1;
  private hasAnswered: boolean = false;
  private currentPair: ColorPair | null = null;
  private feedbackTimer: number = 0;
  private showingFeedback: boolean = false;
  private pendingComplete: boolean = false;
  private pendingPoints: number = 0;
  private pendingPassed: boolean = false;
  private pendingCompleteTimer: number = 0;

  // ================================================================
  // LIFECYCLE
  // ================================================================

  onStart(): void {
    // Find all 16 cell scene objects
    for (let i = 0; i < GRID_SIZE; i++) {
      this.cells.push(this.scene.findSceneObject(`cell_${i}`));
    }

    // Find feedback overlay
    this.feedbackOverlay = this.scene.findSceneObject('PatternFeedback');

    // Register start function on global
    globalThis.axonFilter.startPatternHunter = () => {
      this.startGame();
    };
  }

  onUpdate(deltaTime: number): void {
    if (!this.isActive && !this.showingFeedback && !this.pendingComplete) return;

    if (this.isActive) {
      this.timer += deltaTime;

      // Update timer bar (1.0 = full, 0.0 = empty)
      const progress = 1.0 - (this.timer / GAME_DURATION);
      this.updateTimerBar(Math.max(0, progress));

      // Change timer bar color in last 2 seconds
      if (this.timer >= GAME_DURATION - 2.0) {
        this.setTimerBarColor(COL_TIMER_RED);
      }

      // Check timeout
      if (this.timer >= GAME_DURATION) {
        this.handleTimeout();
      }
    }

    // Fade out feedback overlay
    if (this.showingFeedback) {
      this.feedbackTimer += deltaTime;
      if (this.feedbackTimer > 0.5) {
        const fadeProgress = (this.feedbackTimer - 0.5) / 0.5;
        this.setImageOpacity(this.feedbackOverlay, Math.max(0, 0.3 * (1 - fadeProgress)));
        if (fadeProgress >= 1.0) {
          this.setVisible(this.feedbackOverlay, false);
          this.showingFeedback = false;
        }
      }
    }

    // Delayed completion callback
    if (this.pendingComplete) {
      this.pendingCompleteTimer += deltaTime;
      if (this.pendingCompleteTimer >= 1.5) {
        this.pendingComplete = false;
        if (globalThis.axonFilter.onGameComplete) {
          globalThis.axonFilter.onGameComplete(this.pendingPoints, this.pendingPassed);
        }
      }
    }
  }

  /**
   * Handle global touch events — compute which grid cell was tapped
   */
  onEvent(event: APJS.IEvent): void {
    if (event.type === APJS.EventType.Touch) {
      const touch = event.args[0] as APJS.TouchData;
      if (touch.phase === APJS.TouchPhase.Began) {
        this.handleTouch(touch.position);
      }
    }
  }

  // ================================================================
  // GAME LOGIC
  // ================================================================

  private startGame(): void {
    this.isActive = true;
    this.timer = 0;
    this.hasAnswered = false;
    this.showingFeedback = false;
    this.pendingComplete = false;

    // Pick random color pair
    const pairIndex = Math.floor(Math.random() * COLOR_PAIRS.length);
    this.currentPair = COLOR_PAIRS[pairIndex];

    // Pick random odd cell
    this.oddCellIndex = Math.floor(Math.random() * GRID_SIZE);

    // Set header text
    this.setHeaderText('FIND THE ODD ONE');

    // Reset timer bar color
    this.setTimerBarColor(COL_TIMER_CYAN);

    // Color all cells
    for (let i = 0; i < GRID_SIZE; i++) {
      const cell = this.cells[i];
      if (!cell) continue;

      const color = (i === this.oddCellIndex) ? this.currentPair.odd : this.currentPair.base;
      this.setCellColor(cell, color);
      this.setVisible(cell, true);
      this.setObjScale(cell, 1, 1, 1);
      this.setImageOpacity(cell, 1.0);
    }

    // Hide feedback overlay
    this.setVisible(this.feedbackOverlay, false);

    // Update timer bar to full
    this.updateTimerBar(1.0);
  }

  private handleTouch(pos: APJS.Vector2f): void {
    if (!this.isActive || this.hasAnswered) return;

    // Check if touch is within grid bounds
    const nx = pos.x; // normalized screen X (0-1)
    const ny = pos.y; // normalized screen Y (0-1)

    if (nx < GRID_LEFT || nx > GRID_RIGHT || ny < GRID_TOP || ny > GRID_BOTTOM) {
      return; // Outside grid
    }

    // Calculate which cell was tapped
    const cellWidth = (GRID_RIGHT - GRID_LEFT) / GRID_COLS;
    const cellHeight = (GRID_BOTTOM - GRID_TOP) / GRID_ROWS;

    const col = Math.floor((nx - GRID_LEFT) / cellWidth);
    const row = Math.floor((ny - GRID_TOP) / cellHeight);

    // Clamp to valid range
    const clampedCol = Math.max(0, Math.min(GRID_COLS - 1, col));
    const clampedRow = Math.max(0, Math.min(GRID_ROWS - 1, row));

    const cellIndex = clampedRow * GRID_COLS + clampedCol;

    if (cellIndex >= 0 && cellIndex < GRID_SIZE) {
      this.handleCellTap(cellIndex);
    }
  }

  private handleCellTap(cellIndex: number): void {
    if (!this.isActive || this.hasAnswered) return;
    this.hasAnswered = true;

    if (cellIndex === this.oddCellIndex) {
      // CORRECT
      this.showFeedback(true);
      this.animateCellCorrect(this.cells[cellIndex]);
      this.endGame(100, true);
    } else {
      // WRONG
      this.showFeedback(false);
      this.animateGridShake();
      this.revealOddCell();
      this.endGame(0, false);
    }
  }

  private handleTimeout(): void {
    if (this.hasAnswered) return;
    this.hasAnswered = true;

    this.showFeedback(false);
    this.revealOddCell();
    this.endGame(0, false);
  }

  private endGame(points: number, passed: boolean): void {
    this.isActive = false;
    this.pendingComplete = true;
    this.pendingPoints = points;
    this.pendingPassed = passed;
    this.pendingCompleteTimer = 0;
  }

  // ================================================================
  // VISUAL FEEDBACK
  // ================================================================

  private showFeedback(correct: boolean): void {
    this.setVisible(this.feedbackOverlay, true);
    this.feedbackTimer = 0;
    this.showingFeedback = true;

    if (correct) {
      this.setCellColor(this.feedbackOverlay!, COL_GREEN_FLASH);
    } else {
      this.setCellColor(this.feedbackOverlay!, COL_RED_FLASH);
    }
    this.setImageOpacity(this.feedbackOverlay, 0.3);
  }

  private animateCellCorrect(cell: APJS.SceneObject | null): void {
    if (!cell) return;
    this.setObjScale(cell, 1.3, 1.3, 1);
    this.setCellColor(cell, COL_GOLD);
  }

  private animateGridShake(): void {
    // Apply a small X offset to the container using a frame-based approach
    // We track shake state and handle it in onUpdate implicitly via
    // the cells' parent container. Since we can't easily do multi-frame
    // in a single function call, we offset individual cell positions briefly.
    // For simplicity in Effect House, we just flash feedback — the overlay
    // red flash provides sufficient "wrong" feedback.
  }

  private revealOddCell(): void {
    const oddCell = this.cells[this.oddCellIndex];
    if (!oddCell) return;

    // Make it bright gold and larger
    this.setCellColor(oddCell, COL_GOLD);
    this.setObjScale(oddCell, 1.2, 1.2, 1);
  }

  // ================================================================
  // UTILITY: SHARED UI (header + timer bar)
  // ================================================================

  private setHeaderText(content: string): void {
    const headerObj = globalThis.axonFilter.headerText;
    if (!headerObj) return;
    const text = headerObj.getComponent('Text') as APJS.Text;
    if (text) text.text = content;
  }

  private updateTimerBar(progress: number): void {
    const barFill = globalThis.axonFilter.timerBarFill;
    if (!barFill) return;
    barFill.getTransform().setLocalScale(
      new APJS.Vector3f(Math.max(0, progress), 1, 1),
    );
  }

  private setTimerBarColor(color: APJS.Color): void {
    const barFill = globalThis.axonFilter.timerBarFill;
    if (!barFill) return;
    const img = barFill.getComponent('Image') as APJS.Image;
    if (img) img.color = color;
  }

  // ================================================================
  // UTILITY: SCENE OBJECTS
  // ================================================================

  private setVisible(obj: APJS.SceneObject | null, visible: boolean): void {
    if (obj) obj.enabled = visible;
  }

  private setImageOpacity(obj: APJS.SceneObject | null, alpha: number): void {
    if (!obj) return;
    const img = obj.getComponent('Image') as APJS.Image;
    if (img) img.opacity = alpha;
  }

  private setCellColor(cell: APJS.SceneObject, color: APJS.Color): void {
    if (!cell) return;
    const img = cell.getComponent('Image') as APJS.Image;
    if (img) img.color = color;
  }

  private setObjScale(obj: APJS.SceneObject | null, x: number, y: number, z: number): void {
    if (!obj) return;
    obj.getTransform().setLocalScale(new APJS.Vector3f(x, y, z));
  }
}
