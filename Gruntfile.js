module.exports = function(grunt) {
    var json = require("./package.json");
    var scriptName = json.scriptName;
    var scriptFullName = json.scriptName + ".full";

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            dist: ["<%= pkg.dist %><%= pkg.version %>*"]
        },
        concat: {
            options: {
                banner: '/*! By <%= pkg.author %> <%= grunt.template.today("yyyy-mm-dd") %> v<%= pkg.version %> <%= pkg.repository.url %> */\n;(function(window){\n',
                footer: '\n})(window);'
            },
            min: {
                src: [
                    'mods/global.js', 'mods/path.js', 'mods/scriptLoader.js',
                    'mods/main_global.js', 'mods/main_config.js', 'mods/main_define.js', 'mods/main_require.js', 'mods/main_interface.js'
                ],
                dest: '<%= pkg.dist %><%= pkg.version %>/'+ scriptName +'.js',
            },
            full: {
                src: [
                    'mods/global.js', 'mods/path.js', 'mods/scriptLoader.js',
                    'mods/main_global.js', 'mods/main_config.js', 'mods/main_define.js', 'mods/main_require.js', 'mods/main_interface.js',
                    'mods/plugin/ajaxLoader.js', 'mods/plugin/linkLoader.js'
                ],
                dest: '<%= pkg.dist %><%= pkg.version %>/'+ scriptFullName +'.js',
            }
        },
        uglify: {
            options: {
                // banner: '/*! By <%= pkg.author %> <%= grunt.template.today("yyyy-mm-dd") %> v<%= pkg.version %> */\n;',
                preserveComments: 'some',
                mangle: {
                    toplevel: true,
                    eval: true
                },

                compress: {
                    // 删除所有 console
                    keep_fargs: false,
                    unsafe : true
                }
            },
            min: {
                src: "<%= pkg.dist %><%= pkg.version %>/"+ scriptName +".js",
                dest: "<%= pkg.dist %><%= pkg.version %>/"+ scriptName +".min.js"
            },
            full: {
                src: "<%= pkg.dist %><%= pkg.version %>/"+ scriptFullName +".js",
                dest: "<%= pkg.dist %><%= pkg.version %>/"+ scriptFullName +".min.js"
            }
        },
        copy: {
            min: {
                src: "<%= pkg.dist %><%= pkg.version %>/"+ scriptName +".min.js",
                dest: "./"+ scriptName +".min.js"
            },
            full: {
                src: "<%= pkg.dist %><%= pkg.version %>/"+ scriptFullName +".min.js",
                dest: "./"+ scriptFullName +".min.js"
            }
        }
    });

    // 加载包含 "uglify" 任务的插件。
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');

    // 默认被执行的任务列表。
    grunt.registerTask('default', ['clean', 'concat', 'uglify', 'copy']);

};
