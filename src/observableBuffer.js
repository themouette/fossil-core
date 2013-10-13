// An observable buffer is used to store events
// while the observable isn't available yet.
//
// It primary use is to stub modules `parent` pubsub
// until the module is attached to
define(['./mixin'], function (Mixin) {
    var ObservableBuffer = Mixin.extend({
        constructor: function () {
            this.store = [];
            Mixin.apply(this, arguments);
        },
        replay: function(on) {
            _.each(this.store, function (step) {
                var method = step[0];
                var args = step[1];
                switch(method) {
                    // methods expecting a context.
                    // we should be able to replace this with on, on the fly
                    case 'on':
                    case 'off':
                    case 'once':
                        if (args && this === args[2]) {
                            on[method].apply(on, args.slice(0,2).concat([on]).concat(args.slice(3)));
                            break;
                        }
                    default:
                        on[method].apply(on, args);
                }
            }, this);
        }
    });

    // store every call
    _.each(['on', 'off', 'once', 'listenTo', 'listenToOnce', 'stopListening', 'trigger'], function (method) {
        ObservableBuffer.prototype[method] = function storeCall() {
            var args = _.toArray(arguments);
            this.store.push([method, args]);

            return this;
        };
    });

    return ObservableBuffer;
});
