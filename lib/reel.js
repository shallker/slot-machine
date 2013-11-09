var Progress = require('progress');
var eventy = require('eventy');
var delta = require('delta');

module.exports = Reel;

function Reel(el) {
  var reel = eventy(this);

  reel.el = el;
  reel.fps = 60;
  reel.spinning;
  reel.progress;
  reel.height = 300;
  reel.item = 0;
  reel.items = 3;

  Object.defineProperty(reel, 'spinHeight', {
    get: function () {
      var Y = this.el.style.backgroundPosition.split(' ').pop();

      return parseFloat(Y);
    },

    set: function (value) {
      this.el.style.backgroundPosition = '0px '+ value + 'px';
    }
  });

  /**
   * Setup a default value of backgroundPosition style
   */
  reel.el.style.backgroundPosition = '0px 0px';
}

Reel.prototype.spin = function (accelerationComplete) {
  var reel = this;
  var progress = new Progress;
  var isAccelerationComplete = false;

  progress.begin = 0;
  progress.end = Math.round(Math.random() * 5) + 20;
  progress.duration = 1000;
  progress.delta = delta.easeInQuad;
  progress.start();
  reel.progress = progress

  reel.spinning = setInterval(function () {
    /** For Firefox */
    var positionX = '0px';
    var positionY = reel.spinHeight + reel.progress.progression + 'px';

    reel.el.style.backgroundPosition = positionX + ' ' + positionY;

    /**
     * Trigger accelerationComplete for the first time
     */
    if (!isAccelerationComplete && progress.done) {
      isAccelerationComplete = true;
      accelerationComplete && accelerationComplete();
    }
  }, 1000 / this.fps);
}

Reel.prototype.stop = function (decelerationComplete) {
  var reel = this;

  /**
   * Stop the spinning first
   */
  clearInterval(reel.spinning);

  /**
   * Average height of items
   */
  var itemHeight = reel.height / reel.items;
  
  /**
   * How many rounds we've ran
   */
  var laps = Math.floor(reel.spinHeight / reel.height);

  /**
   * How long we ran in the last round
   */
  var remainder = reel.spinHeight % reel.height;

  /**
   * The nth item in the last round
   */
  var nth = Math.ceil(remainder / itemHeight);

  /**
   * Let's spin the reel to the nth item
   */
  var end = (laps * reel.height) + (nth * itemHeight);

  reel.el.style.backgroundPosition = '0px' + ' ' + end + 'px';

  /**
   * Turn the nth in descend order because we're spinning in reverse mode
   */
  reel.item = this.items - (nth - 1);

  decelerationComplete && decelerationComplete();
}
