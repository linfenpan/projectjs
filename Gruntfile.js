module.exports = function(grunt) {

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
            build: {
                src: [
                    'mods/global.js', 'mods/path.js', 'mods/scriptLoader.js', 'mods/pXMLHttpRequest.js',
                    'mods/main_global.js', 'mods/main_config.js', 'mods/main_define.js', 'mods/main_require.js', 'mods/main_interface.js'
                ],
                dest: '<%= pkg.dist %><%= pkg.version %>/<%= pkg.scriptName %>.js',
            }
        },
        uglify: {
            options: {
                // banner: '/*! By <%= pkg.author %> <%= grunt.template.today("yyyy-mm-dd") %> v<%= pkg.version %> */\n;',
                preserveComments: 'some',
                mangle: {
                    toplevel: true,
                    eval: true,
                    props: "isAbsolute"
                },

                compress: {
                    // 删除所有 console
                    keep_fargs: false,
                    unsafe : true
                }
            },
            build: {
                src: "<%= pkg.dist %><%= pkg.version %>/<%= pkg.scriptName %>.js",
                dest: "<%= pkg.dist %><%= pkg.version %>/<%= pkg.scriptName %>.min.js"
            }
        },
        copy: {
            dist: {
                src: "<%= pkg.dist %><%= pkg.version %>/<%= pkg.scriptName %>.min.js",
                dest: "./<%= pkg.scriptName %>.min.js"
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
