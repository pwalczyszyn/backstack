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