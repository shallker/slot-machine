var ObjectDocument = require('object-document');
var Reel = require('./reel');
var eventy = require('eventy');

module.exports = SlotMachine;

function SlotMachine(el) {
  var slotMachine = eventy(this);

  slotMachine.reels = [];
  slotMachine.reelItems = SlotMachine.reelItems;
  slotMachine.reelHeight = SlotMachine.reelHeight;
  slotMachine.el = ObjectDocument.wrapElement(el);

  slotMachine.el.select('.reel').forEach(function (item, index) {
    var reel = new Reel(item);

    reel.items = slotMachine.reelItems;
    reel.height = slotMachine.reelHeight;
    slotMachine.reels.push(reel);
  });
}

SlotMachine.prototype.start = function () {
  var slotMachine = this;
  var reels = slotMachine.reels.slice();
  var accelerationComplete = [];

  (function start() {
    if (reels.length) {
      reels.shift().spin(function () {
        accelerationComplete.push(1);

        if (accelerationComplete.length === slotMachine.reels.length) {
          slotMachine.trigger('start-complete');
        }
      });

      setTimeout(start, 100);
    }
  })();
}

SlotMachine.prototype.stop = function () {
  var slotMachine = this;
  var reels = slotMachine.reels.slice();
  var decelerationComplete = [];

  (function stop() {
    if (reels.length) {
      reels.shift().stop(function () {
        decelerationComplete.push(1);

        if (decelerationComplete.length === slotMachine.reels.length) {
          slotMachine.trigger('stop-complete');
        }
      });

      setTimeout(stop, 500);
    }
  })();
}
