module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        src: ['client/*.js',],
        dest: 'build/js/app.min.js'
      }
    },
    copy: {
      dev: {
        files: [{
          src: 'client/vendor/phaser.js',
          dest: 'build/js/vendor/phaser.min.js'
        },{
          src: 'client/vendor/KiiSDK.js',
          dest: 'build/js/vendor/KiiSDK.min.js'
        },{
          src: 'assets/**/*',
          dest: 'build/'
        },{
          src: 'index.html',
          dest: 'build/'
        },{
          src: 'favicon.ico',
          dest: 'build/'
        },{
          src: 'style/*.css',
          dest: 'build/'
        }]
      },
      dist: {
        files: [{
          src: 'client/vendor/phaser.min.js',
          dest: 'build/js/vendor/phaser.min.js'
        },{
          src: 'client/vendor/KiiSDK.min.js',
          dest: 'build/js/vendor/KiiSDK.min.js'
        },{
          src: 'assets/**/*',
          dest: 'build/'
        },{
          src: 'index.html',
          dest: 'build/'
        },{
          src: 'favicon.ico',
          dest: 'build/'
        },{
          src: 'style/*.css',
          dest: 'build/'
        }]
      }
    },
    processhtml: {
      dist: {
        options: {
          process: true,
          data: {
            title: 'HXC MICRO',
            message: 'This is production distribution'
          }
        },
        files: {
          'build/index.html': ['index.html']
        }
      }
    },
    uglify: {
      options: {
        report: 'min',
        preserveComments: 'some'
      },
      dist: {
        files: {
          'build/js/app.min.js': ['build/js/app.min.js']
        }
      }
    },
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-processhtml');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.registerTask('default', ['concat', 'uglify', 'copy:dist', 'processhtml']);
  grunt.registerTask('dev', ['concat', 'copy:dev', 'processhtml'])
}
