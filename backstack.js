//////////////////////////////////////////////////////////////////////////////////////
//
//	Copyright 2012 Piotr Walczyszyn (http://outof.me | @pwalczyszyn)
//
//	Licensed under the Apache License, Version 2.0 (the "License");
//	you may not use this file except in compliance with the License.
//	You may obtain a copy of the License at
//
//		http://www.apache.org/licenses/LICENSE-2.0
//
//	Unless required by applicable law or agreed to in writing, software
//	distributed under the License is distributed on an "AS IS" BASIS,
//	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//	See the License for the specific language governing permissions and
//	limitations under the License.
//
//////////////////////////////////////////////////////////////////////////////////////

// BackStack version 1.1.2

(function (root, factory) {
    // Set up BackStack appropriately for the environment.
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery', 'underscore', 'backbone'], factory);
    } else {
        // Browser globals
        root.BackStack = factory((root.jQuery || root.Zepto || root.ender), root._, root.Backbone);
    }
}(this, function ($, _, Backbone) {

/**
 * almond 0.1.1 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var defined = {},
        waiting = {},
        config = {},
        defining = {},
        aps = [].slice,
        main, req;

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {},
            nameParts, nameSegment, mapValue, foundMap, i, j, part;

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; (part = name[i]); i++) {
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            return true;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                break;
                            }
                        }
                    }
                }

                foundMap = foundMap || starMap[nameSegment];

                if (foundMap) {
                    nameParts.splice(0, i, foundMap);
                    name = nameParts.join('/');
                    break;
                }
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (waiting.hasOwnProperty(name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!defined.hasOwnProperty(name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    function makeMap(name, relName) {
        var prefix, plugin,
            index = name.indexOf('!');

        if (index !== -1) {
            prefix = normalize(name.slice(0, index), relName);
            name = name.slice(index + 1);
            plugin = callDep(prefix);

            //Normalize according
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            p: plugin
        };
    }

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    main = function (name, deps, callback, relName) {
        var args = [],
            usingExports,
            cjsModule, depName, ret, map, i;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i++) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = makeRequire(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = defined[name] = {};
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = {
                        id: name,
                        uri: '',
                        exports: defined[name],
                        config: makeConfig(name)
                    };
                } else if (defined.hasOwnProperty(depName) || waiting.hasOwnProperty(depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else if (!defining[depName]) {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                    cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync) {
        if (typeof deps === "string") {
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        waiting[name] = [name, deps, callback];
    };

    define.amd = {
        jQuery: true
    };
}());

define("almond", function(){});

define('effects/vendorPrefix',[], function () {

    /**
     * Helper function to detect browser vendor prefix.
     * Thanks to Lea Verou: http://lea.verou.me/2009/02/find-the-vendor-prefix-of-the-current-browser/
     * I just modified it slightly as I expect it to be used in mobile/WebKit scenarios mostly.
     */
    var vendorPrefix,
        regex = /^(Moz|Webkit|Khtml|O|ms|Icab)(?=[A-Z])/,
        someScript = document.getElementsByTagName('script')[0];

    // Exception for WebKit based browsers
    if ('WebkitOpacity' in someScript.style) {
        vendorPrefix = 'Webkit';
    } else if ('KhtmlOpacity' in someScript.style) {
        vendorPrefix = 'Khtml';
    } else {
        for (var prop in someScript.style) {
            if (regex.test(prop)) {
                // test is faster than match, so it's better to perform
                // that on the lot and match only when necessary
                vendorPrefix = prop.match(regex)[0];
                break;
            }
        }
    }

    return (vendorPrefix.toLowerCase() || '');
});
define('effects/Effect',['effects/vendorPrefix'], function (vendorPrefix) {

    var Effect = function Effect(params) {

        if (params) _.extend(this, params);

        this.vendorPrefix = vendorPrefix;

        if (this.vendorPrefix == 'moz' || this.vendorPrefix == '') this.transitionEndEvent = 'transitionend';
        else if (this.vendorPrefix == 'ms') this.transitionEndEvent = 'MSTransitionEnd';
        else this.transitionEndEvent = this.vendorPrefix + 'TransitionEnd';

    };

    // Shared empty constructor function to aid in prototype-chain creation.
    var ctor = function () {
    };

    Effect.extend = function (protoProps, staticProps) {
        var child = function () {
            Effect.apply(this, arguments);
        };

        // Inherit class (static) properties from parent.
        _.extend(child, Effect);

        // Set the prototype chain to inherit from `parent`, without calling
        // `parent`'s constructor function.
        ctor.prototype = Effect.prototype;
        child.prototype = new ctor();

        // Add prototype properties (instance properties) to the subclass,
        // if supplied.
        if (protoProps) _.extend(child.prototype, protoProps);

        // Add static properties to the constructor function, if supplied.
        if (staticProps) _.extend(child, staticProps);

        // Correctly set child's `prototype.constructor`.
        child.prototype.constructor = child;

        // Set a convenience property in case the parent's prototype is needed later.
        child.__super__ = Effect.prototype;

        return child;
    };

    return Effect;
});
define('effects/SlideEffect',['effects/Effect'], function (Effect) {

    var SlideEffect = Effect.extend({

        direction:'left',

        fromViewTransitionProps:{duration:0.4, easing:'ease-out', delay:0},

        toViewTransitionProps:{duration:0.4, easing:'ease-out', delay:0},

        play:function ($fromView, $toView, callback, context) {

            var timeout,
                that = this,
                activeTransitions = 0,
                transformParams,
                transformProp = that.vendorPrefix == '' ? 'transform' :
                    ['-' + that.vendorPrefix, '-', 'transform'].join(''),
                transitionProp = that.vendorPrefix == '' ? 'transition' :
                    ['-' + that.vendorPrefix, '-', 'transition'].join('');

            var transitionEndHandler = function (event) {
                if (activeTransitions >= 0) {
                    activeTransitions--;

                    var $target = $(event.target);
                    $target.css(transformProp, '');
                    $target.css(transitionProp, '');

                    if ($toView && $toView[0] == event.target) $toView.css('left', 0);

                    if (activeTransitions == 0 && callback) {
                        if (timeout) clearTimeout(timeout);
                        callback.call(context);
                    }
                }
            };

            if ($fromView) {
                activeTransitions++;

                $fromView.one(that.transitionEndEvent, transitionEndHandler);

                $fromView.css('left', 0);
                $fromView.css(transitionProp, [transformProp, ' ',
                                               that.fromViewTransitionProps.duration, 's ',
                                               that.fromViewTransitionProps.easing, ' ',
                                               that.fromViewTransitionProps.delay, 's'].join(''));
            }

            if ($toView) {
                activeTransitions++;

                $toView.one(that.transitionEndEvent, transitionEndHandler);

                $toView.css('left', that.direction == 'left' ? context.$el.width() : -context.$el.width());
                $toView.css(transitionProp, [transformProp, ' ',
                                             that.toViewTransitionProps.duration, 's ',
                                             that.toViewTransitionProps.easing, ' ',
                                             that.toViewTransitionProps.delay, 's'].join(''));

                // Showing the view
                $toView.css('visibility', 'visible');
            }

            if ($fromView || $toView) {
                // This is a hack to force DOM reflow before transition starts
                context.$el.css('width');

                transformParams = 'translate3d(' + (that.direction == 'left' ? -context.$el.width() : context.$el.width()) + 'px, 0, 0)';
            }

            // This is a fallback for situations when TransitionEnd event doesn't get triggered
            var transDuration = Math.max(that.fromViewTransitionProps.duration, that.toViewTransitionProps.duration) +
                Math.max(that.fromViewTransitionProps.delay, that.toViewTransitionProps.delay);

            timeout = setTimeout(function () {
                if (activeTransitions > 0) {
                    activeTransitions = -1;

                    console.log('Warning ' + that.transitionEndEvent + ' didn\'t trigger in expected time!');

                    if ($toView) {
                        $toView.off(that.transitionEndEvent, transitionEndHandler);
                        $toView.css(transitionProp, '');
                        $toView.css(transformProp, '');
                        $toView.css('left', 0);
                    }

                    if ($fromView) {
                        $fromView.off(that.transitionEndEvent, transitionEndHandler);
                        $fromView.css(transitionProp, '');
                        $fromView.css(transformProp, '');
                    }

                    callback.call(context);
                }
            }, transDuration * 1.5 * 1000);

            var $views;
            if ($fromView && $toView) $views = $fromView.add($toView);
            else if ($toView) $views = $toView;
            else if ($fromView) $views = $fromView;

            if ($views) $views.css(transformProp, transformParams);
        }
    });

    return SlideEffect;
});
define('StackNavigator',['effects/SlideEffect'], function (SlideEffect) {

    /**
     * Rendering the view and setting props required by StackNavigator.
     * @private
     * @ignore
     *
     * @param {View} view View to be rendered.
     * @param {StackNavigator} stackNavigator View StackNavigator instance.
     */
    function appendView(view, stackNavigator) {

        if (!view.__backStackRendered__) {

            // Setting ref to parent StackNavigator
            view.stackNavigator = stackNavigator;

            // Setting default destructionPolicy if it's not set
            if (typeof view.destructionPolicy === 'undefined') view.destructionPolicy = 'auto';

            // Setting default styles
            view.$el.css({position:'absolute', visibility:'hidden', overflow:'hidden', width:'100%', height:'100%'});

        } else {
            // Resetting visibility to hidden
            view.$el.css({visibility:'hidden'});
        }

        // Adding view to the DOM
        stackNavigator.$el.append(view.el);

        if (!view.__backStackRendered__) {
            // Rendering the view
            view.render.call(view);

            // Setting default of __backStackRendered__ property
            view.__backStackRendered__ = true;
        }
    }

    /**
     * Creates event objects triggered by BackStack.
     * @private
     * @ignore
     *
     * @param {string} type Event type name.
     * @param {*} args Event args.
     * @param {boolean} cancelable Flag indicating if event is cancelable.
     * @return {event} The new object.
     */
    function createEvent(type, args, cancelable) {
        return _.extend({

            type:type,

            cancelable:_.isUndefined(cancelable) ? false : cancelable,

            preventDefault:function () {
                if (this.cancelable)
                    this.isDefaultPrevented = function () {
                        return true;
                    };
            },

            isDefaultPrevented:function () {
                return false;
            },

            trigger:function (target) {
                target.trigger(this.type, this);
                return this;
            }
        }, args);
    }

    /**
     * Private common push method.
     * @private
     * @ignore
     *
     * @param {object} fromViewRef Reference to from view.
     * @param {object} toViewRef Reference to to view.
     * @param {number} replaceHowMany Number of views to replace with pushed view.
     * @param {Effect} transition Transition to played during push.
     */
    function push(fromViewRef, toViewRef, replaceHowMany, transition) {

        // Rendering view if required
        appendView(toViewRef.instance, this);

        transition = transition || this.defaultPushTransition || (this.defaultPushTransition = new SlideEffect({direction:'left'}));
        transition.play(fromViewRef ? fromViewRef.instance.$el : null, toViewRef.instance.$el,
            function () { // Callback function

                var remove = replaceHowMany > 0 ? this.viewsStack.splice(this.viewsStack.length - replaceHowMany, replaceHowMany)
                    : (fromViewRef ? [fromViewRef] : null);

                if (remove != null) {
                    _.each(remove, function (ref) {

                        // Triggering viewDeactivate event
                        createEvent('viewDeactivate', {target:ref.instance}).trigger(ref.instance);

                        if (ref.instance.destructionPolicy == 'never') { // Detaching if destructionPolicy == 'never'
                            ref.instance.$el.detach();
                        } else { // Removing if destructionPolicy == 'auto'
                            ref.instance.remove();
                            ref.instance = null;
                        }
                    }, this);
                }

                // Adding view to the stack internal array
                this.viewsStack.push(toViewRef);

                // Setting activeView property
                this.activeView = toViewRef.instance;

                // Triggering viewActivate event
                createEvent('viewActivate', {target:toViewRef.instance}).trigger(toViewRef.instance);

                // Triggering viewChanged event
                createEvent('viewChanged', {target:this}).trigger(this);

                // Popping item from actions queue
                popActionsQueue.call(this);

            }, this);
    }

    /**
     * Private common pop method.
     * @private
     * @ignore
     *
     * @param {object} fromViewRef Reference to from view.
     * @param {object} toViewRef Reference to to view.
     * @param {number} howMany Number of views to pop from the stack.
     * @param {Effect} transition Transition to played during pop.
     */
    function pop(fromViewRef, toViewRef, howMany, transition) {

        if (toViewRef) {
            // Recreating view instance if necessary
            toViewRef.instance = toViewRef.instance ? toViewRef.instance : new toViewRef.viewClass(toViewRef.options);
            // Rendering view if required
            appendView(toViewRef.instance, this);
        }

        transition = transition || this.defaultPopTransition || (this.defaultPopTransition = new SlideEffect({direction:'right'}));
        transition.play(fromViewRef.instance.$el, toViewRef ? toViewRef.instance.$el : null,
            function () { // Callback function

                // Popping views from a stack
                var remove = this.viewsStack.splice(this.viewsStack.length - howMany, howMany);
                _.each(remove, function (ref) {

                    // Triggering viewDeactivate event
                    createEvent('viewDeactivate', {target:ref.instance}).trigger(ref.instance);

                    if (ref.instance.destructionPolicy == 'never') { // Detaching if destructionPolicy == 'never'
                        ref.instance.$el.detach();
                    } else { // Removing if destructionPolicy == 'auto'
                        ref.instance.remove();
                        ref.instance = null;
                    }
                }, this);

                if (toViewRef) { // If toViewRef exists activating it

                    // Setting activeView property
                    this.activeView = toViewRef.instance;

                    // Triggering viewActivate event
                    createEvent('viewActivate', {target:toViewRef.instance}).trigger(toViewRef.instance);

                } else { // Nulling activeView property
                    this.activeView = null;
                }

                // Triggering viewChanged event
                createEvent('viewChanged', {target:this}).trigger(this);

                // Popping item from actions queue
                popActionsQueue.call(this);
            }, this);
    }

    function pushView(view, viewOptions, transition) {
        // Getting ref of the view on top of the stack
        var fromViewRef = _.last(this.viewsStack),
        // Creating new view instance if it is necessary
            toView = _.isFunction(view) ? new view(viewOptions) : view,
        // Creating new view ref
            toViewRef = {instance:toView, viewClass:toView.constructor, options:viewOptions},
        // Creating viewChanging event object and triggering it
            event = createEvent('viewChanging',
                {
                    action:'push',
                    fromViewClass:fromViewRef ? fromViewRef.viewClass : null,
                    fromView:fromViewRef ? fromViewRef.instance : null,
                    toViewClass:toViewRef.viewClass,
                    toView:toViewRef.instance
                },
                true).trigger(this);

        // Checking if event wasn't cancelled
        if (event.isDefaultPrevented()) return null;

        push.call(this, fromViewRef, toViewRef, 0, transition);
    }

    function popView(transition) {
        if (this.viewsStack.length == 0) throw new Error('Popping from an empty stack!');

        // Getting ref of the view on top of the stack
        var fromViewRef = _.last(this.viewsStack),
        // Getting ref of the view below current one
            toViewRef = this.viewsStack.length > 1 ? this.viewsStack[this.viewsStack.length - 2] : null,
        // Creating viewChanging event object and triggering it
            event = createEvent('viewChanging',
                {
                    action:'pop',
                    fromViewClass:fromViewRef.viewClass,
                    fromView:fromViewRef.instance,
                    toViewClass:toViewRef ? toViewRef.viewClass : null,
                    toView:toViewRef ? toViewRef.instance : null
                },
                true).trigger(this);

        // Checking if event wasn't cancelled
        if (event.isDefaultPrevented()) return;

        // Popping top view
        pop.call(this, fromViewRef, toViewRef, 1, transition);
    }

    function popAll(transition) {
        if (this.viewsStack.length == 0) throw new Error('Popping from an empty stack!');

        // Getting ref of the view on top of the stack
        var fromViewRef = _.last(this.viewsStack),
        // Creating viewChanging event object and triggering it
            event = createEvent('viewChanging',
                {
                    action:'popAll',
                    fromViewClass:fromViewRef.viewClass,
                    fromView:fromViewRef.instance,
                    toViewClass:null,
                    toView:null
                },
                true).trigger(this);

        // Checking if event wasn't cancelled
        if (event.isDefaultPrevented()) return;

        // Popping top view
        pop.call(this, fromViewRef, null, this.viewsStack.length, transition);
    }

    function replaceView(view, viewOptions, transition) {
        if (this.viewsStack.length == 0) throw new Error('Replacing on an empty stack!');

        // Getting ref of the view on top of the stack
        var fromViewRef = _.last(this.viewsStack),
        // Creating new view instance if it is necessary
            toView = _.isFunction(view) ? new view(viewOptions) : view,
        // Creating new view ref
            toViewRef = {instance:toView, viewClass:toView.constructor, options:viewOptions},
        // Creating viewChanging event object and triggering it
            event = createEvent('viewChanging',
                {
                    action:'replace',
                    fromViewClass:fromViewRef.viewClass,
                    fromView:fromViewRef.instance,
                    toViewClass:toViewRef.viewClass,
                    toView:toViewRef.instance
                },
                true).trigger(this);

        // Checking if event wasn't cancelled
        if (event.isDefaultPrevented()) return null;

        // Pushing new view on top
        push.call(this, fromViewRef, toViewRef, 1, transition);
    }

    function replaceAll(view, viewOptions, transition) {
        if (this.viewsStack.length == 0) throw new Error('Replacing on an empty stack!');

        // Getting ref of the view on top of the stack
        var fromViewRef = _.last(this.viewsStack),
        // Creating new view instance if it is necessary
            toView = _.isFunction(view) ? new view(viewOptions) : view,
        // Creating new view ref
            toViewRef = {instance:toView, viewClass:toView.constructor, options:viewOptions},
        // Creating viewChanging event object and triggering it
            event = createEvent('viewChanging',
                {
                    action:'replaceAll',
                    fromViewClass:fromViewRef.viewClass,
                    fromView:fromViewRef.instance,
                    toViewClass:toViewRef.viewClass,
                    toView:toViewRef.instance
                },
                true).trigger(this);

        // Checking if event wasn't cancelled
        if (event.isDefaultPrevented()) return null;

        // Pushing new view on top
        push.call(this, fromViewRef, toViewRef, this.viewsStack.length, transition);
    }

    function popActionsQueue() {
        this.actionsQueue.splice(0, 1);
        if (this.actionsQueue.length > 0) {
            var action = this.actionsQueue[0],
                args = Array.prototype.slice.call(action.args);
            switch (action.fn) {
                case 'pushView':
                    pushView.apply(this, args);
                    break;
                case 'popView':
                    popView.apply(this, args);
                    break;
                case 'popAll':
                    popAll.apply(this, args);
                    break;
                case 'replaceView':
                    replaceView.apply(this, args);
                    break;
                case 'replaceAll':
                    replaceAll.apply(this, args);
                    break;
            }
        }
    }

    var StackNavigator = Backbone.View.extend(
        /** @lends BackStack.StackNavigator */
        {
            /**
             * @name StackNavigator#viewChanging
             * @event
             * @param {Object} e
             * @param {Boolean} [e.cancelable=true]
             */

            /**
             * An array with all the view refs on the stack.
             */
            viewsStack:null,

            /**
             * View on top of the stack.
             */
            activeView:null,

            /**
             * Default push transition effect.
             */
            defaultPushTransition:null,

            /**
             * Default pop transition effect.
             */
            defaultPopTransition:null,

            /**
             * Queue of actions to be executed on the stack.
             */
            actionsQueue:null,

            /**
             * Initializes StackNavigator.
             *
             * @param {Object} options This is a Backbone.View options hash that can have popTransition and pushTransition
             * properties that can be initiated for this instance of navigator.
             *
             * @constructs
             * */
            initialize:function (options) {
                // Setting default styles
                this.$el.css({overflow:'hidden'});

                // Setting new viewsStack array
                this.viewsStack = [];

                // Setting new queue of actions
                this.actionsQueue = [];

                // Setting default pop transition
                if (options.popTransition) this.defaultPopTransition = options.popTransition;

                // Setting default push transition
                if (options.pushTransition) this.defaultPushTransition = options.pushTransition;
            },

            /**
             * Pushes new view to the stack.
             *
             * @param {Backbone.View || Backbone.ViewClass} view View class or view instance to be pushed to the stack.
             * @param {Object} viewOptions Options to be passed if view is contructed by StackNavigator.
             * @param {Effect} transition Transition effect to be played when pushing new view.
             */
            pushView:function (view, viewOptions, transition) {
                // Pushing current action to the queue
                this.actionsQueue.push({fn:'pushView', args:arguments});

                if (this.actionsQueue.length == 1) pushView.call(this, view, viewOptions, transition);
            },

            /**
             * Pops an active view from a stack and displays one below.
             *
             * @param {Effect} transition Transition effect to be played when popping new view.
             */
            popView:function (transition) {
                // Pushing current action to the queue
                this.actionsQueue.push({fn:'popView', args:arguments});

                if (this.actionsQueue.length == 1) popView.call(this, transition);
            },

            /**
             * Pops all views from a stack and leaves empty stack.
             *
             * @param {Effect} transition Transition effect to be played when popping views.
             */
            popAll:function (transition) {
                // Pushing current action to the queue
                this.actionsQueue.push({fn:'popAll', args:arguments});

                if (this.actionsQueue.length == 1) popAll.call(this, transition);
            },

            /**
             * Replaces view on top of the stack, with the one passed as a view param.
             *
             * @param {Backbone.View || Backbone.ViewClass} view View class or view instance to be pushed on top of the stack instead of current one.
             * @param {Object} viewOptions Hash with options to be passed to the view, if view param is not an instance.
             * @param {Effect} transition Transition effect to be played when replacing views.
             */
            replaceView:function (view, viewOptions, transition) {
                // Pushing current action to the queue
                this.actionsQueue.push({fn:'replaceView', args:arguments});

                if (this.actionsQueue.length == 1) replaceView.call(this, view, viewOptions, transition);
            },

            /**
             * Replaces all of the views on the stack, with the one passed as a view param.
             *
             * @param {Backbone.View || Backbone.ViewClass} view View class or view instance to be pushed on top of the stack.
             * @param {Object} viewOptions Hash with options to be passed to the view, if view param is not an instance.
             * @param {Effect} transition Transition effect to be played when replacing views.
             */
            replaceAll:function (view, viewOptions, transition) {
                // Pushing current action to the queue
                this.actionsQueue.push({fn:'replaceAll', args:arguments});

                if (this.actionsQueue.length == 1) replaceAll.call(this, view, viewOptions, transition);
            }
        });

    return StackNavigator;
});
define('effects/FadeEffect',['effects/Effect'], function (Effect) {

    var FadeEffect = Effect.extend({

        fromViewTransitionProps:{duration:0.4, easing:'linear', delay:0.1},

        toViewTransitionProps:{duration:0.4, easing:'linear', delay:0.1},

        play:function ($fromView, $toView, callback, context) {

            var that = this,
                timeout,
                activeTransitions = 0,
                transitionProp = that.vendorPrefix == '' ? 'transition'
                    : ['-' + that.vendorPrefix.toLowerCase(), '-', 'transition'].join('');

            var transitionEndHandler = function (event) {
                if (activeTransitions >= 0) {
                    activeTransitions--;

                    $(event.target).css(transitionProp, '');

                    if (activeTransitions == 0 && callback) {
                        if (timeout) clearTimeout(timeout);
                        callback.call(context);
                    }
                }
            };

            if ($fromView) {
                activeTransitions++;

                // Registering transition end handler
                $fromView.one(that.transitionEndEvent, transitionEndHandler);

                // Setting transition css props
                $fromView.css(transitionProp, ['opacity ', that.fromViewTransitionProps.duration, 's ',
                                               that.fromViewTransitionProps.easing, ' ',
                                               that.fromViewTransitionProps.delay, 's'].join(''));
            }

            if ($toView) {
                activeTransitions++;

                $toView.one(that.transitionEndEvent, transitionEndHandler);

                // Setting initial opacity
                $toView.css('opacity', 0);

                // Setting transition css props
                $toView.css(transitionProp, ['opacity ', that.toViewTransitionProps.duration, 's ',
                                             that.toViewTransitionProps.easing, ' ',
                                             that.toViewTransitionProps.delay, 's'].join(''));

                // Showing the view
                $toView.css('visibility', 'visible');
            }

            // This is a hack to force DOM reflow before transition starts
            context.$el.css('width');

            // This is a fallback for situations when TransitionEnd event doesn't get triggered
            var transDuration = Math.max(that.fromViewTransitionProps.duration, that.toViewTransitionProps.duration) +
                Math.max(that.fromViewTransitionProps.delay, that.toViewTransitionProps.delay);

            timeout = setTimeout(function () {
                if (activeTransitions > 0) {
                    activeTransitions = -1;

                    console.log('Warning ' + that.transitionEndEvent + ' didn\'t trigger in expected time!');

                    if ($toView) {
                        $toView.off(that.transitionEndEvent, transitionEndHandler);
                        $toView.css(transitionProp, '');
                    }

                    if ($fromView) {
                        $fromView.off(that.transitionEndEvent, transitionEndHandler);
                        $fromView.css(transitionProp, '');
                    }

                    callback.call(context);
                }
            }, transDuration * 1.5 * 1000);

            if ($toView) $toView.css('opacity', 1);
            if ($fromView) $fromView.css('opacity', 0);
        }
    });

    return FadeEffect;
});
define('effects/NoEffect',['effects/Effect'], function (Effect) {

    var NoEffect = Effect.extend();
    NoEffect.prototype.play = function ($fromView, $toView, callback, context) {
        if ($toView) {
            // Showing the view
            $toView.css('visibility', 'visible');
        }
        callback.call(context);
    };

    return NoEffect;
});
    return {
        StackNavigator : require('StackNavigator'),
        Effect : require('effects/Effect'),
        NoEffect : require('effects/NoEffect'),
        SlideEffect : require('effects/SlideEffect'),
        FadeEffect : require('effects/FadeEffect')
    };
}));
