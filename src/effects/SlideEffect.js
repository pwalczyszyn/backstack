define(['effects/vendorPrefix'], function (vendorPrefix) {

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