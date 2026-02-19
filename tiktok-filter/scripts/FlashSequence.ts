/**
 * FlashSequence.ts — Mini-Game 2: Repeat the Sequence
 *
 * Mechanic:
 * - 3x3 grid (9 cells)
 * - Watch phase: 4 cells light up one by one (700ms each)
 * - Play phase: Tap them back in the same order (4s timeout)
 * - All correct = 150pts, any wrong = fail
 *
 * Effect House Setup:
 * - Attach this script component to the "FlashSequenceContainer" SceneObject
 * - Create 9 child SceneObjects named "flash_cell_0" through "flash_cell_8"
 *   each with an Image component (rounded square)
 * - Create "progressDot_0" through "progressDot_3" for sequence position dots
 * - Touch is handled globally — we compute which cell was tapped
 *   based on normalized screen coordinates and known grid layout
 *
 * Communication:
 * - GameController calls globalThis.axonFilter.startFlashSequence()
 * - This script calls globalThis.axonFilter.onGameComplete(points, passed)
 */

declare var globalThis: any;

// ============================================================
// CONSTANTS
// ============================================================

const FLASH_GRID_SIZE = 9;
const FLASH_GRID_COLS = 3;
const FLASH_GRID_ROWS = 3;
const SEQUENCE_LENGTH = 4;
const FLASH_DURATION = 0.7;
const FLASH_GAP = 0.1;
const PLAY_TIMEOUT = 4.0;

// Cell colors
const CELL_IDLE = new APJS.Color(0.12, 0.1, 0.18, 0.8);
const CELL_ACTIVE = new APJS.Color(0.0, 0.83, 1.0, 1.0);
const CELL_TRAIL = new APJS.Color(0.0, 0.83, 1.0, 0.35);
const CELL_CORRECT_TAP = new APJS.Color(0.0, 0.85, 0.35, 1.0);
const CELL_WRONG_TAP = new APJS.Color(1.0, 0.2, 0.2, 1.0);
const CELL_GOLD = new APJS.Color(1.0, 0.84, 0.0, 1.0);

// Dot colors
const DOT_INACTIVE = new APJS.Color(1.0, 1.0, 1.0, 0.2);
const DOT_WATCHING = new APJS.Color(1.0, 0.84, 0.0, 1.0);
const DOT_DONE = new APJS.Color(0.0, 0.85, 0.35, 1.0);
const DOT_CURRENT = new APJS.Color(0.0, 0.83, 1.0, 1.0);

// Feedback colors
const FLASH_GREEN_OVERLAY = new APJS.Color(0.0, 0.85, 0.35, 0.25);
const FLASH_RED_OVERLAY = new APJS.Color(1.0, 0.2, 0.2, 0.25);
const FLASH_TIMER_RED = new APJS.Color(1.0, 0.2, 0.2, 1.0);
const FLASH_TIMER_CYAN = new APJS.Color(0.0, 0.83, 1.0, 1.0);

// Grid bounds in normalized screen coordinates
// Adjust these to match your Effect House scene layout
const FLASH_GRID_LEFT = 0.15;
const FLASH_GRID_RIGHT = 0.85;
const FLASH_GRID_TOP = 0.3;
const FLASH_GRID_BOTTOM = 0.7;

// ============================================================
// INTERNAL PHASE ENUM
// ============================================================

const enum FlashPhase {
  INACTIVE = 0,
  WATCHING = 1,
  PLAYING = 2,
  RESULT = 3,
}

// ============================================================
// SCRIPT COMPONENT
// ============================================================

@component()
export class FlashSequence extends APJS.BasicScriptComponent {

  // Scene object references
  private cells: (APJS.SceneObject | null)[] = [];
  private progressDots: (APJS.SceneObject | null)[] = [];
  private feedbackOverlay: APJS.SceneObject | null = null;
  private checkmarkIcon: APJS.SceneObject | null = null;
  private crossIcon: APJS.SceneObject | null = null;

  // State
  private phase: FlashPhase = FlashPhase.INACTIVE;
  private sequence: number[] = [];
  private showStep: number = -1;
  private showTimer: number = 0;
  private playerIndex: number = 0;
  private playTimer: number = 0;
  private resultTimer: number = 0;
  private resultPoints: number = 0;
  private resultPassed: boolean = false;

  // ================================================================
  // LIFECYCLE
  // ================================================================

  onStart(): void {
    // Find all 9 cell scene objects
    for (let i = 0; i < FLASH_GRID_SIZE; i++) {
      this.cells.push(this.scene.findSceneObject(`flash_cell_${i}`));
    }

    // Find 4 progress dots
    for (let i = 0; i < SEQUENCE_LENGTH; i++) {
      this.progressDots.push(this.scene.findSceneObject(`progressDot_${i}`));
    }

    // Find feedback elements
    this.feedbackOverlay = this.scene.findSceneObject('FlashFeedback');
    this.checkmarkIcon = this.scene.findSceneObject('FlashCheckmark');
    this.crossIcon = this.scene.findSceneObject('FlashCross');

    // Register start function on global
    globalThis.axonFilter.startFlashSequence = () => {
      this.startGame();
    };
  }

  onUpdate(deltaTime: number): void {
    switch (this.phase) {
      case FlashPhase.WATCHING:
        this.updateWatching(deltaTime);
        break;
      case FlashPhase.PLAYING:
        this.updatePlaying(deltaTime);
        break;
      case FlashPhase.RESULT:
        this.updateResult(deltaTime);
        break;
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
    // Generate random sequence of 4 unique cells
    this.sequence = this.generateSequence(SEQUENCE_LENGTH, FLASH_GRID_SIZE);
    this.showStep = -1;
    this.showTimer = 0;
    this.playerIndex = 0;
    this.playTimer = 0;
    this.resultTimer = 0;

    // Set header
    this.setHeaderText('WATCH...');

    // Reset timer bar
    this.setTimerBarColor(FLASH_TIMER_CYAN);

    // Reset all cells to idle
    for (let i = 0; i < FLASH_GRID_SIZE; i++) {
      this.setCellColor(this.cells[i], CELL_IDLE);
      this.setVisible(this.cells[i], true);
      this.setObjScale(this.cells[i], 1, 1, 1);
    }

    // Reset progress dots
    for (let i = 0; i < SEQUENCE_LENGTH; i++) {
      this.setDotColor(this.progressDots[i], DOT_INACTIVE);
      this.setVisible(this.progressDots[i], true);
    }

    // Hide feedback elements
    this.setVisible(this.feedbackOverlay, false);
    this.setVisible(this.checkmarkIcon, false);
    this.setVisible(this.crossIcon, false);

    // Update timer bar to full
    this.updateTimerBar(1.0);

    // Start watching phase
    this.phase = FlashPhase.WATCHING;
  }

  private generateSequence(length: number, gridSize: number): number[] {
    const seq: number[] = [];
    const available: number[] = [];
    for (let i = 0; i < gridSize; i++) available.push(i);

    for (let i = 0; i < length; i++) {
      const randIndex = Math.floor(Math.random() * available.length);
      seq.push(available[randIndex]);
      available.splice(randIndex, 1);
    }
    return seq;
  }

  private handleTouch(pos: APJS.Vector2f): void {
    if (this.phase !== FlashPhase.PLAYING) return;

    const nx = pos.x;
    const ny = pos.y;

    // Check if within grid bounds
    if (nx < FLASH_GRID_LEFT || nx > FLASH_GRID_RIGHT ||
        ny < FLASH_GRID_TOP || ny > FLASH_GRID_BOTTOM) {
      return;
    }

    // Calculate which cell
    const cellWidth = (FLASH_GRID_RIGHT - FLASH_GRID_LEFT) / FLASH_GRID_COLS;
    const cellHeight = (FLASH_GRID_BOTTOM - FLASH_GRID_TOP) / FLASH_GRID_ROWS;

    const col = Math.min(FLASH_GRID_COLS - 1, Math.max(0,
      Math.floor((nx - FLASH_GRID_LEFT) / cellWidth)));
    const row = Math.min(FLASH_GRID_ROWS - 1, Math.max(0,
      Math.floor((ny - FLASH_GRID_TOP) / cellHeight)));

    const cellIndex = row * FLASH_GRID_COLS + col;

    if (cellIndex >= 0 && cellIndex < FLASH_GRID_SIZE) {
      this.handleCellTap(cellIndex);
    }
  }

  private handleCellTap(cellIndex: number): void {
    if (this.phase !== FlashPhase.PLAYING) return;

    const expectedCell = this.sequence[this.playerIndex];

    if (cellIndex === expectedCell) {
      // CORRECT TAP
      this.setCellColor(this.cells[cellIndex], CELL_CORRECT_TAP);
      this.setObjScale(this.cells[cellIndex], 1.08, 1.08, 1);

      // Update progress dot
      if (this.playerIndex < this.progressDots.length) {
        this.setDotColor(this.progressDots[this.playerIndex], DOT_DONE);
      }

      this.playerIndex++;

      // Check if sequence complete
      if (this.playerIndex >= SEQUENCE_LENGTH) {
        this.handleSuccess();
      } else {
        // Highlight next dot
        if (this.playerIndex < this.progressDots.length) {
          this.setDotColor(this.progressDots[this.playerIndex], DOT_CURRENT);
        }
      }
    } else {
      // WRONG TAP
      this.setCellColor(this.cells[cellIndex], CELL_WRONG_TAP);
      this.handleFailure();
    }
  }

  private handleSuccess(): void {
    this.phase = FlashPhase.RESULT;
    this.resultTimer = 0;
    this.resultPoints = 150;
    this.resultPassed = true;

    this.setHeaderText('PERFECT!');

    // Light up all sequence cells in gold
    for (let i = 0; i < this.sequence.length; i++) {
      this.setCellColor(this.cells[this.sequence[i]], CELL_GOLD);
    }

    // Show checkmark
    this.setVisible(this.checkmarkIcon, true);
    this.setObjScale(this.checkmarkIcon, 0.5, 0.5, 1);

    // Green flash
    this.setVisible(this.feedbackOverlay, true);
    this.setCellColor(this.feedbackOverlay!, FLASH_GREEN_OVERLAY);
    this.setImageOpacity(this.feedbackOverlay, 0.25);
  }

  private handleFailure(): void {
    this.phase = FlashPhase.RESULT;
    this.resultTimer = 0;
    this.resultPoints = 0;
    this.resultPassed = false;

    this.setHeaderText('WRONG!');

    // Reveal remaining correct sequence in dim cyan
    for (let i = this.playerIndex; i < this.sequence.length; i++) {
      this.setCellColor(this.cells[this.sequence[i]], CELL_TRAIL);
    }

    // Show X icon
    this.setVisible(this.crossIcon, true);
    this.setObjScale(this.crossIcon, 0.5, 0.5, 1);

    // Red flash
    this.setVisible(this.feedbackOverlay, true);
    this.setCellColor(this.feedbackOverlay!, FLASH_RED_OVERLAY);
    this.setImageOpacity(this.feedbackOverlay, 0.25);
  }

  // ================================================================
  // UPDATE PHASES
  // ================================================================

  /**
   * WATCHING: Show cells lighting up one by one
   */
  private updateWatching(dt: number): void {
    this.showTimer += dt;

    const stepDuration = FLASH_DURATION + FLASH_GAP;
    const currentStep = Math.floor(this.showTimer / stepDuration);

    // New step?
    if (currentStep !== this.showStep && currentStep < SEQUENCE_LENGTH) {
      // Dim previous cell (trail effect)
      if (this.showStep >= 0 && this.showStep < this.sequence.length) {
        this.setCellColor(this.cells[this.sequence[this.showStep]], CELL_TRAIL);
      }
      // Dim the cell before previous (fully idle)
      if (this.showStep >= 1) {
        this.setCellColor(this.cells[this.sequence[this.showStep - 1]], CELL_IDLE);
      }

      this.showStep = currentStep;

      // Light up current cell
      this.setCellColor(this.cells[this.sequence[this.showStep]], CELL_ACTIVE);
      this.setObjScale(this.cells[this.sequence[this.showStep]], 1.1, 1.1, 1);

      // Update progress dot
      if (this.showStep < this.progressDots.length) {
        this.setDotColor(this.progressDots[this.showStep], DOT_WATCHING);
      }
    }

    // Within a step: shrink cell back to normal after initial pop
    if (this.showStep >= 0 && this.showStep < this.sequence.length) {
      const withinStep = this.showTimer - (this.showStep * stepDuration);
      if (withinStep > 0.15) {
        this.setObjScale(this.cells[this.sequence[this.showStep]], 1, 1, 1);
      }
    }

    // All steps shown? Transition to play phase
    const totalShowTime = SEQUENCE_LENGTH * stepDuration + 0.3;
    if (this.showTimer >= totalShowTime) {
      // Reset all cells to idle
      for (let i = 0; i < FLASH_GRID_SIZE; i++) {
        this.setCellColor(this.cells[i], CELL_IDLE);
        this.setObjScale(this.cells[i], 1, 1, 1);
      }

      // Reset progress dots for play phase
      for (let i = 0; i < SEQUENCE_LENGTH; i++) {
        this.setDotColor(this.progressDots[i], DOT_INACTIVE);
      }
      // Highlight first dot
      if (this.progressDots.length > 0) {
        this.setDotColor(this.progressDots[0], DOT_CURRENT);
      }

      this.setHeaderText('YOUR TURN!');
      this.phase = FlashPhase.PLAYING;
      this.playTimer = 0;
    }
  }

  /**
   * PLAYING: Player taps cells, timer counting down
   */
  private updatePlaying(dt: number): void {
    this.playTimer += dt;

    // Update timer bar
    const progress = 1.0 - (this.playTimer / PLAY_TIMEOUT);
    this.updateTimerBar(Math.max(0, progress));

    // Red timer in last 1.5s
    if (this.playTimer >= PLAY_TIMEOUT - 1.5) {
      this.setTimerBarColor(FLASH_TIMER_RED);
    }

    // Timeout
    if (this.playTimer >= PLAY_TIMEOUT) {
      this.handleFailure();
    }
  }

  /**
   * RESULT: Show success/failure, then report to GameController
   */
  private updateResult(dt: number): void {
    this.resultTimer += dt;

    // Animate checkmark/X: scale up with overshoot
    if (this.resultTimer < 0.3) {
      const progress = this.resultTimer / 0.3;
      const scale = this.easeOutBack(progress);
      if (this.resultPassed) {
        this.setObjScale(this.checkmarkIcon, scale, scale, 1);
      } else {
        this.setObjScale(this.crossIcon, scale, scale, 1);
      }
    }

    // Fade out feedback overlay
    if (this.resultTimer > 0.5 && this.resultTimer < 1.0) {
      const fadeProgress = (this.resultTimer - 0.5) / 0.5;
      this.setImageOpacity(this.feedbackOverlay, Math.max(0, 0.25 * (1 - fadeProgress)));
    }

    // After 1.5s, report to GameController
    if (this.resultTimer >= 1.5) {
      this.phase = FlashPhase.INACTIVE;
      if (globalThis.axonFilter.onGameComplete) {
        globalThis.axonFilter.onGameComplete(this.resultPoints, this.resultPassed);
      }
    }
  }

  // ================================================================
  // UTILITY: SHARED UI
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

  private setCellColor(obj: APJS.SceneObject | null, color: APJS.Color): void {
    if (!obj) return;
    const img = obj.getComponent('Image') as APJS.Image;
    if (img) img.color = color;
  }

  private setDotColor(obj: APJS.SceneObject | null, color: APJS.Color): void {
    if (!obj) return;
    const img = obj.getComponent('Image') as APJS.Image;
    if (img) img.color = color;
  }

  private setObjScale(obj: APJS.SceneObject | null, x: number, y: number, z: number): void {
    if (!obj) return;
    obj.getTransform().setLocalScale(new APJS.Vector3f(x, y, z));
  }

  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
}
