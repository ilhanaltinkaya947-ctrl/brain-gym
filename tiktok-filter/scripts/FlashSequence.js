/**
 * FlashSequence.js — Mini-Game 2: Repeat the Sequence
 *
 * Simplified mechanic:
 * - 3x3 grid (9 cells)
 * - Watch phase: 4 cells light up one by one (700ms each)
 * - Play phase: Tap them back in the same order
 * - Any wrong tap = fail
 * - 4 second time limit for play phase
 *
 * Effect House Setup:
 * - Attach this script to the "FlashSequenceContainer" SceneObject
 * - Create 9 child SceneObjects named "flash_cell_0" through "flash_cell_8"
 *   each with an Image component (rounded square)
 * - Each cell must have a TouchComponent for tap detection
 * - Create "progressDot_0" through "progressDot_3" for sequence position dots
 * - See ui-layout.md for exact positioning
 *
 * Communication:
 * - GameController calls global.AxonFilter.startFlashSequence()
 * - This script calls global.AxonFilter.onGameComplete(points, passed) when done
 */

// @input SceneObject[] cells             — 9 grid cell SceneObjects
// @input SceneObject[] progressDots      — 4 dot SceneObjects showing sequence position
// @input SceneObject feedbackOverlay     — Full-game-area overlay for correct/wrong flash
// @input SceneObject checkmarkIcon       — Large checkmark for success
// @input SceneObject crossIcon           — Large X for failure

// ============================================================
// CONSTANTS
// ============================================================

var GRID_SIZE = 9;
var SEQUENCE_LENGTH = 4;
var FLASH_DURATION = 0.7;   // How long each cell stays lit during show phase
var FLASH_GAP = 0.1;        // Gap between flashes
var PLAY_TIMEOUT = 4.0;     // Seconds to complete the sequence
var TRAIL_OPACITY = 0.35;   // Opacity of the previously-lit cell (trail effect)

// Cell colors
var CELL_IDLE = [0.12, 0.1, 0.18, 0.8];          // Dark purple-grey
var CELL_ACTIVE = [0.0, 0.83, 1.0, 1.0];          // Neon cyan
var CELL_TRAIL = [0.0, 0.83, 1.0, 0.35];          // Dim cyan
var CELL_CORRECT_TAP = [0.0, 0.85, 0.35, 1.0];    // Green
var CELL_WRONG_TAP = [1.0, 0.2, 0.2, 1.0];        // Red
var CELL_GOLD = [1.0, 0.84, 0.0, 1.0];            // Gold (success)

var DOT_INACTIVE = [1.0, 1.0, 1.0, 0.2];
var DOT_WATCHING = [1.0, 0.84, 0.0, 1.0];          // Gold
var DOT_DONE = [0.0, 0.85, 0.35, 1.0];             // Green
var DOT_CURRENT = [0.0, 0.83, 1.0, 1.0];           // Cyan

// ============================================================
// STATE
// ============================================================

var PHASE = {
  INACTIVE: 0,
  WATCHING: 1,   // Showing sequence to player
  PLAYING: 2,    // Player tapping back
  RESULT: 3,     // Showing success/failure
};

var phase = PHASE.INACTIVE;
var sequence = [];        // Array of cell indices (0-8)
var showStep = -1;        // Current step being shown (-1 = not started)
var showTimer = 0;        // Timer within show phase
var playerIndex = 0;      // Which sequence element player needs to tap next
var playTimer = 0;        // Timer for play phase timeout
var resultTimer = 0;      // Timer for result display
var resultPoints = 0;
var resultPassed = false;

// ============================================================
// PUBLIC API
// ============================================================

global.AxonFilter.startFlashSequence = function () {
  startGame();
};

// ============================================================
// GAME LOGIC
// ============================================================

function startGame() {
  // Generate random sequence of 4 unique cells
  sequence = generateSequence(SEQUENCE_LENGTH, GRID_SIZE);
  showStep = -1;
  showTimer = 0;
  playerIndex = 0;
  playTimer = 0;
  resultTimer = 0;

  // Set header
  setHeaderText('WATCH...');

  // Reset all cells to idle
  for (var i = 0; i < script.cells.length && i < GRID_SIZE; i++) {
    setCellColor(script.cells[i], CELL_IDLE);
    setVisible(script.cells[i], true);
    setScale(script.cells[i], 1, 1, 1);
  }

  // Reset progress dots
  for (var i = 0; i < script.progressDots.length && i < SEQUENCE_LENGTH; i++) {
    setDotColor(script.progressDots[i], DOT_INACTIVE);
    setVisible(script.progressDots[i], true);
  }

  // Hide feedback elements
  setVisible(script.feedbackOverlay, false);
  setVisible(script.checkmarkIcon, false);
  setVisible(script.crossIcon, false);

  // Update timer bar to full
  updateTimerBar(1.0);

  // Start watching phase
  phase = PHASE.WATCHING;

  // Bind tap events (only active during play phase)
  bindTapEvents();
}

function generateSequence(length, gridSize) {
  var seq = [];
  var available = [];
  for (var i = 0; i < gridSize; i++) available.push(i);

  for (var i = 0; i < length; i++) {
    var randIndex = Math.floor(Math.random() * available.length);
    seq.push(available[randIndex]);
    available.splice(randIndex, 1);
  }
  return seq;
}

function bindTapEvents() {
  for (var i = 0; i < script.cells.length && i < GRID_SIZE; i++) {
    (function (index) {
      var cell = script.cells[index];
      if (!cell) return;

      var touchComp = cell.getComponent('Component.TouchComponent');
      if (touchComp) {
        touchComp.onTouchStart.add(function () {
          handleCellTap(index);
        });
      }
    })(i);
  }
}

function handleCellTap(cellIndex) {
  if (phase !== PHASE.PLAYING) return;

  var expectedCell = sequence[playerIndex];

  if (cellIndex === expectedCell) {
    // CORRECT TAP
    setCellColor(script.cells[cellIndex], CELL_CORRECT_TAP);
    setScale(script.cells[cellIndex], 1.08, 1.08, 1);

    // Update progress dot
    if (playerIndex < script.progressDots.length) {
      setDotColor(script.progressDots[playerIndex], DOT_DONE);
    }

    playerIndex++;

    // Check if sequence complete
    if (playerIndex >= SEQUENCE_LENGTH) {
      handleSuccess();
    } else {
      // Highlight next dot
      if (playerIndex < script.progressDots.length) {
        setDotColor(script.progressDots[playerIndex], DOT_CURRENT);
      }
    }
  } else {
    // WRONG TAP
    setCellColor(script.cells[cellIndex], CELL_WRONG_TAP);
    handleFailure();
  }
}

function handleSuccess() {
  phase = PHASE.RESULT;
  resultTimer = 0;
  resultPoints = 150;
  resultPassed = true;

  setHeaderText('PERFECT!');

  // Light up all sequence cells in gold
  for (var i = 0; i < sequence.length; i++) {
    setCellColor(script.cells[sequence[i]], CELL_GOLD);
  }

  // Show checkmark
  setVisible(script.checkmarkIcon, true);
  setScale(script.checkmarkIcon, 0.5, 0.5, 1);

  // Green flash
  setVisible(script.feedbackOverlay, true);
  setOverlayColor(script.feedbackOverlay, [0, 0.85, 0.35, 0.25]);
}

function handleFailure() {
  phase = PHASE.RESULT;
  resultTimer = 0;
  resultPoints = 0;
  resultPassed = false;

  setHeaderText('WRONG!');

  // Reveal correct sequence in dim cyan
  for (var i = playerIndex; i < sequence.length; i++) {
    setCellColor(script.cells[sequence[i]], CELL_TRAIL);
  }

  // Show X
  setVisible(script.crossIcon, true);
  setScale(script.crossIcon, 0.5, 0.5, 1);

  // Red flash
  setVisible(script.feedbackOverlay, true);
  setOverlayColor(script.feedbackOverlay, [1.0, 0.2, 0.2, 0.25]);
}

function handlePlayTimeout() {
  if (phase !== PHASE.PLAYING) return;
  handleFailure();
}

// ============================================================
// UPDATE LOOP
// ============================================================

function update(dt) {
  switch (phase) {
    case PHASE.WATCHING:
      updateWatching(dt);
      break;
    case PHASE.PLAYING:
      updatePlaying(dt);
      break;
    case PHASE.RESULT:
      updateResult(dt);
      break;
  }
}

/**
 * WATCHING PHASE: Show cells lighting up one by one
 */
function updateWatching(dt) {
  showTimer += dt;

  var stepDuration = FLASH_DURATION + FLASH_GAP;
  var currentStep = Math.floor(showTimer / stepDuration);

  // New step?
  if (currentStep !== showStep && currentStep < SEQUENCE_LENGTH) {
    // Dim previous cell (trail effect)
    if (showStep >= 0 && showStep < sequence.length) {
      setCellColor(script.cells[sequence[showStep]], CELL_TRAIL);
    }
    // Dim the cell before previous (fully idle)
    if (showStep >= 1) {
      setCellColor(script.cells[sequence[showStep - 1]], CELL_IDLE);
    }

    showStep = currentStep;

    // Light up current cell
    setCellColor(script.cells[sequence[showStep]], CELL_ACTIVE);
    setScale(script.cells[sequence[showStep]], 1.1, 1.1, 1);

    // Update progress dot
    if (showStep < script.progressDots.length) {
      setDotColor(script.progressDots[showStep], DOT_WATCHING);
    }
  }

  // Within a step: shrink cell back to normal after initial pop
  if (showStep >= 0 && showStep < sequence.length) {
    var withinStep = showTimer - (showStep * stepDuration);
    if (withinStep > 0.15) {
      setScale(script.cells[sequence[showStep]], 1, 1, 1);
    }
  }

  // All steps shown? Transition to play phase
  var totalShowTime = SEQUENCE_LENGTH * stepDuration + 0.3; // 300ms pause after last
  if (showTimer >= totalShowTime) {
    // Reset all cells to idle
    for (var i = 0; i < GRID_SIZE; i++) {
      setCellColor(script.cells[i], CELL_IDLE);
      setScale(script.cells[i], 1, 1, 1);
    }

    // Reset progress dots for play phase
    for (var i = 0; i < script.progressDots.length && i < SEQUENCE_LENGTH; i++) {
      setDotColor(script.progressDots[i], DOT_INACTIVE);
    }
    // Highlight first dot
    if (script.progressDots.length > 0) {
      setDotColor(script.progressDots[0], DOT_CURRENT);
    }

    setHeaderText('YOUR TURN!');
    phase = PHASE.PLAYING;
    playTimer = 0;
  }
}

/**
 * PLAYING PHASE: Player taps cells, timer counting down
 */
function updatePlaying(dt) {
  playTimer += dt;

  // Update timer bar
  var progress = 1.0 - (playTimer / PLAY_TIMEOUT);
  updateTimerBar(Math.max(0, progress));

  // Red timer in last 1.5s
  if (playTimer >= PLAY_TIMEOUT - 1.5) {
    setTimerBarColor([1.0, 0.2, 0.2, 1.0]);
  }

  // Timeout
  if (playTimer >= PLAY_TIMEOUT) {
    handlePlayTimeout();
  }
}

/**
 * RESULT PHASE: Show success/failure, then report to GameController
 */
function updateResult(dt) {
  resultTimer += dt;

  // Animate checkmark/X: scale up with overshoot
  if (resultTimer < 0.3) {
    var progress = resultTimer / 0.3;
    var scale = easeOutBack(progress);
    if (resultPassed && script.checkmarkIcon) {
      setScale(script.checkmarkIcon, scale, scale, 1);
    } else if (!resultPassed && script.crossIcon) {
      setScale(script.crossIcon, scale, scale, 1);
    }
  }

  // Fade out feedback overlay
  if (resultTimer > 0.5 && resultTimer < 1.0) {
    var fadeProgress = (resultTimer - 0.5) / 0.5;
    setAlpha(script.feedbackOverlay, Math.max(0, 0.25 * (1 - fadeProgress)));
  }

  // After 1.5s, report to GameController
  if (resultTimer >= 1.5) {
    phase = PHASE.INACTIVE;
    if (global.AxonFilter.onGameComplete) {
      global.AxonFilter.onGameComplete(resultPoints, resultPassed);
    }
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function setVisible(obj, visible) {
  if (obj) obj.enabled = visible;
}

function setAlpha(obj, alpha) {
  if (!obj) return;
  var img = obj.getComponent('Component.Image');
  if (img && img.mainPass) {
    var color = img.mainPass.baseColor;
    color.a = alpha;
    img.mainPass.baseColor = color;
  }
}

function setScale(obj, x, y, z) {
  if (!obj) return;
  obj.getTransform().setLocalScale(new vec3(x, y, z));
}

function setCellColor(cell, color) {
  if (!cell) return;
  var img = cell.getComponent('Component.Image');
  if (img && img.mainPass) {
    img.mainPass.baseColor = new vec4(color[0], color[1], color[2], color[3]);
  }
}

function setDotColor(dot, color) {
  if (!dot) return;
  var img = dot.getComponent('Component.Image');
  if (img && img.mainPass) {
    img.mainPass.baseColor = new vec4(color[0], color[1], color[2], color[3]);
  }
}

function setOverlayColor(obj, color) {
  setCellColor(obj, color); // Same implementation
}

function setHeaderText(text) {
  var headerObj = global.AxonFilter.headerText;
  if (!headerObj) return;
  var textComp = headerObj.getComponent('Component.Text');
  if (textComp) textComp.text = text;
}

function updateTimerBar(progress) {
  var barFill = global.AxonFilter.timerBarFill;
  if (!barFill) return;
  barFill.getTransform().setLocalScale(new vec3(Math.max(0, progress), 1, 1));
}

function setTimerBarColor(color) {
  var barFill = global.AxonFilter.timerBarFill;
  if (!barFill) return;
  var img = barFill.getComponent('Component.Image');
  if (img && img.mainPass) {
    img.mainPass.baseColor = new vec4(color[0], color[1], color[2], color[3]);
  }
}

function easeOutBack(t) {
  var c1 = 1.70158;
  var c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ============================================================
// LIFECYCLE
// ============================================================

var updateEvent = script.createEvent('UpdateEvent');
updateEvent.bind(function (eventData) {
  update(eventData.getDeltaTime());
});
