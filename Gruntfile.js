module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concurrent: {
        dev: {
            tasks: ['watch', 'connect:server:keepalive'],
            options: {
                logConcurrentOutput: true
            }
        }
    },
    watch: {},
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
    requirejs: {
        release: {
            options: {
                baseUrl: './',
                optimize: "none",
                paths: {
                    "fossil": "src",
                    "jquery": "components/jquery/jquery",
                    "underscore": "components/underscore/underscore",
                    "backbone": "components/backbone/backbone"
                },
                shim: {
                    'underscore': {exports: '_'},
                    'backbone': { deps: ['underscore', 'jquery'], exports: 'Backbone'}
                },
                name: "fossil/fossil",
                exclude: ["jquery", "underscore", "backbone"],
                out: "<%= pkg.name %>.js"
            }
        }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: '<%= pkg.name %>.js',
        dest: '<%= pkg.name %>.min.js'
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-mocha');

  // Default task(s).
  grunt.registerTask('test', ['mocha']);
  grunt.registerTask('dev', ['concurrent:dev']);
  grunt.registerTask('release', ['test', 'requirejs', 'uglify']);
  grunt.registerTask('default', ['release']);

};
