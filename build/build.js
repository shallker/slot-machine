
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
require.register("component-domify/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `parse`.\n\
 */\n\
\n\
module.exports = parse;\n\
\n\
/**\n\
 * Wrap map from jquery.\n\
 */\n\
\n\
var map = {\n\
  option: [1, '<select multiple=\"multiple\">', '</select>'],\n\
  optgroup: [1, '<select multiple=\"multiple\">', '</select>'],\n\
  legend: [1, '<fieldset>', '</fieldset>'],\n\
  thead: [1, '<table>', '</table>'],\n\
  tbody: [1, '<table>', '</table>'],\n\
  tfoot: [1, '<table>', '</table>'],\n\
  colgroup: [1, '<table>', '</table>'],\n\
  caption: [1, '<table>', '</table>'],\n\
  tr: [2, '<table><tbody>', '</tbody></table>'],\n\
  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n\
  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n\
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],\n\
  _default: [0, '', '']\n\
};\n\
\n\
/**\n\
 * Parse `html` and return the children.\n\
 *\n\
 * @param {String} html\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function parse(html) {\n\
  if ('string' != typeof html) throw new TypeError('String expected');\n\
\n\
  html = html.replace(/^\\s+|\\s+$/g, ''); // Remove leading/trailing whitespace\n\
\n\
  // tag name\n\
  var m = /<([\\w:]+)/.exec(html);\n\
  if (!m) return document.createTextNode(html);\n\
  var tag = m[1];\n\
\n\
  // body support\n\
  if (tag == 'body') {\n\
    var el = document.createElement('html');\n\
    el.innerHTML = html;\n\
    return el.removeChild(el.lastChild);\n\
  }\n\
\n\
  // wrap map\n\
  var wrap = map[tag] || map._default;\n\
  var depth = wrap[0];\n\
  var prefix = wrap[1];\n\
  var suffix = wrap[2];\n\
  var el = document.createElement('div');\n\
  el.innerHTML = prefix + html + suffix;\n\
  while (depth--) el = el.lastChild;\n\
\n\
  // Note: when moving children, don't rely on el.children\n\
  // being 'live' to support Polymer's broken behaviour.\n\
  // See: https://github.com/component/domify/pull/23\n\
  if (1 == el.children.length) {\n\
    return el.removeChild(el.children[0]);\n\
  }\n\
\n\
  var fragment = document.createDocumentFragment();\n\
  while (el.children.length) {\n\
    fragment.appendChild(el.removeChild(el.children[0]));\n\
  }\n\
\n\
  return fragment;\n\
}\n\
//@ sourceURL=component-domify/index.js"
));
require.register("object-dom-object-element/index.js", Function("exports, require, module",
"module.exports = require('./lib/object-element');\n\
//@ sourceURL=object-dom-object-element/index.js"
));
require.register("object-dom-object-element/lib/events.js", Function("exports, require, module",
"var slice = Array.prototype.slice;\n\
\n\
module.exports = Events;\n\
\n\
function Events() {}\n\
\n\
Events.prototype.on = function (eventname, callback) {\n\
  if (typeof this.eventsRegistry[eventname] === 'undefined') {\n\
    this.eventsRegistry[eventname] = [];\n\
  }\n\
\n\
  return this.eventsRegistry[eventname].push(callback);\n\
}\n\
\n\
Events.prototype.off = function (eventname, callback) {\n\
  var i, callbacks = this.eventsRegistry[eventname];\n\
\n\
  if (typeof callbacks === 'undefined') {\n\
    return false;\n\
  }\n\
\n\
  for (i = 0; i < callbacks.length; i++) {\n\
    if (callbacks[i] === callback) {\n\
      return callbacks.splice(i, 1);\n\
    }\n\
  }\n\
\n\
  return false;\n\
}\n\
\n\
Events.prototype.trigger = function (eventname, args) {\n\
  args = slice.call(arguments);\n\
  eventname = args.shift();\n\
\n\
  var callbacks = this.eventsRegistry[eventname];\n\
  var host = this;\n\
\n\
  if (typeof callbacks === 'undefined') {\n\
    return this;\n\
  }\n\
\n\
  callbacks.forEach(function (callback, index) {\n\
    setTimeout(function () {\n\
      callback.apply(host, args);\n\
    }, 0);\n\
  });\n\
\n\
  return this;\n\
}\n\
\n\
Events.prototype.triggerSync = function (eventname, args) {\n\
  args = slice.call(arguments);\n\
  eventname = args.shift();\n\
\n\
  var callbacks = this.eventsRegistry[eventname];\n\
  var host = this;\n\
\n\
  if (typeof callbacks === 'undefined') {\n\
    return this;\n\
  }\n\
\n\
  callbacks.forEach(function (callback, index) {\n\
    callback.apply(host, args);\n\
  });\n\
\n\
  return this;\n\
}\n\
//@ sourceURL=object-dom-object-element/lib/events.js"
));
require.register("object-dom-object-element/lib/object-element.js", Function("exports, require, module",
"var domify = require('domify');\n\
var Events = require('./events');\n\
var slice = Array.prototype.slice;\n\
var supportProto = Object.getPrototypeOf({__proto__: null}) === null;\n\
\n\
module.exports = ObjectElement;\n\
\n\
function ObjectElement(element) {\n\
  Events.apply(this, arguments);\n\
\n\
  var eventsRegistry = {};\n\
\n\
  Object.defineProperty(this, 'eventsRegistry', {\n\
    get: function () {\n\
      return eventsRegistry\n\
    }\n\
  });\n\
\n\
  this.element = element;\n\
}\n\
\n\
if (supportProto) {\n\
  ObjectElement.prototype.__proto__ = Events.prototype;\n\
} else {\n\
  ObjectElement.prototype = Object.create(Events.prototype);\n\
}\n\
\n\
ObjectElement.prototype.defineProperty = function (name, defines) {\n\
  Object.defineProperty(this, name, defines);\n\
}\n\
\n\
ObjectElement.prototype.defineProperty('OBJECT_ELEMENT', {\n\
  get: function () {\n\
    return 1;\n\
  }\n\
});\n\
\n\
/**\n\
 * Shortcut to .element.id\n\
 */\n\
ObjectElement.prototype.defineProperty('id', {\n\
  get: function () {\n\
    return this.element.id;\n\
  },\n\
\n\
  set: function (value) {\n\
    this.element.id = value;\n\
  }\n\
});\n\
\n\
/**\n\
 * Get or set textContent of the element\n\
 */\n\
ObjectElement.prototype.defineProperty('text', {\n\
  get: function () {\n\
    return this.element.textContent;\n\
  },\n\
\n\
  set: function (value) {\n\
    this.element.textContent = value;\n\
  }\n\
});\n\
\n\
/**\n\
 * Get or set innerHTML of the element\n\
 */\n\
ObjectElement.prototype.defineProperty('html', {\n\
  get: function () {\n\
    return this.element.innerHTML;\n\
  },\n\
\n\
  set: function (htmlString) {\n\
    this.element.innerHTML = '';\n\
    this.element.appendChild(domify(htmlString));\n\
  }\n\
});\n\
\n\
/**\n\
 * Call a function on this element\n\
 * @param  {Function callback}\n\
 * @return {Null}\n\
 */\n\
ObjectElement.prototype.tie = function (callback) {\n\
  callback.call(this, this.element);\n\
}\n\
//@ sourceURL=object-dom-object-element/lib/object-element.js"
));
require.register("object-dom-object-div-element/index.js", Function("exports, require, module",
"module.exports = require('./lib/object-div-element');\n\
//@ sourceURL=object-dom-object-div-element/index.js"
));
require.register("object-dom-object-div-element/lib/object-div-element.js", Function("exports, require, module",
"var ObjectElement = require('object-element');\n\
var supportProto = Object.getPrototypeOf({__proto__: null}) === null;\n\
\n\
module.exports = ObjectDivElement;\n\
\n\
function ObjectDivElement(element) {\n\
  element = element || document.createElement('div');\n\
  ObjectElement.call(this, element);\n\
}\n\
\n\
if (supportProto) {\n\
  ObjectDivElement.prototype.__proto__ = ObjectElement.prototype;\n\
} else {\n\
  ObjectDivElement.prototype = Object.create(ObjectElement.prototype);\n\
}\n\
\n\
ObjectDivElement.prototype.defineProperty('tag', {\n\
  get: function () {\n\
    return 'div';\n\
  }\n\
});\n\
//@ sourceURL=object-dom-object-div-element/lib/object-div-element.js"
));
require.register("object-dom-object-document/index.js", Function("exports, require, module",
"module.exports = require('./lib/object-document');\n\
//@ sourceURL=object-dom-object-document/index.js"
));
require.register("object-dom-object-document/lib/object-document.js", Function("exports, require, module",
"var ObjectElement = require('object-element');\n\
var ObjectDivElement = require('object-div-element');\n\
var slice = Array.prototype.slice;\n\
\n\
module.exports = ObjectDocument;\n\
\n\
function ObjectDocument() {\n\
\n\
}\n\
\n\
/**\n\
 * Wrap HTMLElement with ObjectElement\n\
 * @param  {HTMLElement | ObjectElement element}\n\
 * @return {ObjectElement}\n\
 */\n\
ObjectDocument.wrapElement = function (element) {\n\
  return element.OBJECT_ELEMENT ? element : new ObjectElement(element);\n\
}\n\
\n\
/**\n\
 * Loop through HTMLElements and wrap each of them with ObjectElement\n\
 * @param  {Array elements}\n\
 * @return {Array}\n\
 */\n\
ObjectDocument.wrapElements = function (elements) {\n\
  elements = slice.call(elements);\n\
\n\
  return elements.map(function (element, i) {\n\
    return ObjectDocument.wrapElement(element);\n\
  });\n\
}\n\
\n\
ObjectDocument.createElement = function (tag) {\n\
  if (tag) {\n\
    return this.wrapElement(document.createElement(tag));\n\
  } else {\n\
    return new ObjectDivElement;\n\
  }\n\
}\n\
//@ sourceURL=object-dom-object-document/lib/object-document.js"
));
require.register("object-dom-object-element-style/index.js", Function("exports, require, module",
"module.exports = require('./lib/object-element-style');\n\
//@ sourceURL=object-dom-object-element-style/index.js"
));
require.register("object-dom-object-element-style/lib/object-element-style.js", Function("exports, require, module",
"var ObjectElement = require('object-element');\n\
\n\
/**\n\
 * Shortcut to .element.style\n\
 */\n\
ObjectElement.prototype.defineProperty('style', {\n\
  get: function () {\n\
    return this.element.style;\n\
  }\n\
});\n\
\n\
/**\n\
 * Get element's visibility state\n\
 */\n\
ObjectElement.prototype.defineProperty('hidden', {\n\
  get: function () {\n\
    return this.element.style.display === 'none' ? true : false;\n\
  }\n\
});\n\
\n\
/**\n\
 * Get or set element's opacity\n\
 */\n\
ObjectElement.prototype.defineProperty('opacity', {\n\
  get: function () {\n\
    return parseInt(this.element.style.opacity, 10);\n\
  },\n\
\n\
  set: function (value) {\n\
    this.element.style.opacity = value;\n\
  }\n\
});\n\
\n\
/**\n\
 * Get or set element's width\n\
 */\n\
ObjectElement.prototype.defineProperty('width', {\n\
  get: function () {\n\
    return this.element.offsetWidth;\n\
  },\n\
\n\
  set: function (value) {\n\
    this.style.width = value + 'px';\n\
  }\n\
});\n\
\n\
/**\n\
 * Get or set element's height\n\
 */\n\
ObjectElement.prototype.defineProperty('height', {\n\
  get: function () {\n\
    return this.element.offsetHeight;\n\
  },\n\
\n\
  set: function (value) {\n\
    this.style.height = value + 'px';\n\
  }\n\
});\n\
\n\
/**\n\
 * Display element in DOM\n\
 */\n\
ObjectElement.prototype.show = function () {\n\
  if (this.element.style.display === 'none') {\n\
    this.element.style.display = '';\n\
  } else {\n\
    this.element.style.display = 'block';\n\
  }\n\
}\n\
\n\
ObjectElement.prototype.displayBlock = function () {\n\
  this.element.style.display = 'block';  \n\
}\n\
\n\
ObjectElement.prototype.displayNone = function () {\n\
  this.element.style.display = 'none';  \n\
}\n\
\n\
/**\n\
 * Hide element in DOM\n\
 */\n\
ObjectElement.prototype.hide = function () {\n\
  this.element.style.display = 'none';\n\
}\n\
\n\
/**\n\
 * Get or set element's tyle\n\
 * @param  [String name]\n\
 * @param  [String value]\n\
 * @return {[type]}\n\
 */\n\
ObjectElement.prototype.css = function (name, value) {\n\
  if (arguments.length === 0) {\n\
    return this.element.style;\n\
  }\n\
\n\
  if (arguments.length === 1) {\n\
    return this.element.style[name];\n\
  }\n\
\n\
  if (arguments.length === 2) {\n\
    this.style[name] = value;\n\
  }\n\
}\n\
\n\
ObjectElement.prototype.hasClass = function (name) {\n\
  return this.element.classList.contains(name);\n\
}\n\
\n\
ObjectElement.prototype.addClass = function (name) {\n\
  this.triggerSync('add-class', name);\n\
  this.element.classList.add(name);\n\
  this.trigger('added-class', name);\n\
}\n\
\n\
ObjectElement.prototype.removeClass = function (name) {\n\
  this.triggerSync('remove-class', name);\n\
  this.element.classList.remove(name);\n\
  this.trigger('removed-class', name);\n\
}\n\
\n\
ObjectElement.prototype.toggleClass = function (name) {\n\
  this.triggerSync('toggle-class', name);\n\
\n\
  if (this.hasClass(name)) {\n\
    this.removeClass(name);\n\
  } else {\n\
    this.addClass(name);\n\
  }\n\
\n\
  this.trigger('toggled-class', name);\n\
}\n\
//@ sourceURL=object-dom-object-element-style/lib/object-element-style.js"
));
require.register("object-dom-object-element-selection/index.js", Function("exports, require, module",
"module.exports = require('./lib/object-element-selection');\n\
//@ sourceURL=object-dom-object-element-selection/index.js"
));
require.register("object-dom-object-element-selection/lib/object-element-selection.js", Function("exports, require, module",
"var ObjectElement = require('object-element');\n\
var ObjectDocument = require('object-document');\n\
var slice = Array.prototype.slice;\n\
\n\
/**\n\
 * Match the element against the selector\n\
 * @param  {ObjectElement | Element element}\n\
 * @param  {String selector}\n\
 * @return {Boolean}\n\
 */\n\
function match(element, selector) {\n\
  element = element.OBJECT_ELEMENT ? element.element : element;\n\
\n\
  var matchesSelector = element.webkitMatchesSelector \n\
    || element.mozMatchesSelector \n\
    || element.oMatchesSelector \n\
    || element.matchesSelector;\n\
\n\
  return matchesSelector.call(element, selector);\n\
}\n\
\n\
/**\n\
 * Loop through all elements and match theme against th selector\n\
 * @param  {Array elements}\n\
 * @param  {String selector}\n\
 * @return {Array elements}\n\
 */\n\
function matchAll(elements, selector) {\n\
  return elements.filter(function (element, i) {\n\
    return match(element, selector);\n\
  });\n\
}\n\
\n\
/**\n\
 * Loop through each element and return the first matched element\n\
 * @param  {Array elements}\n\
 * @param  {String selector}\n\
 * @return {Element | Null}\n\
 */\n\
function matchFirst(elements, selector) {\n\
  var i;\n\
\n\
  for (i = 0; i < elements.length; i++) {\n\
    if (match(elements[i], selector)) {\n\
      return elements[i];\n\
    }\n\
  }\n\
\n\
  return null;\n\
}\n\
\n\
/**\n\
 * Loop through each element and return the last matched element\n\
 * @param  {Array elements}\n\
 * @param  {String selector}\n\
 * @return {Element | Null}\n\
 */\n\
function matchLast(elements, selector) {\n\
  /**\n\
   * Clone an array of the elements reference first\n\
   */\n\
  return matchFirst(elements.slice().reverse(), selector);\n\
}\n\
\n\
/**\n\
 * Return an array containing ELEMENT_NODE from ndoes\n\
 * @param  {NodeList nodes}\n\
 * @return {Array}\n\
 */\n\
function elementNodesOf(nodes) {\n\
  return slice.call(nodes).map(function (node, i) {\n\
    if (node.nodeType === 1) {\n\
      return node;\n\
    }\n\
  });\n\
}\n\
\n\
ObjectElement.prototype.defineProperty('ancestors', {\n\
  get: function () {\n\
    var ancestors = [],\n\
        parent = this.parent;\n\
\n\
    while (parent && (parent.nodeType !== parent.DOCUMENT_NODE)) {\n\
      ancestors.push(parent);\n\
      parent = parent.parentNode;\n\
    }\n\
\n\
    return ancestors;\n\
  }\n\
});\n\
\n\
ObjectElement.prototype.defineProperty('parent', {\n\
  get: function () {\n\
    return ObjectDocument.wrapElement(this.element.parentNode);\n\
  }\n\
});\n\
\n\
ObjectElement.prototype.defineProperty('firstSibling', {\n\
  get: function () {\n\
    return ObjectDocument.wrapElement(this.parent).firstChild;\n\
  }\n\
});\n\
\n\
ObjectElement.prototype.defineProperty('lastSibling', {\n\
  get: function () {\n\
    return ObjectDocument.wrapElement(this.parent).lastChild;\n\
  }\n\
});\n\
\n\
ObjectElement.prototype.defineProperty('prevSibling', {\n\
  get: function () {\n\
    var prev;\n\
\n\
    if ('previousElementSibling' in this.element) {\n\
      prev = this.element.previousElementSibling;\n\
    } else {\n\
      prev = this.element.previousSibling;\n\
\n\
      while (prev && prev.nodeType !== prev.ELEMENT_NODE) {\n\
        prev = prev.previousSibling;\n\
      }\n\
    }\n\
\n\
    return prev ? ObjectDocument.wrapElement(prev) : null;\n\
  }\n\
});\n\
\n\
ObjectElement.prototype.defineProperty('nextSibling', {\n\
  get: function () {\n\
    var next;\n\
    if ('nextElementSibling' in this.element) {\n\
      next = this.element.nextElementSibling;\n\
    } else {\n\
      next = this.element.nextSibling;\n\
\n\
      while (next && next.nodeType !== next.ELEMENT_NODE) {\n\
        next = next.nextSibling;\n\
      }\n\
    }\n\
\n\
    return next ? ObjectDocument.wrapElement(next) : null;\n\
  }\n\
});\n\
\n\
ObjectElement.prototype.defineProperty('prevSiblings', {\n\
  get: function () {\n\
    var prevs = [];\n\
    var prev = this.prevSibling;\n\
\n\
    while (prev) {\n\
      prevs.push(prev);\n\
      prev = prev.prevSibling;\n\
    }\n\
\n\
    return prevs.reverse();\n\
  }\n\
});\n\
\n\
ObjectElement.prototype.defineProperty('nextSiblings', {\n\
  get: function () {\n\
    var nexts = [];\n\
    var next = this.nextSibling;\n\
\n\
    while (next) {\n\
      nexts.push(next);\n\
      next = next.nextSibling;\n\
    }\n\
\n\
    return nexts;\n\
  }\n\
});\n\
\n\
ObjectElement.prototype.defineProperty('siblings', {\n\
  get: function () {\n\
    return this.prevSiblings.concat(this.nextSiblings);\n\
  }\n\
});\n\
\n\
ObjectElement.prototype.defineProperty('firstChild', {\n\
  get: function () {\n\
    var first;\n\
\n\
    if ('firstElementChild' in this.element) {\n\
      first = this.element.firstElementChild;\n\
    } else {\n\
      first = this.element.firstChild;\n\
\n\
      while (first && first.nodeType !== first.ELEMENT_NODE) {\n\
        first = first.nextSibling;\n\
      }\n\
    }\n\
\n\
    return first ? ObjectDocument.wrapElement(first) : null;\n\
  }\n\
});\n\
\n\
ObjectElement.prototype.defineProperty('lastChild', {\n\
  get: function () {\n\
    var last;\n\
\n\
    if ('lastElementChild' in this.element) {\n\
      last = this.element.lastElementChild;\n\
    } else {\n\
      last = this.element.lastChild;\n\
\n\
      while (last && last.nodeType !== last.ELEMENT_NODE) {\n\
        last = last.previousSibling;\n\
      }\n\
    }\n\
\n\
    return last ? ObjectDocument.wrapElement(last) : null;\n\
  }\n\
});\n\
\n\
/**\n\
 * Get the fist level child elements\n\
 * @param  {[type] element}\n\
 * @return {[type]}\n\
 */\n\
ObjectElement.prototype.defineProperty('children', {\n\
  get: function () {\n\
    var children;\n\
\n\
    if ('children' in this.element) {\n\
      children = slice.call(this.element.children);\n\
    } else {\n\
      children = slice.call(this.element.childNodes).map(function (node, i) {\n\
        if (node.nodeType === node.ELEMENT_NODE) {\n\
          return node;\n\
        }\n\
      });\n\
    }\n\
\n\
    if (children.length === 0) {\n\
      return children;\n\
    }\n\
\n\
    return ObjectDocument.wrapElements(children);\n\
  }\n\
});\n\
\n\
/** #TODO */\n\
ObjectElement.prototype.defineProperty('descendants', {\n\
  get: function () {\n\
\n\
  }\n\
});\n\
\n\
/**\n\
 * Matching the element against selector\n\
 * @param  {String selector}\n\
 * @return {Boolean}\n\
 */\n\
ObjectElement.prototype.match = function (selector) {\n\
  var matchesSelector = this.element.matchesSelector \n\
    || this.element.webkitMatchesSelector \n\
    || this.element.mozMatchesSelector \n\
    || this.element.oMatchesSelector;\n\
\n\
  return matchesSelector.call(this.element, selector);\n\
}\n\
\n\
/** Selection methods */\n\
\n\
ObjectElement.prototype.selectFirstSibling = function (selector) {\n\
  \n\
}\n\
\n\
ObjectElement.prototype.selectLastSibling = function (selector) {\n\
  \n\
}\n\
\n\
ObjectElement.prototype.selectPrevSibling = function (selector) {\n\
  var prev = matchLast(this.prevSiblings, selector);\n\
\n\
  if (prev === null) {\n\
    return prev;\n\
  }\n\
\n\
  return ObjectDocument.wrapElement(prev);\n\
}\n\
\n\
ObjectElement.prototype.selectNextSibling = function (selector) {\n\
  var next = matchFirst(this.nextSiblings, selector);\n\
\n\
  if (next === null) {\n\
    return next;\n\
  }\n\
\n\
  return ObjectDocument.wrapElement(next);\n\
}\n\
\n\
/**\n\
 * Alias of .selectPrevSibling()\n\
 */\n\
ObjectElement.prototype.prev = ObjectElement.prototype.selectPrevSibling;\n\
\n\
/**\n\
 * Alias of .selectNextSibling()\n\
 */\n\
ObjectElement.prototype.next = ObjectElement.prototype.selectNextSibling;\n\
\n\
ObjectElement.prototype.selectPrevSiblings = function (selector) {\n\
  var prevs = matchAll(this.prevSiblings, selector);\n\
\n\
  if (prevs.length === 0) {\n\
    return prevs;\n\
  }\n\
\n\
  return ObjectDocument.wrapElements(prevs);\n\
}\n\
\n\
ObjectElement.prototype.selectNextSiblings = function (selector) {\n\
  var nexts = matchAll(this.nextSiblings, selector);\n\
\n\
  if (nexts.length === 0) {\n\
    return nexts;\n\
  }\n\
\n\
  return ObjectDocument.wrapElements(nexts);\n\
}\n\
\n\
ObjectElement.prototype.selectSiblings = function (selector) {\n\
  return this.selectPrevSiblings(selector).concat(this.selectNextSiblings(selector));\n\
}\n\
\n\
/**\n\
 * Select element's child elements by selector or not\n\
 * @param  {String selector}\n\
 * @return {Array}\n\
 */\n\
ObjectElement.prototype.selectChildren = function (selector) {\n\
  var children = this.children;\n\
\n\
  if (children.length && selector) {\n\
    children = matchAll(children, selector);\n\
  }\n\
\n\
  if (children.length === 0) {\n\
    return children;\n\
  }\n\
\n\
  return ObjectDocument.wrapElements(children);\n\
}\n\
\n\
/**\n\
 * Get first child element by selector or not\n\
 * @param  {String selector}\n\
 * @return {ObjectElement}\n\
 */\n\
ObjectElement.prototype.selectFirstChild = function (selector) {\n\
  return ObjectDocument.wrapElement(matchFirst(this.children, selector));\n\
}\n\
\n\
/**\n\
 * Get last child element by the selector or not\n\
 * @param  {String selector}\n\
 * @return {ObjectElement}\n\
 */\n\
ObjectElement.prototype.selectLastChild = function (selector) {\n\
  return ObjectDocument.wrapElement(matchLast(this.children, selector));\n\
}\n\
\n\
/**\n\
 * Select all elements descended from the element that match the selector\n\
 * @param  {String selector}\n\
 * @return {Array}\n\
 */\n\
ObjectElement.prototype.select = function (selector) {\n\
  var nodeList = slice.call(this.element.querySelectorAll(selector));\n\
\n\
  if (nodeList.length === 0) {\n\
    return [];\n\
  }\n\
\n\
  return ObjectDocument.wrapElements(nodeList);\n\
}\n\
\n\
/**\n\
 * Select the first element descended from the element that matchs the selector\n\
 * @param  {String selector}\n\
 * @return {ObjectElement | null}\n\
 */\n\
ObjectElement.prototype.selectFirst = function (selector) {\n\
  var element = this.element.querySelector(selector);\n\
\n\
  if (element === null) {\n\
    return null;\n\
  }\n\
\n\
  return ObjectDocument.wrapElement(element);\n\
}\n\
\n\
/**\n\
 * Select the last element descended from the element that matchs the selector\n\
 * @param  {String selector}\n\
 * @return {ObjectElement | null}\n\
 */\n\
ObjectElement.prototype.selectLast = function (selector) {\n\
  var elements = this.select(selector);\n\
\n\
  if (elements.length === 0) {\n\
    return null;\n\
  }\n\
\n\
  return ObjectDocument.wrapElement(elements.pop());\n\
}\n\
//@ sourceURL=object-dom-object-element-selection/lib/object-element-selection.js"
));
require.register("polyfill-Array.prototype.map/component.js", Function("exports, require, module",
"require('./Array.prototype.map');\n\
//@ sourceURL=polyfill-Array.prototype.map/component.js"
));
require.register("polyfill-Array.prototype.map/Array.prototype.map.js", Function("exports, require, module",
"// @from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map\n\
// Production steps of ECMA-262, Edition 5, 15.4.4.19\n\
// Reference: http://es5.github.com/#x15.4.4.19\n\
if (!Array.prototype.map) {\n\
  Array.prototype.map = function(callback, thisArg) {\n\
\n\
    var T, A, k;\n\
\n\
    if (this == null) {\n\
      throw new TypeError(\" this is null or not defined\");\n\
    }\n\
\n\
    // 1. Let O be the result of calling ToObject passing the |this| value as the argument.\n\
    var O = Object(this);\n\
\n\
    // 2. Let lenValue be the result of calling the Get internal method of O with the argument \"length\".\n\
    // 3. Let len be ToUint32(lenValue).\n\
    var len = O.length >>> 0;\n\
\n\
    // 4. If IsCallable(callback) is false, throw a TypeError exception.\n\
    // See: http://es5.github.com/#x9.11\n\
    if (typeof callback !== \"function\") {\n\
      throw new TypeError(callback + \" is not a function\");\n\
    }\n\
\n\
    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.\n\
    if (thisArg) {\n\
      T = thisArg;\n\
    }\n\
\n\
    // 6. Let A be a new array created as if by the expression new Array(len) where Array is\n\
    // the standard built-in constructor with that name and len is the value of len.\n\
    A = new Array(len);\n\
\n\
    // 7. Let k be 0\n\
    k = 0;\n\
\n\
    // 8. Repeat, while k < len\n\
    while(k < len) {\n\
\n\
      var kValue, mappedValue;\n\
\n\
      // a. Let Pk be ToString(k).\n\
      //   This is implicit for LHS operands of the in operator\n\
      // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.\n\
      //   This step can be combined with c\n\
      // c. If kPresent is true, then\n\
      if (k in O) {\n\
\n\
        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.\n\
        kValue = O[ k ];\n\
\n\
        // ii. Let mappedValue be the result of calling the Call internal method of callback\n\
        // with T as the this value and argument list containing kValue, k, and O.\n\
        mappedValue = callback.call(T, kValue, k, O);\n\
\n\
        // iii. Call the DefineOwnProperty internal method of A with arguments\n\
        // Pk, Property Descriptor {Value: mappedValue, : true, Enumerable: true, Configurable: true},\n\
        // and false.\n\
\n\
        // In browsers that support Object.defineProperty, use the following:\n\
        // Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });\n\
\n\
        // For best browser support, use the following:\n\
        A[ k ] = mappedValue;\n\
      }\n\
      // d. Increase k by 1.\n\
      k++;\n\
    }\n\
\n\
    // 9. return A\n\
    return A;\n\
  };      \n\
}\n\
//@ sourceURL=polyfill-Array.prototype.map/Array.prototype.map.js"
));
require.register("shallker-array-forEach-shim/index.js", Function("exports, require, module",
"/*\n\
  @from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach\n\
*/\n\
if (!Array.prototype.forEach) {\n\
    Array.prototype.forEach = function (fn, scope) {\n\
        'use strict';\n\
        var i, len;\n\
        for (i = 0, len = this.length; i < len; ++i) {\n\
            if (i in this) {\n\
                fn.call(scope, this[i], i, this);\n\
            }\n\
        }\n\
    };\n\
}\n\
//@ sourceURL=shallker-array-forEach-shim/index.js"
));
require.register("shallker-wang-dever/component.js", Function("exports, require, module",
"require('Array.prototype.map');\n\
require('array-foreach-shim');\n\
\n\
exports = module.exports = require('./util/dever');\n\
\n\
exports.version = '2.0.1';\n\
//@ sourceURL=shallker-wang-dever/component.js"
));
require.register("shallker-wang-dever/util/dever.js", Function("exports, require, module",
"/* Log level */\n\
/*\n\
  0 EMERGENCY system is unusable\n\
  1 ALERT action must be taken immediately\n\
  2 CRITICAL the system is in critical condition\n\
  3 ERROR error condition\n\
  4 WARNING warning condition\n\
  5 NOTICE a normal but significant condition\n\
  6 INFO a purely informational message\n\
  7 DEBUG messages to debug an application\n\
*/\n\
\n\
var slice = Array.prototype.slice,\n\
    dev,\n\
    pro,\n\
    config,\n\
    level = {\n\
      \"0\": \"EMERGENCY\",\n\
      \"1\": \"ALERT\",\n\
      \"2\": \"CRITICAL\",\n\
      \"3\": \"ERROR\",\n\
      \"4\": \"WARNING\",\n\
      \"5\": \"NOTICE\",\n\
      \"6\": \"INFO\",\n\
      \"7\": \"DEBUG\"\n\
    };\n\
\n\
function readFileJSON(path) {\n\
  var json = require('fs').readFileSync(path, {encoding: 'utf8'});\n\
  return JSON.parse(json);\n\
}\n\
\n\
function loadConfig(name) {\n\
  return readFileJSON(process.env.PWD + '/' + name);\n\
}\n\
\n\
function defaultConfig() {\n\
  return {\n\
    \"output\": {\n\
      \"EMERGENCY\": false,\n\
      \"ALERT\": false,\n\
      \"CRITICAL\": false,\n\
      \"ERROR\": false,\n\
      \"WARNING\": true,\n\
      \"NOTICE\": true,\n\
      \"INFO\": true,\n\
      \"DEBUG\": false \n\
    },\n\
    \"throw\": false\n\
  }\n\
}\n\
\n\
try { dev = loadConfig('dev.json'); } catch (e) {}\n\
try { pro = loadConfig('pro.json'); } catch (e) {}\n\
\n\
config = dev || pro || defaultConfig();\n\
\n\
function log() {\n\
  console.log.apply(console, slice.call(arguments));\n\
}\n\
\n\
function debug() {\n\
  var args = slice.call(arguments)\n\
  args.unshift('[Debug]');\n\
  if (console.debug) {\n\
    console.debug.apply(console, args);\n\
  } else {\n\
    console.log.apply(console, args);\n\
  }\n\
}\n\
\n\
function info() {\n\
  var args = slice.call(arguments)\n\
  args.unshift('[Info]');\n\
  if (console.info) {\n\
    console.info.apply(console, args)\n\
  } else {\n\
    console.log.apply(console, args)\n\
  }\n\
}\n\
\n\
function notice() {\n\
  var args = slice.call(arguments)\n\
  args.unshift('[Notice]');\n\
  if (console.notice) {\n\
    console.notice.apply(console, args);\n\
  } else {\n\
    console.log.apply(console, args);\n\
  }\n\
}\n\
\n\
function warn() {\n\
  var args = slice.call(arguments)\n\
  args.unshift('[Warn]');\n\
  if (console.warn) {\n\
    console.warn.apply(console, args);\n\
  } else {\n\
    console.log.apply(console, args);\n\
  }\n\
}\n\
\n\
function error(err) {\n\
  if (config[\"throw\"]) {\n\
    /* remove first line trace which is from here */\n\
    err.stack = err.stack.replace(/\\n\
\\s*at\\s*\\S*/, '');\n\
    throw err;\n\
  } else {\n\
    var args = ['[Error]'];\n\
    err.name && (err.name += ':') && (args.push(err.name));\n\
    args.push(err.message);\n\
    console.log.apply(console, args);\n\
  }\n\
  return false;\n\
}\n\
\n\
exports.config = function(json) {\n\
  config = json;\n\
}\n\
\n\
exports.debug = function(froms) {\n\
  froms = slice.call(arguments).map(function(from) {\n\
    return '[' + from + ']';\n\
  });\n\
\n\
  function exDebug() {\n\
    if (!config.output['DEBUG']) return;\n\
    return debug.apply({}, froms.concat(slice.call(arguments)));\n\
  }\n\
\n\
  exDebug.off = function() {\n\
    return function() {}\n\
  }\n\
\n\
  return exDebug;\n\
}\n\
\n\
exports.info = function(froms) {\n\
  froms = slice.call(arguments).map(function(from) {\n\
    return '[' + from + ']';\n\
  });\n\
\n\
  function exInfo() {\n\
    if (!config.output['INFO']) return;\n\
    return info.apply({}, froms.concat(slice.call(arguments)));\n\
  }\n\
\n\
  exInfo.off = function() {\n\
    return function() {}\n\
  }\n\
\n\
  return exInfo;\n\
}\n\
\n\
exports.notice = function(froms) {\n\
  froms = slice.call(arguments).map(function(from) {\n\
    return '[' + from + ']';\n\
  });\n\
\n\
  function exNotice() {\n\
    if (!config.output['NOTICE']) return;\n\
    return notice.apply({}, froms.concat(slice.call(arguments)));\n\
  }\n\
\n\
  exNotice.off = function() {\n\
    return function() {}\n\
  }\n\
\n\
  return exNotice;\n\
}\n\
\n\
exports.warn = function(froms) {\n\
  froms = slice.call(arguments).map(function(from) {\n\
    return '[' + from + ']';\n\
  });\n\
\n\
  function exWarn() {\n\
    if (!config.output['WARNING']) return;\n\
    return warn.apply({}, froms.concat(slice.call(arguments)));\n\
  }\n\
\n\
  exWarn.off = function() {\n\
    return function() {}\n\
  }\n\
\n\
  return exWarn;\n\
}\n\
\n\
exports.error = function(froms) {\n\
  froms = slice.call(arguments).map(function(from) {\n\
    return '[' + from + ']';\n\
  });\n\
\n\
  function exError() {\n\
    var err;\n\
    if (!config.output['ERROR']) return false;\n\
    err = new Error(slice.call(arguments).join(' '));\n\
    err.name = froms.join(' ');\n\
    return error(err);\n\
  }\n\
\n\
  exError.off = function() {\n\
    return function() {}\n\
  }\n\
\n\
  return exError;\n\
}\n\
//@ sourceURL=shallker-wang-dever/util/dever.js"
));
require.register("shallker-wang-eventy/index.js", Function("exports, require, module",
"module.exports = require('./lib/eventy');\n\
//@ sourceURL=shallker-wang-eventy/index.js"
));
require.register("shallker-wang-eventy/lib/eventy.js", Function("exports, require, module",
"var debug = require('dever').debug('Eventy'),\n\
    error = require('dever').error('Eventy'),\n\
    warn = require('dever').warn('Eventy'),\n\
    slice = Array.prototype.slice;\n\
\n\
module.exports = function Eventy(object) {\n\
  var registry = {};\n\
\n\
  var constructor = function () {\n\
    return this;\n\
  }.call(object || {});\n\
\n\
  /**\n\
   * Remove the first matched callback from callbacks array\n\
   */\n\
  function removeCallback(callback, callbacks) {\n\
    for (var i = 0; i < callbacks.length; i++) {\n\
      if (callbacks[i] === callback) {\n\
        return callbacks.splice(i, 1);\n\
      }\n\
    }\n\
\n\
    return false;\n\
  }\n\
\n\
  /**\n\
   * Listen to an event with a callback\n\
   * @param  {String eventname}\n\
   * @param  {Function callback}\n\
   * @return {Object constructor || Boolean false}\n\
   */\n\
  constructor.on = function (eventname, callback) {\n\
    if (typeof callback !== 'function') {\n\
      error('callback is not a function');\n\
      return false;\n\
    }\n\
\n\
    if (typeof registry[eventname] === 'undefined') {\n\
      registry[eventname] = [];\n\
    }\n\
\n\
    registry[eventname].push(callback);\n\
    return this;\n\
  }\n\
\n\
  /**\n\
   * Remove one callback from the event callback list\n\
   * @param  {String eventname}\n\
   * @param  {Function callback}\n\
   * @return {Object constructor || Boolean false}\n\
   */\n\
  constructor.off = function (eventname, callback) {\n\
    if (typeof callback !== 'function') {\n\
      error('callback is not a function');\n\
      return false;\n\
    }\n\
\n\
    if (typeof registry[eventname] === 'undefined') {\n\
      error('unregistered event');\n\
      return false;\n\
    }\n\
\n\
    var callbacks = registry[eventname];\n\
\n\
    if (callbacks.length === 0) {\n\
      return this;\n\
    }\n\
\n\
    removeCallback(callback, callbacks);\n\
    return this;\n\
  }\n\
\n\
  /**\n\
   * Loop through all callbacks of the event and call them asynchronously\n\
   * @param  {String eventname}\n\
   * @param  [Arguments args]\n\
   * @return {Object constructor}\n\
   */\n\
  constructor.trigger = function (eventname, args) {\n\
    args = slice.call(arguments);\n\
    eventname = args.shift();\n\
\n\
    if (typeof registry[eventname] === 'undefined') {\n\
      return this;\n\
    }\n\
\n\
    var callbacks = registry[eventname];\n\
\n\
    if (callbacks.length === 0) {\n\
      return this;\n\
    }\n\
\n\
    var host = this;\n\
\n\
    callbacks.forEach(function (callback, index) {\n\
      setTimeout(function () {\n\
        callback.apply(host, args);\n\
      }, 0);\n\
    });\n\
\n\
    return this;\n\
  }\n\
\n\
  /**\n\
   * Alias of trigger\n\
   */\n\
  constructor.emit = constructor.trigger;\n\
\n\
  /**\n\
   * Loop through all callbacks of the event and call them synchronously\n\
   * @param  {String eventname}\n\
   * @param  [Arguments args]\n\
   * @return {Object constructor}\n\
   */\n\
  constructor.triggerSync = function (eventname, args) {\n\
    args = slice.call(arguments);\n\
    eventname = args.shift();\n\
\n\
    if (typeof registry[eventname] === 'undefined') {\n\
      return this;\n\
    }\n\
\n\
    var callbacks = registry[eventname];\n\
\n\
    if (callbacks.length === 0) {\n\
      return this;\n\
    }\n\
\n\
    var host = this;\n\
\n\
    callbacks.forEach(function (callback, index) {\n\
      callback.apply(host, args);\n\
    });\n\
\n\
    return this;\n\
  }\n\
\n\
  return constructor;\n\
}\n\
//@ sourceURL=shallker-wang-eventy/lib/eventy.js"
));
require.register("shallker-progress/index.js", Function("exports, require, module",
"module.exports = require('./lib/progress');\n\
//@ sourceURL=shallker-progress/index.js"
));
require.register("shallker-progress/lib/progress.js", Function("exports, require, module",
"var eventy = require('eventy');\n\
\n\
module.exports = Progress;\n\
\n\
function Progress() {\n\
  var progress = eventy(this);\n\
\n\
  progress.begin = 0;\n\
  progress.end = 1;\n\
  progress.duration = 1000;\n\
  progress.done = false;\n\
\n\
  Object.defineProperty(progress, 'progression', {\n\
    get: function () {\n\
      var passed = new Date - this.startTime;\n\
      var progression = passed / this.duration;\n\
\n\
      if (progression > 1) {\n\
        progression = 1;\n\
        this.done = true;\n\
      }\n\
\n\
      progression = this.delta(progression);\n\
\n\
      return progression * (this.end - this.begin) + this.begin;\n\
    }\n\
  });\n\
}\n\
\n\
Progress.prototype.delta = function (progression) {\n\
  return progression;\n\
}\n\
\n\
Progress.prototype.start = function () {\n\
  this.startTime = new Date;\n\
}\n\
//@ sourceURL=shallker-progress/lib/progress.js"
));
require.register("shallker-delta/index.js", Function("exports, require, module",
"module.exports = require('./lib/delta');\n\
//@ sourceURL=shallker-delta/index.js"
));
require.register("shallker-delta/lib/delta.js", Function("exports, require, module",
"exports.linear = function (progress) {\n\
  return progress;\n\
}\n\
\n\
exports.easeInQuad = function (progress) {\n\
  return progress * progress;\n\
}\n\
\n\
exports.easeOutQuad = function (progress) {\n\
  return -progress * (progress - 2);\n\
}\n\
//@ sourceURL=shallker-delta/lib/delta.js"
));
require.register("slot-machine/index.js", Function("exports, require, module",
"require('object-element-style');\n\
require('object-element-selection');\n\
\n\
module.exports = require('./lib/slot-machine');\n\
//@ sourceURL=slot-machine/index.js"
));
require.register("slot-machine/lib/slot-machine.js", Function("exports, require, module",
"var ObjectDocument = require('object-document');\n\
var Reel = require('./reel');\n\
var eventy = require('eventy');\n\
\n\
module.exports = SlotMachine;\n\
\n\
function SlotMachine(el) {\n\
  var slotMachine = eventy(this);\n\
\n\
  slotMachine.reels = [];\n\
  slotMachine.reelItems = SlotMachine.reelItems;\n\
  slotMachine.reelHeight = SlotMachine.reelHeight;\n\
  slotMachine.el = ObjectDocument.wrapElement(el);\n\
\n\
  slotMachine.el.select('.reel').forEach(function (item, index) {\n\
    var reel = new Reel(item);\n\
\n\
    reel.items = slotMachine.reelItems;\n\
    reel.height = slotMachine.reelHeight;\n\
    slotMachine.reels.push(reel);\n\
  });\n\
}\n\
\n\
SlotMachine.prototype.start = function () {\n\
  var slotMachine = this;\n\
  var reels = slotMachine.reels.slice();\n\
  var accelerationComplete = [];\n\
\n\
  (function start() {\n\
    if (reels.length) {\n\
      reels.shift().spin(function () {\n\
        accelerationComplete.push(1);\n\
\n\
        if (accelerationComplete.length === slotMachine.reels.length) {\n\
          slotMachine.trigger('start-complete');\n\
        }\n\
      });\n\
\n\
      setTimeout(start, 100);\n\
    }\n\
  })();\n\
}\n\
\n\
SlotMachine.prototype.stop = function () {\n\
  var slotMachine = this;\n\
  var reels = slotMachine.reels.slice();\n\
  var decelerationComplete = [];\n\
\n\
  (function stop() {\n\
    if (reels.length) {\n\
      reels.shift().stop(function () {\n\
        decelerationComplete.push(1);\n\
\n\
        if (decelerationComplete.length === slotMachine.reels.length) {\n\
          slotMachine.trigger('stop-complete');\n\
        }\n\
      });\n\
\n\
      setTimeout(stop, 500);\n\
    }\n\
  })();\n\
}\n\
//@ sourceURL=slot-machine/lib/slot-machine.js"
));
require.register("slot-machine/lib/reel.js", Function("exports, require, module",
"var Progress = require('progress');\n\
var eventy = require('eventy');\n\
var delta = require('delta');\n\
\n\
module.exports = Reel;\n\
\n\
function Reel(el) {\n\
  var reel = eventy(this);\n\
\n\
  reel.el = el;\n\
  reel.fps = 60;\n\
  reel.spinning;\n\
  reel.progress;\n\
  reel.height = 300;\n\
  reel.item = 0;\n\
  reel.items = 3;\n\
\n\
  Object.defineProperty(reel, 'spinHeight', {\n\
    get: function () {\n\
      var Y = this.el.style.backgroundPosition.split(' ').pop();\n\
\n\
      return parseFloat(Y);\n\
    },\n\
\n\
    set: function (value) {\n\
      this.el.style.backgroundPosition = '0px '+ value + 'px';\n\
    }\n\
  });\n\
\n\
  /**\n\
   * Setup a default value of backgroundPosition style\n\
   */\n\
  reel.el.style.backgroundPosition = '0px 0px';\n\
}\n\
\n\
Reel.prototype.spin = function (accelerationComplete) {\n\
  var reel = this;\n\
  var progress = new Progress;\n\
  var isAccelerationComplete = false;\n\
\n\
  progress.begin = 0;\n\
  progress.end = Math.round(Math.random() * 5) + 20;\n\
  progress.duration = 1000;\n\
  progress.delta = delta.easeInQuad;\n\
  progress.start();\n\
  reel.progress = progress\n\
\n\
  reel.spinning = setInterval(function () {\n\
    /** For Firefox */\n\
    var positionX = '0px';\n\
    var positionY = reel.spinHeight + reel.progress.progression + 'px';\n\
\n\
    reel.el.style.backgroundPosition = positionX + ' ' + positionY;\n\
\n\
    /**\n\
     * Trigger accelerationComplete for the first time\n\
     */\n\
    if (!isAccelerationComplete && progress.done) {\n\
      isAccelerationComplete = true;\n\
      accelerationComplete && accelerationComplete();\n\
    }\n\
  }, 1000 / this.fps);\n\
}\n\
\n\
Reel.prototype.stop = function (decelerationComplete) {\n\
  var reel = this;\n\
\n\
  /**\n\
   * Stop the spinning first\n\
   */\n\
  clearInterval(reel.spinning);\n\
\n\
  /**\n\
   * Average height of items\n\
   */\n\
  var itemHeight = reel.height / reel.items;\n\
  \n\
  /**\n\
   * How many rounds we've ran\n\
   */\n\
  var laps = Math.floor(reel.spinHeight / reel.height);\n\
\n\
  /**\n\
   * How long we ran in the last round\n\
   */\n\
  var remainder = reel.spinHeight % reel.height;\n\
\n\
  /**\n\
   * The nth item in the last round\n\
   */\n\
  var nth = Math.ceil(remainder / itemHeight);\n\
\n\
  /**\n\
   * Let's spin the reel to the nth item\n\
   */\n\
  var end = (laps * reel.height) + (nth * itemHeight);\n\
\n\
  reel.el.style.backgroundPosition = '0px' + ' ' + end + 'px';\n\
\n\
  /**\n\
   * Turn the nth in descend order because we're spinning in reverse mode\n\
   */\n\
  reel.item = this.items - (nth - 1);\n\
\n\
  decelerationComplete && decelerationComplete();\n\
}\n\
//@ sourceURL=slot-machine/lib/reel.js"
));
















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