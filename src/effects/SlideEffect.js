define(['effects/Effect'], function (Effect) {

    var SlideEffect = Effect.extend({

        direction:'left',

        fromViewTransitionProps:{duration:0.4, easing:'ease-out', delay:0},

        toViewTransitionProps:{duration:0.4, easing:'ease-out', delay:0}

    });

    SlideEffect.prototype.play = function ($fromView, $toView, callback, context) {
        var that = this,
            activeTransitions = 0,
            transformParams,
            timeout,
            transformProp = that.vendorPrefix == '' ? 'transform'
                : ['-' + that.vendorPrefix.toLowerCase(), '-', 'transform'].join(''),
            transitionProp = that.vendorPrefix == '' ? 'transition'
                : ['-' + that.vendorPrefix.toLowerCase(), '-', 'transition'].join('');

        var transitionEndHandler = function (event) {
            activeTransitions--;
            event.target.style[transitionProp] = '';
            event.target.style[transformProp] = '';

            if ($toView && $toView[0] == event.target) {
                $toView.css('left', 0);
            }

            if (activeTransitions == 0 && callback) {
                callback.call(context);
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
            $toView.css('display', $toView.data('original-display'));
            $toView.removeData('original-display');
        }

        if ($fromView || $toView) {
            // This is a hack to force DOM reflow before transition starts
            context.$el.css('width');
            transformParams = 'translateX(' + (that.direction == 'left' ? -context.$el.width() : context.$el.width()) + 'px)';
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

        if ($fromView && $toView)
            $fromView[0].style[transformProp] = $toView[0].style[transformProp] = transformParams;
        else if ($toView)
            $toView[0].style[transformProp] = transformParams;
        else if ($fromView)
            $fromView[0].style[transformProp] = transformParams;
    };

    return SlideEffect;
});