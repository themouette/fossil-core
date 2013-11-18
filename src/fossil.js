define([
    'deferred',
    'utils',
    'mixin',
    'module',
    'service',
    'observableBuffer',
    'viewStore',
    'mixins/observable',
    'mixins/startable',
    'mixins/deferrable',
    'services/session',
    'services/canvas',
    'services/routing',
    'services/events',
    'services/template',
    'engines/handlebars',
    'engines/underscore'
], function (deferred,
    utils, Mixin, Module, Service, ObservableBuffer, ViewStore,
    Observable, Startable, Deferrable,
    Session, Canvas, Routing, Events, Template,
    Underscore, Handlebars
) {
  "use strict";

    var Fossil = {
        utils: utils,
        Mixin: Mixin,
        mixins: {
            Observable: Observable,
            Startable: Startable,
            Deferrable: Deferrable
        },
        Module: Module,
        Service: Service,
        services: {
            Session: Session,
            Canvas: Canvas,
            Routing: Routing,
            Events: Events,
            Template: Template
        },
        engines: {
            Underscore: Underscore,
            Handlebars: Handlebars
        },
        ViewStore: ViewStore,
        ObservableBuffer: ObservableBuffer
    };

    return Fossil;
});
