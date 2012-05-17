/**
 * Created by Piotr Walczyszyn (outof.me | @pwalczyszyn)
 *
 * User: pwalczys
 * Date: 5/11/12
 * Time: 3:23 PM
 */

var MainView = Backbone.View.extend({

    id:'mainView',

    subviews:null,

    subviewsNavigator:null,

    events:{
        'click #btnIntro':'btnIntro_clickHandler',
        'click #btnAbout':'btnAbout_clickHandler',
        'click #btnExample':'btnExample_clickHandler',
        'click #btnAPI':'btnAPI_clickHandler'
    },

    render:function () {
        this.$el.html($('#mainTemplate').html());

        // Initializing hash of subviews
        this.subviews = {};

        // Initializing subviews navigator
        this.subviewsNavigator = new BackStack.StackNavigator({el:'#subviewsContainer'});

        // Pushing AboutView to the stack
        this.showSubview('aboutView', AboutView);

        return this;
    },

    showSubview:function (subviewId, SubviewClass) {
        if (!this.subviewsNavigator.activeView || Object(this.subviewsNavigator.activeView).constructor != SubviewClass) {

            var subview = this.subviews[subviewId];
            if (subview) {
                // Replacing with already constructed view
                this.subviewsNavigator.replaceView(subview);
            } else {
                if (this.subviewsNavigator.activeView) // Replacing and creating new view on the stack
                    this.subviews[subviewId] = this.subviewsNavigator.replaceView(SubviewClass);
                else // Pushing and creating first view on to the stack
                    this.subviews[subviewId] = this.subviewsNavigator.pushView(SubviewClass);
            }

            $('button[data-view="' + subviewId + '"]').addClass('down').siblings().removeClass('down');
        }
    },

    btnIntro_clickHandler:function (event) {
        this.stackNavigator.popView();
    },

    btnAbout_clickHandler:function (event) {
        this.showSubview('aboutView', AboutView);
    },

    btnExample_clickHandler:function (event) {
        this.showSubview('exampleView', ExampleView);
    },

    btnAPI_clickHandler:function (event) {
        this.showSubview('apiView', APIView);
    }

});
