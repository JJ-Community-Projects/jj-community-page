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
  ConfiguredLeaderboardResponse1,
  DonationPaginatedResponse1,
  EventPaginatedResponse1,
  FitnessGoalPaginatedResponse1,
  Forbidden,
  FundraisingEventResponse1,
  LeaderboardEntryPaginatedResponse1,
  NotFound,
  Unauthorized,
  UnprocessableEntity,
} from '../models/index';
import {
    ConfiguredLeaderboardResponse1FromJSON,
    ConfiguredLeaderboardResponse1ToJSON,
    DonationPaginatedResponse1FromJSON,
    DonationPaginatedResponse1ToJSON,
    EventPaginatedResponse1FromJSON,
    EventPaginatedResponse1ToJSON,
    FitnessGoalPaginatedResponse1FromJSON,
    FitnessGoalPaginatedResponse1ToJSON,
    ForbiddenFromJSON,
    ForbiddenToJSON,
    FundraisingEventResponse1FromJSON,
    FundraisingEventResponse1ToJSON,
    LeaderboardEntryPaginatedResponse1FromJSON,
    LeaderboardEntryPaginatedResponse1ToJSON,
    NotFoundFromJSON,
    NotFoundToJSON,
    UnauthorizedFromJSON,
    UnauthorizedToJSON,
    UnprocessableEntityFromJSON,
    UnprocessableEntityToJSON,
} from '../models/index';

export interface GetFundraisingEventRequest {
    fundraisingEventId: string;
}

export interface GetFundraisingEventConfiguredLeaderboardsRequest {
    fundraisingEventId: string;
}

export interface GetFundraisingEventDonationsRequest {
    fundraisingEventId: string;
    completedBefore?: string;
    completedAfter?: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetFundraisingEventFitnessGoalsRequest {
    fundraisingEventId: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetFundraisingEventSupportingEventsRequest {
    fundraisingEventId: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface V5ApiWebPublicFundraisingEventLeaderboardControllerDonorRequest {
    fundraisingEventId: string;
    timeType?: V5ApiWebPublicFundraisingEventLeaderboardControllerDonorTimeTypeEnum;
    after?: string;
    before?: string;
    limit?: number;
}

export interface V5ApiWebPublicFundraisingEventLeaderboardControllerTeamRequest {
    fundraisingEventId: string;
    timeType?: V5ApiWebPublicFundraisingEventLeaderboardControllerTeamTimeTypeEnum;
    after?: string;
    before?: string;
    limit?: number;
}

export interface V5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessDistanceRequest {
    fundraisingEventId: string;
    timeType?: V5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessDistanceTimeTypeEnum;
    after?: string;
    before?: string;
    limit?: number;
}

export interface V5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessTimeRequest {
    fundraisingEventId: string;
    timeType?: V5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessTimeTimeTypeEnum;
    after?: string;
    before?: string;
    limit?: number;
}

export interface V5ApiWebPublicFundraisingEventLeaderboardControllerUserRequest {
    fundraisingEventId: string;
    timeType?: V5ApiWebPublicFundraisingEventLeaderboardControllerUserTimeTypeEnum;
    after?: string;
    before?: string;
    limit?: number;
}

export interface V5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessDistanceRequest {
    fundraisingEventId: string;
    timeType?: V5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessDistanceTimeTypeEnum;
    after?: string;
    before?: string;
    limit?: number;
}

export interface V5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessTimeRequest {
    fundraisingEventId: string;
    timeType?: V5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessTimeTimeTypeEnum;
    after?: string;
    before?: string;
    limit?: number;
}

/**
 * 
 */
export class FundraisingEventApi extends runtime.BaseAPI {

    /**
     * Returns a fundraising event by its ID
     * Get by ID
     */
    async getFundraisingEventRaw(requestParameters: GetFundraisingEventRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<FundraisingEventResponse1>> {
        if (requestParameters['fundraisingEventId'] == null) {
            throw new runtime.RequiredError(
                'fundraisingEventId',
                'Required parameter "fundraisingEventId" was null or undefined when calling getFundraisingEvent().'
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
            path: `/api/public/fundraising_events/{fundraising_event_id}`.replace(`{${"fundraising_event_id"}}`, encodeURIComponent(String(requestParameters['fundraisingEventId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => FundraisingEventResponse1FromJSON(jsonValue));
    }

    /**
     * Returns a fundraising event by its ID
     * Get by ID
     */
    async getFundraisingEvent(requestParameters: GetFundraisingEventRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<FundraisingEventResponse1> {
        const response = await this.getFundraisingEventRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List configured leaderboards
     * @deprecated
     */
    async getFundraisingEventConfiguredLeaderboardsRaw(requestParameters: GetFundraisingEventConfiguredLeaderboardsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ConfiguredLeaderboardResponse1>> {
        if (requestParameters['fundraisingEventId'] == null) {
            throw new runtime.RequiredError(
                'fundraisingEventId',
                'Required parameter "fundraisingEventId" was null or undefined when calling getFundraisingEventConfiguredLeaderboards().'
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
            path: `/api/public/fundraising_events/{fundraising_event_id}/configured_leaderboard`.replace(`{${"fundraising_event_id"}}`, encodeURIComponent(String(requestParameters['fundraisingEventId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => ConfiguredLeaderboardResponse1FromJSON(jsonValue));
    }

    /**
     * List configured leaderboards
     * @deprecated
     */
    async getFundraisingEventConfiguredLeaderboards(requestParameters: GetFundraisingEventConfiguredLeaderboardsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ConfiguredLeaderboardResponse1> {
        const response = await this.getFundraisingEventConfiguredLeaderboardsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     *  This endpoint will list donations for a given Fundraising Event. Contact  support for access to this endpoint. 
     * List donations
     * @deprecated
     */
    async getFundraisingEventDonationsRaw(requestParameters: GetFundraisingEventDonationsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<DonationPaginatedResponse1>> {
        if (requestParameters['fundraisingEventId'] == null) {
            throw new runtime.RequiredError(
                'fundraisingEventId',
                'Required parameter "fundraisingEventId" was null or undefined when calling getFundraisingEventDonations().'
            );
        }

        const queryParameters: any = {};

        if (requestParameters['completedBefore'] != null) {
            queryParameters['completed_before'] = requestParameters['completedBefore'];
        }

        if (requestParameters['completedAfter'] != null) {
            queryParameters['completed_after'] = requestParameters['completedAfter'];
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
            path: `/api/public/fundraising_events/{fundraising_event_id}/donations`.replace(`{${"fundraising_event_id"}}`, encodeURIComponent(String(requestParameters['fundraisingEventId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => DonationPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     *  This endpoint will list donations for a given Fundraising Event. Contact  support for access to this endpoint. 
     * List donations
     * @deprecated
     */
    async getFundraisingEventDonations(requestParameters: GetFundraisingEventDonationsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<DonationPaginatedResponse1> {
        const response = await this.getFundraisingEventDonationsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List fitness goals
     */
    async getFundraisingEventFitnessGoalsRaw(requestParameters: GetFundraisingEventFitnessGoalsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<FitnessGoalPaginatedResponse1>> {
        if (requestParameters['fundraisingEventId'] == null) {
            throw new runtime.RequiredError(
                'fundraisingEventId',
                'Required parameter "fundraisingEventId" was null or undefined when calling getFundraisingEventFitnessGoals().'
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
            path: `/api/public/fundraising_events/{fundraising_event_id}/fitness_goals`.replace(`{${"fundraising_event_id"}}`, encodeURIComponent(String(requestParameters['fundraisingEventId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => FitnessGoalPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List fitness goals
     */
    async getFundraisingEventFitnessGoals(requestParameters: GetFundraisingEventFitnessGoalsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<FitnessGoalPaginatedResponse1> {
        const response = await this.getFundraisingEventFitnessGoalsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Returns supporting campaigns by Fundraising Event ID
     * List campaigns
     */
    async getFundraisingEventSupportingEventsRaw(requestParameters: GetFundraisingEventSupportingEventsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<EventPaginatedResponse1>> {
        if (requestParameters['fundraisingEventId'] == null) {
            throw new runtime.RequiredError(
                'fundraisingEventId',
                'Required parameter "fundraisingEventId" was null or undefined when calling getFundraisingEventSupportingEvents().'
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
            path: `/api/public/fundraising_events/{fundraising_event_id}/supporting_events`.replace(`{${"fundraising_event_id"}}`, encodeURIComponent(String(requestParameters['fundraisingEventId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => EventPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * Returns supporting campaigns by Fundraising Event ID
     * List campaigns
     */
    async getFundraisingEventSupportingEvents(requestParameters: GetFundraisingEventSupportingEventsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<EventPaginatedResponse1> {
        const response = await this.getFundraisingEventSupportingEventsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List top donors
     */
    async v5ApiWebPublicFundraisingEventLeaderboardControllerDonorRaw(requestParameters: V5ApiWebPublicFundraisingEventLeaderboardControllerDonorRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<LeaderboardEntryPaginatedResponse1>> {
        if (requestParameters['fundraisingEventId'] == null) {
            throw new runtime.RequiredError(
                'fundraisingEventId',
                'Required parameter "fundraisingEventId" was null or undefined when calling v5ApiWebPublicFundraisingEventLeaderboardControllerDonor().'
            );
        }

        const queryParameters: any = {};

        if (requestParameters['timeType'] != null) {
            queryParameters['time_type'] = requestParameters['timeType'];
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
            path: `/api/public/fundraising_events/{fundraising_event_id}/donor_leaderboard`.replace(`{${"fundraising_event_id"}}`, encodeURIComponent(String(requestParameters['fundraisingEventId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => LeaderboardEntryPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List top donors
     */
    async v5ApiWebPublicFundraisingEventLeaderboardControllerDonor(requestParameters: V5ApiWebPublicFundraisingEventLeaderboardControllerDonorRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<LeaderboardEntryPaginatedResponse1> {
        const response = await this.v5ApiWebPublicFundraisingEventLeaderboardControllerDonorRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List top teams
     */
    async v5ApiWebPublicFundraisingEventLeaderboardControllerTeamRaw(requestParameters: V5ApiWebPublicFundraisingEventLeaderboardControllerTeamRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<LeaderboardEntryPaginatedResponse1>> {
        if (requestParameters['fundraisingEventId'] == null) {
            throw new runtime.RequiredError(
                'fundraisingEventId',
                'Required parameter "fundraisingEventId" was null or undefined when calling v5ApiWebPublicFundraisingEventLeaderboardControllerTeam().'
            );
        }

        const queryParameters: any = {};

        if (requestParameters['timeType'] != null) {
            queryParameters['time_type'] = requestParameters['timeType'];
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
            path: `/api/public/fundraising_events/{fundraising_event_id}/team_leaderboard`.replace(`{${"fundraising_event_id"}}`, encodeURIComponent(String(requestParameters['fundraisingEventId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => LeaderboardEntryPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List top teams
     */
    async v5ApiWebPublicFundraisingEventLeaderboardControllerTeam(requestParameters: V5ApiWebPublicFundraisingEventLeaderboardControllerTeamRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<LeaderboardEntryPaginatedResponse1> {
        const response = await this.v5ApiWebPublicFundraisingEventLeaderboardControllerTeamRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List top teams fitness distances
     */
    async v5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessDistanceRaw(requestParameters: V5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessDistanceRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<LeaderboardEntryPaginatedResponse1>> {
        if (requestParameters['fundraisingEventId'] == null) {
            throw new runtime.RequiredError(
                'fundraisingEventId',
                'Required parameter "fundraisingEventId" was null or undefined when calling v5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessDistance().'
            );
        }

        const queryParameters: any = {};

        if (requestParameters['timeType'] != null) {
            queryParameters['time_type'] = requestParameters['timeType'];
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
            path: `/api/public/fundraising_events/{fundraising_event_id}/team_fitness_distance_leaderboard`.replace(`{${"fundraising_event_id"}}`, encodeURIComponent(String(requestParameters['fundraisingEventId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => LeaderboardEntryPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List top teams fitness distances
     */
    async v5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessDistance(requestParameters: V5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessDistanceRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<LeaderboardEntryPaginatedResponse1> {
        const response = await this.v5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessDistanceRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List top teams fitness times
     */
    async v5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessTimeRaw(requestParameters: V5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessTimeRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<LeaderboardEntryPaginatedResponse1>> {
        if (requestParameters['fundraisingEventId'] == null) {
            throw new runtime.RequiredError(
                'fundraisingEventId',
                'Required parameter "fundraisingEventId" was null or undefined when calling v5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessTime().'
            );
        }

        const queryParameters: any = {};

        if (requestParameters['timeType'] != null) {
            queryParameters['time_type'] = requestParameters['timeType'];
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
            path: `/api/public/fundraising_events/{fundraising_event_id}/team_fitness_time_leaderboard`.replace(`{${"fundraising_event_id"}}`, encodeURIComponent(String(requestParameters['fundraisingEventId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => LeaderboardEntryPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List top teams fitness times
     */
    async v5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessTime(requestParameters: V5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessTimeRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<LeaderboardEntryPaginatedResponse1> {
        const response = await this.v5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessTimeRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List top fundraisers
     */
    async v5ApiWebPublicFundraisingEventLeaderboardControllerUserRaw(requestParameters: V5ApiWebPublicFundraisingEventLeaderboardControllerUserRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<LeaderboardEntryPaginatedResponse1>> {
        if (requestParameters['fundraisingEventId'] == null) {
            throw new runtime.RequiredError(
                'fundraisingEventId',
                'Required parameter "fundraisingEventId" was null or undefined when calling v5ApiWebPublicFundraisingEventLeaderboardControllerUser().'
            );
        }

        const queryParameters: any = {};

        if (requestParameters['timeType'] != null) {
            queryParameters['time_type'] = requestParameters['timeType'];
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
            path: `/api/public/fundraising_events/{fundraising_event_id}/user_leaderboard`.replace(`{${"fundraising_event_id"}}`, encodeURIComponent(String(requestParameters['fundraisingEventId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => LeaderboardEntryPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List top fundraisers
     */
    async v5ApiWebPublicFundraisingEventLeaderboardControllerUser(requestParameters: V5ApiWebPublicFundraisingEventLeaderboardControllerUserRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<LeaderboardEntryPaginatedResponse1> {
        const response = await this.v5ApiWebPublicFundraisingEventLeaderboardControllerUserRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List top users fitness distances
     */
    async v5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessDistanceRaw(requestParameters: V5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessDistanceRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<LeaderboardEntryPaginatedResponse1>> {
        if (requestParameters['fundraisingEventId'] == null) {
            throw new runtime.RequiredError(
                'fundraisingEventId',
                'Required parameter "fundraisingEventId" was null or undefined when calling v5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessDistance().'
            );
        }

        const queryParameters: any = {};

        if (requestParameters['timeType'] != null) {
            queryParameters['time_type'] = requestParameters['timeType'];
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
            path: `/api/public/fundraising_events/{fundraising_event_id}/user_fitness_distance_leaderboard`.replace(`{${"fundraising_event_id"}}`, encodeURIComponent(String(requestParameters['fundraisingEventId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => LeaderboardEntryPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List top users fitness distances
     */
    async v5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessDistance(requestParameters: V5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessDistanceRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<LeaderboardEntryPaginatedResponse1> {
        const response = await this.v5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessDistanceRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List top users fitness times
     */
    async v5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessTimeRaw(requestParameters: V5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessTimeRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<LeaderboardEntryPaginatedResponse1>> {
        if (requestParameters['fundraisingEventId'] == null) {
            throw new runtime.RequiredError(
                'fundraisingEventId',
                'Required parameter "fundraisingEventId" was null or undefined when calling v5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessTime().'
            );
        }

        const queryParameters: any = {};

        if (requestParameters['timeType'] != null) {
            queryParameters['time_type'] = requestParameters['timeType'];
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
            path: `/api/public/fundraising_events/{fundraising_event_id}/user_fitness_time_leaderboard`.replace(`{${"fundraising_event_id"}}`, encodeURIComponent(String(requestParameters['fundraisingEventId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => LeaderboardEntryPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List top users fitness times
     */
    async v5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessTime(requestParameters: V5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessTimeRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<LeaderboardEntryPaginatedResponse1> {
        const response = await this.v5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessTimeRaw(requestParameters, initOverrides);
        return await response.value();
    }

}

/**
 * @export
 */
export const V5ApiWebPublicFundraisingEventLeaderboardControllerDonorTimeTypeEnum = {
    Daily: 'daily',
    Weekly: 'weekly',
    Monthly: 'monthly',
    Yearly: 'yearly',
    Ytd: 'ytd',
    All: 'all',
    Custom: 'custom'
} as const;
export type V5ApiWebPublicFundraisingEventLeaderboardControllerDonorTimeTypeEnum = typeof V5ApiWebPublicFundraisingEventLeaderboardControllerDonorTimeTypeEnum[keyof typeof V5ApiWebPublicFundraisingEventLeaderboardControllerDonorTimeTypeEnum];
/**
 * @export
 */
export const V5ApiWebPublicFundraisingEventLeaderboardControllerTeamTimeTypeEnum = {
    Daily: 'daily',
    Weekly: 'weekly',
    Monthly: 'monthly',
    Yearly: 'yearly',
    Ytd: 'ytd',
    All: 'all',
    Custom: 'custom'
} as const;
export type V5ApiWebPublicFundraisingEventLeaderboardControllerTeamTimeTypeEnum = typeof V5ApiWebPublicFundraisingEventLeaderboardControllerTeamTimeTypeEnum[keyof typeof V5ApiWebPublicFundraisingEventLeaderboardControllerTeamTimeTypeEnum];
/**
 * @export
 */
export const V5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessDistanceTimeTypeEnum = {
    Daily: 'daily',
    Weekly: 'weekly',
    Monthly: 'monthly',
    Yearly: 'yearly',
    Ytd: 'ytd',
    All: 'all',
    Custom: 'custom'
} as const;
export type V5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessDistanceTimeTypeEnum = typeof V5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessDistanceTimeTypeEnum[keyof typeof V5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessDistanceTimeTypeEnum];
/**
 * @export
 */
export const V5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessTimeTimeTypeEnum = {
    Daily: 'daily',
    Weekly: 'weekly',
    Monthly: 'monthly',
    Yearly: 'yearly',
    Ytd: 'ytd',
    All: 'all',
    Custom: 'custom'
} as const;
export type V5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessTimeTimeTypeEnum = typeof V5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessTimeTimeTypeEnum[keyof typeof V5ApiWebPublicFundraisingEventLeaderboardControllerTeamFitnessTimeTimeTypeEnum];
/**
 * @export
 */
export const V5ApiWebPublicFundraisingEventLeaderboardControllerUserTimeTypeEnum = {
    Daily: 'daily',
    Weekly: 'weekly',
    Monthly: 'monthly',
    Yearly: 'yearly',
    Ytd: 'ytd',
    All: 'all',
    Custom: 'custom'
} as const;
export type V5ApiWebPublicFundraisingEventLeaderboardControllerUserTimeTypeEnum = typeof V5ApiWebPublicFundraisingEventLeaderboardControllerUserTimeTypeEnum[keyof typeof V5ApiWebPublicFundraisingEventLeaderboardControllerUserTimeTypeEnum];
/**
 * @export
 */
export const V5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessDistanceTimeTypeEnum = {
    Daily: 'daily',
    Weekly: 'weekly',
    Monthly: 'monthly',
    Yearly: 'yearly',
    Ytd: 'ytd',
    All: 'all',
    Custom: 'custom'
} as const;
export type V5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessDistanceTimeTypeEnum = typeof V5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessDistanceTimeTypeEnum[keyof typeof V5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessDistanceTimeTypeEnum];
/**
 * @export
 */
export const V5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessTimeTimeTypeEnum = {
    Daily: 'daily',
    Weekly: 'weekly',
    Monthly: 'monthly',
    Yearly: 'yearly',
    Ytd: 'ytd',
    All: 'all',
    Custom: 'custom'
} as const;
export type V5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessTimeTimeTypeEnum = typeof V5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessTimeTimeTypeEnum[keyof typeof V5ApiWebPublicFundraisingEventLeaderboardControllerUserFitnessTimeTimeTypeEnum];
