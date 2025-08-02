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
  CampaignPaginatedResponse1,
  DonationPaginatedResponse1,
  FitnessGoalPaginatedResponse1,
  Forbidden,
  LeaderboardEntryPaginatedResponse1,
  MilestonePaginatedResponse1,
  NotFound,
  PollPaginatedResponse1,
  PollResponse1,
  RewardPaginatedResponse1,
  SchedulePaginatedResponse1,
  TargetPaginatedResponse1,
  TeamCampaignResponse1,
  Unauthorized,
  UnprocessableEntity,
} from '../models';
import {
    CampaignPaginatedResponse1FromJSON,
    CampaignPaginatedResponse1ToJSON,
    DonationPaginatedResponse1FromJSON,
    DonationPaginatedResponse1ToJSON,
    FitnessGoalPaginatedResponse1FromJSON,
    FitnessGoalPaginatedResponse1ToJSON,
    ForbiddenFromJSON,
    ForbiddenToJSON,
    LeaderboardEntryPaginatedResponse1FromJSON,
    LeaderboardEntryPaginatedResponse1ToJSON,
    MilestonePaginatedResponse1FromJSON,
    MilestonePaginatedResponse1ToJSON,
    NotFoundFromJSON,
    NotFoundToJSON,
    PollPaginatedResponse1FromJSON,
    PollPaginatedResponse1ToJSON,
    PollResponse1FromJSON,
    PollResponse1ToJSON,
    RewardPaginatedResponse1FromJSON,
    RewardPaginatedResponse1ToJSON,
    SchedulePaginatedResponse1FromJSON,
    SchedulePaginatedResponse1ToJSON,
    TargetPaginatedResponse1FromJSON,
    TargetPaginatedResponse1ToJSON,
    TeamCampaignResponse1FromJSON,
    TeamCampaignResponse1ToJSON,
    UnauthorizedFromJSON,
    UnauthorizedToJSON,
    UnprocessableEntityFromJSON,
    UnprocessableEntityToJSON,
} from '../models';

export interface GetTeamCampaignRequest {
    teamCampaignId: string;
}

export interface GetTeamCampaignDonationsRequest {
    teamCampaignId: string;
    completedBefore?: string;
    completedAfter?: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetTeamCampaignFitnessGoalsRequest {
    teamCampaignId: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetTeamCampaignMilestonesRequest {
    teamCampaignId: string;
    includeDisabled?: boolean;
    createdBefore?: string;
    createdAfter?: string;
    updatedBefore?: string;
    updatedAfter?: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetTeamCampaignPollbyIdRequest {
    pollId: string;
    teamCampaignId: string;
}

export interface GetTeamCampaignPollsRequest {
    teamCampaignId: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetTeamCampaignRewardsRequest {
    teamCampaignId: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetTeamCampaignSchedulesRequest {
    teamCampaignId: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetTeamCampaignSupportingCampaignsRequest {
    teamCampaignId: string;
    status?: GetTeamCampaignSupportingCampaignsStatusEnum;
    updatedAfter?: string;
    updatedBefore?: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetTeamCampaignTargetsRequest {
    teamCampaignId: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetTeamCampaignTopDonorsRequest {
    teamCampaignId: string;
    timeType?: GetTeamCampaignTopDonorsTimeTypeEnum;
    after?: string;
    before?: string;
    limit?: number;
}

export interface V5ApiWebPublicTeamCampaignControllerShowSlugRequest {
    teamSlug: string;
    teamCampaignSlug: string;
}

export interface V5ApiWebPublicTeamCampaignLeaderboardControllerUserRequest {
    teamCampaignId: string;
    timeType?: V5ApiWebPublicTeamCampaignLeaderboardControllerUserTimeTypeEnum;
    after?: string;
    before?: string;
    limit?: number;
}

/**
 *
 */
export class TeamCampaignApi extends runtime.BaseAPI {

    /**
     * Returns a Team Campaign by its ID
     * Get by ID
     */
    async getTeamCampaignRaw(requestParameters: GetTeamCampaignRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<TeamCampaignResponse1>> {
        if (requestParameters['teamCampaignId'] == null) {
            throw new runtime.RequiredError(
                'teamCampaignId',
                'Required parameter "teamCampaignId" was null or undefined when calling getTeamCampaign().'
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
            path: `/api/public/team_campaigns/{team_campaign_id}`.replace(`{${"team_campaign_id"}}`, encodeURIComponent(String(requestParameters['teamCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => TeamCampaignResponse1FromJSON(jsonValue));
    }

    /**
     * Returns a Team Campaign by its ID
     * Get by ID
     */
    async getTeamCampaign(requestParameters: GetTeamCampaignRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<TeamCampaignResponse1> {
        const response = await this.getTeamCampaignRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List donations
     */
    async getTeamCampaignDonationsRaw(requestParameters: GetTeamCampaignDonationsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<DonationPaginatedResponse1>> {
        if (requestParameters['teamCampaignId'] == null) {
            throw new runtime.RequiredError(
                'teamCampaignId',
                'Required parameter "teamCampaignId" was null or undefined when calling getTeamCampaignDonations().'
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
            path: `/api/public/team_campaigns/{team_campaign_id}/donations`.replace(`{${"team_campaign_id"}}`, encodeURIComponent(String(requestParameters['teamCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => DonationPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List donations
     */
    async getTeamCampaignDonations(requestParameters: GetTeamCampaignDonationsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<DonationPaginatedResponse1> {
        const response = await this.getTeamCampaignDonationsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List fitness goals
     */
    async getTeamCampaignFitnessGoalsRaw(requestParameters: GetTeamCampaignFitnessGoalsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<FitnessGoalPaginatedResponse1>> {
        if (requestParameters['teamCampaignId'] == null) {
            throw new runtime.RequiredError(
                'teamCampaignId',
                'Required parameter "teamCampaignId" was null or undefined when calling getTeamCampaignFitnessGoals().'
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
            path: `/api/public/team_campaigns/{team_campaign_id}/fitness_goals`.replace(`{${"team_campaign_id"}}`, encodeURIComponent(String(requestParameters['teamCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => FitnessGoalPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List fitness goals
     */
    async getTeamCampaignFitnessGoals(requestParameters: GetTeamCampaignFitnessGoalsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<FitnessGoalPaginatedResponse1> {
        const response = await this.getTeamCampaignFitnessGoalsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List milestones
     */
    async getTeamCampaignMilestonesRaw(requestParameters: GetTeamCampaignMilestonesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<MilestonePaginatedResponse1>> {
        if (requestParameters['teamCampaignId'] == null) {
            throw new runtime.RequiredError(
                'teamCampaignId',
                'Required parameter "teamCampaignId" was null or undefined when calling getTeamCampaignMilestones().'
            );
        }

        const queryParameters: any = {};

        if (requestParameters['includeDisabled'] != null) {
            queryParameters['include_disabled'] = requestParameters['includeDisabled'];
        }

        if (requestParameters['createdBefore'] != null) {
            queryParameters['created_before'] = requestParameters['createdBefore'];
        }

        if (requestParameters['createdAfter'] != null) {
            queryParameters['created_after'] = requestParameters['createdAfter'];
        }

        if (requestParameters['updatedBefore'] != null) {
            queryParameters['updated_before'] = requestParameters['updatedBefore'];
        }

        if (requestParameters['updatedAfter'] != null) {
            queryParameters['updated_after'] = requestParameters['updatedAfter'];
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
            path: `/api/public/team_campaigns/{team_campaign_id}/milestones`.replace(`{${"team_campaign_id"}}`, encodeURIComponent(String(requestParameters['teamCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => MilestonePaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List milestones
     */
    async getTeamCampaignMilestones(requestParameters: GetTeamCampaignMilestonesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<MilestonePaginatedResponse1> {
        const response = await this.getTeamCampaignMilestonesRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Returns a poll by its ID
     * Get team campaign poll by ID
     */
    async getTeamCampaignPollbyIdRaw(requestParameters: GetTeamCampaignPollbyIdRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<PollResponse1>> {
        if (requestParameters['pollId'] == null) {
            throw new runtime.RequiredError(
                'pollId',
                'Required parameter "pollId" was null or undefined when calling getTeamCampaignPollbyId().'
            );
        }

        if (requestParameters['teamCampaignId'] == null) {
            throw new runtime.RequiredError(
                'teamCampaignId',
                'Required parameter "teamCampaignId" was null or undefined when calling getTeamCampaignPollbyId().'
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
            path: `/api/public/team_campaigns/{team_campaign_id}/polls/{poll_id}`.replace(`{${"poll_id"}}`, encodeURIComponent(String(requestParameters['pollId']))).replace(`{${"team_campaign_id"}}`, encodeURIComponent(String(requestParameters['teamCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => PollResponse1FromJSON(jsonValue));
    }

    /**
     * Returns a poll by its ID
     * Get team campaign poll by ID
     */
    async getTeamCampaignPollbyId(requestParameters: GetTeamCampaignPollbyIdRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<PollResponse1> {
        const response = await this.getTeamCampaignPollbyIdRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List polls
     */
    async getTeamCampaignPollsRaw(requestParameters: GetTeamCampaignPollsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<PollPaginatedResponse1>> {
        if (requestParameters['teamCampaignId'] == null) {
            throw new runtime.RequiredError(
                'teamCampaignId',
                'Required parameter "teamCampaignId" was null or undefined when calling getTeamCampaignPolls().'
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
            path: `/api/public/team_campaigns/{team_campaign_id}/polls`.replace(`{${"team_campaign_id"}}`, encodeURIComponent(String(requestParameters['teamCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => PollPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List polls
     */
    async getTeamCampaignPolls(requestParameters: GetTeamCampaignPollsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<PollPaginatedResponse1> {
        const response = await this.getTeamCampaignPollsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List rewards
     */
    async getTeamCampaignRewardsRaw(requestParameters: GetTeamCampaignRewardsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<RewardPaginatedResponse1>> {
        if (requestParameters['teamCampaignId'] == null) {
            throw new runtime.RequiredError(
                'teamCampaignId',
                'Required parameter "teamCampaignId" was null or undefined when calling getTeamCampaignRewards().'
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
            path: `/api/public/team_campaigns/{team_campaign_id}/rewards`.replace(`{${"team_campaign_id"}}`, encodeURIComponent(String(requestParameters['teamCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => RewardPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List rewards
     */
    async getTeamCampaignRewards(requestParameters: GetTeamCampaignRewardsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<RewardPaginatedResponse1> {
        const response = await this.getTeamCampaignRewardsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List schedules
     */
    async getTeamCampaignSchedulesRaw(requestParameters: GetTeamCampaignSchedulesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<SchedulePaginatedResponse1>> {
        if (requestParameters['teamCampaignId'] == null) {
            throw new runtime.RequiredError(
                'teamCampaignId',
                'Required parameter "teamCampaignId" was null or undefined when calling getTeamCampaignSchedules().'
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
            path: `/api/public/team_campaigns/{team_campaign_id}/schedules`.replace(`{${"team_campaign_id"}}`, encodeURIComponent(String(requestParameters['teamCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => SchedulePaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List schedules
     */
    async getTeamCampaignSchedules(requestParameters: GetTeamCampaignSchedulesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<SchedulePaginatedResponse1> {
        const response = await this.getTeamCampaignSchedulesRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List supporting campaigns
     */
    async getTeamCampaignSupportingCampaignsRaw(requestParameters: GetTeamCampaignSupportingCampaignsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<CampaignPaginatedResponse1>> {
        if (requestParameters['teamCampaignId'] == null) {
            throw new runtime.RequiredError(
                'teamCampaignId',
                'Required parameter "teamCampaignId" was null or undefined when calling getTeamCampaignSupportingCampaigns().'
            );
        }

        const queryParameters: any = {};

        if (requestParameters['status'] != null) {
            queryParameters['status'] = requestParameters['status'];
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
            path: `/api/public/team_campaigns/{team_campaign_id}/supporting_campaigns`.replace(`{${"team_campaign_id"}}`, encodeURIComponent(String(requestParameters['teamCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => CampaignPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List supporting campaigns
     */
    async getTeamCampaignSupportingCampaigns(requestParameters: GetTeamCampaignSupportingCampaignsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<CampaignPaginatedResponse1> {
        const response = await this.getTeamCampaignSupportingCampaignsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List targets
     */
    async getTeamCampaignTargetsRaw(requestParameters: GetTeamCampaignTargetsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<TargetPaginatedResponse1>> {
        if (requestParameters['teamCampaignId'] == null) {
            throw new runtime.RequiredError(
                'teamCampaignId',
                'Required parameter "teamCampaignId" was null or undefined when calling getTeamCampaignTargets().'
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
            path: `/api/public/team_campaigns/{team_campaign_id}/targets`.replace(`{${"team_campaign_id"}}`, encodeURIComponent(String(requestParameters['teamCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => TargetPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List targets
     */
    async getTeamCampaignTargets(requestParameters: GetTeamCampaignTargetsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<TargetPaginatedResponse1> {
        const response = await this.getTeamCampaignTargetsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List top donors
     */
    async getTeamCampaignTopDonorsRaw(requestParameters: GetTeamCampaignTopDonorsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<LeaderboardEntryPaginatedResponse1>> {
        if (requestParameters['teamCampaignId'] == null) {
            throw new runtime.RequiredError(
                'teamCampaignId',
                'Required parameter "teamCampaignId" was null or undefined when calling getTeamCampaignTopDonors().'
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
            path: `/api/public/team_campaigns/{team_campaign_id}/donor_leaderboards`.replace(`{${"team_campaign_id"}}`, encodeURIComponent(String(requestParameters['teamCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => LeaderboardEntryPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List top donors
     */
    async getTeamCampaignTopDonors(requestParameters: GetTeamCampaignTopDonorsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<LeaderboardEntryPaginatedResponse1> {
        const response = await this.getTeamCampaignTopDonorsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Returns a Team Campaign by its team slug and campaign slug
     * Get team campaign by team slug and campaign slug
     */
    async v5ApiWebPublicTeamCampaignControllerShowSlugRaw(requestParameters: V5ApiWebPublicTeamCampaignControllerShowSlugRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<TeamCampaignResponse1>> {
        if (requestParameters['teamSlug'] == null) {
            throw new runtime.RequiredError(
                'teamSlug',
                'Required parameter "teamSlug" was null or undefined when calling v5ApiWebPublicTeamCampaignControllerShowSlug().'
            );
        }

        if (requestParameters['teamCampaignSlug'] == null) {
            throw new runtime.RequiredError(
                'teamCampaignSlug',
                'Required parameter "teamCampaignSlug" was null or undefined when calling v5ApiWebPublicTeamCampaignControllerShowSlug().'
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
            path: `/api/public/team_campaigns/by/slugs/{team_slug}/{team_campaign_slug}`.replace(`{${"team_slug"}}`, encodeURIComponent(String(requestParameters['teamSlug']))).replace(`{${"team_campaign_slug"}}`, encodeURIComponent(String(requestParameters['teamCampaignSlug']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => TeamCampaignResponse1FromJSON(jsonValue));
    }

    /**
     * Returns a Team Campaign by its team slug and campaign slug
     * Get team campaign by team slug and campaign slug
     */
    async v5ApiWebPublicTeamCampaignControllerShowSlug(requestParameters: V5ApiWebPublicTeamCampaignControllerShowSlugRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<TeamCampaignResponse1> {
        const response = await this.v5ApiWebPublicTeamCampaignControllerShowSlugRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List top fundraisers
     */
    async v5ApiWebPublicTeamCampaignLeaderboardControllerUserRaw(requestParameters: V5ApiWebPublicTeamCampaignLeaderboardControllerUserRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<LeaderboardEntryPaginatedResponse1>> {
        if (requestParameters['teamCampaignId'] == null) {
            throw new runtime.RequiredError(
                'teamCampaignId',
                'Required parameter "teamCampaignId" was null or undefined when calling v5ApiWebPublicTeamCampaignLeaderboardControllerUser().'
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
            path: `/api/public/team_campaigns/{team_campaign_id}/user_leaderboards`.replace(`{${"team_campaign_id"}}`, encodeURIComponent(String(requestParameters['teamCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => LeaderboardEntryPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List top fundraisers
     */
    async v5ApiWebPublicTeamCampaignLeaderboardControllerUser(requestParameters: V5ApiWebPublicTeamCampaignLeaderboardControllerUserRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<LeaderboardEntryPaginatedResponse1> {
        const response = await this.v5ApiWebPublicTeamCampaignLeaderboardControllerUserRaw(requestParameters, initOverrides);
        return await response.value();
    }

}

/**
 * @export
 */
export const GetTeamCampaignSupportingCampaignsStatusEnum = {
    Published: 'published',
    Retired: 'retired'
} as const;
export type GetTeamCampaignSupportingCampaignsStatusEnum = typeof GetTeamCampaignSupportingCampaignsStatusEnum[keyof typeof GetTeamCampaignSupportingCampaignsStatusEnum];
/**
 * @export
 */
export const GetTeamCampaignTopDonorsTimeTypeEnum = {
    Daily: 'daily',
    Weekly: 'weekly',
    Monthly: 'monthly',
    Yearly: 'yearly',
    Ytd: 'ytd',
    All: 'all'
} as const;
export type GetTeamCampaignTopDonorsTimeTypeEnum = typeof GetTeamCampaignTopDonorsTimeTypeEnum[keyof typeof GetTeamCampaignTopDonorsTimeTypeEnum];
/**
 * @export
 */
export const V5ApiWebPublicTeamCampaignLeaderboardControllerUserTimeTypeEnum = {
    Daily: 'daily',
    Weekly: 'weekly',
    Monthly: 'monthly',
    Yearly: 'yearly',
    Ytd: 'ytd',
    All: 'all'
} as const;
export type V5ApiWebPublicTeamCampaignLeaderboardControllerUserTimeTypeEnum = typeof V5ApiWebPublicTeamCampaignLeaderboardControllerUserTimeTypeEnum[keyof typeof V5ApiWebPublicTeamCampaignLeaderboardControllerUserTimeTypeEnum];
