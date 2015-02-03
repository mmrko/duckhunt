/* jshint unused: false, undef:false, quotmark:false */
/* global createjs, duckHuntSprite, TweenMax, TimelineMax */

window.duckHunt = (function ($) {
  'use strict';

  var stage = new createjs.Stage(document.getElementById('stage')),
      background = new createjs.Stage(document.getElementById('background')),
      scoreBoard = $('#scoreboard').FlipClock(0, { clockFace: 'Counter'}),
      sprites = duckHuntSprite.getSprites(),
      config = {}, settings = {}, timeline = {}, ducks = [], ammo = 0;

  function timelineComplete() {
    var dog,
        hits = scoreBoard.getTime().getSeconds(),
        finalScore =  hits / config.targetCount;

    // If less than 60% of targets were hit, the player deserves to be laughed at...
    if (finalScore < 0.6) {
      createjs.Sound.play('dog_laugh', createjs.Sound.INTERRUPT_ANY, 1500, 0, 0, 1, 0);
      dog = sprites.dogLaugh;
    }
    // ...well done!
    else {
      createjs.Sound.play('dog_smile', createjs.Sound.INTERRUPT_ANY, 1500, 0, 0, 1, 0);
      dog = sprites.dogSmile;
    }

    // Position the dog
    dog.x = stage.canvas.width/2;
    dog.y = stage.canvas.height;

    stage.addChild(dog);

    // Animate
    TweenMax.to(dog, 1, { y: 400, delay: 1, onComplete: function () { dog.y = 400; } });
    TweenMax.to(dog, 1.5, { y: stage.canvas.height, delay:2.5 });
  }

  // Fetch a target from the target array and add it to the stage
  function getNextDuck() {
    var duck = ducks.shift();
    if (duck !== undefined) {
      stage.addChild(duck);
      createjs.Sound.play('quack');
    }
  }

  /**
   * This function is executed whenever the animation associated with a target
   * has completed. This function does 3 things:
   * 1. Remove any tweens associated with the target
   * 2. Remove the target from the stage
   * 3. Fetch a new target
   *
   * @param {Object} obj The target object
   */
  function tweenComplete(obj) {
    if (obj !== undefined) {
      TweenMax.killTweensOf(obj);
      stage.removeChild(obj);
      getNextDuck();
    }
  }

  /**
   * Duck death animation. This function is executed whenever a target has been hit.
   * @param  {Object} event Mouse/touch interaction event
   */
  function killDuck(event) {
    var duckDeath = sprites.duck.death.clone();
    // Reset the playhead (see duckHuntSprite.js)
    duckDeath.gotoAndPlay("die");
    duckDeath.x = event.stageX;
    duckDeath.y = event.stageY;
    stage.addChild(duckDeath);

    // Animate the sprite object and remove it and its tween on completion
    TweenMax.to(duckDeath, 1.5, {
      bezier: [ { x: duckDeath.x, y:duckDeath.y }, { x:duckDeath.x, y:stage.canvas.height } ],
      ease:Power3.easeOut,
      onComplete: function () { TweenMax.killTweensOf(duckDeath); stage.removeChild(duckDeath); }
    }).delay(0.3);
  }

  /**
   * Initial game setup
   * @param  {Object} customConfig Custom game configuration
   */
  function setup(customConfig) {
    customConfig = customConfig || {};

    createjs.Ticker.setFPS(60);
    createjs.Ticker.useRAF = true;
    createjs.Touch.enable(background);

    config.initialSpeed = customConfig.initialSpeed ? customConfig.initialSpeed : 2.5;
    config.targetCount = customConfig.targetCount ? customConfig.targetCount : 12;
    config.mute = customConfig.mute ? customConfig.mute : false;
    config.paused = customConfig.paused ? customConfig.paused : false;

    // Fetch settings (curves, timescale and ammo count)
    settings = window.duckHunt.settings;

    // Initialize sounds
    if (createjs.Sound.initializeDefaultPlugins()) {
      var soundPath = 'audio/',
        manifest = [
          { id:'gun_shot', src:soundPath +'gun_shot.mp3' },
          { id:'dog_laugh', src:soundPath + 'dog_laugh.mp3' },
          { id:'start_game', src:soundPath + 'start_game.mp3' },
          { id:'dog_smile', src:soundPath + 'dog_smile.mp3' },
          { id:'quack', src:soundPath + 'quack.mp3' },
          { id:'drop', src:soundPath + 'drop.m4a' }
        ];
      createjs.Sound.registerManifest(manifest);
    }

    if (!createjs.Touch.isSupported()) {
      console.log('Touch events are not supported!');
    }
  }

  /**
   * Initializes a game.
   * @return {[type]} [description]
   */
  function init() {

    var duck = null,
        bezierCurves = settings.getBeziers();

    timeline = new TimelineMax({ onComplete: timelineComplete });

    // Set the timescale (1.0 by default)
    timeline.timeScale(settings.timeScale);

    if (config.mute) {
      createjs.Sound.setMute(true);
    }

    if (config.paused) {
      pause();
    }

    // Generate and append ammo elements to the DOM.
    ammo = (function appendShells(ammo) {
      var shells = [];
      for (var i = ammo; i--;) {
        shells.push($('<div />').addClass('shell'));
      }
      $('.shells').append(shells);
      return shells.length;
    }(settings.ammo));

    // Generate targets and apply the flight paths (curves) to them randomly
    for (var i = config.targetCount; i--;) {
      duck = sprites.duck.fly.clone(); // Clone the sprite

      duck.x = stage.canvas.width + duck.spriteSheet._frameWidth;
      duck.y = duck.spriteSheet._frameHeight;
      duck.die = killDuck;

      if (bezierCurves.length) {
        var index = Math.floor(Math.random() * bezierCurves.length),
            ease = Math.round(Math.random()) ? Linear.easeNone : Linear.easeInOut;

        timeline.add(TweenMax.to(duck, config.initialSpeed, {
          bezier: bezierCurves[index],
          ease: ease,
          onComplete: tweenComplete,
          onCompleteParams: [duck],
          orientToBezier: [["x", "y", "rotation", 180, 0.01]]
        }));
      }

      ducks.push(duck);
    }

    // Apply listeners
    background.addEventListener('stagemousedown', handleMouseDown);
    createjs.Ticker.addEventListener('tick', tick);

    getNextDuck();
  }

  function handleMouseDown(event) {
    var duck, pt;

    // If the user clicked/touched the canvas and there's enough ammunition...
    if (background.mouseInBounds && ammo) {

      // Apply the animation as an inline style to prevent an unnecessary layout from occurring
      document.getElementsByClassName('shell')[ammo-1].style.cssText = '-webkit-animation:shellShot 0.75s forwards;';

      createjs.Sound.play('gun_shot');

      // Loop through the objects array and check if one has been hit
      for (var i = stage.getNumChildren(); i--;) {
        duck = stage.getChildAt(i);

        // Consider only targets that are flying (= not dead, see duckHuntSprite.js)
        if (duck.currentAnimation !== 'fly') {
          continue;
        }

        // Convert the global mouse coordinates to object's coordinate space
        pt = duck.globalToLocal(event.stageX, event.stageY);

        // Check if the target has been hit
        if (duck.hitTest(pt.x, pt.y)) {

          // Play duck death animation
          duck.die(event);

          tweenComplete(duck);

          if (scoreBoard !== undefined) {
            scoreBoard.increment();
          }
          // Only one target can be hit at a time so there's no need to continue the loop
          break;
        }
      }
      ammo--;
    }
  }

  function tick(event) {
    stage.update(event);
  }

  var initialize = function (customConfig) {
    setup(customConfig);
    init();
  };

  var play = function () {
    // Start of the game music
    createjs.Sound.play('drop', createjs.Sound.INTERRUPT_ANY, 0, 0, 0, 0.3, 0);
    timeline.play();
  };

  var restart = function () {
    init();
  };

  var pause = function () {
    timeline.pause();
    settings.activate();
    background.enableDOMEvents(false);
    stage.enableDOMEvents(false);
  };

  var resume = function () {
    settings.deactivate();
    background.enableDOMEvents(true);
    stage.enableDOMEvents(true);
    timeline.resume();
  };

  var toggleSounds = function () {
    if (createjs.Sound.getMute()) {
      createjs.Sound.setMute(false);
    } else {
      createjs.Sound.setMute(true);
    }
  };

  var setTimeScale = function (timeScale) {
    timeline.timeScale(timeScale);
  };

  // API
  return {
    initialize: initialize,
    play: play,
    restart: restart,
    pause: pause,
    resume: resume,
    toggleSounds: toggleSounds,
    setTimeScale: setTimeScale
  };
}(jQuery));
