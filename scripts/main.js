/**
 * Created by JetBrains PhpStorm.
 * User: pwalczys
 * Date: 2/9/12
 * Time: 3:54 PM
 * To change this template use File | Settings | File Templates.
 */

var ViewOne = Backbone.View.extend({

    id:'viewOne',

    events:{
        'click button':'button_clickHandler'
    },

    render:function () {
        this.$el.html('<p>This is ViewOne </p><p><button>Push ViewTwo</button></p>');
        return this;
    },

    button_clickHandler:function (event) {
        this.stackNavigator.pushView(ViewTwo);
    }
});

var ViewTwo = Backbone.View.extend({

    id:'viewTwo',

    events:{
        'click button':'button_clickHandler'
    },

    render:function () {
        this.$el.html('<p>This is a ViewTwo </p><p><button>Pop ViewTwo</button></p>');
        return this;
    },

    button_clickHandler:function (event) {
        this.stackNavigator.popView();
    }
});

function initBackbone() {

    var navigator = new BackStack.StackNavigator({
            el:'#container',
            popTransition:popTransition,
            pushTransition:pushTransition
        });

    navigator.pushView(ViewOne);
}
