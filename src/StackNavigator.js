define(['effects/SlideEffect'], function (SlideEffect) {

    /**
     * Rendering the view and setting props required by StackNavigator.
     * @private
     * @ignore
     *
     * @param {View} view View to be rendered.
     * @param {StackNavigator} stackNavigator View StackNavigator instance.
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
     * Creates event objects triggered by BackStack.
     * @private
     * @ignore
     *
     * @param {string} type Event type name.
     * @param {*} args Event args.
     * @param {boolean} cancelable Flag indicating if event is cancelable.
     * @return {event} The new object.
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
     * Private common push method.
     * @private
     * @ignore
     *
     * @param {object} fromViewRef Reference to from view.
     * @param {object} toViewRef Reference to to view.
     * @param {number} replaceHowMany Number of views to replace with pushed view.
     * @param {Effect} transition Transition to played during push.
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
     * Private common pop method.
     * @private
     * @ignore
     *
     * @param {object} fromViewRef Reference to from view.
     * @param {object} toViewRef Reference to to view.
     * @param {number} howMany Number of views to pop from the stack.
     * @param {Effect} transition Transition to played during pop.
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

    var StackNavigator = Backbone.View.extend(
        /** @lends BackStack.StackNavigator */
        {

            /**
             * @name StackNavigator#viewChanging
             * @event
             * @param {Object} e
             * @param {Boolean} [e.cancelable=true]
             */

            /**
             * An array with all the view refs on the stack.
             */
            viewsStack:null,

            /**
             * View on top of the stack.
             */
            activeView:null,

            /**
             * Default push transition effect.
             */
            defaultPushTransition:null,

            /**
             * Default pop transition effect.
             */
            defaultPopTransition:null,

            /**
             * Initializes StackNavigator.
             *
             * @param {Object} options This is a Backbone.View options hash that can have popTransition and pushTransition
             * properties that can be initiated for this instance of navigator.
             *
             * @constructs
             * */
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

            /**
             * Pushes new view to the stack.
             *
             * @param {Backbone.View || Backbone.ViewClass} view View class or view instance to be pushed to the stack.
             * @param {Object} viewOptions Options to be passed if view is contructed by StackNavigator.
             * @param {Effect} transition Transition effect to be played when pushing new view.
             *
             * @return {Backbone.View} Instance of a pushed view.
             */
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

            /**
             * Pops an active view from a stack and displays one below.
             *
             * @param {Effect} transition Transition effect to be played when popping new view.
             */
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

            /**
             * Pops all views from a stack and leaves empty stack.
             *
             * @param {Effect} transition Transition effect to be played when popping views.
             */
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

            /**
             * Replaces view on top of the stack, with the one passed as a view param.
             *
             * @param {Backbone.View || Backbone.ViewClass} view View class or view instance to be pushed on top of the stack instead of current one.
             * @param {Object} viewOptions Hash with options to be passed to the view, if view param is not an instance.
             * @param {Effect} transition Transition effect to be played when replacing views.
             *
             * @return {Backbone.View} Instance of a pushed view.
             */
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

            /**
             * Replaces all of the views on the stack, with the one passed as a view param.
             *
             * @param {Backbone.View || Backbone.ViewClass} view View class or view instance to be pushed on top of the stack.
             * @param {Object} viewOptions Hash with options to be passed to the view, if view param is not an instance.
             * @param {Effect} transition Transition effect to be played when replacing views.
             *
             * @return {Backbone.View} Instance of a pushed view.
             */
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