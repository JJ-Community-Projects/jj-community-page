import {addSocial, getSocial, importFromTiltify, removeSocial} from './impl.ts'

export const socialRouter = {
  add: addSocial,
  remove: removeSocial,
  importFromTiltify: importFromTiltify,
  get: getSocial
}
