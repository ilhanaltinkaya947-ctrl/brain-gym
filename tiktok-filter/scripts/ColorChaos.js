/**
 * ColorChaos.js — Mini-Game 3: Stroop Color Test
 *
 * Simplified mechanic:
 * - 3 rapid rounds, 2 seconds each (6 seconds total)
 * - A color word displayed in a DIFFERENT ink color (Stroop effect)
 * - Example: "BLUE" written in red ink → correct answer is RED
 * - 3 color buttons at bottom — tap the INK COLOR
 * - Wrong button or timeout = fail that round
 *
 * Effect House Setup:
 * - Attach this script to the "ColorChaosContainer" SceneObject
 * - Create "stroopWord" Text SceneObject (large, centered)
 * - Create 3 button SceneObjects: "colorBtn_0", "colorBtn_1", "colorBtn_2"
 *   each with Image component (rounded rectangle) + TouchComponent
 * - Create "roundIndicator_0", "roundIndicator_1", "roundIndicator_2"
 *   (small dots showing which round we're on)
 * - See ui-layout.md for positioning
 *
 * Communication:
 * - GameController calls global.AxonFilter.startColorChaos()
 * - This script calls global.AxonFilter.onGameComplete(points, passed) when done
 */

// @input SceneObject stroopWord           — Text object showing the color word
// @input SceneObject[] colorButtons       — 3 color button SceneObjects
// @input SceneObject[] roundIndicators    — 3 small dots for round tracking
// @input SceneObject feedbackOverlay      — Flash overlay for correct/wrong
// @input SceneObject feedbackText         — "NICE!" or "NOPE" text overlay

// ============================================================
// COLOR DEFINITIONS
// ============================================================

// The 4 colors used in the game
var GAME_COLORS = [
  {
    name: 'RED',
    rgb: [1.0, 0.2, 0.2, 1.0],    // #FF3333
    hex: '#FF3333',
  },
  {
    name: 'BLUE',
    rgb: [0.2, 0.4, 1.0, 1.0],    // #3366FF
    hex: '#3366FF',
  },
  {
    name: 'GREEN',
    rgb: [0.0, 0.8, 0.3, 1.0],    // #00CC4D
    hex: '#00CC4D',
  },
  {
    name: 'YELLOW',
    rgb: [1.0, 0.85, 0.0, 1.0],   // #FFD900
    hex: '#FFD900',
  },
];

// ============================================================
// CONSTANTS
// ============================================================

var TOTAL_ROUNDS = 3;
var ROUND_DURATION = 2.0;  // Seconds per round
var FEEDBACK_DURATION = 0.4;
var POINTS_PER_CORRECT = 75;

// ============================================================
// STATE
// ============================================================

var PHASE = {
  INACTIVE: 0,
  PLAYING: 1,     // Active round
  FEEDBACK: 2,    // Showing correct/wrong feedback
  DONE: 3,        // All rounds complete
};

var phase = PHASE.INACTIVE;
var currentRound = 0;        // 0, 1, 2
var roundTimer = 0;
var feedbackTimer = 0;
var totalPoints = 0;
var roundsCorrect = 0;
var hasAnsweredThisRound = false;

// Current round data
var wordColorIndex = -1;     // Index into GAME_COLORS for the WORD text
var inkColorIndex = -1;      // Index into GAME_COLORS for the INK color (correct answer)
var buttonColorIndices = [];  // 3 indices: which color each button shows

// ============================================================
// PUBLIC API
// ============================================================

global.AxonFilter.startColorChaos = function () {
  startGame();
};

// ============================================================
// GAME LOGIC
// ============================================================

function startGame() {
  currentRound = 0;
  totalPoints = 0;
  roundsCorrect = 0;

  setHeaderText('TAP THE INK COLOR');

  // Reset round indicators
  for (var i = 0; i < script.roundIndicators.length && i < TOTAL_ROUNDS; i++) {
    setDotColor(script.roundIndicators[i], [1.0, 1.0, 1.0, 0.2]);
    setVisible(script.roundIndicators[i], true);
  }

  // Hide feedback elements
  setVisible(script.feedbackOverlay, false);
  setVisible(script.feedbackText, false);

  // Start first round
  startRound();
}

function startRound() {
  phase = PHASE.PLAYING;
  roundTimer = 0;
  hasAnsweredThisRound = false;

  // Generate Stroop conflict:
  // Pick a word (text content) and a DIFFERENT ink color
  wordColorIndex = Math.floor(Math.random() * GAME_COLORS.length);
  do {
    inkColorIndex = Math.floor(Math.random() * GAME_COLORS.length);
  } while (inkColorIndex === wordColorIndex);

  // Set up the word display
  var wordComp = script.stroopWord.getComponent('Component.Text');
  if (wordComp) {
    // The TEXT says one color name...
    wordComp.text = GAME_COLORS[wordColorIndex].name;
    // ...but the INK is a different color
    var inkColor = GAME_COLORS[inkColorIndex].rgb;
    wordComp.textFill.color = new vec4(inkColor[0], inkColor[1], inkColor[2], inkColor[3]);
  }
  setVisible(script.stroopWord, true);
  setScale(script.stroopWord, 0.8, 0.8, 1); // Start small for pop-in

  // Set up 3 buttons:
  // - One must be the INK color (correct answer)
  // - One must be the WORD color (the trap/decoy)
  // - One is a random other color
  buttonColorIndices = generateButtonColors(inkColorIndex, wordColorIndex);

  // Shuffle button positions so correct isn't always in same spot
  shuffleArray(buttonColorIndices);

  for (var i = 0; i < script.colorButtons.length && i < 3; i++) {
    var colorIdx = buttonColorIndices[i];
    var btnColor = GAME_COLORS[colorIdx].rgb;
    setButtonColor(script.colorButtons[i], btnColor);
    setVisible(script.colorButtons[i], true);
    setScale(script.colorButtons[i], 1, 1, 1);
  }

  // Highlight current round indicator
  if (currentRound < script.roundIndicators.length) {
    setDotColor(script.roundIndicators[currentRound], [0.0, 0.83, 1.0, 1.0]); // Cyan
  }

  // Update timer bar
  updateTimerBar(1.0);
  setTimerBarColor([0.0, 0.83, 1.0, 1.0]); // Reset to cyan

  // Bind touch events
  bindButtonTaps();
}

function generateButtonColors(correctIndex, trapIndex) {
  var indices = [correctIndex, trapIndex];

  // Find a third color that's neither correct nor trap
  var others = [];
  for (var i = 0; i < GAME_COLORS.length; i++) {
    if (i !== correctIndex && i !== trapIndex) others.push(i);
  }
  indices.push(others[Math.floor(Math.random() * others.length)]);

  return indices;
}

function bindButtonTaps() {
  for (var i = 0; i < script.colorButtons.length && i < 3; i++) {
    (function (btnIndex) {
      var btn = script.colorButtons[btnIndex];
      if (!btn) return;

      var touchComp = btn.getComponent('Component.TouchComponent');
      if (touchComp) {
        touchComp.onTouchStart.add(function () {
          handleButtonTap(btnIndex);
        });
      }
    })(i);
  }
}

function handleButtonTap(buttonIndex) {
  if (phase !== PHASE.PLAYING || hasAnsweredThisRound) return;
  hasAnsweredThisRound = true;

  var tappedColorIndex = buttonColorIndices[buttonIndex];
  var isCorrect = (tappedColorIndex === inkColorIndex);

  if (isCorrect) {
    totalPoints += POINTS_PER_CORRECT;
    roundsCorrect++;

    // Visual feedback: pulse button gold
    setButtonColor(script.colorButtons[buttonIndex], [1.0, 0.84, 0.0, 1.0]);
    setScale(script.colorButtons[buttonIndex], 1.15, 1.15, 1);

    showFeedback(true);

    // Mark round indicator green
    if (currentRound < script.roundIndicators.length) {
      setDotColor(script.roundIndicators[currentRound], [0.0, 0.85, 0.35, 1.0]);
    }
  } else {
    // Dim wrong button, highlight correct one
    setScale(script.colorButtons[buttonIndex], 0.85, 0.85, 1);

    // Find and highlight the correct button
    for (var i = 0; i < buttonColorIndices.length; i++) {
      if (buttonColorIndices[i] === inkColorIndex) {
        setButtonColor(script.colorButtons[i], [1.0, 0.84, 0.0, 1.0]);
        setScale(script.colorButtons[i], 1.1, 1.1, 1);
      }
    }

    showFeedback(false);

    // Mark round indicator red
    if (currentRound < script.roundIndicators.length) {
      setDotColor(script.roundIndicators[currentRound], [1.0, 0.2, 0.2, 1.0]);
    }
  }

  // Transition to feedback phase
  phase = PHASE.FEEDBACK;
  feedbackTimer = 0;
}

function handleRoundTimeout() {
  if (hasAnsweredThisRound) return;
  hasAnsweredThisRound = true;

  showFeedback(false);

  // Mark round indicator red
  if (currentRound < script.roundIndicators.length) {
    setDotColor(script.roundIndicators[currentRound], [1.0, 0.2, 0.2, 1.0]);
  }

  // Highlight correct button
  for (var i = 0; i < buttonColorIndices.length; i++) {
    if (buttonColorIndices[i] === inkColorIndex) {
      setButtonColor(script.colorButtons[i], [1.0, 0.84, 0.0, 1.0]);
      setScale(script.colorButtons[i], 1.1, 1.1, 1);
    }
  }

  phase = PHASE.FEEDBACK;
  feedbackTimer = 0;
}

function showFeedback(correct) {
  setVisible(script.feedbackOverlay, true);
  if (correct) {
    setOverlayColor(script.feedbackOverlay, [0, 0.85, 0.35, 0.2]);
  } else {
    setOverlayColor(script.feedbackOverlay, [1.0, 0.2, 0.2, 0.2]);
  }

  // Show feedback text
  setVisible(script.feedbackText, true);
  var textComp = script.feedbackText.getComponent('Component.Text');
  if (textComp) {
    textComp.text = correct ? 'NICE!' : 'NOPE';
    var color = correct ? [0.0, 0.85, 0.35, 1.0] : [1.0, 0.2, 0.2, 1.0];
    textComp.textFill.color = new vec4(color[0], color[1], color[2], color[3]);
  }
  setScale(script.feedbackText, 0.5, 0.5, 1);
}

function advanceRound() {
  currentRound++;
  if (currentRound >= TOTAL_ROUNDS) {
    finishGame();
  } else {
    startRound();
  }
}

function finishGame() {
  phase = PHASE.DONE;

  // Hide game elements
  setVisible(script.stroopWord, false);
  for (var i = 0; i < script.colorButtons.length; i++) {
    setVisible(script.colorButtons[i], false);
  }

  // Small delay then report to GameController
  var delayFrames = 0;
  var delayEvent = script.createEvent('UpdateEvent');
  delayEvent.bind(function () {
    delayFrames++;
    if (delayFrames >= 15) { // ~0.5s at 30fps
      script.removeEvent(delayEvent);
      if (global.AxonFilter.onGameComplete) {
        var passed = roundsCorrect >= 2; // Pass if 2+ out of 3 correct
        global.AxonFilter.onGameComplete(totalPoints, passed);
      }
    }
  });
}

// ============================================================
// UPDATE LOOP
// ============================================================

function update(dt) {
  switch (phase) {
    case PHASE.PLAYING:
      updatePlaying(dt);
      break;
    case PHASE.FEEDBACK:
      updateFeedback(dt);
      break;
  }
}

function updatePlaying(dt) {
  roundTimer += dt;

  // Pop-in animation for word (first 0.15s)
  if (roundTimer < 0.15) {
    var progress = roundTimer / 0.15;
    var scale = 0.8 + 0.2 * easeOutBack(progress);
    setScale(script.stroopWord, scale, scale, 1);
  } else {
    setScale(script.stroopWord, 1, 1, 1);
  }

  // Update timer bar
  var progress = 1.0 - (roundTimer / ROUND_DURATION);
  updateTimerBar(Math.max(0, progress));

  // Red timer in last 0.5s
  if (roundTimer >= ROUND_DURATION - 0.5) {
    setTimerBarColor([1.0, 0.2, 0.2, 1.0]);
  }

  // Timeout
  if (roundTimer >= ROUND_DURATION) {
    handleRoundTimeout();
  }
}

function updateFeedback(dt) {
  feedbackTimer += dt;

  // Feedback text pop-in (first 0.15s)
  if (feedbackTimer < 0.15) {
    var progress = feedbackTimer / 0.15;
    var scale = easeOutBack(progress);
    setScale(script.feedbackText, scale, scale, 1);
  }

  // Fade out feedback overlay
  if (feedbackTimer > 0.2) {
    var fadeProgress = (feedbackTimer - 0.2) / 0.2;
    setAlpha(script.feedbackOverlay, Math.max(0, 0.2 * (1 - fadeProgress)));
    setAlpha(script.feedbackText, Math.max(0, 1.0 - fadeProgress));
  }

  // Advance to next round after feedback duration
  if (feedbackTimer >= FEEDBACK_DURATION) {
    setVisible(script.feedbackOverlay, false);
    setVisible(script.feedbackText, false);
    advanceRound();
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function shuffleArray(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
}

function setVisible(obj, visible) {
  if (obj) obj.enabled = visible;
}

function setAlpha(obj, alpha) {
  if (!obj) return;
  var img = obj.getComponent('Component.Image');
  if (img && img.mainPass) {
    var c = img.mainPass.baseColor;
    c.a = alpha;
    img.mainPass.baseColor = c;
    return;
  }
  var txt = obj.getComponent('Component.Text');
  if (txt) {
    var c = txt.textFill.color;
    c.a = alpha;
    txt.textFill.color = c;
  }
}

function setScale(obj, x, y, z) {
  if (!obj) return;
  obj.getTransform().setLocalScale(new vec3(x, y, z));
}

function setButtonColor(btn, color) {
  if (!btn) return;
  var img = btn.getComponent('Component.Image');
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
  setButtonColor(obj, color);
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
