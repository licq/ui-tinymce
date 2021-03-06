/**
 * Binds a TinyMCE widget to <textarea> elements.
 */
angular.module('ui.tinymce', [])
    .value('uiTinymceConfig', {})
    .directive('uiTinymce', ['uiTinymceConfig', function (uiTinymceConfig) {
        uiTinymceConfig = uiTinymceConfig || {};
        var generatedIds = 0;
        return {
            require: 'ngModel',
            link: function (scope, elm, attrs, ngModel) {
                var tinyInstance, userSetup;

                // generate an ID if not present
                if (!attrs.id) {
                    attrs.$set('id', 'uiTinymce' + generatedIds++);
                }

                // update model when tinymce value changes.
                var updateView = function () {
                    ngModel.$setViewValue(elm.val());
                    if (!scope.$$phase) {
                        scope.$apply();
                    }
                };

                // hook our setup functions into the tinymce config.
                var getOptions = function () {
                    var expression = attrs.uiTinymce ? scope.$eval(attrs.uiTinymce) : {};
                    if (expression.setup) {
                        userSetup = expression.setup;
                        delete expression.setup;
                    }

                    var options = {
                        // Update model when calling setContent (such as from the source editor popup)
                        setup: function (ed) {
                            var args;
                            ed.on('init', function (args) {
                                ngModel.$render();
                            });
                            // Update model on button click
                            ed.on('ExecCommand', function (e) {
                                ed.save();
                                updateView();
                            });
                            // Update model on keypress
                            ed.on('KeyUp', function (e) {
                                ed.save();
                                updateView();
                            });
                            // Update model on change, i.e. copy/pasted text, plugins altering content
                            ed.on('SetContent', function (e) {
                                if (!e.initial) {
                                    ed.save();
                                    updateView();
                                }
                            });
                            if (userSetup) {
                                userSetup.apply(scope, [ed]);
                            }
                        },
                        mode: 'exact',
                        elements: attrs.id
                    };
                    var result =  angular.extend(options, uiTinymceConfig, expression);
                    if(userSetup) expression.setup = userSetup;
                    return result;
                };

                setTimeout(function () {
                    tinymce.init(getOptions());
                });

                var initTinymceWidget = function (options) {
                    if (!tinyInstance) {
                        tinyInstance = tinymce.get(attrs.id);
                    }
                    if (tinyInstance) {
                        tinyInstance.setContent(ngModel.$viewValue || '');
                    }
                };


                // Watch for changes to the directive options
                scope.$watch(getOptions, initTinymceWidget, true);
            }
        };
    }]);

