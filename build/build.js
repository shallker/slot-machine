
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-domify/index.js", function(exports, require, module){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Wrap map from jquery.
 */

var map = {
  option: [1, '<select multiple="multiple">', '</select>'],
  optgroup: [1, '<select multiple="multiple">', '</select>'],
  legend: [1, '<fieldset>', '</fieldset>'],
  thead: [1, '<table>', '</table>'],
  tbody: [1, '<table>', '</table>'],
  tfoot: [1, '<table>', '</table>'],
  colgroup: [1, '<table>', '</table>'],
  caption: [1, '<table>', '</table>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  _default: [0, '', '']
};

/**
 * Parse `html` and return the children.
 *
 * @param {String} html
 * @return {Array}
 * @api private
 */

function parse(html) {
  if ('string' != typeof html) throw new TypeError('String expected');

  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) return document.createTextNode(html);
  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = document.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = document.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  // Note: when moving children, don't rely on el.children
  // being 'live' to support Polymer's broken behaviour.
  // See: https://github.com/component/domify/pull/23
  if (1 == el.children.length) {
    return el.removeChild(el.children[0]);
  }

  var fragment = document.createDocumentFragment();
  while (el.children.length) {
    fragment.appendChild(el.removeChild(el.children[0]));
  }

  return fragment;
}

});
require.register("object-dom-object-element/index.js", function(exports, require, module){
module.exports = require('./lib/object-element');

});
require.register("object-dom-object-element/lib/events.js", function(exports, require, module){
var slice = Array.prototype.slice;

module.exports = Events;

function Events() {}

Events.prototype.on = function (eventname, callback) {
  if (typeof this.eventsRegistry[eventname] === 'undefined') {
    this.eventsRegistry[eventname] = [];
  }

  return this.eventsRegistry[eventname].push(callback);
}

Events.prototype.off = function (eventname, callback) {
  var i, callbacks = this.eventsRegistry[eventname];

  if (typeof callbacks === 'undefined') {
    return false;
  }

  for (i = 0; i < callbacks.length; i++) {
    if (callbacks[i] === callback) {
      return callbacks.splice(i, 1);
    }
  }

  return false;
}

Events.prototype.trigger = function (eventname, args) {
  args = slice.call(arguments);
  eventname = args.shift();

  var callbacks = this.eventsRegistry[eventname];
  var host = this;

  if (typeof callbacks === 'undefined') {
    return this;
  }

  callbacks.forEach(function (callback, index) {
    setTimeout(function () {
      callback.apply(host, args);
    }, 0);
  });

  return this;
}

Events.prototype.triggerSync = function (eventname, args) {
  args = slice.call(arguments);
  eventname = args.shift();

  var callbacks = this.eventsRegistry[eventname];
  var host = this;

  if (typeof callbacks === 'undefined') {
    return this;
  }

  callbacks.forEach(function (callback, index) {
    callback.apply(host, args);
  });

  return this;
}

});
require.register("object-dom-object-element/lib/object-element.js", function(exports, require, module){
var domify = require('domify');
var Events = require('./events');
var slice = Array.prototype.slice;
var supportProto = Object.getPrototypeOf({__proto__: null}) === null;

module.exports = ObjectElement;

function ObjectElement(element) {
  Events.apply(this, arguments);

  var eventsRegistry = {};

  Object.defineProperty(this, 'eventsRegistry', {
    get: function () {
      return eventsRegistry
    }
  });

  this.element = element;
}

if (supportProto) {
  ObjectElement.prototype.__proto__ = Events.prototype;
} else {
  ObjectElement.prototype = Object.create(Events.prototype);
}

ObjectElement.prototype.defineProperty = function (name, defines) {
  Object.defineProperty(this, name, defines);
}

ObjectElement.prototype.defineProperty('OBJECT_ELEMENT', {
  get: function () {
    return 1;
  }
});

/**
 * Shortcut to .element.id
 */
ObjectElement.prototype.defineProperty('id', {
  get: function () {
    return this.element.id;
  },

  set: function (value) {
    this.element.id = value;
  }
});

/**
 * Get or set textContent of the element
 */
ObjectElement.prototype.defineProperty('text', {
  get: function () {
    return this.element.textContent;
  },

  set: function (value) {
    this.element.textContent = value;
  }
});

/**
 * Get or set innerHTML of the element
 */
ObjectElement.prototype.defineProperty('html', {
  get: function () {
    return this.element.innerHTML;
  },

  set: function (htmlString) {
    this.element.innerHTML = '';
    this.element.appendChild(domify(htmlString));
  }
});

/**
 * Call a function on this element
 * @param  {Function callback}
 * @return {Null}
 */
ObjectElement.prototype.tie = function (callback) {
  callback.call(this, this.element);
}

});
require.register("object-dom-object-div-element/index.js", function(exports, require, module){
module.exports = require('./lib/object-div-element');

});
require.register("object-dom-object-div-element/lib/object-div-element.js", function(exports, require, module){
var ObjectElement = require('object-element');
var supportProto = Object.getPrototypeOf({__proto__: null}) === null;

module.exports = ObjectDivElement;

function ObjectDivElement(element) {
  element = element || document.createElement('div');
  ObjectElement.call(this, element);
}

if (supportProto) {
  ObjectDivElement.prototype.__proto__ = ObjectElement.prototype;
} else {
  ObjectDivElement.prototype = Object.create(ObjectElement.prototype);
}

ObjectDivElement.prototype.defineProperty('tag', {
  get: function () {
    return 'div';
  }
});

});
require.register("object-dom-object-document/index.js", function(exports, require, module){
module.exports = require('./lib/object-document');

});
require.register("object-dom-object-document/lib/object-document.js", function(exports, require, module){
var ObjectElement = require('object-element');
var ObjectDivElement = require('object-div-element');
var slice = Array.prototype.slice;

module.exports = ObjectDocument;

function ObjectDocument() {

}

/**
 * Wrap HTMLElement with ObjectElement
 * @param  {HTMLElement | ObjectElement element}
 * @return {ObjectElement}
 */
ObjectDocument.wrapElement = function (element) {
  return element.OBJECT_ELEMENT ? element : new ObjectElement(element);
}

/**
 * Loop through HTMLElements and wrap each of them with ObjectElement
 * @param  {Array elements}
 * @return {Array}
 */
ObjectDocument.wrapElements = function (elements) {
  elements = slice.call(elements);

  return elements.map(function (element, i) {
    return ObjectDocument.wrapElement(element);
  });
}

ObjectDocument.createElement = function (tag) {
  if (tag) {
    return this.wrapElement(document.createElement(tag));
  } else {
    return new ObjectDivElement;
  }
}

});
require.register("object-dom-object-element-style/index.js", function(exports, require, module){
module.exports = require('./lib/object-element-style');

});
require.register("object-dom-object-element-style/lib/object-element-style.js", function(exports, require, module){
var ObjectElement = require('object-element');

/**
 * Shortcut to .element.style
 */
ObjectElement.prototype.defineProperty('style', {
  get: function () {
    return this.element.style;
  }
});

/**
 * Get element's visibility state
 */
ObjectElement.prototype.defineProperty('hidden', {
  get: function () {
    return this.element.style.display === 'none' ? true : false;
  }
});

/**
 * Get or set element's opacity
 */
ObjectElement.prototype.defineProperty('opacity', {
  get: function () {
    return parseInt(this.element.style.opacity, 10);
  },

  set: function (value) {
    this.element.style.opacity = value;
  }
});

/**
 * Get or set element's width
 */
ObjectElement.prototype.defineProperty('width', {
  get: function () {
    return this.element.offsetWidth;
  },

  set: function (value) {
    this.style.width = value + 'px';
  }
});

/**
 * Get or set element's height
 */
ObjectElement.prototype.defineProperty('height', {
  get: function () {
    return this.element.offsetHeight;
  },

  set: function (value) {
    this.style.height = value + 'px';
  }
});

/**
 * Display element in DOM
 */
ObjectElement.prototype.show = function () {
  if (this.element.style.display === 'none') {
    this.element.style.display = '';
  } else {
    this.element.style.display = 'block';
  }
}

ObjectElement.prototype.displayBlock = function () {
  this.element.style.display = 'block';  
}

ObjectElement.prototype.displayNone = function () {
  this.element.style.display = 'none';  
}

/**
 * Hide element in DOM
 */
ObjectElement.prototype.hide = function () {
  this.element.style.display = 'none';
}

/**
 * Get or set element's tyle
 * @param  [String name]
 * @param  [String value]
 * @return {[type]}
 */
ObjectElement.prototype.css = function (name, value) {
  if (arguments.length === 0) {
    return this.element.style;
  }

  if (arguments.length === 1) {
    return this.element.style[name];
  }

  if (arguments.length === 2) {
    this.style[name] = value;
  }
}

ObjectElement.prototype.hasClass = function (name) {
  return this.element.classList.contains(name);
}

ObjectElement.prototype.addClass = function (name) {
  this.triggerSync('add-class', name);
  this.element.classList.add(name);
  this.trigger('added-class', name);
}

ObjectElement.prototype.removeClass = function (name) {
  this.triggerSync('remove-class', name);
  this.element.classList.remove(name);
  this.trigger('removed-class', name);
}

ObjectElement.prototype.toggleClass = function (name) {
  this.triggerSync('toggle-class', name);

  if (this.hasClass(name)) {
    this.removeClass(name);
  } else {
    this.addClass(name);
  }

  this.trigger('toggled-class', name);
}

});
require.register("object-dom-object-element-selection/index.js", function(exports, require, module){
module.exports = require('./lib/object-element-selection');

});
require.register("object-dom-object-element-selection/lib/object-element-selection.js", function(exports, require, module){
var ObjectElement = require('object-element');
var ObjectDocument = require('object-document');
var slice = Array.prototype.slice;

/**
 * Match the element against the selector
 * @param  {ObjectElement | Element element}
 * @param  {String selector}
 * @return {Boolean}
 */
function match(element, selector) {
  element = element.OBJECT_ELEMENT ? element.element : element;

  var matchesSelector = element.webkitMatchesSelector 
    || element.mozMatchesSelector 
    || element.oMatchesSelector 
    || element.matchesSelector;

  return matchesSelector.call(element, selector);
}

/**
 * Loop through all elements and match theme against th selector
 * @param  {Array elements}
 * @param  {String selector}
 * @return {Array elements}
 */
function matchAll(elements, selector) {
  return elements.filter(function (element, i) {
    return match(element, selector);
  });
}

/**
 * Loop through each element and return the first matched element
 * @param  {Array elements}
 * @param  {String selector}
 * @return {Element | Null}
 */
function matchFirst(elements, selector) {
  var i;

  for (i = 0; i < elements.length; i++) {
    if (match(elements[i], selector)) {
      return elements[i];
    }
  }

  return null;
}

/**
 * Loop through each element and return the last matched element
 * @param  {Array elements}
 * @param  {String selector}
 * @return {Element | Null}
 */
function matchLast(elements, selector) {
  /**
   * Clone an array of the elements reference first
   */
  return matchFirst(elements.slice().reverse(), selector);
}

/**
 * Return an array containing ELEMENT_NODE from ndoes
 * @param  {NodeList nodes}
 * @return {Array}
 */
function elementNodesOf(nodes) {
  return slice.call(nodes).map(function (node, i) {
    if (node.nodeType === 1) {
      return node;
    }
  });
}

ObjectElement.prototype.defineProperty('ancestors', {
  get: function () {
    var ancestors = [],
        parent = this.parent;

    while (parent && (parent.nodeType !== parent.DOCUMENT_NODE)) {
      ancestors.push(parent);
      parent = parent.parentNode;
    }

    return ancestors;
  }
});

ObjectElement.prototype.defineProperty('parent', {
  get: function () {
    return ObjectDocument.wrapElement(this.element.parentNode);
  }
});

ObjectElement.prototype.defineProperty('firstSibling', {
  get: function () {
    return ObjectDocument.wrapElement(this.parent).firstChild;
  }
});

ObjectElement.prototype.defineProperty('lastSibling', {
  get: function () {
    return ObjectDocument.wrapElement(this.parent).lastChild;
  }
});

ObjectElement.prototype.defineProperty('prevSibling', {
  get: function () {
    var prev;

    if ('previousElementSibling' in this.element) {
      prev = this.element.previousElementSibling;
    } else {
      prev = this.element.previousSibling;

      while (prev && prev.nodeType !== prev.ELEMENT_NODE) {
        prev = prev.previousSibling;
      }
    }

    return prev ? ObjectDocument.wrapElement(prev) : null;
  }
});

ObjectElement.prototype.defineProperty('nextSibling', {
  get: function () {
    var next;
    if ('nextElementSibling' in this.element) {
      next = this.element.nextElementSibling;
    } else {
      next = this.element.nextSibling;

      while (next && next.nodeType !== next.ELEMENT_NODE) {
        next = next.nextSibling;
      }
    }

    return next ? ObjectDocument.wrapElement(next) : null;
  }
});

ObjectElement.prototype.defineProperty('prevSiblings', {
  get: function () {
    var prevs = [];
    var prev = this.prevSibling;

    while (prev) {
      prevs.push(prev);
      prev = prev.prevSibling;
    }

    return prevs.reverse();
  }
});

ObjectElement.prototype.defineProperty('nextSiblings', {
  get: function () {
    var nexts = [];
    var next = this.nextSibling;

    while (next) {
      nexts.push(next);
      next = next.nextSibling;
    }

    return nexts;
  }
});

ObjectElement.prototype.defineProperty('siblings', {
  get: function () {
    return this.prevSiblings.concat(this.nextSiblings);
  }
});

ObjectElement.prototype.defineProperty('firstChild', {
  get: function () {
    var first;

    if ('firstElementChild' in this.element) {
      first = this.element.firstElementChild;
    } else {
      first = this.element.firstChild;

      while (first && first.nodeType !== first.ELEMENT_NODE) {
        first = first.nextSibling;
      }
    }

    return first ? ObjectDocument.wrapElement(first) : null;
  }
});

ObjectElement.prototype.defineProperty('lastChild', {
  get: function () {
    var last;

    if ('lastElementChild' in this.element) {
      last = this.element.lastElementChild;
    } else {
      last = this.element.lastChild;

      while (last && last.nodeType !== last.ELEMENT_NODE) {
        last = last.previousSibling;
      }
    }

    return last ? ObjectDocument.wrapElement(last) : null;
  }
});

/**
 * Get the fist level child elements
 * @param  {[type] element}
 * @return {[type]}
 */
ObjectElement.prototype.defineProperty('children', {
  get: function () {
    var children;

    if ('children' in this.element) {
      children = slice.call(this.element.children);
    } else {
      children = slice.call(this.element.childNodes).map(function (node, i) {
        if (node.nodeType === node.ELEMENT_NODE) {
          return node;
        }
      });
    }

    if (children.length === 0) {
      return children;
    }

    return ObjectDocument.wrapElements(children);
  }
});

/** #TODO */
ObjectElement.prototype.defineProperty('descendants', {
  get: function () {

  }
});

/**
 * Matching the element against selector
 * @param  {String selector}
 * @return {Boolean}
 */
ObjectElement.prototype.match = function (selector) {
  var matchesSelector = this.element.matchesSelector 
    || this.element.webkitMatchesSelector 
    || this.element.mozMatchesSelector 
    || this.element.oMatchesSelector;

  return matchesSelector.call(this.element, selector);
}

/** Selection methods */

ObjectElement.prototype.selectFirstSibling = function (selector) {
  
}

ObjectElement.prototype.selectLastSibling = function (selector) {
  
}

ObjectElement.prototype.selectPrevSibling = function (selector) {
  var prev = matchLast(this.prevSiblings, selector);

  if (prev === null) {
    return prev;
  }

  return ObjectDocument.wrapElement(prev);
}

ObjectElement.prototype.selectNextSibling = function (selector) {
  var next = matchFirst(this.nextSiblings, selector);

  if (next === null) {
    return next;
  }

  return ObjectDocument.wrapElement(next);
}

/**
 * Alias of .selectPrevSibling()
 */
ObjectElement.prototype.prev = ObjectElement.prototype.selectPrevSibling;

/**
 * Alias of .selectNextSibling()
 */
ObjectElement.prototype.next = ObjectElement.prototype.selectNextSibling;

ObjectElement.prototype.selectPrevSiblings = function (selector) {
  var prevs = matchAll(this.prevSiblings, selector);

  if (prevs.length === 0) {
    return prevs;
  }

  return ObjectDocument.wrapElements(prevs);
}

ObjectElement.prototype.selectNextSiblings = function (selector) {
  var nexts = matchAll(this.nextSiblings, selector);

  if (nexts.length === 0) {
    return nexts;
  }

  return ObjectDocument.wrapElements(nexts);
}

ObjectElement.prototype.selectSiblings = function (selector) {
  return this.selectPrevSiblings(selector).concat(this.selectNextSiblings(selector));
}

/**
 * Select element's child elements by selector or not
 * @param  {String selector}
 * @return {Array}
 */
ObjectElement.prototype.selectChildren = function (selector) {
  var children = this.children;

  if (children.length && selector) {
    children = matchAll(children, selector);
  }

  if (children.length === 0) {
    return children;
  }

  return ObjectDocument.wrapElements(children);
}

/**
 * Get first child element by selector or not
 * @param  {String selector}
 * @return {ObjectElement}
 */
ObjectElement.prototype.selectFirstChild = function (selector) {
  return ObjectDocument.wrapElement(matchFirst(this.children, selector));
}

/**
 * Get last child element by the selector or not
 * @param  {String selector}
 * @return {ObjectElement}
 */
ObjectElement.prototype.selectLastChild = function (selector) {
  return ObjectDocument.wrapElement(matchLast(this.children, selector));
}

/**
 * Select all elements descended from the element that match the selector
 * @param  {String selector}
 * @return {Array}
 */
ObjectElement.prototype.select = function (selector) {
  var nodeList = slice.call(this.element.querySelectorAll(selector));

  if (nodeList.length === 0) {
    return [];
  }

  return ObjectDocument.wrapElements(nodeList);
}

/**
 * Select the first element descended from the element that matchs the selector
 * @param  {String selector}
 * @return {ObjectElement | null}
 */
ObjectElement.prototype.selectFirst = function (selector) {
  var element = this.element.querySelector(selector);

  if (element === null) {
    return null;
  }

  return ObjectDocument.wrapElement(element);
}

/**
 * Select the last element descended from the element that matchs the selector
 * @param  {String selector}
 * @return {ObjectElement | null}
 */
ObjectElement.prototype.selectLast = function (selector) {
  var elements = this.select(selector);

  if (elements.length === 0) {
    return null;
  }

  return ObjectDocument.wrapElement(elements.pop());
}

});
require.register("polyfill-Array.prototype.map/component.js", function(exports, require, module){
require('./Array.prototype.map');

});
require.register("polyfill-Array.prototype.map/Array.prototype.map.js", function(exports, require, module){
// @from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.com/#x15.4.4.19
if (!Array.prototype.map) {
  Array.prototype.map = function(callback, thisArg) {

    var T, A, k;

    if (this == null) {
      throw new TypeError(" this is null or not defined");
    }

    // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
    var O = Object(this);

    // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0;

    // 4. If IsCallable(callback) is false, throw a TypeError exception.
    // See: http://es5.github.com/#x9.11
    if (typeof callback !== "function") {
      throw new TypeError(callback + " is not a function");
    }

    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    if (thisArg) {
      T = thisArg;
    }

    // 6. Let A be a new array created as if by the expression new Array(len) where Array is
    // the standard built-in constructor with that name and len is the value of len.
    A = new Array(len);

    // 7. Let k be 0
    k = 0;

    // 8. Repeat, while k < len
    while(k < len) {

      var kValue, mappedValue;

      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      if (k in O) {

        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
        kValue = O[ k ];

        // ii. Let mappedValue be the result of calling the Call internal method of callback
        // with T as the this value and argument list containing kValue, k, and O.
        mappedValue = callback.call(T, kValue, k, O);

        // iii. Call the DefineOwnProperty internal method of A with arguments
        // Pk, Property Descriptor {Value: mappedValue, : true, Enumerable: true, Configurable: true},
        // and false.

        // In browsers that support Object.defineProperty, use the following:
        // Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });

        // For best browser support, use the following:
        A[ k ] = mappedValue;
      }
      // d. Increase k by 1.
      k++;
    }

    // 9. return A
    return A;
  };      
}

});
require.register("shallker-array-forEach-shim/index.js", function(exports, require, module){
/*
  @from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
*/
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (fn, scope) {
        'use strict';
        var i, len;
        for (i = 0, len = this.length; i < len; ++i) {
            if (i in this) {
                fn.call(scope, this[i], i, this);
            }
        }
    };
}

});
require.register("shallker-wang-dever/component.js", function(exports, require, module){
require('Array.prototype.map');
require('array-foreach-shim');

exports = module.exports = require('./util/dever');

exports.version = '2.0.1';

});
require.register("shallker-wang-dever/util/dever.js", function(exports, require, module){
/* Log level */
/*
  0 EMERGENCY system is unusable
  1 ALERT action must be taken immediately
  2 CRITICAL the system is in critical condition
  3 ERROR error condition
  4 WARNING warning condition
  5 NOTICE a normal but significant condition
  6 INFO a purely informational message
  7 DEBUG messages to debug an application
*/

var slice = Array.prototype.slice,
    dev,
    pro,
    config,
    level = {
      "0": "EMERGENCY",
      "1": "ALERT",
      "2": "CRITICAL",
      "3": "ERROR",
      "4": "WARNING",
      "5": "NOTICE",
      "6": "INFO",
      "7": "DEBUG"
    };

function readFileJSON(path) {
  var json = require('fs').readFileSync(path, {encoding: 'utf8'});
  return JSON.parse(json);
}

function loadConfig(name) {
  return readFileJSON(process.env.PWD + '/' + name);
}

function defaultConfig() {
  return {
    "output": {
      "EMERGENCY": false,
      "ALERT": false,
      "CRITICAL": false,
      "ERROR": false,
      "WARNING": true,
      "NOTICE": true,
      "INFO": true,
      "DEBUG": false 
    },
    "throw": false
  }
}

try { dev = loadConfig('dev.json'); } catch (e) {}
try { pro = loadConfig('pro.json'); } catch (e) {}

config = dev || pro || defaultConfig();

function log() {
  console.log.apply(console, slice.call(arguments));
}

function debug() {
  var args = slice.call(arguments)
  args.unshift('[Debug]');
  if (console.debug) {
    console.debug.apply(console, args);
  } else {
    console.log.apply(console, args);
  }
}

function info() {
  var args = slice.call(arguments)
  args.unshift('[Info]');
  if (console.info) {
    console.info.apply(console, args)
  } else {
    console.log.apply(console, args)
  }
}

function notice() {
  var args = slice.call(arguments)
  args.unshift('[Notice]');
  if (console.notice) {
    console.notice.apply(console, args);
  } else {
    console.log.apply(console, args);
  }
}

function warn() {
  var args = slice.call(arguments)
  args.unshift('[Warn]');
  if (console.warn) {
    console.warn.apply(console, args);
  } else {
    console.log.apply(console, args);
  }
}

function error(err) {
  if (config["throw"]) {
    /* remove first line trace which is from here */
    err.stack = err.stack.replace(/\n\s*at\s*\S*/, '');
    throw err;
  } else {
    var args = ['[Error]'];
    err.name && (err.name += ':') && (args.push(err.name));
    args.push(err.message);
    console.log.apply(console, args);
  }
  return false;
}

exports.config = function(json) {
  config = json;
}

exports.debug = function(froms) {
  froms = slice.call(arguments).map(function(from) {
    return '[' + from + ']';
  });

  function exDebug() {
    if (!config.output['DEBUG']) return;
    return debug.apply({}, froms.concat(slice.call(arguments)));
  }

  exDebug.off = function() {
    return function() {}
  }

  return exDebug;
}

exports.info = function(froms) {
  froms = slice.call(arguments).map(function(from) {
    return '[' + from + ']';
  });

  function exInfo() {
    if (!config.output['INFO']) return;
    return info.apply({}, froms.concat(slice.call(arguments)));
  }

  exInfo.off = function() {
    return function() {}
  }

  return exInfo;
}

exports.notice = function(froms) {
  froms = slice.call(arguments).map(function(from) {
    return '[' + from + ']';
  });

  function exNotice() {
    if (!config.output['NOTICE']) return;
    return notice.apply({}, froms.concat(slice.call(arguments)));
  }

  exNotice.off = function() {
    return function() {}
  }

  return exNotice;
}

exports.warn = function(froms) {
  froms = slice.call(arguments).map(function(from) {
    return '[' + from + ']';
  });

  function exWarn() {
    if (!config.output['WARNING']) return;
    return warn.apply({}, froms.concat(slice.call(arguments)));
  }

  exWarn.off = function() {
    return function() {}
  }

  return exWarn;
}

exports.error = function(froms) {
  froms = slice.call(arguments).map(function(from) {
    return '[' + from + ']';
  });

  function exError() {
    var err;
    if (!config.output['ERROR']) return false;
    err = new Error(slice.call(arguments).join(' '));
    err.name = froms.join(' ');
    return error(err);
  }

  exError.off = function() {
    return function() {}
  }

  return exError;
}

});
require.register("shallker-wang-eventy/index.js", function(exports, require, module){
module.exports = require('./lib/eventy');

});
require.register("shallker-wang-eventy/lib/eventy.js", function(exports, require, module){
var debug = require('dever').debug('Eventy'),
    error = require('dever').error('Eventy'),
    warn = require('dever').warn('Eventy'),
    slice = Array.prototype.slice;

module.exports = function Eventy(object) {
  var registry = {};

  var constructor = function () {
    return this;
  }.call(object || {});

  /**
   * Remove the first matched callback from callbacks array
   */
  function removeCallback(callback, callbacks) {
    for (var i = 0; i < callbacks.length; i++) {
      if (callbacks[i] === callback) {
        return callbacks.splice(i, 1);
      }
    }

    return false;
  }

  /**
   * Listen to an event with a callback
   * @param  {String eventname}
   * @param  {Function callback}
   * @return {Object constructor || Boolean false}
   */
  constructor.on = function (eventname, callback) {
    if (typeof callback !== 'function') {
      error('callback is not a function');
      return false;
    }

    if (typeof registry[eventname] === 'undefined') {
      registry[eventname] = [];
    }

    registry[eventname].push(callback);
    return this;
  }

  /**
   * Remove one callback from the event callback list
   * @param  {String eventname}
   * @param  {Function callback}
   * @return {Object constructor || Boolean false}
   */
  constructor.off = function (eventname, callback) {
    if (typeof callback !== 'function') {
      error('callback is not a function');
      return false;
    }

    if (typeof registry[eventname] === 'undefined') {
      error('unregistered event');
      return false;
    }

    var callbacks = registry[eventname];

    if (callbacks.length === 0) {
      return this;
    }

    removeCallback(callback, callbacks);
    return this;
  }

  /**
   * Loop through all callbacks of the event and call them asynchronously
   * @param  {String eventname}
   * @param  [Arguments args]
   * @return {Object constructor}
   */
  constructor.trigger = function (eventname, args) {
    args = slice.call(arguments);
    eventname = args.shift();

    if (typeof registry[eventname] === 'undefined') {
      return this;
    }

    var callbacks = registry[eventname];

    if (callbacks.length === 0) {
      return this;
    }

    var host = this;

    callbacks.forEach(function (callback, index) {
      setTimeout(function () {
        callback.apply(host, args);
      }, 0);
    });

    return this;
  }

  /**
   * Alias of trigger
   */
  constructor.emit = constructor.trigger;

  /**
   * Loop through all callbacks of the event and call them synchronously
   * @param  {String eventname}
   * @param  [Arguments args]
   * @return {Object constructor}
   */
  constructor.triggerSync = function (eventname, args) {
    args = slice.call(arguments);
    eventname = args.shift();

    if (typeof registry[eventname] === 'undefined') {
      return this;
    }

    var callbacks = registry[eventname];

    if (callbacks.length === 0) {
      return this;
    }

    var host = this;

    callbacks.forEach(function (callback, index) {
      callback.apply(host, args);
    });

    return this;
  }

  return constructor;
}

});
require.register("shallker-progress/index.js", function(exports, require, module){
module.exports = require('./lib/progress');

});
require.register("shallker-progress/lib/progress.js", function(exports, require, module){
var eventy = require('eventy');

module.exports = Progress;

function Progress() {
  var progress = eventy(this);

  progress.begin = 0;
  progress.end = 1;
  progress.duration = 1000;
  progress.done = false;

  Object.defineProperty(progress, 'progression', {
    get: function () {
      var passed = new Date - this.startTime;
      var progression = passed / this.duration;

      if (progression > 1) {
        progression = 1;
        this.done = true;
      }

      progression = this.delta(progression);

      return progression * (this.end - this.begin) + this.begin;
    }
  });
}

Progress.prototype.delta = function (progression) {
  return progression;
}

Progress.prototype.start = function () {
  this.startTime = new Date;
}

});
require.register("shallker-delta/index.js", function(exports, require, module){
module.exports = require('./lib/delta');

});
require.register("shallker-delta/lib/delta.js", function(exports, require, module){
exports.linear = function (progress) {
  return progress;
}

exports.easeInQuad = function (progress) {
  return progress * progress;
}

exports.easeOutQuad = function (progress) {
  return -progress * (progress - 2);
}

});
require.register("slot-machine/index.js", function(exports, require, module){
require('object-element-style');
require('object-element-selection');

module.exports = require('./lib/slot-machine');

});
require.register("slot-machine/lib/slot-machine.js", function(exports, require, module){
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

});
require.register("slot-machine/lib/reel.js", function(exports, require, module){
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

});
















require.alias("object-dom-object-document/index.js", "slot-machine/deps/object-document/index.js");
require.alias("object-dom-object-document/lib/object-document.js", "slot-machine/deps/object-document/lib/object-document.js");
require.alias("object-dom-object-document/index.js", "slot-machine/deps/object-document/index.js");
require.alias("object-dom-object-document/index.js", "object-document/index.js");
require.alias("object-dom-object-element/index.js", "object-dom-object-document/deps/object-element/index.js");
require.alias("object-dom-object-element/lib/events.js", "object-dom-object-document/deps/object-element/lib/events.js");
require.alias("object-dom-object-element/lib/object-element.js", "object-dom-object-document/deps/object-element/lib/object-element.js");
require.alias("object-dom-object-element/index.js", "object-dom-object-document/deps/object-element/index.js");
require.alias("component-domify/index.js", "object-dom-object-element/deps/domify/index.js");

require.alias("object-dom-object-element/index.js", "object-dom-object-element/index.js");
require.alias("object-dom-object-div-element/index.js", "object-dom-object-document/deps/object-div-element/index.js");
require.alias("object-dom-object-div-element/lib/object-div-element.js", "object-dom-object-document/deps/object-div-element/lib/object-div-element.js");
require.alias("object-dom-object-div-element/index.js", "object-dom-object-document/deps/object-div-element/index.js");
require.alias("object-dom-object-element/index.js", "object-dom-object-div-element/deps/object-element/index.js");
require.alias("object-dom-object-element/lib/events.js", "object-dom-object-div-element/deps/object-element/lib/events.js");
require.alias("object-dom-object-element/lib/object-element.js", "object-dom-object-div-element/deps/object-element/lib/object-element.js");
require.alias("object-dom-object-element/index.js", "object-dom-object-div-element/deps/object-element/index.js");
require.alias("component-domify/index.js", "object-dom-object-element/deps/domify/index.js");

require.alias("object-dom-object-element/index.js", "object-dom-object-element/index.js");
require.alias("object-dom-object-div-element/index.js", "object-dom-object-div-element/index.js");
require.alias("object-dom-object-document/index.js", "object-dom-object-document/index.js");
require.alias("object-dom-object-element-style/index.js", "slot-machine/deps/object-element-style/index.js");
require.alias("object-dom-object-element-style/lib/object-element-style.js", "slot-machine/deps/object-element-style/lib/object-element-style.js");
require.alias("object-dom-object-element-style/index.js", "slot-machine/deps/object-element-style/index.js");
require.alias("object-dom-object-element-style/index.js", "object-element-style/index.js");
require.alias("object-dom-object-element/index.js", "object-dom-object-element-style/deps/object-element/index.js");
require.alias("object-dom-object-element/lib/events.js", "object-dom-object-element-style/deps/object-element/lib/events.js");
require.alias("object-dom-object-element/lib/object-element.js", "object-dom-object-element-style/deps/object-element/lib/object-element.js");
require.alias("object-dom-object-element/index.js", "object-dom-object-element-style/deps/object-element/index.js");
require.alias("component-domify/index.js", "object-dom-object-element/deps/domify/index.js");

require.alias("object-dom-object-element/index.js", "object-dom-object-element/index.js");
require.alias("object-dom-object-element-style/index.js", "object-dom-object-element-style/index.js");
require.alias("object-dom-object-element-selection/index.js", "slot-machine/deps/object-element-selection/index.js");
require.alias("object-dom-object-element-selection/lib/object-element-selection.js", "slot-machine/deps/object-element-selection/lib/object-element-selection.js");
require.alias("object-dom-object-element-selection/index.js", "slot-machine/deps/object-element-selection/index.js");
require.alias("object-dom-object-element-selection/index.js", "object-element-selection/index.js");
require.alias("object-dom-object-element/index.js", "object-dom-object-element-selection/deps/object-element/index.js");
require.alias("object-dom-object-element/lib/events.js", "object-dom-object-element-selection/deps/object-element/lib/events.js");
require.alias("object-dom-object-element/lib/object-element.js", "object-dom-object-element-selection/deps/object-element/lib/object-element.js");
require.alias("object-dom-object-element/index.js", "object-dom-object-element-selection/deps/object-element/index.js");
require.alias("component-domify/index.js", "object-dom-object-element/deps/domify/index.js");

require.alias("object-dom-object-element/index.js", "object-dom-object-element/index.js");
require.alias("object-dom-object-document/index.js", "object-dom-object-element-selection/deps/object-document/index.js");
require.alias("object-dom-object-document/lib/object-document.js", "object-dom-object-element-selection/deps/object-document/lib/object-document.js");
require.alias("object-dom-object-document/index.js", "object-dom-object-element-selection/deps/object-document/index.js");
require.alias("object-dom-object-element/index.js", "object-dom-object-document/deps/object-element/index.js");
require.alias("object-dom-object-element/lib/events.js", "object-dom-object-document/deps/object-element/lib/events.js");
require.alias("object-dom-object-element/lib/object-element.js", "object-dom-object-document/deps/object-element/lib/object-element.js");
require.alias("object-dom-object-element/index.js", "object-dom-object-document/deps/object-element/index.js");
require.alias("component-domify/index.js", "object-dom-object-element/deps/domify/index.js");

require.alias("object-dom-object-element/index.js", "object-dom-object-element/index.js");
require.alias("object-dom-object-div-element/index.js", "object-dom-object-document/deps/object-div-element/index.js");
require.alias("object-dom-object-div-element/lib/object-div-element.js", "object-dom-object-document/deps/object-div-element/lib/object-div-element.js");
require.alias("object-dom-object-div-element/index.js", "object-dom-object-document/deps/object-div-element/index.js");
require.alias("object-dom-object-element/index.js", "object-dom-object-div-element/deps/object-element/index.js");
require.alias("object-dom-object-element/lib/events.js", "object-dom-object-div-element/deps/object-element/lib/events.js");
require.alias("object-dom-object-element/lib/object-element.js", "object-dom-object-div-element/deps/object-element/lib/object-element.js");
require.alias("object-dom-object-element/index.js", "object-dom-object-div-element/deps/object-element/index.js");
require.alias("component-domify/index.js", "object-dom-object-element/deps/domify/index.js");

require.alias("object-dom-object-element/index.js", "object-dom-object-element/index.js");
require.alias("object-dom-object-div-element/index.js", "object-dom-object-div-element/index.js");
require.alias("object-dom-object-document/index.js", "object-dom-object-document/index.js");
require.alias("object-dom-object-element-selection/index.js", "object-dom-object-element-selection/index.js");
require.alias("shallker-wang-eventy/index.js", "slot-machine/deps/eventy/index.js");
require.alias("shallker-wang-eventy/lib/eventy.js", "slot-machine/deps/eventy/lib/eventy.js");
require.alias("shallker-wang-eventy/index.js", "slot-machine/deps/eventy/index.js");
require.alias("shallker-wang-eventy/index.js", "eventy/index.js");
require.alias("shallker-wang-dever/component.js", "shallker-wang-eventy/deps/dever/component.js");
require.alias("shallker-wang-dever/util/dever.js", "shallker-wang-eventy/deps/dever/util/dever.js");
require.alias("shallker-wang-dever/component.js", "shallker-wang-eventy/deps/dever/index.js");
require.alias("polyfill-Array.prototype.map/component.js", "shallker-wang-dever/deps/Array.prototype.map/component.js");
require.alias("polyfill-Array.prototype.map/Array.prototype.map.js", "shallker-wang-dever/deps/Array.prototype.map/Array.prototype.map.js");
require.alias("polyfill-Array.prototype.map/component.js", "shallker-wang-dever/deps/Array.prototype.map/index.js");
require.alias("polyfill-Array.prototype.map/component.js", "polyfill-Array.prototype.map/index.js");
require.alias("shallker-array-forEach-shim/index.js", "shallker-wang-dever/deps/array-foreach-shim/index.js");
require.alias("shallker-array-forEach-shim/index.js", "shallker-wang-dever/deps/array-foreach-shim/index.js");
require.alias("shallker-array-forEach-shim/index.js", "shallker-array-forEach-shim/index.js");
require.alias("shallker-wang-dever/component.js", "shallker-wang-dever/index.js");
require.alias("shallker-wang-eventy/index.js", "shallker-wang-eventy/index.js");
require.alias("shallker-progress/index.js", "slot-machine/deps/progress/index.js");
require.alias("shallker-progress/lib/progress.js", "slot-machine/deps/progress/lib/progress.js");
require.alias("shallker-progress/index.js", "slot-machine/deps/progress/index.js");
require.alias("shallker-progress/index.js", "progress/index.js");
require.alias("shallker-wang-eventy/index.js", "shallker-progress/deps/eventy/index.js");
require.alias("shallker-wang-eventy/lib/eventy.js", "shallker-progress/deps/eventy/lib/eventy.js");
require.alias("shallker-wang-eventy/index.js", "shallker-progress/deps/eventy/index.js");
require.alias("shallker-wang-dever/component.js", "shallker-wang-eventy/deps/dever/component.js");
require.alias("shallker-wang-dever/util/dever.js", "shallker-wang-eventy/deps/dever/util/dever.js");
require.alias("shallker-wang-dever/component.js", "shallker-wang-eventy/deps/dever/index.js");
require.alias("polyfill-Array.prototype.map/component.js", "shallker-wang-dever/deps/Array.prototype.map/component.js");
require.alias("polyfill-Array.prototype.map/Array.prototype.map.js", "shallker-wang-dever/deps/Array.prototype.map/Array.prototype.map.js");
require.alias("polyfill-Array.prototype.map/component.js", "shallker-wang-dever/deps/Array.prototype.map/index.js");
require.alias("polyfill-Array.prototype.map/component.js", "polyfill-Array.prototype.map/index.js");
require.alias("shallker-array-forEach-shim/index.js", "shallker-wang-dever/deps/array-foreach-shim/index.js");
require.alias("shallker-array-forEach-shim/index.js", "shallker-wang-dever/deps/array-foreach-shim/index.js");
require.alias("shallker-array-forEach-shim/index.js", "shallker-array-forEach-shim/index.js");
require.alias("shallker-wang-dever/component.js", "shallker-wang-dever/index.js");
require.alias("shallker-wang-eventy/index.js", "shallker-wang-eventy/index.js");
require.alias("shallker-progress/index.js", "shallker-progress/index.js");
require.alias("shallker-delta/index.js", "slot-machine/deps/delta/index.js");
require.alias("shallker-delta/lib/delta.js", "slot-machine/deps/delta/lib/delta.js");
require.alias("shallker-delta/index.js", "slot-machine/deps/delta/index.js");
require.alias("shallker-delta/index.js", "delta/index.js");
require.alias("shallker-delta/index.js", "shallker-delta/index.js");
require.alias("slot-machine/index.js", "slot-machine/index.js");