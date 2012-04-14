/**
 * Created by Piotr Walczyszyn (outof.me | @pwalczyszyn)
 *
 * User: pwalczys
 * Date: 4/14/12
 * Time: 2:11 PM
 */

define(['StackNavigator', 'StackView', 'effects/NoEffect', 'effects/SlideEffect', 'effects/FadeEffect'],
    function (StackNavigator, StackView, NoEffect, SlideEffect, FadeEffect) {

        BackStack.StackNavigator = StackNavigator;
        BackStack.StackView = StackView;
        BackStack.NoEffect = NoEffect;
        BackStack.SlideEffect = SlideEffect;
        BackStack.FadeEffect = FadeEffect;

        return BackStack;
    });

