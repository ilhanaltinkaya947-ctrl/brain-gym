/**
 * PatternHunter.js — Mini-Game 1: Find the Odd One Out
 *
 * Simplified mechanic:
 * - 4x4 grid (16 cells) of colored circles
 * - 15 are one color, 1 is a different color (30-40 degree hue shift)
 * - Player taps the odd one to score
 * - 7 second time limit
 *
 * Effect House Setup:
 * - Attach this script to the "PatternHunterContainer" SceneObject
 * - Create 16 child SceneObjects named "cell_0" through "cell_15"
 *   each with an Image component (circle shape)
 * - Each cell must have a TouchComponent for tap detection
 * - See ui-layout.md for exact positioning
 *
 * Communication:
 * - GameController calls global.AxonFilter.startPatternHunter()
 * - This script calls global.AxonFilter.onGameComplete(points, passed) when done
 */

// @input SceneObject[] cells              — 16 circle SceneObjects (cell_0 to cell_15)
// @input SceneObject feedbackOverlay      — Full-game-area overlay for correct/wrong flash
// @input SceneObject oddHighlight         — Pulsing ring that highlights the odd cell on timeout

// ============================================================
// COLOR PAIRS — each pair has a base color and an "odd" variant
// Hue-shifted 30-40 degrees for a noticeable but challenging difference
// ============================================================

var COLOR_PAIRS = [
  {
    name: 'Cyan vs Magenta',
    base: [0.0, 0.83, 1.0, 1.0],     // #00D4FF
    odd:  [0.83, 0.0, 1.0, 1.0],      // #D400FF
  },
  {
    name: 'Green vs Yellow',
    base: [0.0, 0.85, 0.35, 1.0],     // #00D959
    odd:  [0.85, 0.85, 0.0, 1.0],     // #D9D900
  },
  {
    name: 'Orange vs Red',
    base: [1.0, 0.55, 0.0, 1.0],      // #FF8C00
    odd:  [1.0, 0.2, 0.2, 1.0],       // #FF3333
  },
  {
    name: 'Purple vs Blue',
    base: [0.6, 0.2, 0.9, 1.0],       // #9933E6
    odd:  [0.2, 0.4, 0.9, 1.0],       // #3366E6
  },
];

// ============================================================
// STATE
// ============================================================

var GRID_SIZE = 16;
var GAME_DURATION = 7.0;

var isActive = false;
var timer = 0;
var oddCellIndex = -1;
var hasAnswered = false;
var currentPair = null;
var feedbackTimer = 0;
var showingFeedback = false;
var feedbackType = ''; // 'correct', 'wrong', 'timeout'

// ============================================================
// PUBLIC API — Called by GameController
// ============================================================

global.AxonFilter.startPatternHunter = function () {
  startGame();
};

// ============================================================
// GAME LOGIC
// ============================================================

function startGame() {
  isActive = true;
  timer = 0;
  hasAnswered = false;
  showingFeedback = false;

  // Pick random color pair
  var pairIndex = Math.floor(Math.random() * COLOR_PAIRS.length);
  currentPair = COLOR_PAIRS[pairIndex];

  // Pick random odd cell
  oddCellIndex = Math.floor(Math.random() * GRID_SIZE);

  // Set header text
  setHeaderText('FIND THE ODD ONE');

  // Color all cells
  for (var i = 0; i < script.cells.length && i < GRID_SIZE; i++) {
    var cell = script.cells[i];
    if (!cell) continue;

    var color = (i === oddCellIndex) ? currentPair.odd : currentPair.base;
    setCellColor(cell, color);
    setVisible(cell, true);
    setScale(cell, 1, 1, 1);
    setAlpha(cell, 1.0);
  }

  // Hide feedback overlay
  setVisible(script.feedbackOverlay, false);
  setVisible(script.oddHighlight, false);

  // Bind tap events to all cells
  bindTapEvents();

  // Update timer bar
  updateTimerBar(1.0);
}

function bindTapEvents() {
  for (var i = 0; i < script.cells.length && i < GRID_SIZE; i++) {
    (function (index) {
      var cell = script.cells[index];
      if (!cell) return;

      var touchComp = cell.getComponent('Component.TouchComponent');
      if (touchComp) {
        touchComp.addTouchBlockingException('TouchTypeDoubleTap');
        touchComp.onTouchStart.add(function () {
          handleCellTap(index);
        });
      }
    })(i);
  }
}

function handleCellTap(cellIndex) {
  if (!isActive || hasAnswered) return;
  hasAnswered = true;

  if (cellIndex === oddCellIndex) {
    // CORRECT
    showFeedback('correct');

    // Animate the tapped cell: scale up + fade
    animateCellCorrect(script.cells[cellIndex]);

    // Report score (100 points, passed)
    endGame(100, true);
  } else {
    // WRONG
    showFeedback('wrong');

    // Shake the grid briefly
    animateGridShake();

    // Reveal the odd cell
    revealOddCell();

    // Report score (0 points, failed)
    endGame(0, false);
  }
}

function handleTimeout() {
  if (hasAnswered) return;
  hasAnswered = true;

  showFeedback('timeout');
  revealOddCell();
  endGame(0, false);
}

function endGame(points, passed) {
  isActive = false;
  feedbackTimer = 0;
  showingFeedback = true;
  feedbackType = passed ? 'correct' : 'wrong';

  // Delay before reporting to GameController (let feedback animation play)
  // The update loop handles this delay
  var self = this;
  var delayFrames = 0;
  var delayEvent = script.createEvent('UpdateEvent');
  delayEvent.bind(function (eventData) {
    delayFrames++;
    // Wait ~45 frames (~1.5s at 30fps)
    if (delayFrames >= 45) {
      script.removeEvent(delayEvent);
      if (global.AxonFilter.onGameComplete) {
        global.AxonFilter.onGameComplete(points, passed);
      }
    }
  });
}

// ============================================================
// VISUAL FEEDBACK
// ============================================================

function showFeedback(type) {
  setVisible(script.feedbackOverlay, true);

  if (type === 'correct') {
    // Green flash
    setOverlayColor(script.feedbackOverlay, [0, 0.85, 0.35, 0.3]);
  } else {
    // Red flash
    setOverlayColor(script.feedbackOverlay, [1.0, 0.2, 0.2, 0.3]);
  }
}

function animateCellCorrect(cell) {
  // Scale up the correct cell (pop effect)
  // In Effect House, we use a tween-like approach in the update loop
  // For simplicity, just set an immediate larger scale + gold color
  if (!cell) return;
  setScale(cell, 1.3, 1.3, 1);
  setCellColor(cell, [1.0, 0.84, 0.0, 1.0]); // Gold
}

function animateGridShake() {
  // Apply a small X offset to the container, then reset
  // Effect House doesn't have built-in shake, so we approximate
  var container = script.getSceneObject();
  if (!container) return;

  var transform = container.getTransform();
  var origPos = transform.getLocalPosition();

  // Quick shake: offset right, left, right, center over 4 frames
  var shakeFrames = 0;
  var shakeEvent = script.createEvent('UpdateEvent');
  shakeEvent.bind(function () {
    shakeFrames++;
    var offset = 0;
    if (shakeFrames === 1) offset = 0.02;
    else if (shakeFrames === 2) offset = -0.02;
    else if (shakeFrames === 3) offset = 0.01;
    else if (shakeFrames === 4) offset = -0.01;
    else {
      transform.setLocalPosition(origPos);
      script.removeEvent(shakeEvent);
      return;
    }
    transform.setLocalPosition(new vec3(origPos.x + offset, origPos.y, origPos.z));
  });
}

function revealOddCell() {
  // Pulse the odd cell to make it obvious
  var oddCell = script.cells[oddCellIndex];
  if (!oddCell) return;

  // Make it bright gold and larger
  setCellColor(oddCell, [1.0, 0.84, 0.0, 1.0]);
  setScale(oddCell, 1.2, 1.2, 1);

  // Show highlight ring around it
  if (script.oddHighlight) {
    setVisible(script.oddHighlight, true);
    // Position highlight over the odd cell
    var cellTransform = oddCell.getTransform();
    var highlightTransform = script.oddHighlight.getTransform();
    highlightTransform.setLocalPosition(cellTransform.getLocalPosition());
  }
}

// ============================================================
// UPDATE LOOP
// ============================================================

function update(dt) {
  if (!isActive && !showingFeedback) return;

  if (isActive) {
    timer += dt;

    // Update timer bar (1.0 = full, 0.0 = empty)
    var progress = 1.0 - (timer / GAME_DURATION);
    updateTimerBar(Math.max(0, progress));

    // Change timer bar color in last 2 seconds
    if (timer >= GAME_DURATION - 2.0) {
      setTimerBarColor([1.0, 0.2, 0.2, 1.0]); // Red
    }

    // Check timeout
    if (timer >= GAME_DURATION) {
      handleTimeout();
    }
  }

  // Fade out feedback overlay
  if (showingFeedback) {
    feedbackTimer += dt;
    if (feedbackTimer > 0.5) {
      var fadeProgress = (feedbackTimer - 0.5) / 0.5;
      setAlpha(script.feedbackOverlay, Math.max(0, 0.3 * (1 - fadeProgress)));
      if (fadeProgress >= 1.0) {
        setVisible(script.feedbackOverlay, false);
        showingFeedback = false;
      }
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

function setOverlayColor(obj, color) {
  if (!obj) return;
  var img = obj.getComponent('Component.Image');
  if (img && img.mainPass) {
    img.mainPass.baseColor = new vec4(color[0], color[1], color[2], color[3]);
  }
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
  var transform = barFill.getTransform();
  // Scale X from 1.0 (full) to 0.0 (empty), anchored left
  transform.setLocalScale(new vec3(Math.max(0, progress), 1, 1));
}

function setTimerBarColor(color) {
  var barFill = global.AxonFilter.timerBarFill;
  if (!barFill) return;
  var img = barFill.getComponent('Component.Image');
  if (img && img.mainPass) {
    img.mainPass.baseColor = new vec4(color[0], color[1], color[2], color[3]);
  }
}

// ============================================================
// LIFECYCLE
// ============================================================

var updateEvent = script.createEvent('UpdateEvent');
updateEvent.bind(function (eventData) {
  update(eventData.getDeltaTime());
});
