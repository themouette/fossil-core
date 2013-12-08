module.exports = function(grunt) {
    var port = grunt.option('port') || 1337;

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        config: {
            out: 'app.js',
            tmp: ''
        },
        port: port,
        concat: {
            kernel: {
                src: [
                    'bower_components/requirejs/require.js',
                    'src/services.js',
                    'src/config.js',
                    'src/kernel.js'
                ],
                dest: '<%- config.out %>'
            },

            release: {
                src: [
                    'bower_components/almond/almond.js',
                    'src/config.js',
                    '<%- config.out %>'
                ],
                dest: '<%- config.out %>'
            }
        },

        requirejs: {
            release: {
                options: {
                    out: '<%- config.out %>',
                    optimize: 'none',
                    baseUrl: 'src/',
                    include: ['services', 'kernel'],
                    mainConfigFile: "src/config.js"
                }
            }
        },

        uglify: {
            release: {
                options: {
                    banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
                },
                library: {
                    src: '<%- config.out %>',
                    dest: '<%- config.out %>'
                }
            }
        },
        compress: {
            js: {
                options: {
                    mode: 'gzip'
                },
                expand: true,
                src: ['<%- config.out %>'],
                cwd: './',
                dest: './',
                ext: '.gz.js'
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

        sass: {
            theme: {
                files: {
                    'css/main.css': 'scss/main.scss'
                }
            }
        },

        watch: {
            kernel: {
                files: [ 'src/services.js', 'src/config.js', 'src/kernel.js' ],
                tasks: ['concat:kernel']
            },
            theme: {
                files: [ 'scss/**/*.scss' ],
                tasks: ['sass:theme']
            }
        },

        concurrent: {
            dev: {
                tasks: ['watch:kernel', 'watch:theme', 'connect:dev:keepalive'],
                options: {
                    logConcurrentOutput: true,
                    limit: 3,
                }
            }
        }
    });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-sass');

  // Exposed task(s).
  grunt.registerTask('test', []);

  grunt.registerTask('build:theme', 'Build application themes', ['sass']);

  grunt.registerTask('build:dev', ['concat:kernel', 'build:theme']);
  grunt.registerTask('build:release', [
        'requirejs:release',
        'concat:release',
        'uglify:release',
        'compress:js',
        'build:theme'
    ]);

  grunt.registerTask('dev', ['build:dev', 'concurrent:dev']);
  grunt.registerTask('release', ['test', 'build:release']);

  grunt.registerTask('default', ['release']);

};
