'use strict';

angular.module('blApp.dataSense.controllers')
    .controller('AddNewWidgetController', ['$scope', '$rootScope', '$http', '$modalInstance', '$timeout', 'widgetUtilService', 'selectedWidget', 
        function ($scope, $rootScope, $http, $modalInstance, $timeout, widgetUtilService, selectedWidget) {
            var apiUrl;
            var inputJson = {};
            $scope.widgetInfo = {};
            $scope.widgetInfo.widgetTitle = '';
            $scope.widgetInfo.selectedWidgetType = 'Timeline';
            $scope.attributes = {};
            $scope.alerts = [];
            $scope.isEditMode = selectedWidget ? true : false;

            $scope.initAttributes = function() {
                $scope.attributes.groupDimension = widgetUtilService.getGroupDimension();
                $scope.attributes.pivotDimension = widgetUtilService.getPivotDimension();
                $scope.attributes.showUpTo = widgetUtilService.getShowUpTo();
                $scope.attributes.orientation = widgetUtilService.getOrientation();
                $scope.attributes.equivType = widgetUtilService.getEquivalenciesType();
                $scope.attributes.rowsPerTable = widgetUtilService.getRowsPerTable();
            };

            $scope.getSelectedWidgetType = function () {
                var widgetTypes = ['timeline', 'pie', 'bar', 'table', 'image', 'equivalencies'];
                var selectedWidgetType = '';
                angular.forEach(widgetTypes, function (type) {
                    if ($scope.widgetInfo[type].isSelected) {
                        selectedWidgetType = type;
                    }
                });
                //Capitalize first letter
                return [selectedWidgetType.charAt(0).toUpperCase(), selectedWidgetType.slice(1)].join('');
            };

            $scope.initTimelineForm = function(initData) {
                initData = initData || {};

                $scope.widgetInfo.timeline = {
                    metric: initData.metric,
                    compareMetric: initData.compareMetric,
                    drillDown: initData.drillDown
                };

                if (initData) {
                    $scope.widgetInfo.timeline.isSelected = initData.type == "Timeline";
                }
            };

            $scope.initPieForm = function(initData) {
                initData = initData || {};

                $scope.widgetInfo.pie = {
                    metric: initData.metric,
                    groupDimension: initData.groupDimension,
                    showUpTo: initData.showUpTo,
                    drillDown: initData.drillDown
                };

                if (typeof $scope.widgetInfo.pie.showUpTo != 'undefined' && $scope.widgetInfo.pie.showUpTo != null) {
                    $scope.widgetInfo.pie.showUpTo = $scope.widgetInfo.pie.showUpTo.toString();
                }

                if (initData) {
                    $scope.widgetInfo.pie.isSelected = initData.type == "Pie";
                }
            };

            $scope.initBarForm = function(initData) {
                initData = initData || {};

                $scope.widgetInfo.bar = {
                    metric: initData.metric,
                    groupDimension: initData.groupDimension,
                    pivotDimension: initData.pivotDimension,
                    drillDown: initData.drillDown
                };

                if (initData) {
                    $scope.widgetInfo.bar.isSelected = initData.type == "Bar";
                }
            };

            $scope.initTableForm = function(initData) {
                initData = initData || {};

                $scope.widgetInfo.table = {
                    displayedColumns: initData.displayedColumns || [{value: ''}],
                    rowsPerTable: initData.rowsPerTable ? initData.rowsPerTable.toString() : null,
                    drillDown: initData.drillDown
                };

                if (initData) {
                    $scope.widgetInfo.table.isSelected = initData.type == "Table";
                }
            };

            $scope.initImageForm = function(initData) {
                initData = initData || {};

                $scope.widgetInfo.image = {
                    metric: $rootScope.selectedDashboardMetrics[0],
                    imageUrl: initData.imageUrl,
                    fileReceived: initData.fileReceived || false,
                    drillDown: initData.drillDown
                };

                if (initData) {
                    $scope.widgetInfo.image.isSelected = initData.type == "Image";
                }
            };

            $scope.clearFileReceivedFlg = function(initData) {
                $scope.widgetInfo.image.fileReceived = false;
            };

            $scope.onFlowFileSuccess = function(data) {
                var result = JSON.parse(data);
                if (result.success == 1) {
                    $scope.widgetInfo.image.imageUrl = result.message.embedSource;
                    $scope.widgetInfo.image.fileReceived = true;
                }
            };

            $timeout(function() {
                $('.flow-container').scope().$flow.opts.target = '/assets/dashboard/' + $rootScope.selectedDashboard._id;
            }, 500);

            $scope.initEquivalenciesForm = function(initData) {
                initData = initData || {};

                $scope.widgetInfo.equivalencies = {
                    orientation: null,
                    equivType: null,
                    co2Kilograms: false,
                    greenhouseKilograms: false,
                    drillDown: null
                };

                if (initData) {
                    $scope.widgetInfo.equivalencies.isSelected = initData.type == "Equivalencies";
                }
            };

            $scope.addTableColumnsField = function ($event) {
                $scope.widgetInfo.table.displayedColumns.push({
                    value: ''
                });
                $event.preventDefault();
            };

            $scope.addNewWidget = function() {

                inputJson = {};
                inputJson.type = $scope.getSelectedWidgetType();
                inputJson.title = $scope.widgetInfo.widgetTitle;

                if (inputJson.type == 'Timeline') {
                    angular.extend(inputJson, $scope.widgetInfo.timeline);
                } else if (inputJson.type == 'Image') {
                    angular.extend(inputJson, $scope.widgetInfo.image);
                } else if (inputJson.type == 'Table') {
                    angular.extend(inputJson, $scope.widgetInfo.table);
                    if ($scope.widgetInfo.table.displayedColumns.length > 0) {
                        inputJson.metric = $scope.widgetInfo.table.displayedColumns[0].value;
                    }
                    if ($scope.widgetInfo.table.displayedColumns.length > 1) {
                        inputJson.compareMetric = $scope.widgetInfo.table.displayedColumns[1].value;
                    }
                } else if (inputJson.type == 'Bar') {
                    angular.extend(inputJson, $scope.widgetInfo.bar);
                } else if (inputJson.type == 'Pie') {
                    angular.extend(inputJson, $scope.widgetInfo.pie);
                } else if (inputJson.type == 'Equivalencies') {
                    angular.extend(inputJson, $scope.widgetInfo.equivalencies);
                }
                if (!$scope.checkValidation(inputJson)) { return; }

                // inputJson.isSelected won't go to backend
                delete inputJson.isSelected;

                $modalInstance.close(inputJson);
            };

            $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
            
            $scope.addAlert = function(message) {
                $scope.alerts.push({ type: 'danger', msg: message });
            };

            $scope.closeAlert = function(index) {
                $scope.alerts.splice(index, 1);
            };

            $scope.clearAlert = function () {
                $scope.alerts.splice(0, $scope.alerts.length);
            };

            $scope.checkValidation = function(data) {
                var isEmpty = function (v) {
                    if (typeof v == 'undefined' || v == null || v === "") {
                        return true;
                    }
                    return false;
                };
                $scope.clearAlert();
                if (typeof data == 'undefined' || data == null) {
                    return false;
                }
                if (isEmpty(data.title)) {
                    $scope.addAlert("Please input widget title.");
                }
                if (typeof data.metric != 'undefined' && isEmpty(data.metric)) {
                    $scope.addAlert("Please select a metric to create a new widget.");
                }
                if (typeof data.metric != 'undefined' && typeof data.compareMetric != 'undefined') {
                    if (data.metric != null && data.compareMetric != null && data.metric._id == data.compareMetric._id) {
                        $scope.addAlert("Please select compare metric as different value than metric.");
                    }
                }

                $timeout(function() {
                    $scope.clearAlert();
                }, 4000);
                if ($scope.alerts.length > 0) {
                    return false;
                }
                return true;
            };

            $scope.chooseWidgetType = function (widgetType) {
                setTimeout(function () {
                    $scope.widgetInfo.selectedWidgetType = widgetType;    
                }, 0);
            };

            $scope.initAttributes();
            $scope.initTimelineForm(selectedWidget);
            $scope.initPieForm(selectedWidget);
            $scope.initBarForm(selectedWidget);
            $scope.initTableForm(selectedWidget);
            $scope.initImageForm(selectedWidget);
            $scope.initEquivalenciesForm(selectedWidget);

            if (selectedWidget) {
                var widgetType = selectedWidget.type.toLowerCase();

                $scope.widgetInfo.widgetTitle = selectedWidget.title;
                $scope.widgetInfo[widgetType].isSelected = true;
            }
        }
    ]);