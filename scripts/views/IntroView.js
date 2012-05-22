/**
 * Created by Piotr Walczyszyn (outof.me | @pwalczyszyn)
 *
 * User: pwalczys
 * Date: 5/11/12
 * Time: 3:23 PM
 */

var IntroView = Backbone.View.extend({

    id:'introView',

    events:{
        'click a.start-demo':'button_clickHandler'
    },

    render:function () {
        this.$el.html($('#introTemplate').html());
        return this;
    },

    button_clickHandler:function (event) {
        this.stackNavigator.pushView(MainView);
    }

});
