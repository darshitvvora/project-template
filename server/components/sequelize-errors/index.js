/**
 * Created by Darshit
 */


const _ = require('lodash');

export function test() {}

export function handleUniqueValidationError(model, where) {
  return (err) => {
    const errorMessages = _.map(err.errors, 'message');
    if (errorMessages.indexOf(`${Object.keys(where)[0]} must be unique`) !== -1) {
      return model
        .find({ where })
        .then((entity) => {
          const error = err;
          error.message = `${Object.keys(where)[0]} must be unique`;
          error.data = entity;
          return Promise.reject(error);
        });
    }
    return Promise.reject(err);
  };
}
