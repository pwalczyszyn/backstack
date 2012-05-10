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

        viewsStack:null,

        activeView:null,

        defaultPushTransition:null,

        defaultPopTransition:null,

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
            var toView, toViewRef,
                isViewInstance = (typeof view !== 'function'),
                fromViewRef = _.last(this.viewsStack);

            // Creating new view instance if it is necessary
            toView = (!isViewInstance) ? new view(viewOptions) : view;

            // Creating new view ref
            toViewRef = {instance:toView, viewClass:toView.constructor, options:viewOptions};

            var event = $.Event('viewChanging',
                {
                    action:'push',
                    fromViewClass:fromViewRef ? fromViewRef.viewClass : null,
                    fromView:fromViewRef ? fromViewRef.instance : null,
                    toViewClass:toViewRef.viewClass,
                    toView:toViewRef.instance
                });
            this.trigger(event.type, event);

            if (!event.isDefaultPrevented()) {

                push.call(this, fromViewRef, toViewRef, transition);

                return toView;
            }

            return null;
        },

        popView:function (transition) {
            var toViewRef, fromViewRef;
            if (this.viewsStack.length > 0)
                fromViewRef = this.viewsStack[this.viewsStack.length - 1];

            if (this.viewsStack.length > 1)
                toViewRef = this.viewsStack[this.viewsStack.length - 2];

            var event = $.Event('viewChanging',
                {
                    action:'pop',
                    fromViewClass:fromViewRef ? fromViewRef.viewClass : null,
                    fromView:fromViewRef ? fromViewRef.instance : null,
                    toViewClass:toViewRef ? toViewRef.viewClass : null,
                    toView:toViewRef ? toViewRef.instance : null
                });
            this.trigger(event.type, event);

            if (!event.isDefaultPrevented()) {

                var fromView = fromViewRef.instance;
                pop.call(this, fromViewRef, toViewRef, transition);

                return fromView;
            }

            return null;
        },

        popAll:function (transition) {
            if (this.viewsStack.length > 0) {

                var fromViewRef;
                if (this.viewsStack.length > 0)
                    fromViewRef = this.viewsStack[this.viewsStack.length - 1];

                var event = $.Event('viewChanging',
                    {
                        action:'popAll',
                        fromViewClass:fromViewRef ? fromViewRef.viewClass : null,
                        fromView:fromViewRef ? fromViewRef.instance : null,
                        toViewClass:null,
                        toView:null
                    });
                this.trigger(event.type, event);

                if (!event.isDefaultPrevented()) {
                    // Removing views except the top one
                    this.viewsStack.splice(0, this.viewsStack.length - 1);
                    pop.call(this, fromViewRef, null, transition);
                }
            }
            return null;
        },

        replaceView:function (view, viewOptions, transition) {
            if (this.viewsStack.length > 0) {

                var toView, toViewRef,
                    isViewInstance = (typeof view !== 'function'),
                    fromViewRef = this.viewsStack[this.viewsStack.length - 1];

                toView = (!isViewInstance) ? new view(viewOptions) : view;
                toViewRef = {instance:toView, viewClass:toView.constructor, options:viewOptions};

                var event = $.Event('viewChanging',
                    {
                        action:'replace',
                        fromViewClass:fromViewRef.viewClass,
                        fromView:fromViewRef.instance,
                        toViewClass:toViewRef.viewClass,
                        toView:toViewRef.instance
                    });
                this.trigger(event.type, event);

                if (!event.isDefaultPrevented()) {

                    this.viewsStack.pop();
                    push.call(this, fromViewRef, toViewRef, transition);

                    return toView;
                }
            }
            return null;
        },

        replaceAll:function (view, viewOptions, transition) {
            if (this.viewsStack.length > 0) {

                var toView, toViewRef,
                    isViewInstance = (typeof view !== 'function'),
                    fromViewRef = this.viewsStack[this.viewsStack.length - 1];

                toView = (!isViewInstance) ? new view(viewOptions) : view;
                toViewRef = {instance:toView, viewClass:toView.constructor, options:viewOptions};

                var event = $.Event('viewChanging',
                    {
                        action:'replaceAll',
                        fromViewClass:fromViewRef.viewClass,
                        fromView:fromViewRef.instance,
                        toViewClass:toViewRef.viewClass,
                        toView:toViewRef.instance
                    });
                this.trigger(event.type, event);

                if (!event.isDefaultPrevented()) {

                    this.viewsStack.splice(0, this.viewsStack.length);
                    push.call(this, fromViewRef, toViewRef, transition);

                    return toView;
                }
            }
            return null;
        }
    });

    return StackNavigator;
});