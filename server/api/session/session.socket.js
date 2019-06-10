/**
 * Broadcast updates to client when the model changes
 */


import SessionEvents from './session.events';

// Model events to emit
const events = ['save', 'remove'];

export function register(socket) {
  // Bind model events to socket events
  for (let i = 0, eventsLength = events.length; i < eventsLength; i++) {
    const event = events[i];
    const listener = createListener(`session:${event}`, socket);

    SessionEvents.on(event, listener);
    socket.on('disconnect', removeListener(event, listener));
  }
}


function createListener(event, socket) {
  return function (doc) {
    socket.emit(event, doc);
  };
}

function removeListener(event, listener) {
  return function () {
    SessionEvents.removeListener(event, listener);
  };
}
