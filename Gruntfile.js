module.exports = function(grunt) {
  var versions = {
    firefox: 25,
    chrome: 30
  };
  var browsers = [{
/*    browserName: 'firefox',
    platform: 'Windows 8.1',
    version: versions.firefox
  }, {
    browserName: 'firefox',
    platform: 'Windows 8',
    version: versions.firefox
  }, {
    browserName: 'firefox',
    platform: 'Windows 7',
    version: versions.firefox
  }, {
    browserName: 'firefox',
    platform: 'Linux',
    version: versions.firefox
  }, {*/
    browserName: 'chrome',
    platform: 'Windows 8.1',
    version: versions.chrome
  }, {
    browserName: 'chrome',
    platform: 'Windows 8',
    version: versions.chrome
  }, {
    browserName: 'chrome',
    platform: 'Windows 7',
    version: versions.chrome
  }, {
    browserName: 'chrome',
    platform: 'XP',
    version: versions.chrome
  }, {
    browserName: 'chrome',
    platform: 'linux',
    version: versions.chrome
  }, {
    browserName: 'internet explorer',
    platform: 'Windows 8.1',
    version: '11'
  }, {
    browserName: 'internet explorer',
    platform: 'Windows 8',
    version: '10'
  }, {
    browserName: 'internet explorer',
    platform: 'Windows 7',
    version: '10'
  }, {
    browserName: 'internet explorer',
    platform: 'Windows 7',
    version: '9'
  }, {
    browserName: 'opera',
    platform: 'Windows 2008',
    version: '12'
  }];

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // list of files to be processed
    // for compilation.
    buildsrc: [
            'src/core.js',
            'src/deferred.js',
            'src/view.js',
            'src/mixins/*.js',
            'src/service.js',
            'src/application.js',
            'src/module.js',
            'src/fragment.js',
            'src/services/*.js'
        ],
    concurrent: {
        dev: {
            tasks: ['watch', 'connect:server:keepalive'],
            options: {
                logConcurrentOutput: true
            }
        }
    },
    watch: {
        src: {
            files: 'src/**/*.js',
            tasks: ['concat:library', 'concat:amd']
        }
    },
    mocha: {
        options: {
            log: true,
            ingnoreLeaks: false,
            reporter: 'Dot',
            run: true
        },

        require: {
          options: {run: false},
          src: ['tests/index.html']
        }
    },
    'saucelabs-mocha': {
        all: {
            options: {
                username: process.env.SAUCE_USERNAME || 'fossil',
                key: process.env.SAUCE_ACCESS_KEY,
                urls: ['http://127.0.0.1:8000/tests/index.html'],
                tunnelTimeout: 120,
                build: process.env.TRAVIS_JOB_ID || '<%= pkg.version %>-dev@<%= grunt.template.today() %>',
                concurrency: 3,
                browsers: browsers,
                testReadyTimeout: 1000*60,
                testname: "<%= pkg.name %> mocha tests"
            }
        }
    },
    connect: {
        server: {
            options: {
                port: 8000,
                base: '.',
                hostname: '*'
            }
        }
    },
    requirejs: {
        standalone: {
            options: {
                out: '<%= pkg.name %>.js',
                optimize: 'none',
                baseUrl: 'src/',
                include: [
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
                    'engines/handlebars'
                ],
                wrap: {
                    startFile: [ 'bower_components/almond/almond.js' ]
                },
                paths: {
                    'jquery': 'empty:',
                    'underscore': 'empty:',
                    'backbone': 'empty:',
                    'fossil/views/view': 'empty:',
                    'fossil/views/regionManager': 'empty:',
                    'handlebars': 'empty:'
                }
            }
        }
    },

    concat: {
        library:{
            options: {
                banner: "var Fossil = (function (_, Backbone, jQuery) {\n",
                footer: [
                    "return Fossil;",
                    "})(_, Backbone, jQuery);"
                ].join("\n")
            },
            src: '<%= buildsrc %>',
            dest: '<%= pkg.name %>.js'
        },
        amd:{
            src: '<%= buildsrc %>',
            dest: '<%= pkg.name %>-amd.js'
        }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      library: {
        src: '<%= pkg.name %>.js',
        dest: '<%= pkg.name %>.min.js'
      }
    },
    compress: {
        main: {
            options: {
                mode: 'gzip'
            },
            expand: true,
            src: ['<%= pkg.name %>.min.js'],
            cwd: './',
            dest: './',
            ext: '.gz.js'
        }
    },
    copy: {
        libToSamples: {
            src: ['<%= pkg.name %>.js'],
            dest: 'samples/'
        }
    },

    docco: {
        lib: {
            src: ['src/**/*.js'],
            options: {
                output: 'doc/sources'
            }
        }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-saucelabs');
  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadNpmTasks('grunt-docco');

  // Default task(s).
  grunt.registerTask('test:unit', ['mocha']);
  grunt.registerTask('test:sauce', ['connect::server', 'saucelabs-mocha']);
  var tests = ['test:unit'];
  if (process.env.TRAVIS_SECURE_ENV_VARS === "true") {
    tests.push('test:sauce');
  }
  grunt.registerTask('test', tests);
  grunt.registerTask('dev', ['concat:library', 'concurrent:dev']);
  grunt.registerTask('release', ['test', 'requirejs:standalone', 'uglify:library', 'copy:libToSamples']);
  grunt.registerTask('default', ['release']);
};
