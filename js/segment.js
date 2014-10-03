'use strict';

angular.module('blApp.dataSense.controllers')
    .controller('SegmentController', ['$scope', '$rootScope', '$http', '$element', '$timeout',  '$modal', 'DataService', 'dataSourceService', 
        function ($scope, $rootScope, $http, $element, $timeout, $modal, DataService, dataSourceService) {

          //$(".bl-choose-segments-chk-segment").customCheckbox();
        	$scope.treedata = [];
          $scope.segments = [];

          $scope.listDataSources = function() {
            var dashboardInfo;
            if ($rootScope.selectedDashboard == null) {
                var cols = Object.keys($rootScope.allDashboards);
                if ($rootScope.allDashboards[cols[0]][0] != 'undefined')
                    $rootScope.selectedDashboard =  $rootScope.allDashboards[cols[0]][0];
                   // $scope.$broadcast('goToDashboard',{'dashboard': $rootScope.allDashboards[cols[0]][0]});
            }
            dashboardInfo = $rootScope.selectedDashboard;
            dataSourceService.listFacilities('all_data').then(function (result) {
              if (result.data.success == 1) {
                    var facilities = result.data.message;
                    $scope.treedata = [];
                    angular.forEach(facilities, function(facility_temp, index){
                          var facility = {};
                          facility.id = 'fc' + index;
                          facility.name = facility_temp.name;
                          facility.type = 'facility';
                          facility.visible = false;
                          facility._id = facility_temp._id;
                          facility.children = [];
                          facility.parent_id = '';

                          angular.forEach(dashboardInfo.sourceFacilities, function(dashboard_facility, index){
                                if (facility_temp._id == dashboard_facility._id) {
                                    facility.visible = true;
                                }
                          });

                          angular.forEach(facility_temp.dataLoggers, function(datalogger_temp, index){
                                var datalogger = {};
                                datalogger.id = 'dl' + index;
                                datalogger.name = datalogger_temp.name;
                                datalogger.type = 'dlogger';
                                datalogger.visible = facility.visible;
                                datalogger._id = datalogger_temp._id;
                                datalogger.children = [];
                                datalogger.parent_id = facility._id;
                                
                                angular.forEach(dashboardInfo.sourceDataLoggers, function(dashboard_datalogger, index){
                                    if (datalogger_temp._id == dashboard_datalogger._id) {
                                        datalogger.visible = true;
                                    }
                                });
                                
                                angular.forEach(datalogger_temp.sensors, function(sensor_temp, index){
                                    var sensor = {};
                                    sensor.id = 'sensor' + index;
                                    sensor.name = sensor_temp.name;
                                    sensor.type = 'dsensor';
                                    sensor.visible = datalogger.visible;
                                    sensor._id = sensor_temp._id;
                                    sensor.children = [];
                                    sensor.parent_id = datalogger._id;
                                    
                                    angular.forEach(dashboardInfo.sourceSensors, function(dashboard_sensor, index){
                                        if (sensor_temp._id == dashboard_sensor._id) {
                                            sensor.visible = true;
                                        }
                                    });
                                    
                                    angular.forEach(sensor_temp.metrics, function(metric_temp, index){
                                        var metric = {};
                                        metric.id = 'm' + index;
                                        metric.name = metric_temp.metricName;
                                        metric.type = 'dmetric';
                                        metric.visible = sensor.visible;
                                        metric._id = metric_temp._id;
                                        metric.children = [];
                                        metric.parent_id = sensor._id;
                                        sensor.children.push(metric);
                                        angular.forEach(dashboardInfo.sourceMetrics, function(dashboard_metric, index){
                                            if (metric_temp._id == dashboard_metric._id) {
                                                metric.visible = true;
                                            }
                                        });
                                    })
                                    datalogger.children.push(sensor);
                                })

                                facility.children.push(datalogger);
                          })

                          $scope.treedata.push(facility);
                          //$scope.$emit('listDataSourcesReady',{});
                    }) 
                    if ($scope.treedata.length == 0)
                          $scope.no_sensors = true;
              }
            });
          }

          $scope.event_sources = function(e, source) {
              e.stopPropagation();
              var visible = !source.visible;
              if (visible) {
                  var facility_ids = [], datalogger_ids = [], sensor_ids = [], metric_ids = [];
                  switch(source.type) {
                      case 'facility':
                          facility_ids.push(source._id);
                          angular.forEach(source.children, function(dataloger, index){
                              if (dataloger.visible)
                                  datalogger_ids.push(dataloger._id);
                              angular.forEach(dataloger.children, function(sensor, index){
                                  if (dataloger.visible)
                                      return false;
                                  if (sensor.visible)
                                      sensor_ids.push(sensor._id);
                                  angular.forEach(sensor.children, function(metric, index){
                                      if (sensor.visible)
                                          return false;
                                      if (metric.visible)
                                          metric_ids.push(metric._id);
                                  })
                              })
                          });
                          $scope.addFacilityToDashboard(source, null, $rootScope.selectedDashboard._id, facility_ids, datalogger_ids, sensor_ids, metric_ids);
                          break;
                      case 'dlogger':
                          angular.forEach(source.children, function(sensor, index){
                              if (sensor.visible)
                                  sensor_ids.push(sensor._id);
                              angular.forEach(sensor.children, function(metric, index){
                                  if (sensor.visible)
                                      return false;
                                  if (metric.visible)
                                      metric_ids.push(metric._id);
                              })
                          });

                          var facility, facility_id = source.parent_id;
                          angular.forEach($scope.treedata, function(facility_temp, index){
                              if (facility_id == facility_temp._id)
                                  facility = facility_temp;
                          });
                          
                          var facility_cnt = 0;
                          angular.forEach(facility.children, function(datalogger, index){
                              if (datalogger.visible) {
                                  datalogger_ids.push(datalogger._id);
                                  facility_cnt++;
                              }
                          });

                          if((facility_cnt+1) == facility.children.length) {
                              facility_ids.push(facility._id);
                              $scope.addFacilityToDashboard(facility, source, $rootScope.selectedDashboard._id, facility_ids, datalogger_ids, sensor_ids, metric_ids);
                          } else {
                              datalogger_ids = [];
                              datalogger_ids.push(source._id);
                              $scope.addDataloggerToDashboard(source, null, $rootScope.selectedDashboard._id, datalogger_ids, sensor_ids, metric_ids);
                          }

                          break;
                      case 'dsensor':
                          angular.forEach(source.children, function(metric, index){
                              if (metric.visible)
                                  metric_ids.push(metric._id);
                          });
                          var datalogger, facility, datalogger_id = source.parent_id;
                          angular.forEach($scope.treedata, function(facility_temp, index){
                              angular.forEach(facility_temp.children, function(datalogger_temp, index){
                                  if (datalogger_id == datalogger_temp._id) {
                                      datalogger = datalogger_temp;
                                      facility = facility_temp;
                                  }
                              });
                          });
                          var datalogger_cnt = 0, facility_cnt = 0;
                          angular.forEach(datalogger.children, function(sensor, index){
                              if (sensor.visible) {
                                  sensor_ids.push(sensor._id);
                                  datalogger_cnt++;
                              }
                          });
                          if((datalogger_cnt+1) == datalogger.children.length) {
                              angular.forEach(facility.children, function(datalogger, index){
                                  if (datalogger.visible) {
                                      datalogger_ids.push(datalogger._id);
                                      facility_cnt++;
                                  }

                              });
                              if((facility_cnt+1) == facility.children.length) {
                                  facility_ids.push(facility._id);
                                  $scope.addFacilityToDashboard(facility, datalogger, $rootScope.selectedDashboard._id, facility_ids, datalogger_ids, sensor_ids, metric_ids);
                              } else {
                                  datalogger_ids = [];
                                  datalogger_ids.push(datalogger._id);
                                  $scope.addDataloggerToDashboard(datalogger, source, $rootScope.selectedDashboard._id, datalogger_ids, sensor_ids, metric_ids);
                              }
                          } else {
                              sensor_ids = [];
                              sensor_ids.push(source._id);
                              $scope.addSensorToDashboard(source, null, $rootScope.selectedDashboard._id, sensor_ids, metric_ids);
                          }
                          
                          break;
                      case 'dmetric':
                          var sensor, datalogger, facility, sensor_id = source.parent_id;
                          angular.forEach($scope.treedata, function(facility_temp, index){
                              angular.forEach(facility_temp.children, function(datalogger_temp, index){
                                  angular.forEach(datalogger_temp.children, function(sensor_temp, index){
                                      if (sensor_id == sensor_temp._id) {
                                          sensor = sensor_temp;
                                          datalogger = datalogger_temp;
                                          facility = facility_temp;
                                      }
                                  });
                              });
                          });
                          var sensor_cnt = 0, datalogger_cnt = 0, facility_cnt = 0;
                          angular.forEach(sensor.children, function(metric, index){
                              if (metric.visible) {
                                  metric_ids.push(metric._id);
                                  sensor_cnt++;
                              }
                          });
                          if((sensor_cnt+1) == sensor.children.length) {
                              angular.forEach(datalogger.children, function(sensor, index){
                                  if (sensor.visible) {
                                      sensor_ids.push(sensor._id);
                                      datalogger_cnt++;
                                  }
                              });
                              if((datalogger_cnt+1) == datalogger.children.length) {
                                  angular.forEach(facility.children, function(datalogger, index){
                                      if (datalogger.visible) {
                                          datalogger_ids.push(datalogger._id);
                                          facility_cnt++;
                                      }

                                  });

                                  if((facility_cnt+1) == facility.children.length) {
                                      facility_ids.push(facility._id);
                                      $scope.addFacilityToDashboard(facility, datalogger, $rootScope.selectedDashboard._id, facility_ids, datalogger_ids, sensor_ids, metric_ids);
                                  } else {
                                      datalogger_ids = [];
                                      datalogger_ids.push(datalogger._id);
                                      $scope.addDataloggerToDashboard(datalogger, sensor, $rootScope.selectedDashboard._id, datalogger_ids, sensor_ids, metric_ids);
                                  }
                              } else {
                                  sensor_ids = [];
                                  sensor_ids.push(sensor._id);
                                  $scope.addSensorToDashboard(sensor, source, $rootScope.selectedDashboard._id, sensor_ids, metric_ids);
                              }
                          } else {
                              metric_ids = [];
                              metric_ids.push(source._id);
                              DataService.addMetricToDashboard($rootScope.selectedDashboard._id, JSON.stringify(metric_ids)).then(function (result) {
                                  source.visible = visible;
                              }); 
                          }
                          break;
                  }
              } else {
                  var facility_ids = [], datalogger_ids = [], sensor_ids = [], metric_ids = [];
                  switch(source.type) {
                      case 'facility':
                          facility_ids.push(source._id);
                          DataService.delFacilityFromDashboard($rootScope.selectedDashboard._id, JSON.stringify(facility_ids)).then(function (result) {
                              source.visible = visible;
                              angular.forEach(source.children, function(datalogger, index){
                                  datalogger.visible = visible;
                                  angular.forEach(datalogger.children, function(sensor, index){
                                      sensor.visible = visible;
                                      angular.forEach(sensor.children, function(metric, index){
                                          metric.visible = visible;
                                      })
                                  })
                              });
                          });
                          break;
                      case 'dlogger':
                          var facility, facility_id = source.parent_id;
                          angular.forEach($scope.treedata, function(facility_temp, index){
                              if (facility_id == facility_temp._id)
                                  facility = facility_temp;
                          });
                          if(facility.visible) {
                              facility_ids.push(facility._id);
                              angular.forEach(facility.children, function(datalogger, index){
                                  if (source._id != datalogger._id)
                                      datalogger_ids.push(datalogger._id);
                              });
                              $scope.delFacilityFromDashboard(facility, source, $rootScope.selectedDashboard._id, facility_ids, datalogger_ids);
                          }
                          else {
                              datalogger_ids.push(source._id);
                              DataService.delDataloggerFromDashboard($rootScope.selectedDashboard._id, JSON.stringify(datalogger_ids)).then(function (result) {
                                  source.visible = visible;
                                  angular.forEach(source.children, function(sensor, index){
                                      sensor.visible = visible;
                                      angular.forEach(sensor.children, function(metric, index){
                                          metric.visible = visible;
                                      })
                                  });
                              });
                          }
                          break;
                      case 'dsensor':
                          var facility, datalogger, datalogger_id = source.parent_id;
                          angular.forEach($scope.treedata, function(facility_temp, index){
                              angular.forEach(facility_temp.children, function(datalogger_temp, index){
                                  if (datalogger_id == datalogger_temp._id) {
                                      datalogger = datalogger_temp;
                                      facility = facility_temp;
                                  }
                              });
                          });
                          facility_ids.push(facility._id);
                          angular.forEach(facility.children, function(datalogger, index){
                              if (datalogger_id != datalogger._id)
                                  datalogger_ids.push(datalogger._id);
                              angular.forEach(datalogger.children, function(sensor, index){
                                  if (source._id != sensor._id)
                                      sensor_ids.push(sensor._id);
                              });
                          });
                          if(facility.visible) {
                              $scope.delSensorFromDashboard(facility, datalogger, source, $rootScope.selectedDashboard._id, facility_ids, datalogger_ids, sensor_ids);
                          }
                          else {
                              if(datalogger.visible) {
                                  datalogger_ids = [];
                                  datalogger_ids.push(datalogger_id);
                                  DataService.delDataloggerFromDashboard($rootScope.selectedDashboard._id, JSON.stringify(datalogger_ids)).then(function (result) {
                                      DataService.addSensorToDashboard($rootScope.selectedDashboard._id, JSON.stringify(sensor_ids)).then(function (result) {
                                          datalogger.visible = visible;
                                          source.visible = visible;
                                          angular.forEach(source.children, function(metric, index){
                                              metric.visible = visible;
                                          });
                                      });
                                  });
                                  
                              } else {
                                  sensor_ids = [];
                                  sensor_ids.push(source._id);
                                  DataService.delSensorFromDashboard($rootScope.selectedDashboard._id, JSON.stringify(sensor_ids)).then(function (result) {
                                      source.visible = visible;
                                      angular.forEach(source.children, function(metric, index){
                                          metric.visible = visible;
                                      })
                                  });
                              }
                          }
                          
                          break;
                      case 'dmetric':
                          var facility, datalogger, sensor, datalogger_id, sensor_id = source.parent_id;
                          angular.forEach($scope.treedata, function(facility_temp, index){
                              angular.forEach(facility_temp.children, function(datalogger_temp, index){
                                  angular.forEach(datalogger_temp.children, function(sensor_temp, index){
                                      if (sensor_id == sensor_temp._id) {
                                          sensor = sensor_temp;
                                          datalogger = datalogger_temp;
                                          facility = facility_temp;
                                      }
                                  });
                              });
                          });
                          datalogger_id = datalogger._id;
                          facility_ids.push(facility._id);
                          angular.forEach(facility.children, function(datalogger, index){
                              if (datalogger_id != datalogger._id)
                                  datalogger_ids.push(datalogger._id);
                              angular.forEach(datalogger.children, function(sensor, index){
                                  if (sensor_id != sensor._id)
                                      sensor_ids.push(sensor._id);
                                  angular.forEach(sensor.children, function(metric, index){
                                      if (source._id != metric._id)
                                          metric_ids.push(metric._id);
                                  });
                              });
                          });
                          if(facility.visible) {
                              DataService.delFacilityFromDashboard($rootScope.selectedDashboard._id, JSON.stringify(facility_ids)).then(function (result) {
                                  DataService.addDataloggerToDashboard($rootScope.selectedDashboard._id, JSON.stringify(datalogger_ids)).then(function (result) {
                                      DataService.addSensorToDashboard($rootScope.selectedDashboard._id, JSON.stringify(sensor_ids)).then(function (result) {
                                          DataService.addMetricToDashboard($rootScope.selectedDashboard._id, JSON.stringify(metric_ids)).then(function (result) {
                                              facility.visible = visible;
                                              datalogger.visible = visible;
                                              sensor.visible = visible;
                                              source.visible = visible;
                                          });
                                      });
                                  });
                              });
                          } else {
                              if(datalogger.visible) {
                                  datalogger_ids = [];
                                  datalogger_ids.push(datalogger_id);
                                  DataService.delDataloggerFromDashboard($rootScope.selectedDashboard._id, JSON.stringify(datalogger_ids)).then(function (result) {
                                      DataService.addSensorToDashboard($rootScope.selectedDashboard._id, JSON.stringify(sensor_ids)).then(function (result) {
                                          DataService.addMetricToDashboard($rootScope.selectedDashboard._id, JSON.stringify(metric_ids)).then(function (result) {
                                              datalogger.visible = visible;
                                              sensor.visible = visible;
                                              source.visible = visible;
                                          });
                                      });
                                  });

                              } else {
                                  if(sensor.visible) {
                                      sensor_ids = [];
                                      sensor_ids.push(sensor_id);
                                      DataService.delSensorFromDashboard($rootScope.selectedDashboard._id, JSON.stringify(sensor_ids)).then(function (result) {
                                          DataService.addMetricToDashboard($rootScope.selectedDashboard._id, JSON.stringify(metric_ids)).then(function (result) {
                                              sensor.visible = visible;
                                              source.visible = visible;
                                          });
                                      });
                                  } else {
                                      metric_ids = [];
                                      metric_ids.push(source._id);
                                      DataService.delMetricFromDashboard($rootScope.selectedDashboard._id, JSON.stringify(metric_ids)).then(function (result) {
                                          source.visible = visible;
                                      });
                                  }
                              }
                          }
                          break;
                  }
              }
              
          }

          $scope.addFacilityToDashboard = function (facility, datalogger, dashboardId, facility_ids, datalogger_ids, sensor_ids, metric_ids) {
              DataService.addFacilityToDashboard(dashboardId, JSON.stringify(facility_ids)).then(function (result) {
                  DataService.delMetricFromDashboard(dashboardId, JSON.stringify(metric_ids)).then(function (result) {
                      DataService.delSensorFromDashboard(dashboardId, JSON.stringify(sensor_ids)).then(function (result) {
                          DataService.delDataloggerFromDashboard(dashboardId, JSON.stringify(datalogger_ids));
                      });
                  });
                  var visible = !facility.visible;
                  facility.visible = visible;
                  if(datalogger != null) {
                      datalogger.visible = visible;
                  } 
                  angular.forEach(facility.children, function(datalogger, index){
                      datalogger.visible = visible;
                      angular.forEach(datalogger.children, function(sensor, index){
                          sensor.visible = visible;
                          angular.forEach(sensor.children, function(metric, index){
                              metric.visible = visible;
                          })
                      })
                  });
                  
              }); 
          }

          $scope.addDataloggerToDashboard = function (datalogger, sensor, dashboardId, datalogger_ids, sensor_ids, metric_ids) {
              DataService.addDataloggerToDashboard(dashboardId, JSON.stringify(datalogger_ids)).then(function (result) {
                   DataService.delMetricFromDashboard(dashboardId, JSON.stringify(metric_ids)).then(function (result) {
                      DataService.delSensorFromDashboard(dashboardId, JSON.stringify(sensor_ids));
                  });
                  var visible = !datalogger.visible;
                  datalogger.visible = visible;
                  if(sensor != null) {
                      sensor.visible = visible;
                  } 
                  angular.forEach(datalogger.children, function(sensor, index){
                      sensor.visible = visible;
                      angular.forEach(sensor.children, function(metric, index){
                          metric.visible = visible;
                      })
                  });
              });
          }

          $scope.addSensorToDashboard = function (sensor, metric, dashboardId, sensor_ids, metric_ids) {
              DataService.addSensorToDashboard(dashboardId, JSON.stringify(sensor_ids)).then(function (result) {
                  if (metric_ids.length > 0) 
                      DataService.delMetricFromDashboard($rootScope.selectedDashboard._id, JSON.stringify(metric_ids));
                  var visible = !sensor.visible;
                  sensor.visible = visible;
                  if(metric != null) {
                      sensor.visible = visible;
                  } 
                  angular.forEach(sensor.children, function(metric, index){
                      metric.visible = visible;
                  })
              }); 
          }

          $scope.delFacilityFromDashboard = function (facility, datalogger, dashboardId, facility_ids, datalogger_ids) {
              var visible = !datalogger.visible;
              DataService.delFacilityFromDashboard(dashboardId, JSON.stringify(facility_ids)).then(function (result) {
                  DataService.addDataloggerToDashboard(dashboardId, JSON.stringify(datalogger_ids)).then(function (result) {
                      facility.visible = visible;
                      datalogger.visible = visible;
                      angular.forEach(datalogger.children, function(sensor, index){
                          sensor.visible = visible;
                          angular.forEach(sensor.children, function(metric, index){
                              metric.visible = visible;
                          })
                      });
                  });
              });
          }

          $scope.delSensorFromDashboard = function (facility, datalogger, sensor, dashboardId, facility_ids, datalogger_ids, sensor_ids) {
              var visible = !sensor.visible;
              DataService.delFacilityFromDashboard(dashboardId, JSON.stringify(facility_ids)).then(function (result) {
                  DataService.addDataloggerToDashboard(dashboardId, JSON.stringify(datalogger_ids)).then(function (result) {
                      DataService.addSensorToDashboard(dashboardId, JSON.stringify(sensor_ids)).then(function (result) {
                          facility.visible = visible;
                          datalogger.visible = visible;
                          sensor.visible = visible;
                          angular.forEach(sensor.children, function(metric, index){
                              metric.visible = visible;
                          })
                      });
                  });
              });
          }

          $scope.applySegmentPanel = function(initial) {
            $scope.isAllSegment = false;
            $scope.segments = [];
            console.log('accepted changed dashboard event');
            console.log($rootScope.selectedDashboard);
            if(initial) {
              $scope.isAllSegment = $rootScope.selectedDashboard.isAllSegment || false;
              
              angular.forEach($rootScope.selectedDashboard.sourceFacilities, function(dashboard_facility, index){
                  $scope.segments.push({'id': dashboard_facility._id, 'name': dashboard_facility.name || 'Noname Facility', 'type': dashboard_facility.type || 'facility'});
              });

              angular.forEach($rootScope.selectedDashboard.sourceDataLoggers, function(dashboard_datalogger, index){
                  $scope.segments.push({'id': dashboard_datalogger._id, 'name': dashboard_datalogger.name || 'Noname Facility', 'type': dashboard_datalogger.type || 'datalogger'});
              });

              angular.forEach($rootScope.selectedDashboard.sourceSensors, function(dashboard_sensor, index){
                  $scope.segments.push({'id': dashboard_sensor._id, 'name': dashboard_sensor.name || 'Noname Facility', 'type': dashboard_sensor.type || 'sensor'});
              });

              angular.forEach($rootScope.selectedDashboard.sourceMetrics, function(dashboard_metric, index){
                  $scope.segments.push({'id': dashboard_metric._id, 'name': dashboard_metric.name || 'Noname Facility', 'type': dashboard_metric.type || 'metric'});
              });
            }
            else {
              $scope.isAllSegment = true;
              if(!$scope.treedata.length)
                $scope.isAllSegment = false;
              //loop for facilities
              angular.forEach($scope.treedata, function(facility, index){
                  if(facility.visible) {
                      $scope.segments.push({'id': facility._id, 'name': facility.name || 'Noname Facility', 'type': facility.type});
                  }
                  else if(facility.children.length) {
                    $scope.isAllSegment = false;
                    //loop for dataloggers
                    angular.forEach(facility.children, function(datalogger, index){
                      if(datalogger.visible) {
                        $scope.segments.push({'id': datalogger._id, 'name': datalogger.name || 'Noname DataLogger', 'type': datalogger.type});
                      }
                      else if(datalogger.children.length) {
                        //loop for sensors
                        angular.forEach(datalogger.children, function(sensor, index){
                          if(sensor.visible) {
                            $scope.segments.push({'id': sensor._id, 'name': sensor.name || 'Noname Sensor', 'type': sensor.type});
                          }
                          else if(sensor.children.length) {
                            //loop for metrics
                            angular.forEach(sensor.children, function(metric, index){
                              if(metric.visible)
                                $scope.segments.push({'id': metric._id, 'name': metric.name || 'Noname Metric', 'type': metric.type});
                            }) 
                          }
                        }) 
                      }
                    }) 
                  }
              });
            }

            //$rootScope.segments = $scope.segments;
            $scope.$emit('updateSegments', {'segments': $scope.segments, 'isAllSegment': $scope.isAllSegment});
            $element.find('#choose-segment-dlg').removeClass('opened').css({'top':0, 'left': 0, 'display':'none'});
            $timeout(function(){$rootScope.$broadcast('changedSegmentOrDateRange',{});}, 30);
          }

          $scope.hideSegmentPanel = function() {
            $element.find('#choose-segment-dlg').removeClass('opened').css({'top':0, 'left': 0, 'display':'none'});
          }

          $scope.toggleSegmentPanel = function(left, top, relationId) {
            var elem;
            elem = $element.find('#choose-segment-dlg');
            if(elem.hasClass('opened') && elem.data('rel') == relationId){
              elem.removeClass('opened').css({'top':0, 'left': left, 'display':'none'});
            }
            else {
              elem.data('rel',relationId);
              elem.removeClass('opened').addClass('opened').css({'top':top, 'left': left, 'display':'block'});
            }
          };

          $scope.init = function () {
              $timeout(function(){
                $scope.applySegmentPanel(1);
                $scope.listDataSources();
              },20);
          }

          $rootScope.$on('selectedDashboardChanged', function() {
            $scope.init();
          });


          $scope.$on('listDataSourcesReady',function(message, data) {
            $timeout(function(){$scope.applySegmentPanel();}, 20);
          });

          $scope.$on('showSegmentPanel',function(message, options) {
                $scope.toggleSegmentPanel(options.left, options.top, options.relationId);
          });

}]);