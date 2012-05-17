/**
 * Created by Piotr Walczyszyn (outof.me | @pwalczyszyn)
 *
 * User: pwalczys
 * Date: 5/11/12
 * Time: 3:23 PM
 */

var ExampleView = Backbone.View.extend({

    id:'exampleView',

    destructionPolicy:'never',

    render:function () {
        this.$el.html($('#exampleTamplate').html());
        return this;
    }

});