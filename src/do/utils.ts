import type {Id, IdOrNull} from "tinybase";
import {isInstanceOf} from "is-what";
export const enum Message {
  /// Message.Response
  Response = 0,
  /// Message.GetContentHashes
  GetContentHashes = 1,
  /// Message.ContentHashes
  ContentHashes = 2,
  /// Message.ContentDiff
  ContentDiff = 3,
  /// Message.GetTableDiff
  GetTableDiff = 4,
  /// Message.GetRowDiff
  GetRowDiff = 5,
  /// Message.GetCellDiff
  GetCellDiff = 6,
  /// Message.GetValueDiff
  GetValueDiff = 7,
}
export const UNDEFINED = '\uFFFC';
const MESSAGE_SEPARATOR = '\n';

const PATH_REGEX = /\/([^?]*)/;
export const EMPTY_STRING = '';
export const isUndefined = (thing: unknown): thing is undefined | null =>
  thing == undefined;

export const ifNotUndefined = <Value, Return>(
  value: Value | null | undefined,
  then: (value: Value) => Return,
  otherwise?: () => Return,
): Return | undefined => (isUndefined(value) ? otherwise?.() : then(value));


export const strMatch = (str: string | undefined, regex: RegExp) =>
  str?.match(regex);

export const getPathId = (request: Request): Id =>
  strMatch(new URL(request.url).pathname, PATH_REGEX)?.[1] ?? EMPTY_STRING;

export const getClientId = (request: Request): Id | null =>
  request.headers.get('upgrade')?.toLowerCase() == 'websocket'
    ? request.headers.get('sec-websocket-key')
    : null;

export type IdObj<Value> = {[id: string]: Value};
export const objValues = <Value>(obj: IdObj<Value>): Value[] =>
  Object.values(obj);


export const size = (arrayOrString: string | any[]): number =>
  arrayOrString.length;
export const arrayIsEmpty = (array: unknown[]): boolean => size(array) == 0;
export const jsonString = JSON.stringify;
export const jsonParse = JSON.parse;


export const jsonStringWithUndefined = (obj: unknown): string =>
  jsonString(obj, (_key, value) => (value === undefined ? UNDEFINED : value));

export const jsonParseWithUndefined = (str: string): any =>
  jsonParse(str, (_key, value) => (value === UNDEFINED ? undefined : value));

export const createPayload = (
  toClientId: IdOrNull,
  ...args: [requestId: IdOrNull, message: Message, body: any]
): string =>
  createRawPayload(toClientId ?? EMPTY_STRING, jsonStringWithUndefined(args));

export const createRawPayload = (clientId: Id, remainder: string): string =>
  clientId + MESSAGE_SEPARATOR + remainder;


export const createResponse = (
  status: number,
  webSocket: WebSocket | null = null,
  body: string | null = null,
): Response => new Response(body, {status, webSocket});

export const createUpgradeRequiredResponse = (): Response =>
  createResponse(426, null, 'Upgrade required');

// Convenience functions for common HTTP status codes
export const createBadRequestResponse = (message: string = 'Bad Request'): Response =>
  createResponse(400, null, message);

export const createUnauthorizedResponse = (message: string = 'Unauthorized'): Response =>
  createResponse(401, null, message);

export const createForbiddenResponse = (message: string = 'Forbidden'): Response =>
  createResponse(403, null, message);

export const createNotFoundResponse = (message: string = 'Not Found'): Response =>
  createResponse(404, null, message);

export const createMethodNotAllowedResponse = (message: string = 'Method Not Allowed'): Response =>
  createResponse(405, null, message);

export const createConflictResponse = (message: string = 'Conflict'): Response =>
  createResponse(409, null, message);

export const createInternalServerErrorResponse = (message: string = 'Internal Server Error'): Response =>
  createResponse(500, null, message);

export const createServiceUnavailableResponse = (message: string = 'Service Unavailable'): Response =>
  createResponse(503, null, message);
