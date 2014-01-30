define([
    'deferred',
    'utils',
    'mixin',
    'module',
    'modules/region',
    'modules/lazy',
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
    utils, Mixin, Module, RegionModule, LazyModule,
    Service, ObservableBuffer, ViewStore,
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
        modules: {
            region: RegionModule,
            lazy: LazyModule
        },
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
