// define all instances of services
// This is the Dependency Injection configuration so it is easy to configure.
define('service.engine', [ 'fossil/engines/handlebars' ], function (Engine) {
    "use strict";
    return new Engine();
});
define('service.template', [ 'service.engine', 'fossil/services/template' ], function (engine, Template) {
    "use strict";
    return new Template({
        engine: engine
    });
});
define('service.routing', [ 'fossil/services/routing', ], function (Routing) {
    "use strict";
    return new Routing({
        history: {pushState: false}
    });
});
define('service.canvas', [ 'fossil/services/canvas' ], function (Canvas) {
    "use strict";
    return new Canvas();
});


// modules are instanciated here either.
define('module.compose', ['modules/compose/compose'], function (Compose) {
    "use strict";
    return new Compose({
        startWithParent: true
    });
});
define('module.conversation', ['modules/conversation/conversation'], function (Conversation) {
    "use strict";
    return new Conversation({
        startWithParent: true,
        type: 'inbox'
    });
});
define('module.draft', ['modules/conversation/conversation'], function (Conversation) {
    "use strict";
    return new Conversation({
        startWithParent: true,
        type: 'drafts'
    });
});
define('module.trash', ['modules/conversation/conversation'], function (Conversation) {
    "use strict";
    return new Conversation({
        startWithParent: true,
        type: 'trash'
    });
});
define('module.folder', ['modules/folder/folder'], function (Folder) {
    "use strict";
    return new Folder({
        startWithParent: true
    });
});
