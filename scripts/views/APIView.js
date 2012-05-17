/**
 * Created by Piotr Walczyszyn (outof.me | @pwalczyszyn)
 *
 * User: pwalczys
 * Date: 5/17/12
 * Time: 3:33 PM
 */

var APIView = Backbone.View.extend({

    id:'apiView',

    destructionPolicy:'never',

    render:function () {
        this.$el.html($('#apiTemplate').text());
        return this;
    }

});
