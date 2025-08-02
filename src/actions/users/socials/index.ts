import { fetchSocialsFromTiltify } from './get.ts';
import {
  addSocial,
  removeSocial,
  setPrimaryLiveStream
} from './manage.ts';

export const socials = {
  // Social retrieval actions
  fetchSocialsFromTiltify,

  // Social management actions
  addSocial,
  removeSocial,
  setPrimaryLiveStream
};
