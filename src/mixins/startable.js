define(['underscore', '../deferred'], function (_, Deferred) {
    'use strict';

    // This mixin requires Fossil.Mixins.Deferrable
    // It gives an object the ability to start, standby and stop.
    var Startable = {
        run: false,
        start: function () {
            if (this.run) {
                return false;
            }
            this.run = true;
            var d = new Deferred();
            this.waitFor(d);
            if (!this._firstStarted) {
                this._firstStarted = true;
                this._firstStart();
            }
            // TODO enhance Deferrable/Startable to use a nested promise
            // so start is always called once start:fisrt is resolved and
            // upper level registered then handlers are executed after both
            // events.
            //
            // ```
            // app.on('start:first', function () {this.waitFor($.ajax(...));});
            // app.on('start', function () {this.waitFor($.ajax(...));});
            // app
            //     .start();
            //     .then(function() {/* should be called after both start:first and start */});
            // ```
            this._doStart();
            d.resolve(true);
            this.thenWith(this, null, this._startError);
        },
        standby: function () {
            if (!this.run) {
                return false;
            }
            this._doStandby();
        },
        stop: function () {
            if (!this._firstStarted) {
                return false;
            }
            this.standby();
            this.thenWith(this, this._doStop, this._stopError);
        },

        // Start being asynchronous, use this
        // callback to catch start errors.
        // when an error occurs, _doStart is not called,
        // this method is called instead.
        _startError: function (error) {
            throw error;
        },
        // Stop being asynchronous, use this
        // callback to catch stop errors.
        // When an error occurs, _doStop is not called,
        // this method is called instead.
        _stopError: function (error) {
            throw error;
        },

        _firstStart: function () {
            this.trigger('start:first', this);
        },
        _doStart: function () {
            this.trigger('start', this);
        },
        _doStandby: function () {
            this.trigger('standby', this);
            this.run = false;
        },
        _doStop: function () {
            this._firstStarted = false;
            this.trigger('stop', this);
        }
    };

    return Startable;
});
