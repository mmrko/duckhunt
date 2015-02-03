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
