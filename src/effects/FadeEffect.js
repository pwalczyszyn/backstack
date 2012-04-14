/**
 * Created by Piotr Walczyszyn (outof.me | @pwalczyszyn)
 *
 * User: pwalczys
 * Date: 4/14/12
 * Time: 2:56 PM
 */

define(['effects/vendorPrefix'], function (vendorPrefix) {

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