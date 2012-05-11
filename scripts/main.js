function onBodyLoad() {

    var navigator = new BackStack.StackNavigator({el:'#container'});
    navigator.pushView(IntroView);

}
