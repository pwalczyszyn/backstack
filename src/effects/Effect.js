define(['effects/vendorPrefix'], function (vendorPrefix) {

    var Effect = function Effect(params) {

        if (params) _.extend(this, params);

        this.vendorPrefix = vendorPrefix;

        if (this.vendorPrefix == 'Moz' || this.vendorPrefix == '') this.transitionEndEvent = 'transitionend';
        else if (this.vendorPrefix == 'ms') this.transitionEndEvent = 'MSTransitionEnd';
        else this.transitionEndEvent = this.vendorPrefix + 'TransitionEnd';

    };

    Effect.prototype.addTimeoutFallback = function (cleanupFunction) {

//        // This is a fallback for situations when TransitionEnd event doesn't get triggered
//        var transDuration = Math.max(that.fromViewTransitionProps.duration, that.toViewTransitionProps.duration) +
//            Math.max(that.fromViewTransitionProps.delay, that.toViewTransitionProps.delay);
//        timeout = setTimeout(function () {
//            if (activeTransitions > 0) {
//                activeTransitions = -1;
//
//                console.log('Warning ' + that.transitionEndEvent + ' didn\'t trigger in expected time!');
//
//                if ($toView) {
//                    $toView.off(that.transitionEndEvent, transitionEndHandler);
//                    $toView.css(transitionProp, '');
//                    $toView.css(transformProp, '');
//                    $toView.css('left', 0);
//                }
//
//                if ($fromView) {
//                    $fromView.off(that.transitionEndEvent, transitionEndHandler);
//                    $fromView.css(transitionProp, '');
//                    $fromView.css(transformProp, '');
//                }
//
//                callback.call(context);
//            }
//        }, transDuration * 1.5 * 1000);


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