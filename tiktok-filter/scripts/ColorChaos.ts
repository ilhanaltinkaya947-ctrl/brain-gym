/**
 * ColorChaos.ts — Mini-Game 3: Stroop Color Test
 *
 * Mechanic:
 * - 3 rapid rounds, 2 seconds each
 * - A color word displayed in a DIFFERENT ink color (Stroop effect)
 * - Example: "BLUE" written in red ink -> correct answer is RED
 * - 3 color buttons at bottom — tap the INK COLOR
 * - 75pts per correct round (max 225pts)
 *
 * Effect House Setup:
 * - Attach this script component to "ColorChaosContainer" SceneObject
 * - Create "StroopWord" Text SceneObject (large, centered)
 * - Create 3 button SceneObjects: "colorBtn_0", "colorBtn_1", "colorBtn_2"
 *   each with an Image component (rounded rectangle)
 * - Create "roundIndicator_0", "roundIndicator_1", "roundIndicator_2"
 * - Touch is handled globally — buttons are hit-tested by screen position
 *
 * Communication:
 * - GameController calls globalThis.axonFilter.startColorChaos()
 * - This script calls globalThis.axonFilter.onGameComplete(points, passed)
 */

declare var globalThis: any;

// ============================================================
// COLOR DEFINITIONS
// ============================================================

interface GameColor {
  name: string;
  color: APJS.Color;
}

const GAME_COLORS: GameColor[] = [
  { name: 'RED',    color: new APJS.Color(1.0, 0.2, 0.2, 1.0) },
  { name: 'BLUE',   color: new APJS.Color(0.2, 0.4, 1.0, 1.0) },
  { name: 'GREEN',  color: new APJS.Color(0.0, 0.8, 0.3, 1.0) },
  { name: 'YELLOW', color: new APJS.Color(1.0, 0.85, 0.0, 1.0) },
];

// ============================================================
// CONSTANTS
// ============================================================

const TOTAL_ROUNDS = 3;
const ROUND_DURATION = 2.0;
const FEEDBACK_DURATION = 0.4;
const POINTS_PER_CORRECT = 75;

const COLOR_GOLD = new APJS.Color(1.0, 0.84, 0.0, 1.0);
const COLOR_GREEN_DOT = new APJS.Color(0.0, 0.85, 0.35, 1.0);
const COLOR_RED_DOT = new APJS.Color(1.0, 0.2, 0.2, 1.0);
const COLOR_CYAN_DOT = new APJS.Color(0.0, 0.83, 1.0, 1.0);
const COLOR_DIM_DOT = new APJS.Color(1.0, 1.0, 1.0, 0.2);
const COLOR_GREEN_FLASH = new APJS.Color(0.0, 0.85, 0.35, 0.2);
const COLOR_RED_FLASH = new APJS.Color(1.0, 0.2, 0.2, 0.2);
const COLOR_TIMER_RED = new APJS.Color(1.0, 0.2, 0.2, 1.0);
const COLOR_TIMER_CYAN = new APJS.Color(0.0, 0.83, 1.0, 1.0);

// Button hit regions in normalized screen coordinates
// 3 buttons arranged horizontally at bottom of game area
// Adjust these to match your Effect House scene layout
const BTN_TOP = 0.72;
const BTN_BOTTOM = 0.82;
const BTN_REGIONS = [
  { left: 0.08, right: 0.34 },  // Button 0 (left)
  { left: 0.37, right: 0.63 },  // Button 1 (center)
  { left: 0.66, right: 0.92 },  // Button 2 (right)
];

// ============================================================
// INTERNAL PHASE ENUM
// ============================================================

const enum ColorPhase {
  INACTIVE = 0,
  PLAYING = 1,
  FEEDBACK = 2,
  DONE = 3,
}

// ============================================================
// SCRIPT COMPONENT
// ============================================================

@component()
export class ColorChaos extends APJS.BasicScriptComponent {

  // Scene object references
  private stroopWord: APJS.SceneObject | null = null;
  private colorButtons: (APJS.SceneObject | null)[] = [];
  private roundIndicators: (APJS.SceneObject | null)[] = [];
  private feedbackOverlay: APJS.SceneObject | null = null;
  private feedbackText: APJS.SceneObject | null = null;

  // State
  private phase: ColorPhase = ColorPhase.INACTIVE;
  private currentRound: number = 0;
  private roundTimer: number = 0;
  private feedbackTimer: number = 0;
  private totalPoints: number = 0;
  private roundsCorrect: number = 0;
  private hasAnsweredThisRound: boolean = false;

  // Current round data
  private wordColorIndex: number = -1;
  private inkColorIndex: number = -1;
  private buttonColorIndices: number[] = [];

  // Completion delay
  private pendingFinish: boolean = false;
  private finishTimer: number = 0;

  // ================================================================
  // LIFECYCLE
  // ================================================================

  onStart(): void {
    // Find scene objects
    this.stroopWord = this.scene.findSceneObject('StroopWord');

    for (let i = 0; i < 3; i++) {
      this.colorButtons.push(this.scene.findSceneObject(`colorBtn_${i}`));
    }

    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      this.roundIndicators.push(this.scene.findSceneObject(`roundIndicator_${i}`));
    }

    this.feedbackOverlay = this.scene.findSceneObject('ColorFeedback');
    this.feedbackText = this.scene.findSceneObject('ColorFeedbackText');

    // Register start function on global
    globalThis.axonFilter.startColorChaos = () => {
      this.startGame();
    };
  }

  onUpdate(deltaTime: number): void {
    switch (this.phase) {
      case ColorPhase.PLAYING:
        this.updatePlaying(deltaTime);
        break;
      case ColorPhase.FEEDBACK:
        this.updateFeedback(deltaTime);
        break;
      case ColorPhase.DONE:
        this.updateDone(deltaTime);
        break;
    }
  }

  /**
   * Handle global touch events — determine which button was tapped
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
    this.currentRound = 0;
    this.totalPoints = 0;
    this.roundsCorrect = 0;
    this.pendingFinish = false;

    this.setHeaderText('TAP THE INK COLOR');

    // Reset round indicators
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      this.setDotColor(this.roundIndicators[i], COLOR_DIM_DOT);
      this.setVisible(this.roundIndicators[i], true);
    }

    // Hide feedback elements
    this.setVisible(this.feedbackOverlay, false);
    this.setVisible(this.feedbackText, false);

    // Start first round
    this.startRound();
  }

  private startRound(): void {
    this.phase = ColorPhase.PLAYING;
    this.roundTimer = 0;
    this.hasAnsweredThisRound = false;

    // Generate Stroop conflict:
    // Pick a word (text content) and a DIFFERENT ink color
    this.wordColorIndex = Math.floor(Math.random() * GAME_COLORS.length);
    do {
      this.inkColorIndex = Math.floor(Math.random() * GAME_COLORS.length);
    } while (this.inkColorIndex === this.wordColorIndex);

    // Set up the word display
    if (this.stroopWord) {
      const text = this.stroopWord.getComponent('Text') as APJS.Text;
      if (text) {
        // The TEXT says one color name...
        text.text = GAME_COLORS[this.wordColorIndex].name;
        // ...but the INK is a different color
        text.color = GAME_COLORS[this.inkColorIndex].color;
      }
    }
    this.setVisible(this.stroopWord, true);
    this.setObjScale(this.stroopWord, 0.8, 0.8, 1); // Start small for pop-in

    // Set up 3 buttons:
    // - One must be the INK color (correct answer)
    // - One must be the WORD color (the trap/decoy)
    // - One is a random other color
    this.buttonColorIndices = this.generateButtonColors(this.inkColorIndex, this.wordColorIndex);
    this.shuffleArray(this.buttonColorIndices);

    for (let i = 0; i < 3; i++) {
      const colorIdx = this.buttonColorIndices[i];
      this.setButtonColor(this.colorButtons[i], GAME_COLORS[colorIdx].color);
      this.setVisible(this.colorButtons[i], true);
      this.setObjScale(this.colorButtons[i], 1, 1, 1);
    }

    // Highlight current round indicator
    if (this.currentRound < this.roundIndicators.length) {
      this.setDotColor(this.roundIndicators[this.currentRound], COLOR_CYAN_DOT);
    }

    // Update timer bar
    this.updateTimerBar(1.0);
    this.setTimerBarColor(COLOR_TIMER_CYAN);
  }

  private generateButtonColors(correctIndex: number, trapIndex: number): number[] {
    const indices = [correctIndex, trapIndex];

    // Find a third color that's neither correct nor trap
    const others: number[] = [];
    for (let i = 0; i < GAME_COLORS.length; i++) {
      if (i !== correctIndex && i !== trapIndex) others.push(i);
    }
    indices.push(others[Math.floor(Math.random() * others.length)]);

    return indices;
  }

  private handleTouch(pos: APJS.Vector2f): void {
    if (this.phase !== ColorPhase.PLAYING || this.hasAnsweredThisRound) return;

    const nx = pos.x;
    const ny = pos.y;

    // Check if within any button region
    if (ny < BTN_TOP || ny > BTN_BOTTOM) return;

    for (let i = 0; i < BTN_REGIONS.length; i++) {
      if (nx >= BTN_REGIONS[i].left && nx <= BTN_REGIONS[i].right) {
        this.handleButtonTap(i);
        return;
      }
    }
  }

  private handleButtonTap(buttonIndex: number): void {
    if (this.phase !== ColorPhase.PLAYING || this.hasAnsweredThisRound) return;
    this.hasAnsweredThisRound = true;

    const tappedColorIndex = this.buttonColorIndices[buttonIndex];
    const isCorrect = (tappedColorIndex === this.inkColorIndex);

    if (isCorrect) {
      this.totalPoints += POINTS_PER_CORRECT;
      this.roundsCorrect++;

      // Visual feedback: pulse button gold
      this.setButtonColor(this.colorButtons[buttonIndex], COLOR_GOLD);
      this.setObjScale(this.colorButtons[buttonIndex], 1.15, 1.15, 1);

      this.showFeedback(true);

      // Mark round indicator green
      if (this.currentRound < this.roundIndicators.length) {
        this.setDotColor(this.roundIndicators[this.currentRound], COLOR_GREEN_DOT);
      }
    } else {
      // Dim wrong button, highlight correct one
      this.setObjScale(this.colorButtons[buttonIndex], 0.85, 0.85, 1);

      // Find and highlight the correct button
      for (let i = 0; i < this.buttonColorIndices.length; i++) {
        if (this.buttonColorIndices[i] === this.inkColorIndex) {
          this.setButtonColor(this.colorButtons[i], COLOR_GOLD);
          this.setObjScale(this.colorButtons[i], 1.1, 1.1, 1);
        }
      }

      this.showFeedback(false);

      // Mark round indicator red
      if (this.currentRound < this.roundIndicators.length) {
        this.setDotColor(this.roundIndicators[this.currentRound], COLOR_RED_DOT);
      }
    }

    // Transition to feedback phase
    this.phase = ColorPhase.FEEDBACK;
    this.feedbackTimer = 0;
  }

  private handleRoundTimeout(): void {
    if (this.hasAnsweredThisRound) return;
    this.hasAnsweredThisRound = true;

    this.showFeedback(false);

    // Mark round indicator red
    if (this.currentRound < this.roundIndicators.length) {
      this.setDotColor(this.roundIndicators[this.currentRound], COLOR_RED_DOT);
    }

    // Highlight correct button
    for (let i = 0; i < this.buttonColorIndices.length; i++) {
      if (this.buttonColorIndices[i] === this.inkColorIndex) {
        this.setButtonColor(this.colorButtons[i], COLOR_GOLD);
        this.setObjScale(this.colorButtons[i], 1.1, 1.1, 1);
      }
    }

    this.phase = ColorPhase.FEEDBACK;
    this.feedbackTimer = 0;
  }

  private showFeedback(correct: boolean): void {
    this.setVisible(this.feedbackOverlay, true);
    if (correct) {
      this.setOverlayColor(this.feedbackOverlay, COLOR_GREEN_FLASH);
    } else {
      this.setOverlayColor(this.feedbackOverlay, COLOR_RED_FLASH);
    }
    this.setImageOpacity(this.feedbackOverlay, 0.2);

    // Show feedback text
    this.setVisible(this.feedbackText, true);
    if (this.feedbackText) {
      const text = this.feedbackText.getComponent('Text') as APJS.Text;
      if (text) {
        text.text = correct ? 'NICE!' : 'NOPE';
        text.color = correct ? COLOR_GREEN_DOT : COLOR_RED_DOT;
      }
    }
    this.setObjScale(this.feedbackText, 0.5, 0.5, 1);
  }

  private advanceRound(): void {
    this.currentRound++;
    if (this.currentRound >= TOTAL_ROUNDS) {
      this.finishGame();
    } else {
      this.startRound();
    }
  }

  private finishGame(): void {
    this.phase = ColorPhase.DONE;
    this.pendingFinish = true;
    this.finishTimer = 0;

    // Hide game elements
    this.setVisible(this.stroopWord, false);
    for (let i = 0; i < this.colorButtons.length; i++) {
      this.setVisible(this.colorButtons[i], false);
    }
  }

  // ================================================================
  // UPDATE PHASES
  // ================================================================

  private updatePlaying(dt: number): void {
    this.roundTimer += dt;

    // Pop-in animation for word (first 0.15s)
    if (this.roundTimer < 0.15) {
      const progress = this.roundTimer / 0.15;
      const scale = 0.8 + 0.2 * this.easeOutBack(progress);
      this.setObjScale(this.stroopWord, scale, scale, 1);
    } else {
      this.setObjScale(this.stroopWord, 1, 1, 1);
    }

    // Update timer bar
    const progress = 1.0 - (this.roundTimer / ROUND_DURATION);
    this.updateTimerBar(Math.max(0, progress));

    // Red timer in last 0.5s
    if (this.roundTimer >= ROUND_DURATION - 0.5) {
      this.setTimerBarColor(COLOR_TIMER_RED);
    }

    // Timeout
    if (this.roundTimer >= ROUND_DURATION) {
      this.handleRoundTimeout();
    }
  }

  private updateFeedback(dt: number): void {
    this.feedbackTimer += dt;

    // Feedback text pop-in (first 0.15s)
    if (this.feedbackTimer < 0.15) {
      const progress = this.feedbackTimer / 0.15;
      const scale = this.easeOutBack(progress);
      this.setObjScale(this.feedbackText, scale, scale, 1);
    }

    // Fade out feedback overlay
    if (this.feedbackTimer > 0.2) {
      const fadeProgress = (this.feedbackTimer - 0.2) / 0.2;
      this.setImageOpacity(this.feedbackOverlay, Math.max(0, 0.2 * (1 - fadeProgress)));
      this.setTextOpacity(this.feedbackText, Math.max(0, 1.0 - fadeProgress));
    }

    // Advance to next round after feedback duration
    if (this.feedbackTimer >= FEEDBACK_DURATION) {
      this.setVisible(this.feedbackOverlay, false);
      this.setVisible(this.feedbackText, false);
      this.advanceRound();
    }
  }

  private updateDone(dt: number): void {
    if (!this.pendingFinish) return;

    this.finishTimer += dt;
    if (this.finishTimer >= 0.5) {
      this.pendingFinish = false;
      if (globalThis.axonFilter.onGameComplete) {
        const passed = this.roundsCorrect >= 2; // Pass if 2+ out of 3 correct
        globalThis.axonFilter.onGameComplete(this.totalPoints, passed);
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

  private setTextOpacity(obj: APJS.SceneObject | null, alpha: number): void {
    if (!obj) return;
    const text = obj.getComponent('Text') as APJS.Text;
    if (text) text.opacity = alpha;
  }

  private setButtonColor(obj: APJS.SceneObject | null, color: APJS.Color): void {
    if (!obj) return;
    const img = obj.getComponent('Image') as APJS.Image;
    if (img) img.color = color;
  }

  private setOverlayColor(obj: APJS.SceneObject | null, color: APJS.Color): void {
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

  private shuffleArray(arr: number[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
  }

  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
}
