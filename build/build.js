({
    baseUrl:"../src",
    paths:{
        "almond":"../build/almond-0.0.3"
    },
    include:["almond", "BackStack"],
    out:"backstack-built.js",
    wrap:{
        startFile:"wrap-start.frag",
        endFile:"wrap-end.frag"
    },
    optimize:"none"
})