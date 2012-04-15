define(['effects/Effect'], function (Effect) {

    var FadeEffect = Effect.extend({
        params:{
            fromViewTransitionProps:{duration:0.4, easing:'linear', delay:0.1},
            toViewTransitionProps:{duration:0.4, easing:'linear', delay:0.1}
        }
    });

    FadeEffect.prototype.play = function ($fromView, $toView, callback, context) {
        var that = this,
            activeTransitions = 0,
            timeout;

        var transitionEndHandler = function (event) {
            activeTransitions--;
            $(event.target)[0].style[that.vendorPrefix + 'Transition'] = '';

            if (activeTransitions == 0 && callback) {
                if (timeout) clearTimeout(timeout);
                callback.call(context);
            }
        };

        if ($fromView) {
            activeTransitions++;

            $fromView.one(that.transitionEndEvent, transitionEndHandler);
            $fromView[0].style[that.vendorPrefix + 'Transition'] = ['opacity ',
                that.params.fromViewTransitionProps.duration, 's ',
                that.params.fromViewTransitionProps.easing, ' ',
                that.params.fromViewTransitionProps.delay, 's'].join('');
        }

        if ($toView) {
            activeTransitions++;

            // Setting initial opacity
            $toView.css('opacity', 0);
            $toView.one(that.transitionEndEvent, transitionEndHandler);
            $toView[0].style[that.vendorPrefix + 'Transition'] = ['opacity ',
                that.params.toViewTransitionProps.duration, 's ',
                that.params.toViewTransitionProps.easing, ' ',
                that.params.toViewTransitionProps.delay, 's'].join('');

            // Showing the view
            $toView.css('display', $toView.data('original-display'));
            $toView.removeData('original-display');
        }

        // This is a hack to force DOM reflow before transition starts
        context.$el.css('width');

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

        if ($toView)
            $toView.css('opacity', 1);

        if ($fromView)
            $fromView.css('opacity', 0);
    };

    return FadeEffect;
});