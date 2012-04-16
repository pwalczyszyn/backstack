define(['StackNavigator', 'StackView', 'effects/Effect', 'effects/NoEffect', 'effects/SlideEffect', 'effects/FadeEffect'],
    function (StackNavigator, StackView, Effect, NoEffect, SlideEffect, FadeEffect) {

        BackStack.StackNavigator = StackNavigator;
        BackStack.StackView = StackView;
        BackStack.Effect = Effect;
        BackStack.NoEffect = NoEffect;
        BackStack.SlideEffect = SlideEffect;
        BackStack.FadeEffect = FadeEffect;

        return BackStack;
    });
