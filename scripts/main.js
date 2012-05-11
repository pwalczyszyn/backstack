var ViewOne = Backbone.View.extend({

    id:'viewOne',

    events:{
        'click button':'button_clickHandler'
    },

    render:function () {

        console.log($('#aboutTemplate').html());

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

function onBodyLoad() {

    var navigator = new BackStack.StackNavigator({el:'#container'});
    navigator.pushView(ViewOne);

}
