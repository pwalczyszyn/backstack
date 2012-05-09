define(['StackNavigator', 'effects/Effect', 'effects/NoEffect', 'effects/SlideEffect', 'effects/FadeEffect'],
    function (StackNavigator, Effect, NoEffect, SlideEffect, FadeEffect) {

        BackStack.StackNavigator = StackNavigator;
        BackStack.Effect = Effect;
        BackStack.NoEffect = NoEffect;
        BackStack.SlideEffect = SlideEffect;
        BackStack.FadeEffect = FadeEffect;

        return BackStack;
    });
