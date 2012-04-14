({
    baseUrl:"../src",
	paths: {
		"almond":"../build/almond-0.0.3"
	},
	include: ["almond", "BackStack"],
    out: "backstack-built.js",
	wrap:true,
	optimize:"none"
})