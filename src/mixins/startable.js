define([
    'fossil/core'
], function (Fossil) {
    'use strict';

    var messages = {
    };

    // This mixin requires Fossil.Mixins.Deferrable
    // It gives an object the ability to start, standby and stop.
    var Startable = Fossil.Mixins.Startable = {
        run: false,
        start: function () {
            if (this.run) {
                return false;
            }
            if (!this._firstStarted) {
                this._firstStart();
                this._firstStarted = true;
            }
            this.thenWith(this, this._doStart, this._startError);
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
            this.run = true;
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
