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
