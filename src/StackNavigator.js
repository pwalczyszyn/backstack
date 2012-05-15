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
     * Creates event objects triggered by BackStack
     *
     * @param type event type name
     * @param args event args
     * @param cancelable flag indicating if event is cancelable
     * @return {*}
     */
    var createEvent = function (type, args, cancelable) {
        return _.extend({

            type:type,

            cancelable:_.isUndefined(cancelable) ? false : cancelable,

            preventDefault:function () {
                if (this.cancelable)
                    this.isDefaultPrevented = function () {
                        return true;
                    };
            },

            isDefaultPrevented:function () {
                return false;
            },

            trigger:function (target) {
                target.trigger(this.type, this);
                return this;
            }
        }, args);
    };

    /**
     * Private common push method
     *
     * @param fromViewRef - reference to from view
     * @param toViewRef - reference to to view
     * @param replaceHowMany - number of views to replace with pushed view
     * @param transition - transition to played during push
     */
    var push = function (fromViewRef, toViewRef, replaceHowMany, transition) {

        // Rendering view if required
        appendView(toViewRef.instance, this);

        transition = transition || this.defaultPushTransition || (this.defaultPushTransition = new SlideEffect({direction:'left'}));
        transition.play(fromViewRef ? fromViewRef.instance.$el : null, toViewRef.instance.$el,
            function () { // Callback function

                var remove = replaceHowMany > 0 ? this.viewsStack.splice(this.viewsStack.length - replaceHowMany, replaceHowMany)
                    : (fromViewRef ? [fromViewRef] : null);

                _.each(remove, function (ref) {

                    // Triggering viewDeactivate event
                    createEvent('viewDeactivate', {target:ref.instance}).trigger(ref.instance);

                    if (ref.instance.destructionPolicy == 'never') { // Detaching if destructionPolicy == 'never'
                        ref.instance.$el.detach();
                    } else { // Removing if destructionPolicy == 'auto'
                        ref.instance.remove();
                        ref.instance = null;
                    }
                }, this);

                // Adding view to the stack internal array
                this.viewsStack.push(toViewRef);

                // Setting activeView property
                this.activeView = toViewRef.instance;

                // Triggering viewActivate event
                createEvent('viewActivate', {target:toViewRef.instance}).trigger(toViewRef.instance);

                // Triggering viewChanged event
                createEvent('viewChanged', {target:this}).trigger(this);

            }, this);
    };

    /**
     * Private common pop method
     *
     * @param fromViewRef - reference to from view
     * @param toViewRef - reference to to view
     * @param howMany - number of views to pop from the stack
     * @param transition - transition to played during pop
     */
    var pop = function (fromViewRef, toViewRef, howMany, transition) {

        if (toViewRef) {
            // Recreating view instance if necessary
            toViewRef.instance = toViewRef.instance ? toViewRef.instance : new toViewRef.viewClass(toViewRef.options);
            // Rendering view if required
            appendView(toViewRef.instance, this);
        }

        transition = transition || this.defaultPopTransition || (this.defaultPopTransition = new SlideEffect({direction:'right'}));
        transition.play(fromViewRef.instance.$el, toViewRef ? toViewRef.instance.$el : null,
            function () { // Callback function

                // Popping views from a stack
                var remove = this.viewsStack.splice(this.viewsStack.length - howMany, howMany);
                _.each(remove, function (ref) {

                    // Triggering viewDeactivate event
                    createEvent('viewDeactivate', {target:ref.instance}).trigger(ref.instance);

                    if (ref.instance.destructionPolicy == 'never') { // Detaching if destructionPolicy == 'never'
                        ref.instance.$el.detach();
                    } else { // Removing if destructionPolicy == 'auto'
                        ref.instance.remove();
                        ref.instance = null;
                    }
                }, this);

                if (toViewRef) { // If toViewRef exists activating it

                    // Setting activeView property
                    this.activeView = toViewRef.instance;

                    // Triggering viewActivate event
                    createEvent('viewActivate', {target:toViewRef.instance}).trigger(toViewRef.instance);

                } else { // Nulling activeView property
                    this.activeView = null;
                }

                // Triggering viewChanged event
                createEvent('viewChanged', {target:this}).trigger(this);

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
            // Creating viewChanging event object and triggering it
                event = createEvent('viewChanging',
                    {
                        action:'push',
                        fromViewClass:fromViewRef ? fromViewRef.viewClass : null,
                        fromView:fromViewRef ? fromViewRef.instance : null,
                        toViewClass:toViewRef.viewClass,
                        toView:toViewRef.instance
                    },
                    true).trigger(this);

            // Checking if event wasn't cancelled
            if (event.isDefaultPrevented()) return null;

            push.call(this, fromViewRef, toViewRef, 0, transition);
            return toView;
        },

        popView:function (transition) {
            if (this.viewsStack.length == 0) throw new Error('Popping from an empty stack!');

            // Getting ref of the view on top of the stack
            var fromViewRef = _.last(this.viewsStack),
            // Getting ref of the view below current one
                toViewRef = this.viewsStack.length > 1 ? this.viewsStack[this.viewsStack.length - 2] : null,
            // Creating viewChanging event object and triggering it
                event = createEvent('viewChanging',
                    {
                        action:'pop',
                        fromViewClass:fromViewRef.viewClass,
                        fromView:fromViewRef.instance,
                        toViewClass:toViewRef ? toViewRef.viewClass : null,
                        toView:toViewRef ? toViewRef.instance : null
                    },
                    true).trigger(this);

            // Checking if event wasn't cancelled
            if (event.isDefaultPrevented()) return;

            // Popping top view
            pop.call(this, fromViewRef, toViewRef, 1, transition);
        },

        popAll:function (transition) {
            if (this.viewsStack.length == 0) throw new Error('Popping from an empty stack!');

            // Getting ref of the view on top of the stack
            var fromViewRef = _.last(this.viewsStack),
            // Creating viewChanging event object and triggering it
                event = createEvent('viewChanging',
                    {
                        action:'popAll',
                        fromViewClass:fromViewRef.viewClass,
                        fromView:fromViewRef.instance,
                        toViewClass:null,
                        toView:null
                    },
                    true).trigger(this);

            // Checking if event wasn't cancelled
            if (event.isDefaultPrevented()) return;

            // Popping top view
            pop.call(this, fromViewRef, null, this.viewsStack.length, transition);
        },

        replaceView:function (view, viewOptions, transition) {
            if (this.viewsStack.length == 0) throw new Error('Replacing on an empty stack!');

            // Getting ref of the view on top of the stack
            var fromViewRef = _.last(this.viewsStack),
            // Creating new view instance if it is necessary
                toView = _.isFunction(view) ? new view(viewOptions) : view,
            // Creating new view ref
                toViewRef = {instance:toView, viewClass:toView.constructor, options:viewOptions},
            // Creating viewChanging event object and triggering it
                event = createEvent('viewChanging',
                    {
                        action:'replace',
                        fromViewClass:fromViewRef.viewClass,
                        fromView:fromViewRef.instance,
                        toViewClass:toViewRef.viewClass,
                        toView:toViewRef.instance
                    },
                    true).trigger(this);

            // Checking if event wasn't cancelled
            if (event.isDefaultPrevented()) return null;

            // Pushing new view on top
            push.call(this, fromViewRef, toViewRef, 1, transition);

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
            // Creating viewChanging event object and triggering it
                event = createEvent('viewChanging',
                    {
                        action:'replaceAll',
                        fromViewClass:fromViewRef.viewClass,
                        fromView:fromViewRef.instance,
                        toViewClass:toViewRef.viewClass,
                        toView:toViewRef.instance
                    },
                    true).trigger(this);

            // Checking if event wasn't cancelled
            if (event.isDefaultPrevented()) return null;

            // Pushing new view on top
            push.call(this, fromViewRef, toViewRef, this.viewsStack.length, transition);

            // Returning pushed new view
            return toView;
        }
    });

    return StackNavigator;
});