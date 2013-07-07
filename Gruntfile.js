module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // list of files to be processed
    // for compilation.
    buildsrc: [
            'src/core.js',
            'src/deferred.js',
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
            tasks: ['concat:library', 'contact:amd']
        },
        tests: {
            files: 'tests/specs/**/*.js',
            tasks: ['concat:tests']
        }
    },
    mocha: {
        options: {
            log: true,
            reporter: 'Nyan'
        },
        all: ['tests/test.html']
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
    concat: {
        tests: {
            options: {
                banner: [
                    "mocha.setup('bdd')",
                    "mocha.checkLeaks();",
                    // ensure application selector is an external element
                    "Fossil.Application.prototype.selector = $('<div>');"
                ].join("\n"),
                footer: [
                    "mocha.run();"
                ].join("\n")
            },
            src: 'tests/specs/**/*.js',
            dest: 'tests/specs.js'
        },
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
            options: {
                banner: "define('fossil', ['underscore', 'backbone', 'jquery']function (_, Backbone, jQuery) {\n",
                footer: [
                    "return Fossil;",
                    "});"
                ].join("\n")
            },
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
      },
      amd: {
        src: '<%= pkg.name %>-amd.js',
        dest: '<%= pkg.name %>-amd.min.js'
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-mocha');

  // Default task(s).
  grunt.registerTask('test', ['contact:tests', 'mocha']);
  grunt.registerTask('dev', ['concurrent:dev']);
  grunt.registerTask('release', ['test', 'concat:library', 'concat:amd', 'uglify:library', 'uglify:amd']);
  grunt.registerTask('default', ['release']);

};
