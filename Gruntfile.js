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
            tasks: ['concat:library', 'concat:amd']
        }
    },
    mocha: {
        options: {
            log: true,
            ingnoreLeaks: false,
            reporter: 'Nyan',
            run: true
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
                banner: "define('fossil', ['underscore', 'backbone', 'jquery'], function (_, Backbone, jQuery) {\n",
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
    },
    copy: {
        libToSamples: {
            src: ['<%= pkg.name %>.js', '<%= pkg.name %>-amd.js'],
            dest: 'samples/'
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
  grunt.loadNpmTasks('grunt-mocha');

  // Default task(s).
  grunt.registerTask('test', ['mocha']);
  grunt.registerTask('dev', ['concurrent:dev']);
  grunt.registerTask('release', ['test', 'concat:library', 'concat:amd', 'uglify:library', 'uglify:amd', 'copy:libToSamples']);
  grunt.registerTask('default', ['release']);

};
