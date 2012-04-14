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

// BackStak version 0.9.0

(function (root, factory) {
    // Set up BackStack appropriately for the environment.
    if (typeof exports !== 'undefined') {
        // Node/CommonJS, no need for jQuery in that case.
        factory(root, exports, require('underscore'), require('jquery'), require('Backbone'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(['underscore', 'jquery', 'Backbone', 'exports'],
            function (_, $, Backbone, exports) {
                // Export global even in AMD case in case this script is loaded with
                // others that may still expect a global Backbone.
                root.BackStack = factory(root, exports, _, $, Backbone);
            });
    } else {
        // Browser globals
        root.BackStack = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender), root.Backbone);
    }
}(this, function (root, BackStack, _, $, Backbone) {

/**
 * almond 0.0.3 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
/*jslint strict: false, plusplus: false */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {

    var defined = {},
        waiting = {},
        aps = [].slice,
        main, req;

    if (typeof define === "function") {
        //If a define is already in play via another AMD loader,
        //do not overwrite.
        return;
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
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
                baseName = baseName.split("/");
                baseName = baseName.slice(0, baseName.length - 1);

                name = baseName.concat(name.split("/"));

                //start trimDots
                var i, part;
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
                            break;
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
            main.apply(undef, args);
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

    main = function (name, deps, callback, relName) {
        var args = [],
            usingExports,
            cjsModule, depName, i, ret, map;

        //Use name if no relName
        if (!relName) {
            relName = name;
        }

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Default to require, exports, module if no deps if
            //the factory arg has any arguments specified.
            if (!deps.length && callback.length) {
                deps = ['require', 'exports', 'module'];
            }

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
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
                        exports: defined[name]
                    };
                } else if (defined.hasOwnProperty(depName) || waiting.hasOwnProperty(depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw name + ' missing ' + depName;
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef) {
                    defined[name] = cjsModule.exports;
                } else if (!usingExports) {
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

    requirejs = req = function (deps, callback, relName, forceSync) {
        if (typeof deps === "string") {

            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            //Drop the config stuff on the ground.
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = arguments[2];
            } else {
                deps = [];
            }
        }

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
    req.config = function () {
        return req;
    };

    /**
     * Export require as a global, but only if it does not already exist.
     */
    if (!require) {
        require = req;
    }

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (define.unordered) {
            waiting[name] = [name, deps, callback];
        } else {
            main(name, deps, callback);
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("almond", function(){});

define('StackView',[],function () {

    var StackView = Backbone.View.extend({

        /**
         * Posible options auto or never
         */
        destructionPolicy:"auto",

        /**
         * Reference to parent StackNavigator
         */
        stackNavigator:null,

        /**
         *
         */
        rendered:false,

        setStackNavigator:function (stackNavigator, navigationOptions) {
            this.stackNavigator = stackNavigator;

            if (navigationOptions) {
                if (navigationOptions.destructionPolicy)
                    this.destructionPolicy = navigationOptions.destructionPolicy;
            }

            // Setting default styles
            this.$el.css({position:'absolute', overflow:'hidden', width:'100%', height:'100%'});
        }

    });

    return StackView;
});
define('effects/NoEffect',[],function () {

    var NoEffect = function (stackNavigator) {
        this.stackNavigator = stackNavigator;
    };

    NoEffect.prototype.play = function (fromView, toView, callback, context) {
        if (toView) {
            // Showing the view
            toView.css('display', toView.data('original-display'));
            toView.removeData('original-display');
        }
        callback.call(context);
    };

    return NoEffect;
});
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

    return (vendorPrefix || '');
});
define('effects/SlideEffect',['effects/vendorPrefix'], function (vendorPrefix) {

    var SlideEffect = function SlideEffect(stackNavigator, direction, effectParams) {
        this.stackNavigator = stackNavigator;
        this.direction = direction ? direction : 'left';
        this.effectParams = 'all ' + (effectParams ? effectParams : '0.4s ease-out');
    };

    SlideEffect.prototype.play = function (fromView, toView, callback, context) {
        var activeTransitions = 0,
            transitionEndEvent,
            transformParams;

        if (vendorPrefix == 'Moz' || vendorPrefix == '')
            transitionEndEvent = 'transitionend';
        else if (vendorPrefix == 'ms')
            transitionEndEvent = 'MSTransitionEnd';
        else
            transitionEndEvent = vendorPrefix.toLowerCase() + 'TransitionEnd';

        var transitionEndHandler = function (event) {
            activeTransitions--;
            $(event.target)[0].style[vendorPrefix + 'Transition'] = '';

            if (activeTransitions == 0 && callback) {
                callback.call(context);
            }
        };

        if (fromView) {
            fromView.one(transitionEndEvent, transitionEndHandler);
            fromView.css('left', 0);
            fromView[0].style[vendorPrefix + 'Transition'] = this.effectParams;

            activeTransitions++;
        }

        if (toView) {
            toView.one(transitionEndEvent, transitionEndHandler);
            toView.css('left', this.direction == 'left' ? this.stackNavigator.$el.width() : -this.stackNavigator.$el.width());
            toView[0].style[vendorPrefix + 'Transition'] = this.effectParams;

            activeTransitions++;

            // Showing the view
            toView.css('display', toView.data('original-display'));
            toView.removeData('original-display');
        }

        if (fromView || toView) {
            // This is a hack to force DOM reflow before transition starts
            this.stackNavigator.$el.css('width');

            transformParams = 'translateX(' + (this.direction == 'left' ? -this.stackNavigator.$el.width() : this.stackNavigator.$el.width()) + 'px)';
        }

        if (fromView && toView)
            fromView[0].style[vendorPrefix + 'Transform'] = toView[0].style[vendorPrefix + 'Transform'] = transformParams;
        else if (toView)
            toView[0].style[vendorPrefix + 'Transform'] = transformParams;
        else if (fromView)
            fromView[0].style[vendorPrefix + 'Transform'] = transformParams;

        // This is a fallback for situations when TransitionEnd event doesn't get triggered
        var that = this;
        setTimeout(function () {
            if (activeTransitions > 0) {
                activeTransitions = -1;

                if (toView) {
                    fromView.off(transitionEndEvent, transitionEndHandler);
                    toView[0].style[vendorPrefix + 'Transition'] = '';
                }

                if (fromView) {
                    toView.off(transitionEndEvent, transitionEndHandler);
                    fromView[0].style[vendorPrefix + 'Transition'] = '';
                }

                callback.call(context);
            }
        }, 600);
    };

    return SlideEffect;
});
define('StackNavigator',['effects/SlideEffect'], function (SlideEffect) {

    /**
     * Private common push method.
     *
     * @param fromViewRef - reference to from view
     * @param toViewRef - reference to to view
     * @param transition - transition to played during push
     */
    var push = function (fromViewRef, toViewRef, transition) {

        // Hiding view
        toViewRef.instance.$el.data('original-display', toViewRef.instance.$el.css('display'));
        toViewRef.instance.$el.css('display', 'none');

        // Adding view to the DOM
        this.$el.append(toViewRef.instance.$el);

        // Rendering view if required
        if (!toViewRef.instance.rendered) {
            toViewRef.instance.render.call(toViewRef.instance);
            toViewRef.instance.rendered = true;
        }
        // Adding view to the stack internal array
        this.viewsStack.push(toViewRef);

        transition = transition || this.defaultPushTransition || (this.defaultPushTransition = new SlideEffect(this, 'left'));
        transition.play(fromViewRef ? fromViewRef.instance.$el : null, toViewRef.instance.$el,
            function () {

                this.activeView = toViewRef.instance;
                toViewRef.instance.$el.trigger('viewActivate');

                if (fromViewRef) {
                    fromViewRef.instance.$el.trigger('viewDeactivate');

                    if (fromViewRef.instance.destructionPolicy == 'never') {
                        fromViewRef.instance.$el.detach();
                    } else {
                        fromViewRef.instance.remove();
                        fromViewRef.instance = null;
                    }
                }

                this.trigger('viewChanged');
            }, this);
    };

    /**
     * Private common pop method.
     *
     * @param fromViewRef - reference to from view
     * @param toViewRef - reference to to view
     * @param transition - transition to played during pop
     */
    var pop = function (fromViewRef, toViewRef, transition) {

        // Removing top view ref from the stack array
        this.viewsStack.pop();

        if (toViewRef) {

            if (!toViewRef.instance) {
                // Getting view class declaration
                var viewClass = toViewRef.viewClass;
                // Creating view instance
                toViewRef.instance = new viewClass(toViewRef.options);
                // Setting ref to StackNavigator
                toViewRef.instance.setStackNavigator(this, toViewRef.options ? toViewRef.options.navigationOptions : null);
            }

            // Hiding view
            toViewRef.instance.$el.data('original-display', toViewRef.instance.$el.css('display'));
            toViewRef.instance.$el.css('display', 'none');

            // Adding view to the DOM
            this.$el.append(toViewRef.instance.$el);
            // Rendering view if required
            if (!toViewRef.instance.rendered) {
                toViewRef.instance.render.call(toViewRef.instance);
                toViewRef.instance.rendered = true;
            }

        }

        transition = transition || this.defaultPopTransition || (this.defaultPopTransition = new SlideEffect(this, 'right'));
        transition.play(fromViewRef.instance.$el, toViewRef ? toViewRef.instance.$el : null,
            function () {

                if (toViewRef) {
                    this.activeView = toViewRef.instance;
                    toViewRef.instance.$el.trigger('viewActivate');
                } else {
                    this.activeView = null;
                }

                fromViewRef.instance.$el.trigger('viewDeactivate');
                fromViewRef.instance.remove();
                fromViewRef.instance = null;

                this.trigger('viewChanged');
            }, this);
    };

    var StackNavigator = Backbone.View.extend({

        viewsStack:null,

        activeView:null,

        defaultPushTransition:null,

        defaultPopTransition:null,

        events:{
            'viewActivate':'proxyActivationEvents',
            'viewDeactivate':'proxyActivationEvents'
        },

        proxyActivationEvents:function (event) {
            this.trigger(event.type, event);
        },

        initialize:function (options) {
            // Setting default styles
            this.$el.css({overflow:'hidden'});

            // Setting new viewsStack array
            this.viewsStack = [];
        },

        pushView:function (view, viewOptions, transition) {
            var toView, toViewRef,
                isViewInstance = (typeof view !== 'function'),
                fromViewRef = _.last(this.viewsStack);

            toView = (!isViewInstance) ? new view(viewOptions) : view;
            toView.setStackNavigator(this, (viewOptions) ? viewOptions.navigationOptions : null);
            toViewRef = {instance:toView, viewClass:toView.constructor, options:viewOptions};

            var event = $.Event('viewChanging',
                {
                    action:'push',
                    fromViewClass:fromViewRef ? fromViewRef.viewClass : null,
                    fromView:fromViewRef ? fromViewRef.instance : null,
                    toViewClass:toViewRef.viewClass,
                    toView:toViewRef.instance
                });
            this.trigger(event.type, event);

            if (!event.isDefaultPrevented()) {

                push.call(this, fromViewRef, toViewRef, transition);

                return toView;
            }

            return null;
        },

        popView:function (transition) {
            var toViewRef, fromViewRef;
            if (this.viewsStack.length > 0)
                fromViewRef = this.viewsStack[this.viewsStack.length - 1];

            if (this.viewsStack.length > 1)
                toViewRef = this.viewsStack[this.viewsStack.length - 2];

            var event = $.Event('viewChanging',
                {
                    action:'pop',
                    fromViewClass:fromViewRef ? fromViewRef.viewClass : null,
                    fromView:fromViewRef ? fromViewRef.instance : null,
                    toViewClass:toViewRef ? toViewRef.viewClass : null,
                    toView:toViewRef ? toViewRef.instance : null
                });
            this.trigger(event.type, event);

            if (!event.isDefaultPrevented()) {

                var fromView = fromViewRef.instance;
                pop.call(this, fromViewRef, toViewRef, transition);

                return fromView;
            }

            return null;
        },

        popAll:function (transition) {
            if (this.viewsStack.length > 0) {

                var fromViewRef;
                if (this.viewsStack.length > 0)
                    fromViewRef = this.viewsStack[this.viewsStack.length - 1];

                var event = $.Event('viewChanging',
                    {
                        action:'popAll',
                        fromViewClass:fromViewRef ? fromViewRef.viewClass : null,
                        fromView:fromViewRef ? fromViewRef.instance : null,
                        toViewClass:null,
                        toView:null
                    });
                this.trigger(event.type, event);

                if (!event.isDefaultPrevented()) {
                    // Removing views except the top one
                    this.viewsStack.splice(0, this.viewsStack.length - 1);
                    pop.call(this, fromViewRef, null, transition);
                }
            }
            return null;
        },

        replaceView:function (view, viewOptions, transition) {
            if (this.viewsStack.length > 0) {

                var toView, toViewRef,
                    isViewInstance = (typeof view !== 'function'),
                    fromViewRef = this.viewsStack[this.viewsStack.length - 1];

                toView = (!isViewInstance) ? new view(viewOptions) : view;
                toView.setStackNavigator(this, (viewOptions) ? viewOptions.navigationOptions : null);
                toViewRef = {instance:toView, viewClass:toView.constructor, options:viewOptions};

                var event = $.Event('viewChanging',
                    {
                        action:'replace',
                        fromViewClass:fromViewRef.viewClass,
                        fromView:fromViewRef.instance,
                        toViewClass:toViewRef.viewClass,
                        toView:toViewRef.instance
                    });
                this.trigger(event.type, event);

                if (!event.isDefaultPrevented()) {

                    this.viewsStack.pop();
                    push.call(this, fromViewRef, toViewRef, transition);

                    return toView;
                }
            }
            return null;
        }
    });

    return StackNavigator;
});
define('effects/FadeEffect',['effects/vendorPrefix'], function (vendorPrefix) {

    var FadeEffect = function (stackNavigator, effectParams) {
        this.stackNavigator = stackNavigator;
        this.effectParams = 'opacity ' + (effectParams) ? effectParams : '0.4s ease-in-out';
    };

    FadeEffect.prototype.play = function (fromView, toView, callback, context) {
        var activeTransitions = 0,
            transitionEndEvent;

        if (vendorPrefix == 'Moz' || vendorPrefix == '')
            transitionEndEvent = 'transitionend';
        else if (vendorPrefix == 'ms')
            transitionEndEvent = 'MSTransitionEnd';
        else
            transitionEndEvent = vendorPrefix.toLowerCase() + 'TransitionEnd';

        var transitionEndHandler = function (event) {
            activeTransitions--;
            $(event.target)[0].style[vendorPrefix + 'Transition'] = '';

            if (activeTransitions == 0 && callback) {
                callback.call(context);
            }
        };

        if (fromView) {
            activeTransitions++;

            fromView.one(transitionEndEvent, transitionEndHandler);
            fromView[0].style[vendorPrefix + 'Transition'] = this.effectParams;
        }

        if (toView) {
            activeTransitions++;

            // Setting initial opacity
            toView.css('opacity', 0);
            toView.one(transitionEndEvent, transitionEndHandler);
            toView[0].style[vendorPrefix + 'Transition'] = this.effectParams;

            // Showing the view
            toView.css('display', toView.data('original-display'));
            toView.removeData('original-display');
        }

        // This is a hack to force DOM reflow before transition starts
        this.stackNavigator.$el.css('width');

        if (toView)
            toView.css('opacity', 1);

        if (fromView)
            fromView.css('opacity', 0);

        // This is a fallback for situations when TransitionEnd event doesn't get triggered
        var that = this;
        setTimeout(function () {
            if (activeTransitions > 0) {
                activeTransitions = -1;

                console.log('Warning ' + transitionEndEvent + ' didn\'t trigger in expected time!');

                if (toView) {
                    fromView.off(transitionEndEvent, transitionEndHandler);
                    toView[0].style[vendorPrefix + 'Transition'] = '';
                }

                if (fromView) {
                    toView.off(transitionEndEvent, transitionEndHandler);
                    fromView[0].style[vendorPrefix + 'Transition'] = '';
                }

                callback.call(context);
            }
        }, 600);
    };

    return FadeEffect;
});
/**
 * This is a license comment it should be removed from the built file
 *
 */

define('BackStack',['StackNavigator', 'StackView', 'effects/NoEffect', 'effects/SlideEffect', 'effects/FadeEffect'],
    function (StackNavigator, StackView, NoEffect, SlideEffect, FadeEffect) {

        BackStack.StackNavigator = StackNavigator;
        BackStack.StackView = StackView;
        BackStack.NoEffect = NoEffect;
        BackStack.SlideEffect = SlideEffect;
        BackStack.FadeEffect = FadeEffect;

        return BackStack;
    });
    return BackStack;
}));