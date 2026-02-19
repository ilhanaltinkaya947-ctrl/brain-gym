/**
 * GameController.js — Main Game Loop for AXON Brain TikTok Filter
 *
 * This is the central orchestrator. It manages:
 * - 3-2-1-GO countdown
 * - Cycling through 3 mini-games in sequence
 * - Global score tracking
 * - Transitions between phases
 * - Final results screen with CTA
 *
 * Effect House Setup:
 * - Attach this script to an empty SceneObject called "GameController"
 * - Bind all UI references in the Inspector panel (see @input annotations)
 *
 * Architecture:
 * - GameController owns the state machine and score
 * - Each MiniGame script exposes start(), cleanup(), and calls onComplete(points)
 * - GameController listens for onComplete and advances to next phase
 */

// ============================================================
// SCENE OBJECT BINDINGS — Connect these in Effect House Inspector
// ============================================================

// @input SceneObject countdownContainer    — Parent of countdown UI elements
// @input SceneObject countdownText         — Text component showing 3, 2, 1, GO!
// @input SceneObject transitionFlash       — Full-screen white rectangle for flash transitions
// @input SceneObject gameLabelText         — Text showing current game name during transition
// @input SceneObject resultsContainer      — Parent of all results screen elements
// @input SceneObject scoreText             — Text showing final score number
// @input SceneObject reactiveMessageText   — Text showing reactive message
// @input SceneObject breakdown1Icon        — Game 1 result indicator (checkmark/X)
// @input SceneObject breakdown2Icon        — Game 2 result indicator
// @input SceneObject breakdown3Icon        — Game 3 result indicator
// @input SceneObject ctaContainer          — "AXON BRAIN" + App Store CTA
// @input SceneObject overlayBackground     — Semi-transparent dark overlay behind games
// @input SceneObject headerText            — Instruction text above game area
// @input SceneObject timerBar              — Timer bar visual (scale X from 1 to 0)
// @input SceneObject timerBarFill          — Inner fill of timer bar

// @input SceneObject patternHunterContainer — Parent of Pattern Hunter game elements
// @input SceneObject flashSequenceContainer — Parent of Flash Sequence game elements
// @input SceneObject colorChaosContainer    — Parent of Color Chaos game elements

// ============================================================
// IMPORTS — Mini-game modules
// ============================================================

// In Effect House, each script is attached to its own SceneObject.
// Communication happens via the global `script` scope or custom events.
// We use a global registry pattern for inter-script communication.

// Global game state accessible by mini-game scripts
if (!global.AxonFilter) {
  global.AxonFilter = {
    score: 0,
    gameResults: [null, null, null], // true = passed, false = failed, null = not played
    currentGame: -1,
    onGameComplete: null, // callback set by GameController
    headerText: null,     // reference for mini-games to update header
    timerBar: null,       // reference for mini-games to update timer
    timerBarFill: null,
  };
}

// ============================================================
// CONSTANTS
// ============================================================

const PHASE = {
  IDLE: 'idle',
  COUNTDOWN: 'countdown',
  TRANSITION: 'transition',
  GAME_1: 'game_pattern_hunter',
  GAME_2: 'game_flash_sequence',
  GAME_3: 'game_color_chaos',
  RESULTS: 'results',
};

// Timeline durations (seconds)
const COUNTDOWN_DURATION = 3.0;
const TRANSITION_DURATION = 0.3;
const GAME_LABEL_DURATION = 0.5;
const GAME_1_DURATION = 7.0;
const GAME_2_DURATION = 7.0;
const GAME_3_DURATION = 6.0;
const RESULTS_DURATION = 5.8;
const SCORE_ROLLUP_DURATION = 1.2;

// Colors (as [r, g, b, a] normalized 0-1 for Effect House)
const COLORS = {
  CYAN:    [0.0, 0.83, 1.0, 1.0],   // #00D4FF
  MAGENTA: [1.0, 0.0, 1.0, 1.0],    // #FF00FF
  GOLD:    [1.0, 0.84, 0.0, 1.0],    // #FFD700
  GREEN:   [0.0, 0.85, 0.35, 1.0],   // #00D959
  RED:     [1.0, 0.2, 0.2, 1.0],     // #FF3333
  WHITE:   [1.0, 1.0, 1.0, 1.0],
  BLACK_70: [0.04, 0.04, 0.06, 0.7], // overlay
};

// Game labels shown during transitions
const GAME_LABELS = ['PATTERN HUNTER', 'FLASH SEQUENCE', 'COLOR CHAOS'];

// ============================================================
// STATE
// ============================================================

var currentPhase = PHASE.IDLE;
var phaseTimer = 0;
var countdownNumber = 3;
var targetScore = 0;     // For score rollup animation
var displayedScore = 0;  // Currently shown score (animates toward targetScore)
var resultsPhaseTime = 0;
var gameCompleteReceived = false;

// ============================================================
// INITIALIZATION
// ============================================================

function init() {
  // Share references with mini-games via global
  global.AxonFilter.headerText = script.headerText;
  global.AxonFilter.timerBar = script.timerBar;
  global.AxonFilter.timerBarFill = script.timerBarFill;

  // Set up the completion callback
  global.AxonFilter.onGameComplete = function (points, passed) {
    handleGameComplete(points, passed);
  };

  // Hide everything initially
  hideAll();

  // Start the countdown after a brief delay (let camera initialize)
  var startDelay = script.createEvent('DelayedCallbackEvent');
  startDelay.bind(function () {
    startCountdown();
  });
  startDelay.reset(0.5);
}

function hideAll() {
  setVisible(script.countdownContainer, false);
  setVisible(script.transitionFlash, false);
  setVisible(script.gameLabelText, false);
  setVisible(script.resultsContainer, false);
  setVisible(script.patternHunterContainer, false);
  setVisible(script.flashSequenceContainer, false);
  setVisible(script.colorChaosContainer, false);
  setVisible(script.overlayBackground, false);
  setVisible(script.headerText, false);
  setVisible(script.timerBar, false);
  setVisible(script.ctaContainer, false);
  setVisible(script.breakdown1Icon, false);
  setVisible(script.breakdown2Icon, false);
  setVisible(script.breakdown3Icon, false);
}

// ============================================================
// PHASE: COUNTDOWN (3, 2, 1, GO!)
// ============================================================

function startCountdown() {
  currentPhase = PHASE.COUNTDOWN;
  phaseTimer = 0;
  countdownNumber = 3;

  // Show overlay + countdown container
  setVisible(script.overlayBackground, true);
  setAlpha(script.overlayBackground, 0.4);
  setVisible(script.countdownContainer, true);

  // Show initial "3"
  updateCountdownDisplay(3);
}

function updateCountdown(dt) {
  phaseTimer += dt;

  var newNumber;
  if (phaseTimer < 1.0) {
    newNumber = 3;
  } else if (phaseTimer < 2.0) {
    newNumber = 2;
  } else if (phaseTimer < 3.0) {
    newNumber = 1;
  } else {
    // Show "GO!" briefly then transition to first game
    if (countdownNumber !== 0) {
      countdownNumber = 0;
      updateCountdownDisplay(0); // 0 = "GO!"
    }
    if (phaseTimer >= 3.5) {
      setVisible(script.countdownContainer, false);
      startTransition(0); // Transition to game 1
    }
    return;
  }

  // Update display only when number changes
  if (newNumber !== countdownNumber) {
    countdownNumber = newNumber;
    updateCountdownDisplay(countdownNumber);
  }

  // Pop animation: scale based on time within each second
  var withinSecond = phaseTimer % 1.0;
  var scale = easeOutBack(Math.min(withinSecond / 0.3, 1.0));
  setScale(script.countdownText, scale, scale, 1);
}

function updateCountdownDisplay(num) {
  var textComp = script.countdownText.getComponent('Component.Text');
  if (!textComp) return;

  if (num === 0) {
    textComp.text = 'GO!';
    setTextColor(script.countdownText, COLORS.GREEN);
  } else {
    textComp.text = String(num);
    // Color: 3=cyan, 2=gold, 1=red
    var color = num === 3 ? COLORS.CYAN : num === 2 ? COLORS.GOLD : COLORS.RED;
    setTextColor(script.countdownText, color);
  }
}

// ============================================================
// PHASE: TRANSITIONS (white flash between games)
// ============================================================

function startTransition(gameIndex) {
  currentPhase = PHASE.TRANSITION;
  phaseTimer = 0;
  global.AxonFilter.currentGame = gameIndex;
  gameCompleteReceived = false;

  // Show flash
  setVisible(script.transitionFlash, true);
  setAlpha(script.transitionFlash, 0);

  // Show game label
  setVisible(script.gameLabelText, true);
  var labelComp = script.gameLabelText.getComponent('Component.Text');
  if (labelComp && gameIndex < GAME_LABELS.length) {
    labelComp.text = GAME_LABELS[gameIndex];
  }
  setAlpha(script.gameLabelText, 0);
}

function updateTransition(dt) {
  phaseTimer += dt;

  // Flash: quick white burst
  var flashProgress = phaseTimer / TRANSITION_DURATION;
  if (flashProgress <= 0.5) {
    // Fade in
    setAlpha(script.transitionFlash, flashProgress * 2 * 0.8);
  } else if (flashProgress <= 1.0) {
    // Fade out
    setAlpha(script.transitionFlash, (1.0 - flashProgress) * 2 * 0.8);
  } else {
    setVisible(script.transitionFlash, false);
  }

  // Game label: fade in, hold, fade out
  if (phaseTimer < 0.1) {
    setAlpha(script.gameLabelText, phaseTimer / 0.1);
  } else if (phaseTimer < GAME_LABEL_DURATION - 0.15) {
    setAlpha(script.gameLabelText, 1.0);
  } else if (phaseTimer < GAME_LABEL_DURATION) {
    setAlpha(script.gameLabelText, (GAME_LABEL_DURATION - phaseTimer) / 0.15);
  }

  // After label duration, start the actual game
  if (phaseTimer >= GAME_LABEL_DURATION) {
    setVisible(script.gameLabelText, false);
    startGame(global.AxonFilter.currentGame);
  }
}

// ============================================================
// PHASE: GAMES — Start/manage each mini-game
// ============================================================

function startGame(gameIndex) {
  // Set overlay for game area
  setVisible(script.overlayBackground, true);
  setAlpha(script.overlayBackground, 0.6);
  setVisible(script.headerText, true);
  setVisible(script.timerBar, true);

  switch (gameIndex) {
    case 0:
      currentPhase = PHASE.GAME_1;
      setVisible(script.patternHunterContainer, true);
      // The PatternHunter.js script auto-starts when its container becomes visible
      // It reads global.AxonFilter and calls onGameComplete when done
      if (global.AxonFilter.startPatternHunter) {
        global.AxonFilter.startPatternHunter();
      }
      break;

    case 1:
      currentPhase = PHASE.GAME_2;
      setVisible(script.flashSequenceContainer, true);
      if (global.AxonFilter.startFlashSequence) {
        global.AxonFilter.startFlashSequence();
      }
      break;

    case 2:
      currentPhase = PHASE.GAME_3;
      setVisible(script.colorChaosContainer, true);
      if (global.AxonFilter.startColorChaos) {
        global.AxonFilter.startColorChaos();
      }
      break;
  }
}

/**
 * Called by mini-game scripts when they finish.
 * @param {number} points — Points earned (0 if failed)
 * @param {boolean} passed — Whether the player succeeded
 */
function handleGameComplete(points, passed) {
  if (gameCompleteReceived) return; // Prevent double-fire
  gameCompleteReceived = true;

  var gameIndex = global.AxonFilter.currentGame;

  // Update global score
  global.AxonFilter.score += points;
  global.AxonFilter.gameResults[gameIndex] = passed;

  // Hide current game container
  setVisible(script.patternHunterContainer, false);
  setVisible(script.flashSequenceContainer, false);
  setVisible(script.colorChaosContainer, false);
  setVisible(script.headerText, false);
  setVisible(script.timerBar, false);

  // Advance to next game or results
  var nextGame = gameIndex + 1;
  if (nextGame < 3) {
    startTransition(nextGame);
  } else {
    startResults();
  }
}

// ============================================================
// PHASE: RESULTS SCREEN
// ============================================================

function startResults() {
  currentPhase = PHASE.RESULTS;
  resultsPhaseTime = 0;
  targetScore = global.AxonFilter.score;
  displayedScore = 0;

  // Dark overlay
  setVisible(script.overlayBackground, true);
  setAlpha(script.overlayBackground, 0.8);

  // Show results container
  setVisible(script.resultsContainer, true);
  setAlpha(script.resultsContainer, 0);

  // Set score text to "0" initially
  var scoreComp = script.scoreText.getComponent('Component.Text');
  if (scoreComp) scoreComp.text = '0';

  // Set reactive message based on score
  var msgComp = script.reactiveMessageText.getComponent('Component.Text');
  if (msgComp) {
    if (targetScore >= 275) {
      msgComp.text = "You're a GENIUS!";
      setTextColor(script.reactiveMessageText, COLORS.GOLD);
    } else if (targetScore >= 150) {
      msgComp.text = 'Not bad... can you do better?';
      setTextColor(script.reactiveMessageText, COLORS.CYAN);
    } else {
      msgComp.text = 'Think you can beat this?';
      setTextColor(script.reactiveMessageText, COLORS.WHITE);
    }
  }
  // Hide sub-elements initially (they fade in at staggered times)
  setAlpha(script.reactiveMessageText, 0);
  setAlpha(script.breakdown1Icon, 0);
  setAlpha(script.breakdown2Icon, 0);
  setAlpha(script.breakdown3Icon, 0);
  setAlpha(script.ctaContainer, 0);
}

function updateResults(dt) {
  resultsPhaseTime += dt;

  // Phase 1: Fade in results container (0 - 0.3s)
  if (resultsPhaseTime < 0.3) {
    setAlpha(script.resultsContainer, resultsPhaseTime / 0.3);
  } else {
    setAlpha(script.resultsContainer, 1.0);
  }

  // Phase 2: Score rollup animation (0.3s - 1.5s)
  if (resultsPhaseTime >= 0.3 && resultsPhaseTime < 0.3 + SCORE_ROLLUP_DURATION) {
    var rollProgress = (resultsPhaseTime - 0.3) / SCORE_ROLLUP_DURATION;
    rollProgress = easeOutCubic(rollProgress);
    displayedScore = Math.round(targetScore * rollProgress);
    var scoreComp = script.scoreText.getComponent('Component.Text');
    if (scoreComp) scoreComp.text = String(displayedScore);
  } else if (resultsPhaseTime >= 0.3 + SCORE_ROLLUP_DURATION) {
    // Ensure final score is exact
    var scoreComp = script.scoreText.getComponent('Component.Text');
    if (scoreComp) scoreComp.text = String(targetScore);
  }

  // Phase 3: Reactive message fade in (1.5s)
  if (resultsPhaseTime >= 1.5 && resultsPhaseTime < 2.0) {
    setAlpha(script.reactiveMessageText, (resultsPhaseTime - 1.5) / 0.5);
  } else if (resultsPhaseTime >= 2.0) {
    setAlpha(script.reactiveMessageText, 1.0);
  }

  // Phase 4: Breakdown icons pop in sequentially (2.0s, 2.2s, 2.4s)
  updateBreakdownIcon(script.breakdown1Icon, 0, resultsPhaseTime, 2.0);
  updateBreakdownIcon(script.breakdown2Icon, 1, resultsPhaseTime, 2.2);
  updateBreakdownIcon(script.breakdown3Icon, 2, resultsPhaseTime, 2.4);

  // Phase 5: CTA fade in (2.8s)
  if (resultsPhaseTime >= 2.8 && resultsPhaseTime < 3.3) {
    setVisible(script.ctaContainer, true);
    setAlpha(script.ctaContainer, (resultsPhaseTime - 2.8) / 0.5);
  } else if (resultsPhaseTime >= 3.3) {
    setAlpha(script.ctaContainer, 1.0);
  }
}

function updateBreakdownIcon(iconObj, gameIndex, time, startTime) {
  if (time >= startTime && time < startTime + 0.3) {
    setVisible(iconObj, true);
    var progress = (time - startTime) / 0.3;
    setAlpha(iconObj, progress);
    var scale = easeOutBack(progress);
    setScale(iconObj, scale, scale, 1);

    // Set icon appearance based on game result
    var result = global.AxonFilter.gameResults[gameIndex];
    var textComp = iconObj.getComponent('Component.Text');
    if (textComp) {
      textComp.text = result ? '✓' : '✗';
    }
    setTextColor(iconObj, result ? COLORS.GREEN : COLORS.RED);
  } else if (time >= startTime + 0.3) {
    setAlpha(iconObj, 1.0);
    setScale(iconObj, 1, 1, 1);
  }
}

// ============================================================
// UPDATE LOOP — Called every frame by Effect House
// ============================================================

function update(dt) {
  switch (currentPhase) {
    case PHASE.COUNTDOWN:
      updateCountdown(dt);
      break;
    case PHASE.TRANSITION:
      updateTransition(dt);
      break;
    case PHASE.RESULTS:
      updateResults(dt);
      break;
    // GAME phases are handled by their own scripts
    // GameController just waits for onGameComplete callback
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Set visibility of a SceneObject (enabled/disabled).
 */
function setVisible(obj, visible) {
  if (obj) obj.enabled = visible;
}

/**
 * Set opacity/alpha of a SceneObject's visual component.
 * Works with Image, Text, or any component that has a mainPass.
 */
function setAlpha(obj, alpha) {
  if (!obj) return;
  // Try Image component first
  var img = obj.getComponent('Component.Image');
  if (img && img.mainPass) {
    var color = img.mainPass.baseColor;
    color.a = alpha;
    img.mainPass.baseColor = color;
    return;
  }
  // Try Text component
  var txt = obj.getComponent('Component.Text');
  if (txt) {
    var color = txt.textFill.color;
    color.a = alpha;
    txt.textFill.color = color;
  }
}

/**
 * Set text color of a SceneObject with Text component.
 * @param {SceneObject} obj
 * @param {number[]} color — [r, g, b, a] normalized
 */
function setTextColor(obj, color) {
  if (!obj) return;
  var txt = obj.getComponent('Component.Text');
  if (txt) {
    txt.textFill.color = new vec4(color[0], color[1], color[2], color[3]);
  }
}

/**
 * Set local scale of a SceneObject.
 */
function setScale(obj, x, y, z) {
  if (!obj) return;
  var transform = obj.getTransform();
  transform.setLocalScale(new vec3(x, y, z));
}

/**
 * Easing: cubic ease-out (decelerating)
 */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Easing: overshoot bounce (for pop effects)
 */
function easeOutBack(t) {
  var c1 = 1.70158;
  var c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ============================================================
// EFFECT HOUSE LIFECYCLE HOOKS
// ============================================================

// Called once when the effect starts
var initEvent = script.createEvent('TurnOnEvent');
initEvent.bind(init);

// Called every frame
var updateEvent = script.createEvent('UpdateEvent');
updateEvent.bind(function (eventData) {
  update(eventData.getDeltaTime());
});
