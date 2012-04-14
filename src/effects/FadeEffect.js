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
        this.effectParams = 'opacity ' + (effectParams) ? effectParams : '0.2s linear 0.1s';
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
            fromView.one(transitionEndEvent, transitionEndHandler);
            fromView[0].style[vendorPrefix + 'Transition'] = this.effectParams;

            activeTransitions++;
        }

        if (toView) {
            // Setting initial opacity
            toView.css('opacity', 0);
            toView.one(transitionEndEvent, transitionEndHandler);
            toView[0].style[vendorPrefix + 'Transition'] = this.effectParams;

            activeTransitions++;

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

        var that = this;
        setTimeout(function () {
            if (activeTransitions > 0) {
                activeTransitions = 0;

                if (toView)
                    toView[0].style[that.vendorPrefix + 'Transition'] = '';
                if (fromView)
                    fromView[0].style[that.vendorPrefix + 'Transition'] = '';

                callback.call(context);
            }
        }, 350);
    };

    return FadeEffect;
});