/*jshint camelcase:false */
/*
 * Middlewarify
 *
 */

module.exports = function( grunt ) {
  'use strict';

  var pkg = grunt.file.readJSON('package.json');

  // Load local tasks
  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-release');

  //
  // Grunt configuration:
  //
  //
  grunt.initConfig({
    // Project configuration
    // ---------------------
    //

    pkg: pkg,


    release: {
      options: {
        bump: true, //default: true
        file: 'package.json', //default: package.json
        add: true, //default: true
        commit: true, //default: true
        tag: true, //default: true
        push: true, //default: true
        pushTags: true, //default: true
        npm: true, //default: true
        tagName: 'v<%= version %>', //default: '<%= version %>'
        commitMessage: 'releasing v<%= version %>', //default: 'release <%= version %>'
        tagMessage: 'v<%= version %>' //default: 'Version <%= version %>'
      }
    },
  });
};
