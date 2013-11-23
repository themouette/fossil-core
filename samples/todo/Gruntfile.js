module.exports = function(grunt) {
    var port = grunt.option('port') || 1337;

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        port: port,
        concat: {
            kernel: {
                src: [
                    'bower_components/requirejs/require.js',
                    'src/config.js',
                    'src/kernel.js'
                ],
                dest: 'app.js'
            }
        },

        connect: {
            dev: {
                options: {
                    hostname: '*',
                    port: '<%= port %>',
                    base: './'
                }
            }
        },

        watch: {
            kernel: {
                files: [ 'src/config.js', 'src/kernel.js' ],
                tasks: ['concat:kernel']
            },
            sass: {
                files: [ 'scss/**/*.{scss,sass}' ],
                tasks: ['sass:dev']
            }
        },

        concurrent: {
            dev: {
                tasks: ['watch:kernel', 'watch:sass', 'connect:dev:keepalive'],
                options: {
                    limit: 3,
                    logConcurrentOutput: true
                }
            }
        },

        sass: {
            options: {
                includePaths:['.']
            },
            dev: {
                options: {
                    outputStyle: 'nested'
                },
                files: {
                    'css/main.css': 'scss/main.scss'
                }
            },
            dist: {
                options: {
                    outputStyle: 'compressed'
                },
                files: {
                    'css/main.css': 'scss/main.scss'
                }
            }
        }
    });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-sass');

  // Exposed task(s).
  grunt.registerTask('test', []);

  grunt.registerTask('build:dev', ['concat:kernel', 'sass:dev']);
  grunt.registerTask('build:release', ['concat:kernel', 'sass:dist']);

  grunt.registerTask('dev', ['build:dev', 'concurrent:dev']);
  grunt.registerTask('release', ['test', 'build:release']);

  grunt.registerTask('default', ['release']);

};
