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
  EventPaginatedResponse1,
  NotFound,
  NullableUserResponse1,
  TeamPaginatedResponse1,
  Unauthorized,
  UnprocessableEntity,
  UserResponse1,
} from '../models';
import {
    EventPaginatedResponse1FromJSON,
    EventPaginatedResponse1ToJSON,
    NotFoundFromJSON,
    NotFoundToJSON,
    NullableUserResponse1FromJSON,
    NullableUserResponse1ToJSON,
    TeamPaginatedResponse1FromJSON,
    TeamPaginatedResponse1ToJSON,
    UnauthorizedFromJSON,
    UnauthorizedToJSON,
    UnprocessableEntityFromJSON,
    UnprocessableEntityToJSON,
    UserResponse1FromJSON,
    UserResponse1ToJSON,
} from '../models';

export interface GetUserRequest {
    userId: string;
}

export interface GetUserCampaignsRequest {
    userId: string;
    status?: GetUserCampaignsStatusEnum;
    supportingType?: GetUserCampaignsSupportingTypeEnum;
    updatedAfter?: string;
    updatedBefore?: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetUserCampaignsAndTeamCampaignsRequest {
    userId: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetUserTeamsRequest {
    userId: string;
    role?: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface V5ApiWebPublicUserControllerShowSlugRequest {
    slug: string;
}

/**
 *
 */
export class UserApi extends runtime.BaseAPI {

    /**
     * Returns a user by its ID
     * Get by ID
     */
    async getUserRaw(requestParameters: GetUserRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<UserResponse1>> {
        if (requestParameters['userId'] == null) {
            throw new runtime.RequiredError(
                'userId',
                'Required parameter "userId" was null or undefined when calling getUser().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("authorization", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/public/users/{user_id}`.replace(`{${"user_id"}}`, encodeURIComponent(String(requestParameters['userId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => UserResponse1FromJSON(jsonValue));
    }

    /**
     * Returns a user by its ID
     * Get by ID
     */
    async getUser(requestParameters: GetUserRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<UserResponse1> {
        const response = await this.getUserRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List campaigns
     */
    async getUserCampaignsRaw(requestParameters: GetUserCampaignsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<TeamPaginatedResponse1>> {
        if (requestParameters['userId'] == null) {
            throw new runtime.RequiredError(
                'userId',
                'Required parameter "userId" was null or undefined when calling getUserCampaigns().'
            );
        }

        const queryParameters: any = {};

        if (requestParameters['status'] != null) {
            queryParameters['status'] = requestParameters['status'];
        }

        if (requestParameters['supportingType'] != null) {
            queryParameters['supporting_type'] = requestParameters['supportingType'];
        }

        if (requestParameters['updatedAfter'] != null) {
            queryParameters['updated_after'] = requestParameters['updatedAfter'];
        }

        if (requestParameters['updatedBefore'] != null) {
            queryParameters['updated_before'] = requestParameters['updatedBefore'];
        }

        if (requestParameters['after'] != null) {
            queryParameters['after'] = requestParameters['after'];
        }

        if (requestParameters['before'] != null) {
            queryParameters['before'] = requestParameters['before'];
        }

        if (requestParameters['limit'] != null) {
            queryParameters['limit'] = requestParameters['limit'];
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
            path: `/api/public/users/{user_id}/campaigns`.replace(`{${"user_id"}}`, encodeURIComponent(String(requestParameters['userId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => TeamPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List campaigns
     */
    async getUserCampaigns(requestParameters: GetUserCampaignsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<TeamPaginatedResponse1> {
        const response = await this.getUserCampaignsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List all Campaigns and Team Campaigns by User ID
     */
    async getUserCampaignsAndTeamCampaignsRaw(requestParameters: GetUserCampaignsAndTeamCampaignsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<EventPaginatedResponse1>> {
        if (requestParameters['userId'] == null) {
            throw new runtime.RequiredError(
                'userId',
                'Required parameter "userId" was null or undefined when calling getUserCampaignsAndTeamCampaigns().'
            );
        }

        const queryParameters: any = {};

        if (requestParameters['after'] != null) {
            queryParameters['after'] = requestParameters['after'];
        }

        if (requestParameters['before'] != null) {
            queryParameters['before'] = requestParameters['before'];
        }

        if (requestParameters['limit'] != null) {
            queryParameters['limit'] = requestParameters['limit'];
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
            path: `/api/public/users/{user_id}/integration_events`.replace(`{${"user_id"}}`, encodeURIComponent(String(requestParameters['userId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => EventPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List all Campaigns and Team Campaigns by User ID
     */
    async getUserCampaignsAndTeamCampaigns(requestParameters: GetUserCampaignsAndTeamCampaignsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<EventPaginatedResponse1> {
        const response = await this.getUserCampaignsAndTeamCampaignsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List teams
     */
    async getUserTeamsRaw(requestParameters: GetUserTeamsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<TeamPaginatedResponse1>> {
        if (requestParameters['userId'] == null) {
            throw new runtime.RequiredError(
                'userId',
                'Required parameter "userId" was null or undefined when calling getUserTeams().'
            );
        }

        const queryParameters: any = {};

        if (requestParameters['role'] != null) {
            queryParameters['role'] = requestParameters['role'];
        }

        if (requestParameters['after'] != null) {
            queryParameters['after'] = requestParameters['after'];
        }

        if (requestParameters['before'] != null) {
            queryParameters['before'] = requestParameters['before'];
        }

        if (requestParameters['limit'] != null) {
            queryParameters['limit'] = requestParameters['limit'];
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
            path: `/api/public/users/{user_id}/teams`.replace(`{${"user_id"}}`, encodeURIComponent(String(requestParameters['userId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => TeamPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List teams
     */
    async getUserTeams(requestParameters: GetUserTeamsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<TeamPaginatedResponse1> {
        const response = await this.getUserTeamsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Returns a user for a given oauth access token
     * Gets the current user for an access token
     */
    async v5ApiWebPublicUserControllerCurrentUserRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<NullableUserResponse1>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("authorization", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/public/current-user`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => NullableUserResponse1FromJSON(jsonValue));
    }

    /**
     * Returns a user for a given oauth access token
     * Gets the current user for an access token
     */
    async v5ApiWebPublicUserControllerCurrentUser(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<NullableUserResponse1> {
        const response = await this.v5ApiWebPublicUserControllerCurrentUserRaw(initOverrides);
        return await response.value();
    }

    /**
     * Returns a user by its slug
     * Get by slug
     */
    async v5ApiWebPublicUserControllerShowSlugRaw(requestParameters: V5ApiWebPublicUserControllerShowSlugRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<UserResponse1>> {
        if (requestParameters['slug'] == null) {
            throw new runtime.RequiredError(
                'slug',
                'Required parameter "slug" was null or undefined when calling v5ApiWebPublicUserControllerShowSlug().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("authorization", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/public/users/by/slug/{slug}`.replace(`{${"slug"}}`, encodeURIComponent(String(requestParameters['slug']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => UserResponse1FromJSON(jsonValue));
    }

    /**
     * Returns a user by its slug
     * Get by slug
     */
    async v5ApiWebPublicUserControllerShowSlug(requestParameters: V5ApiWebPublicUserControllerShowSlugRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<UserResponse1> {
        const response = await this.v5ApiWebPublicUserControllerShowSlugRaw(requestParameters, initOverrides);
        return await response.value();
    }

}

/**
 * @export
 */
export const GetUserCampaignsStatusEnum = {
    Published: 'published',
    Retired: 'retired'
} as const;
export type GetUserCampaignsStatusEnum = typeof GetUserCampaignsStatusEnum[keyof typeof GetUserCampaignsStatusEnum];
/**
 * @export
 */
export const GetUserCampaignsSupportingTypeEnum = {
    InviteOnly: 'invite_only',
    None: 'none',
    Private: 'private',
    Public: 'public'
} as const;
export type GetUserCampaignsSupportingTypeEnum = typeof GetUserCampaignsSupportingTypeEnum[keyof typeof GetUserCampaignsSupportingTypeEnum];
