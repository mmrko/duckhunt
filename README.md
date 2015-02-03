# T-111.5350 Multimedia Programming - Duck Hunt #

A proof-of-concept HTML5 game developed as the project work for [T-111.5350 Multimedia Programming](https://noppa.aalto.fi/noppa/kurssi/t-111.5350/etusivu) course at [Aalto SCI](http://sci.aalto.fi/en/). The game supports touch interactions. Visit http://make.kapsi.fi/duckhunt for the live version.

The game is a single player shooting game that mimics the functionality of the famous [Duck Hunt for Nintendo](http://en.wikipedia.org/wiki/Duck_Hunt). Via a separate settings view the player can adjust the difficulty of the game by configuring the __flight paths__ of the duck, __timescale__ and __ammunition__ count. The settings view can be accessed via the cogwheel icon in the lower right hand corner. The default values for the game are as follows:

* number of ducks: 20
* speed: 2.5 seconds
* number of different flight paths: 3
* ammunition: 20

After adjusting the values in the settings view the page must be __refreshed__ for changes to take effect.

<img src="app/images/screenshot.jpg?raw=true" width="50%"/>
<img src="app/images/screenshot1.jpg?raw=true" width="50%" />

To run the game locally do as follows:

1. Install [node](http://nodejs.org/)
2. Install gulp CLI: `npm install -g gulp`
3. Install Bower: `npm install -g bower`
4. Clone the Git repository: `git clone git@github.com:MMrko/t-111.5350-project.git duckhunt` (Git must be installed)
5. Navigate to the project root folder and run `npm install` to install node packages listed in the project's _package.json_
6. Run `bower install` to install JavaScript dependencies listed in _bower.json_ (this might take a while)
7. Fire up a local server by running `gulp serve`
8. Done!

All custom CSS & JS code is to be found under _app/styles_ and _app/scripts_.

__JavaScript libraries used in the project:__

* [jQuery](http://jquery.com/)
* [FastClick](https://github.com/ftlabs/fastclick)
* [Hammer.js](http://eightmedia.github.io/hammer.js/)
* [Store](https://github.com/marcuswestin/store.js/)
* [EaselJS](https://github.com/CreateJS/EaselJS.git)
* [TweenJS](https://github.com/CreateJS/TweenJS.git)
* [SoundJS](https://github.com/CreateJS/SoundJS.git)
* [GreenSock](https://github.com/greensock/GreenSock-JS.git)
* [FlipClock](https://github.com/objectivehtml/FlipClock.git)
* [jQuery Simple Slider](https://github.com/loopj/jquery-simple-slider.git)
