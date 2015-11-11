/**
* Link.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  schema: 'true',
  attributes: {
    fromDomain: {
      type: 'string'
    },
    toDomain: {
      type: 'string'
    },
    fromURL: {
      type: 'string'
    },
    toURL: {
      type: 'string'
    },
    fromDepth: {
      type: 'integer'
    },
    toDepth: {
      type: 'integer'
    },
    linkType: {
      type: 'string'
    },
    linkURL: {
      type: 'string'
    },
    linkAlt: {
      type: 'string'
    }
  },
  autoCreatedAt: false,
  autoUpdatedAt: false,
  autoPK: false
};

