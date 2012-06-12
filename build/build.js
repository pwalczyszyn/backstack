({
    baseUrl:"../src",
    paths:{
        "almond":"../build/almond"
    },
    include:["almond", "StackNavigator", "effects/Effect", "effects/FadeEffect", "effects/NoEffect", "effects/SlideEffect"],
    preserveLicenseComments:true,
    out:"backstack-built.js",
    wrap:{
        startFile:"wrap-start.frag",
        endFile:"wrap-end.frag"
    },
    optimize:"none"
})