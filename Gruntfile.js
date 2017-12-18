module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      default: {
        src: ['client/*.js', 'common/*.js'],
        dest: 'build/js/app.js'
      }
    },
    uglify: {
      dist: {
        options: {
          report: 'min',
          preserveComments: 'some'
        },
        files: {
          'build/js/app.min.js': ['build/js/app.js']
        }
      }
    },
    copy: {
      dev: {
        files: [{
          expand: true,
          cwd: 'client/vendor/',
          src: 'phaser.js',
          dest: 'build/js/vendor/'
        },{
          expand: true,
          cwd: 'client/vendor/',
          src: 'KiiSDK.js',
          dest: 'build/js/vendor/'
        },{
          src: 'assets/**/*',
          dest: 'build/'
        },{
          src: 'index.html',
          dest: 'build/'
        },{
          src: 'favicon_dev.ico',
          dest: 'build/'
        },{
          src: 'style/*.css',
          dest: 'build/'
        }]
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'client/vendor/',
          src: 'phaser.min.js',
          dest: 'build/js/vendor/'
        },{
          expand: true,
          cwd: 'client/vendor/',
          src: 'KiiSDK.min.js',
          dest: 'build/js/vendor/'
        },{
          src: 'assets/**/*',
          dest: 'build/'
        },{
          src: 'index.html',
          dest: 'build/'
        },{
          src: 'favicon_dist.ico',
          dest: 'build/'
        },{
          src: 'style/*.css',
          dest: 'build/'
        }]
      }
    },
    rename: {
      dev: {
        files: [{
          src: 'build/favicon_dev.ico',
          dest: 'build/favicon.ico'
        },{
          src: 'build/js/app.js',
          dest: 'build/js/app.min.js'
        },{
          src: 'build/js/vendor/phaser.js',
          dest: 'build/js/vendor/phaser.min.js'
        },{
          src: 'build/js/vendor/KiiSDK.js',
          dest: 'build/js/vendor/KiiSDK.min.js'
        }]
      },
      dist: {
        files: [{
          cwd: 'build',
          src: 'favicon_dist.ico',
          dest: 'favicon.ico'
        }]
      }
    },
    processhtml: {
      default: {
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
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-rename');
  grunt.loadNpmTasks('grunt-processhtml');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.registerTask('default', ['concat', 'uglify', 'copy:dist', 'rename:dist', 'processhtml']);
  grunt.registerTask('dev', ['concat', 'copy:dev', 'rename:dev', 'processhtml'])
}
