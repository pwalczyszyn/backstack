define(['effects/Effect'], function (Effect) {

    var NoEffect = Effect.extend();
    NoEffect.prototype.play = function ($fromView, $toView, callback, context) {
        if ($toView) {
            // Showing the view
            $toView.css('visibility', 'visible');
        }
        callback.call(context);
    };

    return NoEffect;
});