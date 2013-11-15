module.exports = function(grunt){

  //load grunt tasks
  require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    config : {
      app: 'www',
      dist: 'dist'
    },

    pkg: grunt.file.readJSON('package.json'),

    bower: {
      install: {
        options: {
          targetDir: '<%= config.app %>/assets/js/libraries',
          install: true,
          verbose: false,
          cleanTargetDir: false,
          cleanBowerDir: false,
          bowerOptions: {}
        }
      }
    },

    // clean
    //--------------------------------------------------------------
    // This will clean the distribution folder of all previously
    // built files.

    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= config.dist %>/*',
            '!<%= config.dist %>/.git*'
          ]
        }]
      }
    },

    htmlhint: {
      build: {
        options: {
          'tag-pair': true,
          'tagname-lowercase': true,
          'attr-lowercase': true,
          'attr-value-double-quotes': true,
          'doctype-first': true,
          'spec-char-escape': true,
          'id-unique': true,
          'head-script-disabled': true,
          'style-disabled': true
        },
        src: ['<%= config.app %>/**/*.html']
      }
    },

    uglify: {
      build: {
        files: {
          'build/js/base.min.js': ['assets/js/base.js']
        }
      }
    },

    // imagemin
    //--------------------------------------------------------------
    // Minify images using OptiPNG, pngquant, jpegtran and gifsicle.
    // Images will be cached and only minified again if they change.

    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= config.app %>/assets/images',
          src: '**/*.{png,jpg,jpeg}',
          dest: '<%= config.dist %>/assets/images'
        }]
      }
    },

    // rev
    //--------------------------------------------------------------
    // Fingerprints filenames to force download of cached files
    rev: {
      dist: {
        files: {
          src: [
            '<%= config.dist %>/assets/**/*.js',
            '<%= config.dist %>/assets/**/*.css',
            '<%= config.dist %>/assets/**/*.{png,jpg,jpeg,gif,webp}',
            '<%= config.dist %>/assets/fonts/*.*'
          ]
        }
      }
    },

    cssc: {
      build: {
        options: {
          consolidateViaDeclarations: true,
          consolidateViaSelectors:    true,
          consolidateMediaQueries:    true
        },
        files: {
          'build/css/master.css': 'build/css/master.css'
        }
      }
    },

    cssmin: {
      build: {
        src: 'build/css/master.css',
        dest: 'build/css/master.css'
      }
    },

    sass: {
      build: {
        files: {
          'build/css/master.css': 'assets/sass/master.scss'
        }
      }
    },

    watch: {
      html: {
        files: ['<%= config.app %>/**/*.html'],
        tasks: ['htmlhint']
      }
    }
  });

  grunt.loadNpmTasks('grunt-bower-task');

  grunt.registerTask('default',  [
    'htmlhint',
    'clean:dist'
    //'sass',
    //'cssc',
    //'cssmin'
  ]);

};