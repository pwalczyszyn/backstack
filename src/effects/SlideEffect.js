define(['effects/Effect'], function (Effect) {

    var SlideEffect = Effect.extend({

        params:{
            direction:'left',
            fromViewTransitionProps:{duration:0.4, easing:'ease-out', delay:0},
            toViewTransitionProps:{duration:0.4, easing:'ease-out', delay:0}
        }

    });

    SlideEffect.prototype.play = function ($fromView, $toView, callback, context) {
        var that = this,
            activeTransitions = 0,
            transformParams,
            timeout;

        var transitionEndHandler = function (event) {
            activeTransitions--;
            $(event.target)[0].style[that.vendorPrefix + 'Transition'] = '';

            if (activeTransitions == 0 && callback) {
                callback.call(context);
            }
        };

        if ($fromView) {
            activeTransitions++;

            $fromView.one(that.transitionEndEvent, transitionEndHandler);
            $fromView.css('left', 0);
            $fromView[0].style[that.vendorPrefix + 'Transition'] = ['all ',
                that.params.fromViewTransitionProps.duration, 's ',
                that.params.fromViewTransitionProps.easing, ' ',
                that.params.fromViewTransitionProps.delay, 's'].join('');
        }

        if ($toView) {
            activeTransitions++;

            $toView.one(that.transitionEndEvent, transitionEndHandler);
            $toView.css('left', that.params.direction == 'left' ? context.$el.width() : -context.$el.width());
            $toView[0].style[that.vendorPrefix + 'Transition'] = ['all ',
                that.params.toViewTransitionProps.duration, 's ',
                that.params.toViewTransitionProps.easing, ' ',
                that.params.toViewTransitionProps.delay, 's'].join('');

            // Showing the view
            $toView.css('display', $toView.data('original-display'));
            $toView.removeData('original-display');
        }

        if ($fromView || $toView) {
            // This is a hack to force DOM reflow before transition starts
            context.$el.css('width');
            transformParams = 'translateX(' + (that.params.direction == 'left' ? -context.$el.width() : context.$el.width()) + 'px)';
        }

        // This is a fallback for situations when TransitionEnd event doesn't get triggered
        var transDuration = Math.max(that.params.fromViewTransitionProps.duration, that.params.toViewTransitionProps.duration) +
            Math.max(that.params.fromViewTransitionProps.delay, that.params.toViewTransitionProps.delay);
        timeout = setTimeout(function () {
            if (activeTransitions > 0) {
                activeTransitions = -1;

                console.log('Warning ' + that.transitionEndEvent + ' didn\'t trigger in expected time!');

                if ($toView) {
                    $toView.off(that.transitionEndEvent, transitionEndHandler);
                    $toView[0].style[that.vendorPrefix + 'Transition'] = '';
                }

                if ($fromView) {
                    $fromView.off(that.transitionEndEvent, transitionEndHandler);
                    $fromView[0].style[that.vendorPrefix + 'Transition'] = '';
                }

                callback.call(context);
            }
        }, transDuration * 1.5 * 1000);

        if ($fromView && $toView)
            $fromView[0].style[that.vendorPrefix + 'Transform'] = $toView[0].style[that.vendorPrefix + 'Transform'] = transformParams;
        else if ($toView)
            $toView[0].style[that.vendorPrefix + 'Transform'] = transformParams;
        else if ($fromView)
            $fromView[0].style[that.vendorPrefix + 'Transform'] = transformParams;
    };

    return SlideEffect;
});