'use strict';

function Character(destiny, data) {
  var base = data.characterBase;

  this.destiny = destiny;
  this.id = base.id;

  //
  // @see https://gist.github.com/aFreshMelon/9c4eb1f64d57b9f1cbf7 for resposnes
  //

  //
  // Generate a proxy method for the following API methods as we can pre-bind
  // the API calls with the correct character id.
  //
  [
    'main', 'inventory', 'activities', 'progression'
  ].forEach(function generate(method) {
    this[method] = destiny.character[method].bind(destiny.character, this.id);
  }, this);
}

//
// Expose the interface.
//
module.exports = Character;
