<div>
    <h3>What is BackStack?</h3>
    <p>
        BackStack is a JavaScript component/extension for <a href="http://documentcloud.github.com/backbone" target="_blank">Backbone.js</a> that allows you to create nice view
        transitions in your HTML5 apps. By default it comes with an implementation of mobile-style slide transitions, fade
        transitions, and no-effect transitions.
    </p>
    <p>
        It is conceptually based on the <a href="http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/spark/components/ViewNavigator.html" target="_blank">ViewNavigator API</a> from the mobile SDK of the <a href="http://incubator.apache.org/flex/" target="_blank">Apache Flex framework</a>. It enables developers to manage a stack of views that can be pushed, popped, or replaced.
    </p>

    <h3>Why should I use it?</h3>
    <p>Although you can use it for web development (as I did to create <a href='http://pwalczyszyn.github.com/backstack/' target='_blank'>this</a> site) it is especially useful when building mobile apps with PhoneGap/Cordova framework.
        Of course, if you are using one of the dozen or so available mobile UI frameworks like <a href="http://jquerymobile.com/" target="_blank">jQuery Mobile</a>,
        <a href="http://www.sencha.com/products/touch/" target="_blank">Sencha Touch</a>, or <a href="http://www.jqtouch.com/" target="_blank">jQTouch</a> you don't need it.
    </p>

    <h3>Are there other alternatives?</h3>
    <p>You can use the ViewNavigator implementation from the <a href="http://triceam.github.com/app-UI/" target="_blank">app-UI</a> framework built by fellow Adobe Evangelist
        <a href="http://tricedesigns.com/" target="_blank">Andy Trice</a>. Alternatively, you can build the transitions yourself; it is not really hard! Or, use one of the frameworks mentioned above.
    </p>

    <h3>How was it built?</h3>
    <p>This may not be particularly interesting to everyone but I used the <a href="https://github.com/jrburke/almond" target="_blank">almond</a> library to develop/package BackStack. Almond is a replacement AMD loader for RequireJS. It is a smaller "shim" loader, providing a minimal AMD API footprint that includes loader plugin support.</p>
</div>

### Where can I find more info about it?
<a href='http://pwalczyszyn.github.com/backstack' target='_blank'>Here is a demo site</a> that is actually built with BackStack. Be aware of a disclaimer that I only tested it with WebKit based browsers as I mainly used it for mobile apps development. So if you are on IE this site many not work for you, sorry for that ;)

You can also checkout this <a href='http://jsfiddle.net/pwalczyszyn/dwRQU' target='_blank'>simple example</a> that is available on jsFiddle.

### BackStack.StackNavigator class API
<div>
    <h3>Constructor</h3>


    <ul>
        <li><strong>options</strong> - Backbone view options hash.
            <ul>
                <li><strong>options.popTransition</strong> - default transition effect object to be used during pop operations.</li>
                <li><strong>options.pushTransition</strong> - default transition effect object to be used during push operations.</li>
            </ul>
        </li>
    </ul>


    <h3>Events</h3>
    <p>
        BackStack.StackNavigator eventing model is based on Backbone's events implementation.
        <ul>
            <li><strong>StackNavigator#viewChanging</strong> - It's triggered just before view on the stack is changed. This event is cancelable and the view change can be stopped using <code>event.preventDefault()</code> function.
                <h4>Event object properties:</h4>
                <ul>
                    <li><strong>action</strong> - this property can have following values: push, pop, popAll, replace and replaceAll.</li>
                    <li><strong>fromViewClass</strong> - class of a from view.</li>
                    <li><strong>fromView</strong> - instance of a from view.</li>
                    <li><strong>toViewClass</strong> - class of a to view.</li>
                    <li><strong>toView</strong> - instance of a to view.</li>
                </ul>
            </li>

            <li><strong>StackNavigator#viewChanged</strong> - It's triggered after view on the stack is changed. This event cannot be canceled.
                <h4>Event object properties:</h4>
                <ul>
                    <li><strong>target</strong> - Instance of BackStack.StackNavigator that triggered this event.</li>
                </ul>
            </li>
            <li><strong>Backbone.View#viewActivate</strong> - This event is triggered when view is activated on the stack.
                <h4>Event object properties:</h4>
                <ul>
                    <li><strong>target</strong> - Instance of a view that was activated.</li>
                </ul>
            </li>
            <li><strong>Backbone.View#viewDeactivate</strong> - This event is triggered when view is deactivated on the stack. Either it was popped or it was covered by another view.
                <h4>Event object properties:</h4>
                <ul>
                    <li><strong>target</strong> - Instance of a view that was deactivated.</li>
                </ul>
            </li>
        </ul>
    </p>

    <h3>Fields</h3>
    <ul>
        <li><strong>StackNavigator.viewsStack</strong> - An array with all the view refs on the stack.</li>
        <li><strong>StackNavigator.activeView</strong> - View on top of the stack.</li>
        <li><strong>StackNavigator.defaultPushTransition</strong> - Default push transition effect.</li>
        <li><strong>StackNavigator.defaultPopTransition</strong> - Default pop transition effect.</li>
    </ul>

    <h3>Functions</h3>
    <ul>
        <li><strong>StackNavigator.popAll(transition)</strong> - Pops all views from a stack and leaves empty stack.
            <h4>Parameters:</h4>
            <ul>
                <li>{Effect} <strong>transition</strong> Transition effect to be played when popping views.</li>
            </ul>
        </li>

        <li><strong>StackNavigator.popView(transition)</strong> - Pops an active view from a stack and displays one below.
            <h4>Parameters:</h4>
            <ul>
                <li>{Effect} <strong>transition</strong> Transition effect to be played when popping new view.</li>
            </ul>
        </li>

        <li><strong>StackNavigator.pushView(view, viewOptions, transition)</strong> - Pushes new view to the stack.
            <h4>Parameters:</h4>
            <ul>
                <li>{Backbone.View || Backbone.ViewClass} <strong>view</strong> View class or view instance to be pushed on top of the stack.</li>
                <li>{Object} <strong>viewOptions</strong> Options to be passed if view is constructed by StackNavigator.</li>
                <li>{Effect} <strong>transition</strong> Transition effect to be played when pushing new view.</li>
            </ul>
            <p><strong>Returns:</strong> {Backbone.View} Instance of a pushed view.</p>
        </li>

        <li><strong>StackNavigator.replaceAll(view, viewOptions, transition)</strong> - Replaces all of the views on the stack, with the one passed as a view param.
            <h4>Parameters:</h4>
            <ul>
                <li>{Backbone.View || Backbone.ViewClass} <strong>view</strong> View class or view instance to be pushed on top of the stack.</li>
                <li>{Object} <strong>viewOptions</strong> Options to be passed if view is constructed by StackNavigator.</li>
                <li>{Effect} <strong>transition</strong> Transition effect to be played when replacing views.</li>
            </ul>
            <p><strong>Returns:</strong> {Backbone.View} Instance of a pushed view.</p>
        </li>

        <li><strong>StackNavigator.replaceView(view, viewOptions, transition)</strong> - Replaces view on top of the stack, with the one passed as a view param.
            <h4>Parameters:</h4>
            <ul>
                <li>{Backbone.View || Backbone.ViewClass} <strong>view</strong> View class or view instance to be pushed on top of the stack instead of current one.</li>
                <li>{Object} <strong>viewOptions</strong> Options to be passed if view is constructed by StackNavigator.</li>
                <li>{Effect} <strong>transition</strong> Transition effect to be played when replacing view.</li>
            </ul>

            <p><strong>Returns:</strong> {Backbone.View} Instance of a pushed view.</p>
        </li>
    </ul>
</div>