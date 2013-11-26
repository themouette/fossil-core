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
                    'src/services.js',
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
                files: [ 'src/services.js', 'src/config.js', 'src/kernel.js' ],
                tasks: ['concat:kernel']
            }
        },

        concurrent: {
            dev: {
                tasks: ['watch:kernel', 'connect:dev:keepalive'],
                options: {
                    logConcurrentOutput: true
                }
            }
        }
    });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-concurrent');

  // Exposed task(s).
  grunt.registerTask('test', []);

  grunt.registerTask('build:dev', ['concat:kernel']);
  grunt.registerTask('build:release', ['concat:kernel']);

  grunt.registerTask('dev', ['build:dev', 'concurrent:dev']);
  grunt.registerTask('release', ['test', 'build:release']);

  grunt.registerTask('default', ['release']);

};
