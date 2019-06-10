/**
 * Session model events
 */

'use strict';

import {EventEmitter} from 'events';
var Session = require('../../sqldb').Session;
var SessionEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
SessionEvents.setMaxListeners(0);

// Model events
var events = {
  afterCreate: 'save',
  afterUpdate: 'save',
  afterDestroy: 'remove'
};

// Register the event emitter to the model events
function registerEvents(Session) {
  for(var e in events) {
    let event = events[e];
    Session.hook(e, emitEvent(event));
  }
}

function emitEvent(event) {
  return function(doc, options, done) {
    SessionEvents.emit(event + ':' + doc._id, doc);
    SessionEvents.emit(event, doc);
    done(null);
  };
}

registerEvents(Session);
export default SessionEvents;
