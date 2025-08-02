/* tslint:disable */
/* eslint-disable */
/**
 * V5ApiPublic
 * Welcome to the Tiltify V5 API docmentation site.  This is the public API for Tiltify. It is intended to be used by third party developers to build integrations with Tiltify. Additional documentation may be found at the [Tiltify Developers](https://developers.tiltify.com) documentation site.  # OpenAPI Specification The API uses the OpenAPI Specification (OAS) to define the API. More information about the OpenAPI Specification can be found at [https://swagger.io/specification/](https://swagger.io/specification/).  # Authentication Tiltify uses OAuth 2.0 access tokens to authenticate API requests. You may get an Application `access_token` or a User `access_token`. To authenticate, you will need to create an application in the Tiltify User Dashboard, and use the generated credentials.  ## Getting an Application Access Token  The method to get an application access token follows the Client Credentials Oauth2 grant flow.  You may give the required parameters to the [Oauth Token Endpoint](#tag/oauth) to get an access token for use with the api directly.  ## Getting a User Access Token  The method to get a user access token follows the OAuth2 Authorization Grant flow. The following is a specific example of how to retrieve A User Access token using OAuth2  ### Getting the code  This example will be using the following values as needed. - Application ID: 1234 - Redirect https://www.example.com/redirect - Secret Key: asdf  To begin with, send a user in a browser to the Tiltify OAuth Authorization url. Include your Client ID, and the response type of `code` as query parameters. You may include your redirect URI if you have more than one. A space separated list of scopes may also be added, however, if not included, the `public` scope will be automatically selected.  ``` https://v5api.tiltify.com/oauth/authorize?&client_id=1234&response_type=code&redirect_uri=https%3A%2F%2Fwww.example.com%2Fredirect&scope=public ```  After signing in and authorizing, the user will be redirected back to your chosen redirect URI with a query parameter of `code`, containing the code used to fetch the access token.  ``` https://www.example.com/redirect?code=1234abcdef ```  The code should be passed to your server backend as the following steps require your secret key, which should not be exposed to the public.  ### Converting The Code To A User Access Token  To retrieve the User Access Token, a post request must be made to the Token URL. In the body of the url are the following fields in Form Data format. Note specifically that code is the code retrieved from the first step.  ``` client_id=1234 redirect_uri=https://www.example.com/redirect code=1234abcdef grant_type=authorization_code ```  Tiltify will return a response like the following:  ``` {      \"access_token\": \"ab6a592346444dea97170837e104d8a5ab6a592346444dea97170837e104d8a5\",     \"created_at\": \"2023-01-27T19:32:03Z\",     \"expires_in\": 7200,     \"refresh_token\": \"njjjytm3otetmgrjmi00yjawlwe4zgytzjixy2mzm2y3njawcg121231999393a3\",     \"scope\": \"public\",     \"token_type\": \"bearer\"  } ```  This access token may now be used as shown below to make requests. When used with the [/current-user](#tag/user/operation/V5ApiWeb.Public.UserController.current_user) endpoint, the full `user` object is returned.  ## Using Access Tokens  Add the Authorization header to your HTTP request.  ``` Authorization: Bearer <access_token> ```  Example:  ``` Authorization: Bearer ab6a592346444dea97170837e104d8a5ab6a592346444dea97170837e104d8a5 ```  ## Using Refresh Tokens  When an initial access token is created, a refresh token will be provided. The refresh token can be used to get a new access token when the current one expires. To do this, make a post request to the token url with grant_type set to `refresh_token`.  Example:  To refresh the User Access Token, a post request must be made to the Token URL. In the body of the url are the following fields in Form Data or json format.  ``` client_id=1234 client_secret=asdf grant_type=refresh_token refresh_token=njjjytm3otetmgrjmi00yjawlwe4zgytzjixy2mzm2y3njawcg121231999393a3 ```  <SecurityDefinitions />  # Webhooks  Tiltify provides a dashboard to subscribe and test campaign and campaign donation webhooks.  To register a webhook, visit the [Developer Dashboard](https://app.tiltify.com/developers)  ## Registering a webhook  In order to begin registering webhooks, you must first create an application.  In the application dashboard, there will be a side navigation option for `Webhooks`.  - Click the `Add Webhook` button - Create the webhook with an endpoint URL and an optional description. - Click edit on the newly created webhook - Click the `Events` submenu and add and event to subscribe to using the `Add event` button. - Enter your Campaign ID, this can be found in your campaign\'s dashboard under `Setup > Information` - Once created, click the `...` button and select Edit - Select the donation and/or Campaign events you would like to receive to your webhook endpoint and click `Update Event`. Including private data may include sensitive information, so please ensure that you secure your application.  You should now receive updates for those events on your webhook url.  <style>blockquote{border-left: 4px solid #F4CB14 !important; color: inherit !important;}</style> > Caution: > When we send a webhook we expect the endpoint to respond with a 200-299 status code. If we do not receive that, we deactivate the webhook after about an hour.   ## Testing  Once a webhook is created, you may send test messages through the `Testing` Submenu.  An example payload will be shown for each event type.  Click `Send Test` to initiate the test.
 *
 * The version of the OpenAPI document: 1.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import * as runtime from '../runtime';
import type {
  NotFound,
  Unauthorized,
} from '../models';
import {
    NotFoundFromJSON,
    NotFoundToJSON,
    UnauthorizedFromJSON,
    UnauthorizedToJSON,
} from '../models';

export interface V5ApiWebOauthAuthorizeRequest {
    clientId: string;
    redirectUri: string;
    responseType: V5ApiWebOauthAuthorizeResponseTypeEnum;
    scope?: V5ApiWebOauthAuthorizeScopeEnum;
}

export interface V5ApiWebOauthTokenRequest {
    clientId: string;
    clientSecret: string;
    grantType: V5ApiWebOauthTokenGrantTypeEnum;
    code?: string;
    refreshToken?: string;
    scope?: V5ApiWebOauthTokenScopeEnum;
}

/**
 *
 */
export class OauthApi extends runtime.BaseAPI {

    /**
     * Returns a `code` through the applications `redirect_uri` to be used with the `/token` with the `authorization_code` grant.
     * Authorize
     */
    async v5ApiWebOauthAuthorizeRaw(requestParameters: V5ApiWebOauthAuthorizeRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        if (requestParameters['clientId'] == null) {
            throw new runtime.RequiredError(
                'clientId',
                'Required parameter "clientId" was null or undefined when calling v5ApiWebOauthAuthorize().'
            );
        }

        if (requestParameters['redirectUri'] == null) {
            throw new runtime.RequiredError(
                'redirectUri',
                'Required parameter "redirectUri" was null or undefined when calling v5ApiWebOauthAuthorize().'
            );
        }

        if (requestParameters['responseType'] == null) {
            throw new runtime.RequiredError(
                'responseType',
                'Required parameter "responseType" was null or undefined when calling v5ApiWebOauthAuthorize().'
            );
        }

        const queryParameters: any = {};

        if (requestParameters['clientId'] != null) {
            queryParameters['client_id'] = requestParameters['clientId'];
        }

        if (requestParameters['redirectUri'] != null) {
            queryParameters['redirect_uri'] = requestParameters['redirectUri'];
        }

        if (requestParameters['responseType'] != null) {
            queryParameters['response_type'] = requestParameters['responseType'];
        }

        if (requestParameters['scope'] != null) {
            queryParameters['scope'] = requestParameters['scope'];
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("authorization", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/oauth/authorize`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     * Returns a `code` through the applications `redirect_uri` to be used with the `/token` with the `authorization_code` grant.
     * Authorize
     */
    async v5ApiWebOauthAuthorize(requestParameters: V5ApiWebOauthAuthorizeRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.v5ApiWebOauthAuthorizeRaw(requestParameters, initOverrides);
    }

    /**
     * Returns an access and refresh token with a provided client id, secret, and grant type. Tokens expire in `7200` seconds.
     * Token
     */
    async v5ApiWebOauthTokenRaw(requestParameters: V5ApiWebOauthTokenRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        if (requestParameters['clientId'] == null) {
            throw new runtime.RequiredError(
                'clientId',
                'Required parameter "clientId" was null or undefined when calling v5ApiWebOauthToken().'
            );
        }

        if (requestParameters['clientSecret'] == null) {
            throw new runtime.RequiredError(
                'clientSecret',
                'Required parameter "clientSecret" was null or undefined when calling v5ApiWebOauthToken().'
            );
        }

        if (requestParameters['grantType'] == null) {
            throw new runtime.RequiredError(
                'grantType',
                'Required parameter "grantType" was null or undefined when calling v5ApiWebOauthToken().'
            );
        }

        const queryParameters: any = {};

        if (requestParameters['clientId'] != null) {
            queryParameters['client_id'] = requestParameters['clientId'];
        }

        if (requestParameters['clientSecret'] != null) {
            queryParameters['client_secret'] = requestParameters['clientSecret'];
        }

        if (requestParameters['grantType'] != null) {
            queryParameters['grant_type'] = requestParameters['grantType'];
        }

        if (requestParameters['code'] != null) {
            queryParameters['code'] = requestParameters['code'];
        }

        if (requestParameters['refreshToken'] != null) {
            queryParameters['refresh_token'] = requestParameters['refreshToken'];
        }

        if (requestParameters['scope'] != null) {
            queryParameters['scope'] = requestParameters['scope'];
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("authorization", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/oauth/token`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     * Returns an access and refresh token with a provided client id, secret, and grant type. Tokens expire in `7200` seconds.
     * Token
     */
    async v5ApiWebOauthToken(requestParameters: V5ApiWebOauthTokenRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.v5ApiWebOauthTokenRaw(requestParameters, initOverrides);
    }

}

/**
 * @export
 */
export const V5ApiWebOauthAuthorizeResponseTypeEnum = {
    Code: 'code'
} as const;
export type V5ApiWebOauthAuthorizeResponseTypeEnum = typeof V5ApiWebOauthAuthorizeResponseTypeEnum[keyof typeof V5ApiWebOauthAuthorizeResponseTypeEnum];
/**
 * @export
 */
export const V5ApiWebOauthAuthorizeScopeEnum = {
    Public: 'public'
} as const;
export type V5ApiWebOauthAuthorizeScopeEnum = typeof V5ApiWebOauthAuthorizeScopeEnum[keyof typeof V5ApiWebOauthAuthorizeScopeEnum];
/**
 * @export
 */
export const V5ApiWebOauthTokenGrantTypeEnum = {
    ClientCredentials: 'client_credentials',
    AuthorizationCode: 'authorization_code',
    RefreshToken: 'refresh_token'
} as const;
export type V5ApiWebOauthTokenGrantTypeEnum = typeof V5ApiWebOauthTokenGrantTypeEnum[keyof typeof V5ApiWebOauthTokenGrantTypeEnum];
/**
 * @export
 */
export const V5ApiWebOauthTokenScopeEnum = {
    Public: 'public'
} as const;
export type V5ApiWebOauthTokenScopeEnum = typeof V5ApiWebOauthTokenScopeEnum[keyof typeof V5ApiWebOauthTokenScopeEnum];
