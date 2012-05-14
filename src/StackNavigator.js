define(['effects/SlideEffect'], function (SlideEffect) {

    /**
     * Rendering the view and setting props required by StackNavigator
     *
     * @param view - view to be rendered
     * @param stackNavigator - view StackNavigator instance
     */
    var appendView = function (view, stackNavigator) {

        if (!view.__backStackRendered__) {

            // Setting ref to parent StackNavigator
            view.stackNavigator = stackNavigator;

            // Setting default destructionPolicy if it's not set
            if (typeof view.destructionPolicy === 'undefined') view.destructionPolicy = 'auto';

            // Setting default styles
            view.$el.css({position:'absolute', visibility:'hidden', overflow:'hidden', width:'100%', height:'100%'});

        } else {
            // Resetting visibility to hidden
            view.$el.css({visibility:'hidden'});
        }

        // Adding view to the DOM
        stackNavigator.$el.append(view.el);

        if (!view.__backStackRendered__) {
            // Rendering the view
            view.render.call(view);

            // Setting default of __backStackRendered__ property
            view.__backStackRendered__ = true;
        }

    }

    /**
     * Private common push method.
     *
     * @param fromViewRef - reference to from view
     * @param toViewRef - reference to to view
     * @param transition - transition to played during push
     */
    var push = function (fromViewRef, toViewRef, transition) {

        // Rendering view if required
        appendView(toViewRef.instance, this);

        // Adding view to the stack internal array
        this.viewsStack.push(toViewRef);

        transition = transition || this.defaultPushTransition || (this.defaultPushTransition = new SlideEffect({direction:'left'}));
        transition.play(fromViewRef ? fromViewRef.instance.$el : null, toViewRef.instance.$el,
            function () {

                this.activeView = toViewRef.instance;
                toViewRef.instance.$el.trigger('viewActivate');

                if (fromViewRef) {
                    fromViewRef.instance.$el.trigger('viewDeactivate');

                    if (fromViewRef.instance.destructionPolicy == 'never') {
                        fromViewRef.instance.$el.detach();
                    } else {
                        fromViewRef.instance.remove();
                        fromViewRef.instance = null;
                    }
                }

                this.trigger('viewChanged');
            }, this);
    };

    /**
     * Private common pop method.
     *
     * @param fromViewRef - reference to from view
     * @param toViewRef - reference to to view
     * @param transition - transition to played during pop
     */
    var pop = function (fromViewRef, toViewRef, transition) {

        // Removing top view ref from the stack array
        this.viewsStack.pop();

        if (toViewRef) {

            // Recreating view instance
            if (!toViewRef.instance) {
                // Getting view class declaration
                var viewClass = toViewRef.viewClass;
                // Creating view instance
                toViewRef.instance = new viewClass(toViewRef.options);
            }

            // Rendering view if required
            appendView(toViewRef.instance, this);

        }

        transition = transition || this.defaultPopTransition || (this.defaultPopTransition = new SlideEffect({direction:'right'}));
        transition.play(fromViewRef.instance.$el, toViewRef ? toViewRef.instance.$el : null,
            function () {

                if (toViewRef) {
                    this.activeView = toViewRef.instance;
                    toViewRef.instance.$el.trigger('viewActivate');
                } else {
                    this.activeView = null;
                }

                fromViewRef.instance.$el.trigger('viewDeactivate');
                fromViewRef.instance.remove();
                fromViewRef.instance = null;

                this.trigger('viewChanged');
            }, this);
    };

    /**
     * StackNavigator implementation
     */
    var StackNavigator = Backbone.View.extend({

        /**
         * An array with all the view refs on the stack
         */
        viewsStack:null,

        /**
         * View on top of the stack
         */
        activeView:null,

        /**
         * Default push transition effect
         */
        defaultPushTransition:null,

        /**
         * Default pop transition effect
         */
        defaultPopTransition:null,

        /**
         * Proxying viewActivate and viewDeactivate events
         */
        events:{
            'viewActivate':'proxyActivationEvents',
            'viewDeactivate':'proxyActivationEvents'
        },

        proxyActivationEvents:function (event) {
            this.trigger(event.type, event);
        },

        initialize:function (options) {
            // Setting default styles
            this.$el.css({overflow:'hidden'});

            // Setting new viewsStack array
            this.viewsStack = [];

            // Setting default pop transition
            if (options.popTransition) this.defaultPopTransition = options.popTransition;

            // Setting default push transition
            if (options.pushTransition) this.defaultPushTransition = options.pushTransition;
        },

        pushView:function (view, viewOptions, transition) {
            // Getting ref of the view on top of the stack
            var fromViewRef = _.last(this.viewsStack),
            // Creating new view instance if it is necessary
                toView = _.isFunction(view) ? new view(viewOptions) : view,
            // Creating new view ref
                toViewRef = {instance:toView, viewClass:toView.constructor, options:viewOptions},
            // Creating viewChanging event object
                event = $.Event('viewChanging',
                    {
                        action:'push',
                        fromViewClass:fromViewRef ? fromViewRef.viewClass : null,
                        fromView:fromViewRef ? fromViewRef.instance : null,
                        toViewClass:toViewRef.viewClass,
                        toView:toViewRef.instance
                    });
            // Triggering viewChanging event
            this.trigger(event.type, event);

            if (event.isDefaultPrevented()) return null;

            push.call(this, fromViewRef, toViewRef, transition);
            return toView;
        },

        popView:function (transition) {
            if (this.viewsStack.length == 0) throw new Error('Popping from an empty stack!');

            // Getting ref of the view on top of the stack
            var fromViewRef = _.last(this.viewsStack),
            // Getting ref of the view below current one
                toViewRef = this.viewsStack.length > 1 ? this.viewsStack[this.viewsStack.length - 2] : null,
            // Creating viewChanging event object
                event = $.Event('viewChanging',
                    {
                        action:'pop',
                        fromViewClass:fromViewRef.viewClass,
                        fromView:fromViewRef.instance,
                        toViewClass:toViewRef ? toViewRef.viewClass : null,
                        toView:toViewRef ? toViewRef.instance : null
                    });
            this.trigger(event.type, event);

            // Checking if event wasn't cancelled
            if (event.isDefaultPrevented()) return;

            // Popping top view
            pop.call(this, fromViewRef, toViewRef, transition);
        },

        popAll:function (transition) {
            if (this.viewsStack.length == 0) throw new Error('Popping from an empty stack!');

            // Getting ref of the view on top of the stack
            var fromViewRef = _.last(this.viewsStack),
            // Creating viewChanging event object
                event = $.Event('viewChanging',
                    {
                        action:'popAll',
                        fromViewClass:fromViewRef.viewClass,
                        fromView:fromViewRef.instance,
                        toViewClass:null,
                        toView:null
                    });
            this.trigger(event.type, event);

            // Checking if event wasn't cancelled
            if (event.isDefaultPrevented()) return;

            // Removing views except the top one
            this.viewsStack.splice(0, this.viewsStack.length - 1);
            // Popping top view
            pop.call(this, fromViewRef, null, transition);
        },

        replaceView:function (view, viewOptions, transition) {
            if (this.viewsStack.length == 0) throw new Error('Replacing on an empty stack!');

            // Getting ref of the view on top of the stack
            var fromViewRef = _.last(this.viewsStack),
            // Creating new view instance if it is necessary
                toView = _.isFunction(view) ? new view(viewOptions) : view,
            // Creating new view ref
                toViewRef = {instance:toView, viewClass:toView.constructor, options:viewOptions},
            // Creating viewChanging event object
                event = $.Event('viewChanging',
                    {
                        action:'replace',
                        fromViewClass:fromViewRef.viewClass,
                        fromView:fromViewRef.instance,
                        toViewClass:toViewRef.viewClass,
                        toView:toViewRef.instance
                    });
            this.trigger(event.type, event);

            // Checking if event wasn't cancelled
            if (event.isDefaultPrevented()) return null;

            // Removing view from the top of a stack
            this.viewsStack.pop();
            // Pushing new view on top
            push.call(this, fromViewRef, toViewRef, transition);

            // Returning pushed new view
            return toView;
        },

        replaceAll:function (view, viewOptions, transition) {
            if (this.viewsStack.length == 0) throw new Error('Replacing on an empty stack!');

            // Getting ref of the view on top of the stack
            var fromViewRef = _.last(this.viewsStack),
            // Creating new view instance if it is necessary
                toView = _.isFunction(view) ? new view(viewOptions) : view,
            // Creating new view ref
                toViewRef = {instance:toView, viewClass:toView.constructor, options:viewOptions},
            // Creating viewChanging event object
                event = $.Event('viewChanging',
                    {
                        action:'replaceAll',
                        fromViewClass:fromViewRef.viewClass,
                        fromView:fromViewRef.instance,
                        toViewClass:toViewRef.viewClass,
                        toView:toViewRef.instance
                    });
            this.trigger(event.type, event);

            // Checking if event wasn't cancelled
            if (event.isDefaultPrevented()) return null;

            // Removing all views stack array
            this.viewsStack.splice(0, this.viewsStack.length);
            // Pushing new view on top
            push.call(this, fromViewRef, toViewRef, transition);

            // Returning pushed new view
            return toView;
        }
    });

    return StackNavigator;
});