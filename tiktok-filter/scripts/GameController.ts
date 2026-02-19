/**
 * GameController.ts — Main Game Loop for AXON Brain TikTok Filter
 *
 * Central orchestrator managing:
 * - 3-2-1-GO countdown
 * - Cycling through 3 mini-games in sequence
 * - Global score tracking
 * - White flash transitions between games
 * - Final results screen with score rollup animation and CTA
 *
 * Effect House Setup:
 * - Attach this script component to an empty SceneObject called "GameController"
 * - All child scene objects are found by name via findSceneObject
 *
 * Architecture:
 * - GameController owns the state machine and score
 * - Each MiniGame script exposes start via globalThis.axonFilter
 * - MiniGames call globalThis.axonFilter.onGameComplete(points, passed) when done
 */

// ============================================================
// GLOBAL COMMUNICATION INTERFACE
// ============================================================

declare var globalThis: any;

if (!globalThis.axonFilter) {
  globalThis.axonFilter = {
    score: 0,
    gameResults: [null, null, null] as (boolean | null)[],
    currentGame: -1,
    onGameComplete: null as ((points: number, passed: boolean) => void) | null,
    startPatternHunter: null as (() => void) | null,
    startFlashSequence: null as (() => void) | null,
    startColorChaos: null as (() => void) | null,
    // Shared scene object references for mini-games
    headerText: null as APJS.SceneObject | null,
    timerBarFill: null as APJS.SceneObject | null,
  };
}

// ============================================================
// CONSTANTS
// ============================================================

const enum Phase {
  IDLE = 0,
  COUNTDOWN = 1,
  TRANSITION = 2,
  GAME_1 = 3,
  GAME_2 = 4,
  GAME_3 = 5,
  RESULTS = 6,
}

const COUNTDOWN_TOTAL = 3.5;        // 3s numbers + 0.5s for GO!
const TRANSITION_DURATION = 0.3;
const GAME_LABEL_DURATION = 0.5;
const SCORE_ROLLUP_DURATION = 1.2;

const GAME_LABELS = ['PATTERN HUNTER', 'FLASH SEQUENCE', 'COLOR CHAOS'];

// Colors (APJS.Color uses 0-1 normalized RGBA)
const COL_CYAN    = new APJS.Color(0.0, 0.83, 1.0, 1.0);
const COL_MAGENTA = new APJS.Color(1.0, 0.0, 1.0, 1.0);
const COL_GOLD    = new APJS.Color(1.0, 0.84, 0.0, 1.0);
const COL_GREEN   = new APJS.Color(0.0, 0.85, 0.35, 1.0);
const COL_RED     = new APJS.Color(1.0, 0.2, 0.2, 1.0);
const COL_WHITE   = new APJS.Color(1.0, 1.0, 1.0, 1.0);

// ============================================================
// SCRIPT COMPONENT
// ============================================================

@component()
export class GameController extends APJS.BasicScriptComponent {

  // ---- Scene object references (resolved in onStart) ----
  private overlayBackground: APJS.SceneObject | null = null;
  private countdownText: APJS.SceneObject | null = null;
  private transitionFlash: APJS.SceneObject | null = null;
  private gameLabelText: APJS.SceneObject | null = null;
  private headerText: APJS.SceneObject | null = null;
  private timerBarFill: APJS.SceneObject | null = null;
  private patternHunterContainer: APJS.SceneObject | null = null;
  private flashSequenceContainer: APJS.SceneObject | null = null;
  private colorChaosContainer: APJS.SceneObject | null = null;
  private resultsContainer: APJS.SceneObject | null = null;
  private scoreText: APJS.SceneObject | null = null;
  private reactiveMessageText: APJS.SceneObject | null = null;
  private breakdown1Icon: APJS.SceneObject | null = null;
  private breakdown2Icon: APJS.SceneObject | null = null;
  private breakdown3Icon: APJS.SceneObject | null = null;
  private ctaContainer: APJS.SceneObject | null = null;
  private patternFeedback: APJS.SceneObject | null = null;
  private flashFeedback: APJS.SceneObject | null = null;
  private colorFeedback: APJS.SceneObject | null = null;

  // ---- State ----
  private currentPhase: Phase = Phase.IDLE;
  private phaseTimer: number = 0;
  private countdownNumber: number = 3;
  private targetScore: number = 0;
  private displayedScore: number = 0;
  private resultsPhaseTime: number = 0;
  private gameCompleteReceived: boolean = false;
  private startDelayTimer: number = 0;
  private startDelayDone: boolean = false;

  // ================================================================
  // LIFECYCLE
  // ================================================================

  onStart(): void {
    // Find all scene objects by name
    this.overlayBackground = this.scene.findSceneObject('OverlayBackground');
    this.countdownText = this.scene.findSceneObject('CountdownText');
    this.transitionFlash = this.scene.findSceneObject('TransitionFlash');
    this.gameLabelText = this.scene.findSceneObject('GameLabelText');
    this.headerText = this.scene.findSceneObject('HeaderText');
    this.timerBarFill = this.scene.findSceneObject('TimerBarFill');
    this.patternHunterContainer = this.scene.findSceneObject('PatternHunterContainer');
    this.flashSequenceContainer = this.scene.findSceneObject('FlashSequenceContainer');
    this.colorChaosContainer = this.scene.findSceneObject('ColorChaosContainer');
    this.resultsContainer = this.scene.findSceneObject('ResultsContainer');
    this.scoreText = this.scene.findSceneObject('ScoreText');
    this.reactiveMessageText = this.scene.findSceneObject('ReactiveMessageText');
    this.breakdown1Icon = this.scene.findSceneObject('Breakdown1Icon');
    this.breakdown2Icon = this.scene.findSceneObject('Breakdown2Icon');
    this.breakdown3Icon = this.scene.findSceneObject('Breakdown3Icon');
    this.ctaContainer = this.scene.findSceneObject('CTAContainer');

    // Share references with mini-games
    globalThis.axonFilter.headerText = this.headerText;
    globalThis.axonFilter.timerBarFill = this.timerBarFill;

    // Set up the game-complete callback
    globalThis.axonFilter.onGameComplete = (points: number, passed: boolean) => {
      this.handleGameComplete(points, passed);
    };

    // Reset global state
    globalThis.axonFilter.score = 0;
    globalThis.axonFilter.gameResults = [null, null, null];
    globalThis.axonFilter.currentGame = -1;

    // Hide everything initially
    this.hideAll();

    // We'll use a small delay in onUpdate before starting countdown
    this.startDelayTimer = 0;
    this.startDelayDone = false;
  }

  onUpdate(deltaTime: number): void {
    // Initial delay before starting countdown (let camera/scene initialize)
    if (!this.startDelayDone) {
      this.startDelayTimer += deltaTime;
      if (this.startDelayTimer >= 0.5) {
        this.startDelayDone = true;
        this.startCountdown();
      }
      return;
    }

    switch (this.currentPhase) {
      case Phase.COUNTDOWN:
        this.updateCountdown(deltaTime);
        break;
      case Phase.TRANSITION:
        this.updateTransition(deltaTime);
        break;
      case Phase.RESULTS:
        this.updateResults(deltaTime);
        break;
      // Game phases are handled by their own script components
    }
  }

  // ================================================================
  // HIDE ALL
  // ================================================================

  private hideAll(): void {
    this.setVisible(this.overlayBackground, false);
    this.setVisible(this.countdownText, false);
    this.setVisible(this.transitionFlash, false);
    this.setVisible(this.gameLabelText, false);
    this.setVisible(this.headerText, false);
    this.setVisible(this.timerBarFill, false);
    this.setVisible(this.patternHunterContainer, false);
    this.setVisible(this.flashSequenceContainer, false);
    this.setVisible(this.colorChaosContainer, false);
    this.setVisible(this.resultsContainer, false);
    this.setVisible(this.scoreText, false);
    this.setVisible(this.reactiveMessageText, false);
    this.setVisible(this.breakdown1Icon, false);
    this.setVisible(this.breakdown2Icon, false);
    this.setVisible(this.breakdown3Icon, false);
    this.setVisible(this.ctaContainer, false);
  }

  // ================================================================
  // PHASE: COUNTDOWN (3, 2, 1, GO!)
  // ================================================================

  private startCountdown(): void {
    this.currentPhase = Phase.COUNTDOWN;
    this.phaseTimer = 0;
    this.countdownNumber = 3;

    this.setVisible(this.overlayBackground, true);
    this.setImageOpacity(this.overlayBackground, 0.4);
    this.setVisible(this.countdownText, true);

    this.updateCountdownDisplay(3);
  }

  private updateCountdown(dt: number): void {
    this.phaseTimer += dt;

    let newNumber: number;
    if (this.phaseTimer < 1.0) {
      newNumber = 3;
    } else if (this.phaseTimer < 2.0) {
      newNumber = 2;
    } else if (this.phaseTimer < 3.0) {
      newNumber = 1;
    } else {
      // Show "GO!" briefly then transition to first game
      if (this.countdownNumber !== 0) {
        this.countdownNumber = 0;
        this.updateCountdownDisplay(0);
      }
      if (this.phaseTimer >= 3.5) {
        this.setVisible(this.countdownText, false);
        this.startTransition(0);
      }
      return;
    }

    // Update display only when number changes
    if (newNumber !== this.countdownNumber) {
      this.countdownNumber = newNumber;
      this.updateCountdownDisplay(this.countdownNumber);
    }

    // Pop animation: scale based on time within each second
    const withinSecond = this.phaseTimer % 1.0;
    const scale = this.easeOutBack(Math.min(withinSecond / 0.3, 1.0));
    this.setObjScale(this.countdownText, scale, scale, 1);
  }

  private updateCountdownDisplay(num: number): void {
    if (!this.countdownText) return;
    const text = this.countdownText.getComponent('Text') as APJS.Text;
    if (!text) return;

    if (num === 0) {
      text.text = 'GO!';
      text.color = COL_GREEN;
    } else {
      text.text = String(num);
      const color = num === 3 ? COL_CYAN : num === 2 ? COL_GOLD : COL_RED;
      text.color = color;
    }
  }

  // ================================================================
  // PHASE: TRANSITION (white flash + game label)
  // ================================================================

  private startTransition(gameIndex: number): void {
    this.currentPhase = Phase.TRANSITION;
    this.phaseTimer = 0;
    globalThis.axonFilter.currentGame = gameIndex;
    this.gameCompleteReceived = false;

    // Show flash (starts transparent)
    this.setVisible(this.transitionFlash, true);
    this.setImageOpacity(this.transitionFlash, 0);

    // Show game label
    this.setVisible(this.gameLabelText, true);
    if (this.gameLabelText && gameIndex < GAME_LABELS.length) {
      const text = this.gameLabelText.getComponent('Text') as APJS.Text;
      if (text) {
        text.text = GAME_LABELS[gameIndex];
      }
    }
    this.setTextOpacity(this.gameLabelText, 0);
  }

  private updateTransition(dt: number): void {
    this.phaseTimer += dt;

    // Flash: quick white burst
    const flashProgress = this.phaseTimer / TRANSITION_DURATION;
    if (flashProgress <= 0.5) {
      this.setImageOpacity(this.transitionFlash, flashProgress * 2 * 0.8);
    } else if (flashProgress <= 1.0) {
      this.setImageOpacity(this.transitionFlash, (1.0 - flashProgress) * 2 * 0.8);
    } else {
      this.setVisible(this.transitionFlash, false);
    }

    // Game label: fade in, hold, fade out
    if (this.phaseTimer < 0.1) {
      this.setTextOpacity(this.gameLabelText, this.phaseTimer / 0.1);
    } else if (this.phaseTimer < GAME_LABEL_DURATION - 0.15) {
      this.setTextOpacity(this.gameLabelText, 1.0);
    } else if (this.phaseTimer < GAME_LABEL_DURATION) {
      this.setTextOpacity(this.gameLabelText, (GAME_LABEL_DURATION - this.phaseTimer) / 0.15);
    }

    // After label duration, start the actual game
    if (this.phaseTimer >= GAME_LABEL_DURATION) {
      this.setVisible(this.gameLabelText, false);
      this.startGame(globalThis.axonFilter.currentGame);
    }
  }

  // ================================================================
  // PHASE: GAMES
  // ================================================================

  private startGame(gameIndex: number): void {
    // Show shared UI
    this.setVisible(this.overlayBackground, true);
    this.setImageOpacity(this.overlayBackground, 0.6);
    this.setVisible(this.headerText, true);
    this.setVisible(this.timerBarFill, true);

    switch (gameIndex) {
      case 0:
        this.currentPhase = Phase.GAME_1;
        this.setVisible(this.patternHunterContainer, true);
        if (globalThis.axonFilter.startPatternHunter) {
          globalThis.axonFilter.startPatternHunter();
        }
        break;
      case 1:
        this.currentPhase = Phase.GAME_2;
        this.setVisible(this.flashSequenceContainer, true);
        if (globalThis.axonFilter.startFlashSequence) {
          globalThis.axonFilter.startFlashSequence();
        }
        break;
      case 2:
        this.currentPhase = Phase.GAME_3;
        this.setVisible(this.colorChaosContainer, true);
        if (globalThis.axonFilter.startColorChaos) {
          globalThis.axonFilter.startColorChaos();
        }
        break;
    }
  }

  private handleGameComplete(points: number, passed: boolean): void {
    if (this.gameCompleteReceived) return;
    this.gameCompleteReceived = true;

    const gameIndex = globalThis.axonFilter.currentGame;

    // Update global score
    globalThis.axonFilter.score += points;
    globalThis.axonFilter.gameResults[gameIndex] = passed;

    // Hide all game containers and shared game UI
    this.setVisible(this.patternHunterContainer, false);
    this.setVisible(this.flashSequenceContainer, false);
    this.setVisible(this.colorChaosContainer, false);
    this.setVisible(this.headerText, false);
    this.setVisible(this.timerBarFill, false);

    // Advance to next game or results
    const nextGame = gameIndex + 1;
    if (nextGame < 3) {
      this.startTransition(nextGame);
    } else {
      this.startResults();
    }
  }

  // ================================================================
  // PHASE: RESULTS SCREEN
  // ================================================================

  private startResults(): void {
    this.currentPhase = Phase.RESULTS;
    this.resultsPhaseTime = 0;
    this.targetScore = globalThis.axonFilter.score;
    this.displayedScore = 0;

    // Dark overlay
    this.setVisible(this.overlayBackground, true);
    this.setImageOpacity(this.overlayBackground, 0.8);

    // Show results container (starts transparent)
    this.setVisible(this.resultsContainer, true);
    this.setVisible(this.scoreText, true);
    this.setVisible(this.reactiveMessageText, true);

    // Set score text to "0" initially
    this.setTextContent(this.scoreText, '0');

    // Set reactive message based on total score
    if (this.targetScore >= 275) {
      this.setTextContent(this.reactiveMessageText, "You're a GENIUS!");
      this.setTextColor(this.reactiveMessageText, COL_GOLD);
    } else if (this.targetScore >= 150) {
      this.setTextContent(this.reactiveMessageText, 'Not bad... can you do better?');
      this.setTextColor(this.reactiveMessageText, COL_CYAN);
    } else {
      this.setTextContent(this.reactiveMessageText, 'Think you can beat this?');
      this.setTextColor(this.reactiveMessageText, COL_WHITE);
    }

    // Hide sub-elements initially (they appear with staggered timing)
    this.setTextOpacity(this.reactiveMessageText, 0);
    this.setVisible(this.breakdown1Icon, false);
    this.setVisible(this.breakdown2Icon, false);
    this.setVisible(this.breakdown3Icon, false);
    this.setVisible(this.ctaContainer, false);
  }

  private updateResults(dt: number): void {
    this.resultsPhaseTime += dt;
    const t = this.resultsPhaseTime;

    // Phase 1: Fade in results (0 - 0.3s)
    // (container is visible, sub-elements appear over time)

    // Phase 2: Score rollup animation (0.3s - 1.5s)
    if (t >= 0.3 && t < 0.3 + SCORE_ROLLUP_DURATION) {
      let rollProgress = (t - 0.3) / SCORE_ROLLUP_DURATION;
      rollProgress = this.easeOutCubic(rollProgress);
      this.displayedScore = Math.round(this.targetScore * rollProgress);
      this.setTextContent(this.scoreText, String(this.displayedScore));
    } else if (t >= 0.3 + SCORE_ROLLUP_DURATION) {
      this.setTextContent(this.scoreText, String(this.targetScore));
    }

    // Phase 3: Reactive message fade in (1.5s - 2.0s)
    if (t >= 1.5 && t < 2.0) {
      this.setTextOpacity(this.reactiveMessageText, (t - 1.5) / 0.5);
    } else if (t >= 2.0) {
      this.setTextOpacity(this.reactiveMessageText, 1.0);
    }

    // Phase 4: Breakdown icons pop in (2.0s, 2.2s, 2.4s)
    this.updateBreakdownIcon(this.breakdown1Icon, 0, t, 2.0);
    this.updateBreakdownIcon(this.breakdown2Icon, 1, t, 2.2);
    this.updateBreakdownIcon(this.breakdown3Icon, 2, t, 2.4);

    // Phase 5: CTA fade in (2.8s)
    if (t >= 2.8 && t < 3.3) {
      this.setVisible(this.ctaContainer, true);
      this.setTextOpacity(this.ctaContainer, (t - 2.8) / 0.5);
    } else if (t >= 3.3) {
      this.setTextOpacity(this.ctaContainer, 1.0);
    }
  }

  private updateBreakdownIcon(
    iconObj: APJS.SceneObject | null,
    gameIndex: number,
    time: number,
    startTime: number,
  ): void {
    if (!iconObj) return;

    if (time >= startTime && time < startTime + 0.3) {
      this.setVisible(iconObj, true);
      const progress = (time - startTime) / 0.3;
      const scale = this.easeOutBack(progress);
      this.setObjScale(iconObj, scale, scale, 1);

      // Set icon appearance based on game result
      const result = globalThis.axonFilter.gameResults[gameIndex];
      const text = iconObj.getComponent('Text') as APJS.Text;
      if (text) {
        text.text = result ? '\u2713' : '\u2717';
        text.color = result ? COL_GREEN : COL_RED;
      }
    } else if (time >= startTime + 0.3) {
      this.setObjScale(iconObj, 1, 1, 1);
    }
  }

  // ================================================================
  // UTILITY: VISIBILITY
  // ================================================================

  private setVisible(obj: APJS.SceneObject | null, visible: boolean): void {
    if (obj) obj.enabled = visible;
  }

  // ================================================================
  // UTILITY: IMAGE OPACITY
  // ================================================================

  private setImageOpacity(obj: APJS.SceneObject | null, alpha: number): void {
    if (!obj) return;
    const img = obj.getComponent('Image') as APJS.Image;
    if (img) {
      img.opacity = alpha;
    }
  }

  // ================================================================
  // UTILITY: TEXT
  // ================================================================

  private setTextContent(obj: APJS.SceneObject | null, content: string): void {
    if (!obj) return;
    const text = obj.getComponent('Text') as APJS.Text;
    if (text) text.text = content;
  }

  private setTextColor(obj: APJS.SceneObject | null, color: APJS.Color): void {
    if (!obj) return;
    const text = obj.getComponent('Text') as APJS.Text;
    if (text) text.color = color;
  }

  private setTextOpacity(obj: APJS.SceneObject | null, alpha: number): void {
    if (!obj) return;
    const text = obj.getComponent('Text') as APJS.Text;
    if (text) text.opacity = alpha;
  }

  // ================================================================
  // UTILITY: TRANSFORM
  // ================================================================

  private setObjScale(obj: APJS.SceneObject | null, x: number, y: number, z: number): void {
    if (!obj) return;
    obj.getTransform().setLocalScale(new APJS.Vector3f(x, y, z));
  }

  // ================================================================
  // EASING
  // ================================================================

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
}
