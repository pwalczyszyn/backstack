/**
 * Created by Piotr Walczyszyn (outof.me | @pwalczyszyn)
 *
 * User: pwalczys
 * Date: 4/14/12
 * Time: 2:56 PM
 */

define(function () {

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