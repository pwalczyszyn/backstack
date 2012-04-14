(function (root, factory) {
    // Set up BackStack appropriately for the environment.
    if (typeof exports !== 'undefined') {
        // Node/CommonJS, no need for jQuery in that case.
        factory(root, exports, require('underscore'), require('jquery'), require('Backbone'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(['underscore', 'jquery', 'Backbone', 'exports'],
            function (_, $, Backbone, exports) {
                // Export global even in AMD case in case this script is loaded with
                // others that may still expect a global Backbone.
                root.BackStack = factory(root, exports, _, $, Backbone);
            });
    } else {
        // Browser globals
        root.BackStack = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender), root.Backbone);
    }
}(this, function (root, BackStack, _, $, Backbone) {
