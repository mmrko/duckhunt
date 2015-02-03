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

