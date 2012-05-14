/**
 * Created by Piotr Walczyszyn (outof.me | @pwalczyszyn)
 *
 * User: pwalczys
 * Date: 5/11/12
 * Time: 3:23 PM
 */

var AboutView = Backbone.View.extend({

    id:'viewOne',

    events:{
        'click button':'button_clickHandler'
    },

    render:function () {
        console.log($('#aboutTemplate').text());
        this.$el.html($('#aboutTemplate').text());
        return this;
    },

    button_clickHandler:function (event) {
        this.stackNavigator.pushView(ViewTwo);
    }

});
