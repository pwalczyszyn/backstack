/**
 * Created by Piotr Walczyszyn (outof.me | @pwalczyszyn)
 *
 * Date: 2/8/12
 * Time: 4:38 PM
 *
 */

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
        root.BackStack = factory(root, {}, root._, root.jQuery, root.Backbone);
    }
}(this, function (root, BackStack, _, $, Backbone) {

    /**
     * Helper function to detect browser vendor prefix.
     * Thanks to Lea Verou: http://lea.verou.me/2009/02/find-the-vendor-prefix-of-the-current-browser/
     * I just modified it slightly as I expect it to be used in mobile/WebKit scenarios mostly.
     */
    var getVendorPrefix = BackStack.getVendorPrefix = function () {
        if ('result' in arguments.callee) return arguments.callee.result;

        var regex = /^(Moz|Webkit|Khtml|O|ms|Icab)(?=[A-Z])/;

        var someScript = document.getElementsByTagName('script')[0];

        // Exception for WebKit based browsers
        if ('WebkitOpacity' in someScript.style) return arguments.callee.result = 'Webkit';
        if ('KhtmlOpacity' in someScript.style) return arguments.callee.result = 'Khtml';

        for (var prop in someScript.style) {
            if (regex.test(prop)) {
                // test is faster than match, so it's better to perform
                // that on the lot and match only when necessary
                return arguments.callee.result = prop.match(regex)[0];
            }
        }
        return arguments.callee.result = '';
    };

    var StackNavigatorSlideEffect = BackStack.StackNavigatorSlideEffect = function (stackNavigator) {
        this.stackNavigator = stackNavigator;
    };
    StackNavigatorSlideEffect.prototype.play = function (fromView, toView, direction, callback, context) {

        var vendor = getVendorPrefix(),
            activeTransitions = 0,
            transitionEndEvent,
            transformParams,
            fromViewTransitionParams = 'all 0.4s ease-out 0.1s',
            toViewTransitionParams = 'all 0.4s ease-out 0.1s';

        if (vendor == 'Moz' || vendor == '')
            transitionEndEvent = 'transitionend';
        else if (vendor == 'ms')
            transitionEndEvent = 'MSTransitionEnd';
        else
            transitionEndEvent = vendor.toLowerCase() + 'TransitionEnd';

        var transitionEndHandler = function (event) {
            activeTransitions--;
            $(event.target)[0].style[vendor + 'Transition'] = '';

            if (activeTransitions == 0 && callback) {
                callback.call(context);
            }
        };

        if (fromView) {
            fromView.one(transitionEndEvent, transitionEndHandler);
            fromView.css('left', 0);
            fromView[0].style[vendor + 'Transition'] = fromViewTransitionParams;

            activeTransitions++;
        }

        if (toView) {
            toView.one(transitionEndEvent, transitionEndHandler);
            toView.css('left', direction == 'left' ? this.stackNavigator.width() : -this.stackNavigator.width());
            toView[0].style[vendor + 'Transition'] = toViewTransitionParams;

            this.stackNavigator.append(toView);

            activeTransitions++;
        }

        if (fromView || toView) {
            // This is a hack to force DOM reflow before transition starts
            this.stackNavigator.css('width');

            transformParams = 'translateX(' + (direction == 'left' ? -this.stackNavigator.width() : this.stackNavigator.width()) + 'px)';
        }

        if (fromView && toView)
            fromView[0].style[vendor + 'Transform'] = toView[0].style[vendor + 'Transform'] = transformParams;
        else if (toView)
            toView[0].style[vendor + 'Transform'] = transformParams;
        else if (fromView)
            fromView[0].style[vendor + 'Transform'] = transformParams;
    };

    var StackNavigatorEvent = BackStack.StackNavigatorEvent =
        function (action, oldViewClass, oldView, newViewClass, newView) {

            this.action = action;

            this.oldViewClass = oldViewClass;

            this.oldView = oldView;

            this.newViewClass = newViewClass;

            this.newView = newView;

            var defaultPrevented = false;

            this.preventDefault = function () {
                this.defaultPrevented = true;
            }

            this.isDefaultPrevented = function () {
                return defaultPrevented;
            }
        };

    /**
     * Extended Backbone.View with additional properties like viewPath, destructionPolicy and a reference to parent
     * StackNavigator.
     */
    var View = BackStack.StackView = Backbone.View.extend({

        viewPath:undefined,

        // Posible options auto or never
        destructionPolicy:"auto",

        stackNavigator:undefined,

        setStackNavigator:function (stackNavigator, navigationOptions) {
            this.stackNavigator = stackNavigator;

            if (navigationOptions) {
                if (navigationOptions.destructionPolicy)
                    this.destructionPolicy = navigationOptions.destructionPolicy;
            }
        }
    });

    BackStack.StackNavigator = Backbone.View.extend({

        tagName:'div',

        viewsStack:new Array(),

        initialize:function (options) {
            if (options && options.firstView)
                this.pushView(options.firstView, options.firstViewOptions);

            // Setting default style with overflow hidden
            this.$el.css({overflow:'hidden'});
        },

        pushView:function (viewClass, viewOptions) {
            var toView, fromViewRef;

            if (this.viewsStack.length > 0)
                fromViewRef = this.viewsStack[this.viewsStack.length - 1];

            toView = new viewClass(viewOptions);
            toView.setStackNavigator(this, viewOptions ? viewOptions.navigationOptions : null);

            var event = new StackNavigatorEvent('push', fromViewRef ? fromViewRef.viewClass : null,
                fromViewRef ? fromViewRef.instance : null, viewClass, toView);
            this.trigger(event.action, event);

            if (!event.isDefaultPrevented()) {
                this.viewsStack.push({instance:toView, viewClass:viewClass, options:viewOptions});

                var slideEffect = new StackNavigatorSlideEffect(this.$el);
                slideEffect.play(fromViewRef ? fromViewRef.instance.$el : null, toView.render().$el, 'left',
                    function () {

                        toView.$el.trigger('viewActivate');

                        if (fromViewRef) {
                            fromViewRef.instance.$el.trigger('viewDeactivate');

                            if (fromViewRef.instance.destructionPolicy == 'never') {
                                fromViewRef.instance.$el.detach();
                            } else {
                                fromViewRef.instance.$el.remove();
                                fromViewRef.instance = null;
                            }
                        }
                    }, this);
            }
        },

        popView:function () {
            var toViewRef, fromViewRef;
            if (this.viewsStack.length > 0)
                fromViewRef = this.viewsStack[this.viewsStack.length - 1];

            if (this.viewsStack.length > 1)
                toViewRef = this.viewsStack[this.viewsStack.length - 2];

            var event = new StackNavigatorEvent('pop',
                fromViewRef ? fromViewRef.viewClass : null, fromViewRef ? fromViewRef.instance : null,
                toViewRef ? toViewRef.viewClass : null, toViewRef ? toViewRef.instance : null);
            this.trigger(event.action, event);

            if (!event.isDefaultPrevented()) {
                this.viewsStack.pop();

                if (toViewRef && !toViewRef.instance) {
                    var viewClass = toViewRef.viewClass;
                    toViewRef.instance = new viewClass(toViewRef.options);
                    toViewRef.instance.setStackNavigator(this, toViewRef.options ? toViewRef.options.navigationOptions : null);
                    toViewRef.instance.render();
                }
                var slideEffect = new StackNavigatorSlideEffect(this.$el);
                slideEffect.play(fromViewRef.instance.$el, toViewRef ? toViewRef.instance.$el : null, 'right',
                    function () {
                        if (toViewRef)
                            toViewRef.instance.$el.trigger('viewActivate');

                        fromViewRef.instance.$el.trigger('viewDeactivate');
                        fromViewRef.instance.$el.remove();
                        fromViewRef.instance = null;
                    }, this);
            }
        }
    });

    return BackStack;
}));