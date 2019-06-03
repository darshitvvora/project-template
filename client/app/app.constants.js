'use strict';

import angular from 'angular';

export default angular.module('projectTemplateApp.constants', [])
  .constant('appConfig', require('../../server/config/environment/shared'))
  .name;
