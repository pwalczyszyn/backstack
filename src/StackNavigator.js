define(['effects/SlideEffect'], function (SlideEffect) {

    /**
     * Private common push method.
     *
     * @param fromViewRef - reference to from view
     * @param toViewRef - reference to to view
     * @param transition - transition to played during push
     */
    var push = function (fromViewRef, toViewRef, transition) {

        // Hiding view
        toViewRef.instance.$el.data('original-display', toViewRef.instance.$el.css('display'));
        toViewRef.instance.$el.css('display', 'none');

        // Adding view to the DOM
        this.$el.append(toViewRef.instance.$el);

        // Rendering view if required
        if (!toViewRef.instance.rendered) {
            toViewRef.instance.render.call(toViewRef.instance);
            toViewRef.instance.rendered = true;
        }
        // Adding view to the stack internal array
        this.viewsStack.push(toViewRef);

        transition = transition || this.defaultPushTransition || (this.defaultPushTransition = new SlideEffect(this, 'left'));
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

            if (!toViewRef.instance) {
                // Getting view class declaration
                var viewClass = toViewRef.viewClass;
                // Creating view instance
                toViewRef.instance = new viewClass(toViewRef.options);
                // Setting ref to StackNavigator
                toViewRef.instance.setStackNavigator(this, toViewRef.options ? toViewRef.options.navigationOptions : null);
            }

            // Hiding view
            toViewRef.instance.$el.data('original-display', toViewRef.instance.$el.css('display'));
            toViewRef.instance.$el.css('display', 'none');

            // Adding view to the DOM
            this.$el.append(toViewRef.instance.$el);
            // Rendering view if required
            if (!toViewRef.instance.rendered) {
                toViewRef.instance.render.call(toViewRef.instance);
                toViewRef.instance.rendered = true;
            }

        }

        transition = transition || this.defaultPopTransition || (this.defaultPopTransition = new SlideEffect(this, 'right'));
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
        },

        pushView:function (view, viewOptions, transition) {
            var toView, toViewRef,
                isViewInstance = (typeof view !== 'function'),
                fromViewRef = _.last(this.viewsStack);

            toView = (!isViewInstance) ? new view(viewOptions) : view;
            toView.setStackNavigator(this, (viewOptions) ? viewOptions.navigationOptions : null);
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
                toView.setStackNavigator(this, (viewOptions) ? viewOptions.navigationOptions : null);
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
        }
    });

    return StackNavigator;
});