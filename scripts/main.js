/* jshint unused: false */
/* global createjs */

/**
 *
 * Sprite definitions
 *
 */
window.duckHuntSprite = (function ($) {
  'use strict';

  var duckFlightData = {
    images: [
      'images/bird/bird1.png',
      'images/bird/bird2.png',
      'images/bird/bird3.png',
      'images/bird/bird4.png',
      'images/bird/bird5.png',
      'images/bird/bird6.png'
    ],
    frames: { width:130, height:98 },
    animations: {
      fly: {
        frames: [0, 1, 2, 3, 4, 5, 4, 3, 2, 1],
        speed: 0.5
      }
    }
  };

  var duckDeathData = {
    images: [
      'images/bird/bird_dead.png',
      'images/bird/bird_dropping_1.png',
      'images/bird/bird_dropping_2.png'
    ],
    frames: { width:151, height:165 },
    animations: {
      die: {
        frames: [0],
        next: 'drop',
        speed: 0.05
      },
      drop: {
        frames: [1,2],
        speed: 0.25
      }

    }
  };

  var dogData = {
    images: [
      'images/dog/dog1.png',
      'images/dog/dog2.png'
    ],
    frames: { width:340, height:349 },
    animations: {
      laugh: {
        frames: [0,1],
        speed: 0.1
      }

    }
  };

  var dogHappyData = {
    images: [
      'images/dog/dog_happy.png'
    ],
    frames: { width:611, height:350 },
    animations: {
      smile: {
        frames: [0],
        speed: 0.1
      }

    }
  };

  function scale(obj, coeff) {
    obj.scaleX = obj.scaleX * coeff.x;
    obj.scaleY = obj.scaleY * coeff.y;
    return obj;
  }

  var getDuckFlySprite = function  () {
    var spriteSheet = new createjs.SpriteSheet(duckFlightData),
      animation = new createjs.Sprite(spriteSheet, 'fly');

    animation.regX = duckFlightData.frames.width/2;
    animation.regY = duckFlightData.frames.height/2;
    scale(animation, { x: -0.8, y: 0.8 });

    return animation;
  };

  var getDuckDeathSprite = function() {
    var spriteSheet = new createjs.SpriteSheet(duckDeathData),
      animation = new createjs.Sprite(spriteSheet, 'die');

    animation.regX = duckDeathData.frames.width/2;
    animation.regY = duckDeathData.frames.height/2;
    scale(animation, { x: 0.6, y: 0.6 });

    return animation;
  };

  var getDogSprite = function() {
    var spriteSheet = new createjs.SpriteSheet(dogData),
      animation = new createjs.Sprite(spriteSheet, 'laugh');

    animation.regX = duckDeathData.frames.width/2;
    animation.regY = duckDeathData.frames.height/2;
    scale(animation, { x: 0.4, y: 0.4 });

    return animation;
  };

  var getDogSmileSprite = function() {
    var spriteSheet = new createjs.SpriteSheet(dogHappyData),
      animation = new createjs.Sprite(spriteSheet, 'smile');

    animation.regX = duckDeathData.frames.width/2;
    animation.regY = duckDeathData.frames.height/2;
    scale(animation, { x: 0.4, y: 0.4 });

    return animation;
  };

  // API
  return {
    getSprites: function () {
      return {
        'duck': {
          'fly': getDuckFlySprite(),
          'death': getDuckDeathSprite()
        },
        'dogLaugh': getDogSprite(),
        'dogSmile': getDogSmileSprite()
      };
    }
  };

}(jQuery));

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

/* jshint unused: false, quotmark:false */
/* global createjs, store */

window.duckHunt.settings = (function ($) {
  'use strict';

  var canvas = document.getElementById('settings-canvas'),
    stage = new createjs.Stage(canvas),
    pointsContainer = new createjs.Container(),
    update = true; // Variable to track whether or not the canvas should be updated on tick()

  /**
   * Draws the graphics according either using default values or points given as a parameter
   * @param  {Array} points An array of points to use for drawing the graphics (optional)
   * @param  {Object} options Additional dawing options (optional)
   * @return {Object} The graphics
   */
  function setupGraphics(points, options) {

    var rectangleSize = (options !== undefined && options.rectangleSize !== undefined) ? options.rectangleSize : 30,
      circleRadius = (options !== undefined && options.circleRadius !== undefined) ? options.circleRadius : 20,
      line = new createjs.Shape(),
      p1 = new createjs.Shape(),
      p2 = new createjs.Shape(),
      cp1 = new createjs.Shape(),
      cp2 = new createjs.Shape();

    line.name = "line";
    p1.name = (points !== undefined && points.p1 !== undefined && points.p1.name !== undefined) ? points.p1.name : "endPointStart";
    p2.name = (points !== undefined && points.p2 !== undefined && points.p2.name !== undefined) ? points.p2.name : "endPointEnd";
    cp1.name = (points !== undefined && points.cp1 !== undefined && points.cp1.name !== undefined) ? points.cp1.name : "controlPointFirst";
    cp2.name = (points !== undefined && points.cp2 !== undefined && points.cp2.name !== undefined) ? points.cp2.name : "controlPointSecond";

    line.graphics.setStrokeStyle(2, "square").beginStroke('#F00');

    p1.x = 10;
    p1.y = (points !== undefined && points.p1 !== undefined) ? points.p1.y : 25;
    p2.x = stage.canvas.width - 10;
    p2.y = (points !== undefined && points.p2 !== undefined) ? points.p2.y : stage.canvas.height - 25;
    cp1.x = (points !== undefined && points.cp1 !== undefined) ? points.cp1.x : (p2.x - p1.x) / 2;
    cp1.y = (points !== undefined && points.cp1 !== undefined) ? points.cp1.y : 100;
    cp2.x = (points !== undefined && points.cp2 !== undefined) ? points.cp2.x : (p2.x - p1.x) / 2;
    cp2.y = (points !== undefined && points.cp2 !== undefined) ? points.cp2.y : stage.canvas.height - cp1.y;

    p1.graphics.beginFill('#FFF').beginStroke('#000').drawRect(rectangleSize / 2, 0, rectangleSize, rectangleSize, 0);
    p2.graphics.beginFill('#FFF').beginStroke('#000').drawRect(-rectangleSize / 2, 0, rectangleSize, rectangleSize, 0);
    cp1.graphics.beginFill('#FF0').beginStroke('#000').drawCircle(0, 0, circleRadius);
    cp2.graphics.beginFill('#FF0').beginStroke('#000').drawCircle(0, 0, circleRadius);
    p1.regX = p1.regY = p2.regX = p2.regY = rectangleSize / 2;
    cp1.regX = cp1.regY = cp2.regX = cp2.regY = circleRadius / 2;

    return {
      "line" : line,
      "points" : {
        "p1": p1,
        "p2": p2,
        "cp1": cp1,
        "cp2": cp2
      }
    };
  }

  /**
   * Fetch graphics currently added to the canvas
   * @return {Object} The graphics
   */
  function getGraphics() {
    return {
      "line" : stage.getChildByName("line"),
      "points" : {
        "p1": pointsContainer.getChildByName("endPointStart"),
        "p2": pointsContainer.getChildByName("endPointEnd"),
        "cp1": pointsContainer.getChildByName("controlPointFirst"),
        "cp2": pointsContainer.getChildByName("controlPointSecond")
      }
    };
  }

  /**
   * Initializes the settings view:
   * - populates the canvas with graphics
   * - attaches event handlers
   */
  function init () {
    var data = null,
      graphics = setupGraphics(),
      $curveContainer = $('.curve-container'),
      $addBtn = $('.settings-curve-add'),
      $removeBtn = $('.settings-curve-remove');

    createjs.Touch.enable(stage);
    stage.enableMouseOver(10);
    stage.mouseMoveOutside = true; // keep tracking the mouse even when it leaves the canvas

    graphics.line.graphics.moveTo(graphics.points.p1.x, graphics.points.p1.y)
                .bezierCurveTo(graphics.points.cp1.x, graphics.points.cp1.y,
                       graphics.points.cp2.x, graphics.points.cp2.y,
                       graphics.points.p2.x, graphics.points.p2.y);

    pointsContainer.addChild(graphics.points.p1, graphics.points.p2, graphics.points.cp1, graphics.points.cp2);
    stage.addChild(graphics.line, pointsContainer);

    if ($.isEmptyObject(data)) {
      $curveContainer.addClass('empty');
    }

    // This function is run whenever a control point is clicked/touched
    function activatePoint(event) {
      var target = event.target;

      target.offset = {
        x: target.x-event.stageX,
        y: target.y-event.stageY
      };

      pointsContainer.addChild(target); // Draw the active point on top of other graphics
    }

    // This function is run whenever a point is being dragged
    function drawCurve(event) {
      var target = event.target,
          line = graphics.line,
          points = graphics.points,
          y = event.stageY - target.offset.y;

      // Update x coordinate depending on the point (control points or endpoint)
      target.x = (target.name.indexOf('controlPoint') !== -1) ? event.stageX + target.offset.x : target.x;
      // Don't update the y coordinate near canvas borders (min. 25px offset)
      if (y > 25 && y < stage.canvas.height - 25) {
        target.y = y;
      }

      // Draw
      line.graphics.clear().setStrokeStyle(2, "square").beginStroke('#F00')
             .moveTo(points.p1.x, points.p1.y)
             .bezierCurveTo(points.cp1.x, points.cp1.y, points.cp2.x, points.cp2.y, points.p2.x, points.p2.y);

      update = true;
    }

    /**
     * Adds and draws a curve to the list of curves
     * @param {Integer} idx Index number (optional)
     * @param {Array} points An array of points according to which the curve should be drawn
     */
    function addCurveToList(idx, points) {
      var $curve = $('<canvas />').addClass('curve').attr({ 'width': 256, 'height': 108, 'data-id': idx === undefined ? localStorage.length : idx }),
        stage = new createjs.Stage($curve.get(0)),
        graphics = setupGraphics(points, { 'circleRadius': 5, 'rectangleSize': 10 }),
        p = graphics.points;

      // Scale the points to fit the smaller canvas
      for (var point in p) {
        p[point].x = p[point].x / 5;
        p[point].y = p[point].y / 5;
      }

      // Draw and update the canvas
      stage.addChild(graphics.line, p.p1, p.p2, p.cp1, p.cp2);
      graphics.line.graphics.moveTo(p.p1.x, p.p1.y).bezierCurveTo(p.cp1.x, p.cp1.y, p.cp2.x, p.cp2.y, p.p2.x, p.p2.y);
      stage.update();

      // Add the element to DOM
      $curveContainer.prepend($curve);
    }

    function addDefaultCurves(points, count) {
      var height = $('#stage').height(),
          width = $('#stage').width();

      if (!localStorage.length) {
        for (var i = count; i--;) {
          store.set(i,
             {
              p1: { x:points.p1.x, y:Math.round(Math.random() * height) },
              cp1: { x:Math.round(Math.random() * width), y:Math.round(Math.random() * height) },
              cp2: { x:Math.round(Math.random() * width), y:Math.round(Math.random() * height) },
              p2: { x:points.p2.x, y:Math.round(Math.random() * height) }
            }
          );
        }
      }
    }

    /**
     * ADD EVENT LISTENERS START
     */
    $curveContainer.hammer().on('click, tap', '.curve', function (e) {
      $(this).toggleClass('selected');

      if ($('.selected', $curveContainer).length) {
        $removeBtn.removeClass('inactive');
      } else {
        $removeBtn.addClass('inactive');
      }
    });

    $addBtn.hammer().on('click, tap', function () {
      var graphics = getGraphics(),
        points = pointsToJSON(graphics.points),
        idx = localStorage.length === null ? 0 : localStorage.length;

      store.set(idx, points);

      $curveContainer.removeClass('empty');
      addCurveToList(idx, points);
    });

    $removeBtn.hammer().on('click, tap', function () {
      $('.selected', $curveContainer).each(function (i, el) {
        var id = $(this).attr('data-id');

        store.remove(id);

        $(el).fadeOut("fast", function () {
          if (!$(this).siblings('.curve').length) {
            $curveContainer.addClass('empty');
            $removeBtn.addClass('inactive');
          }
          $(this).remove();
        });
      });
    });

    $(window).load(function () {
      $('.slider-timescale [data-slider]').bind('slider:changed', function (event, data) {
        var speed = data.value.toFixed(3);
        $(this).siblings('.slider-counter').html(speed);
        sessionStorage.setItem('timeScale', speed);
      }).simpleSlider('setValue', getTimeScale());

      $('.slider-ammo [data-slider]').bind('slider:changed', function (event, data) {
        var ammo = parseInt(data.value, 10);
        $(this).siblings('.slider-counter').html(ammo);
        sessionStorage.setItem('ammo', ammo);
      }).simpleSlider('setValue', getAmmo());
    });

    pointsContainer.on("mousedown", activatePoint);
    pointsContainer.on("pressmove", drawCurve);
    /**
     * ADD EVENT LISTENERS END
     */

    // Add 3 default curves
    addDefaultCurves(graphics.points, 3);

    // Fetch curves stored to localStorage and add them to the list of curves
    $.each(store.getAll(), addCurveToList);
  }

  function tick(event) {
    if (update) {
      stage.update(event);
      update = false;
    }
  }

  /**
   * Activate the settings view
   */
  function activate(graphics) {
    stage.enableDOMEvents(true);
    createjs.Ticker.addEventListener("tick", tick);
  }

  /**
   * Deactivate the settings view
   */
  function deactivate() {
    stage.enableDOMEvents(false);
    createjs.Ticker.removeEventListener("tick", tick);
  }

  /**
   * Convert graphics points to JSON format
   */
  function pointsToJSON(points) {
    return {
      p1: { x: points.p1.x, y: points.p1.y },
      p2: { x: points.p2.x, y: points.p2.y },
      cp1: { x: points.cp1.x, y: points.cp1.y },
      cp2: { x: points.cp2.x, y: points.cp2.y }
    };
  }

  function getTimeScale() {
    return sessionStorage.getItem('timeScale') !== null ? sessionStorage.getItem('timeScale') : 1;
  }

  function getAmmo() {
    return sessionStorage.getItem('ammo') !== null ? sessionStorage.getItem('ammo') : 20;
  }

  function getBeziers() {
    var data = [];

    // Fetch points stored to localStorage
    store.forEach(function(key, val) {
      var points = [
        { x:val.p2.x, y:val.p2.y },
        { x:val.cp2.x, y:val.cp2.y },
        { x:val.cp1.x, y:val.cp1.y },
        { x:val.p1.x - 150, y:val.p1.y }
      ];
      data.push({ type: "cubic", values: points });
    });

    return data;
  }

  init();

  // API
  return {
    activate: activate,
    deactivate: deactivate,
    getBeziers: getBeziers,
    timeScale: getTimeScale(),
    ammo: getAmmo()
  };

}(jQuery));

/* jshint unused: false, devel:true */
/* global createjs, FastClick, duckHunt */

(function ($) {
  'use strict';

  // Attach FastClick
  FastClick.attach(document.body);

  $(document).ready(function () {

    var $container = $('#container');

    var pauseGame = function () {
      duckHunt.pause();
      $container.addClass('hidden');
    };

    var resumeGame = function () {
      // Wait half a second before resuming to make
      // the change from pause to play-state more subtle
      setTimeout(function () {
        duckHunt.resume();
      }, 500);

      $container.removeClass('hidden');
    };

    $('[href="#settings"]').hammer().on('click, tap', function (e) {
      pauseGame();
    });

    $('[href="#play"]').hammer().on('click, tap', function (e) {
      resumeGame();
    });

    $('[data-action="mute"]').hammer().on('click, tap', function (e) {
      $(this).toggleClass('off');
      duckHunt.toggleSounds();
    });

    $('#settings').hammer().on('swipeleft', function (e) {
      window.location.hash = '#play';
      resumeGame();
    });

    $container.find('.actions').hammer().on('swiperight', function (e) {
      pauseGame();
      window.location.hash = '#settings';
    });

  });

  $(window).load(function () {

    // Init the game (pass in an optional parameter with custom game configuration)
    duckHunt.initialize({
      'initialSpeed': 2.5, // Duration for how long the target will be visible on the screen
      'targetCount': 20, // Number of targets (ducks)
      'mute': true, // Mute sounds
      'paused': false // Initial play state
    });

    if (window.location.hash === '#settings') {
      // Pause the game if the settings view is opened on page load
      duckHunt.pause();
    }
  });

}(jQuery));

