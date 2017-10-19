module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        src: ['client/*.js','client/**/*.js'],
        dest: 'build/js/app.js' // TODO FIX @@@@@@@@@ not min
      }
    },
    copy: {
      dist: {
        files: [{
          src: 'client/vendor/phaser.min.js',
          dest: 'build/js/vendor/phaser.min.js'
        },{
          src: 'assets/**/*',
          dest: 'build/'
        },{
          src: 'index.html',
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
          'build/js/app.min.js': ['build/js/app.js']
        }
      }
    },
    // DON'T USE THIS PLZ
    connect: {
      server: {
        options: {
          base: 'build',
          port: 80,
          keepalive: true
        }
      }
    },
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-processhtml');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.registerTask('default', ['concat', 'uglify', 'copy', 'processhtml']);
}