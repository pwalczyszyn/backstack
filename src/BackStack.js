/**
 * Created by Piotr Walczyszyn (outof.me | @pwalczyszyn)
 *
 * User: pwalczys
 * Date: 4/14/12
 * Time: 2:11 PM
 */

define(['StackNavigator', 'StackView', 'effects/NoEffect', 'effects/SlideEffect', 'effects/FadeEffect'],
    function (StackNavigator, StackView, NoEffect, SlideEffect, FadeEffect) {

        var BackStack = {
            StackNavigator:StackNavigator,
            StackView:StackView,
            NoEffect:NoEffect,
            SlideEffect:SlideEffect,
            FadeEffect:FadeEffect
        };

        return BackStack;
    });

require(['BackStack'], function (BackStack) {
    window.BackStack = BackStack;
    console.log('BackStack initialized!');
    $(document).trigger('BackStackLoaded');
});
