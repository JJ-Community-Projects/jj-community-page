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
  CampaignResponse1,
  DonationMatchPaginatedResponse1,
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
  Unauthorized,
  UnprocessableEntity,
} from '../models/index';
import {
    CampaignResponse1FromJSON,
    CampaignResponse1ToJSON,
    DonationMatchPaginatedResponse1FromJSON,
    DonationMatchPaginatedResponse1ToJSON,
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
    UnauthorizedFromJSON,
    UnauthorizedToJSON,
    UnprocessableEntityFromJSON,
    UnprocessableEntityToJSON,
} from '../models/index';

export interface GetCampaignRequest {
    campaignId: string;
}

export interface GetCampaignDonationMatchesRequest {
    campaignId: string;
    createdBefore?: string;
    createdAfter?: string;
    updatedBefore?: string;
    updatedAfter?: string;
    status?: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetCampaignDonationsRequest {
    campaignId: string;
    completedBefore?: string;
    completedAfter?: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetCampaignFitnessGoalsRequest {
    campaignId: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetCampaignMilestonesRequest {
    campaignId: string;
    includeDisabled?: boolean;
    createdBefore?: string;
    createdAfter?: string;
    updatedBefore?: string;
    updatedAfter?: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetCampaignPollbyIdRequest {
    pollId: string;
    campaignId: string;
}

export interface GetCampaignPollsRequest {
    campaignId: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetCampaignRewardsRequest {
    campaignId: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetCampaignSchedulesRequest {
    campaignId: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetCampaignTargetsRequest {
    campaignId: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetCampaignTopDonorsRequest {
    campaignId: string;
    timeType?: GetCampaignTopDonorsTimeTypeEnum;
    after?: string;
    before?: string;
    limit?: number;
}

export interface V5ApiWebPublicCampaignControllerShowSlugRequest {
    userSlug: string;
    campaignSlug: string;
}

/**
 * 
 */
export class CampaignApi extends runtime.BaseAPI {

    /**
     * Returns a campaign by its ID
     * Get by ID
     */
    async getCampaignRaw(requestParameters: GetCampaignRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<CampaignResponse1>> {
        if (requestParameters['campaignId'] == null) {
            throw new runtime.RequiredError(
                'campaignId',
                'Required parameter "campaignId" was null or undefined when calling getCampaign().'
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
            path: `/api/public/campaigns/{campaign_id}`.replace(`{${"campaign_id"}}`, encodeURIComponent(String(requestParameters['campaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => CampaignResponse1FromJSON(jsonValue));
    }

    /**
     * Returns a campaign by its ID
     * Get by ID
     */
    async getCampaign(requestParameters: GetCampaignRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<CampaignResponse1> {
        const response = await this.getCampaignRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List donation matches
     */
    async getCampaignDonationMatchesRaw(requestParameters: GetCampaignDonationMatchesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<DonationMatchPaginatedResponse1>> {
        if (requestParameters['campaignId'] == null) {
            throw new runtime.RequiredError(
                'campaignId',
                'Required parameter "campaignId" was null or undefined when calling getCampaignDonationMatches().'
            );
        }

        const queryParameters: any = {};

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

        if (requestParameters['status'] != null) {
            queryParameters['status'] = requestParameters['status'];
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
            path: `/api/public/campaigns/{campaign_id}/donation_matches`.replace(`{${"campaign_id"}}`, encodeURIComponent(String(requestParameters['campaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => DonationMatchPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List donation matches
     */
    async getCampaignDonationMatches(requestParameters: GetCampaignDonationMatchesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<DonationMatchPaginatedResponse1> {
        const response = await this.getCampaignDonationMatchesRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List donations
     */
    async getCampaignDonationsRaw(requestParameters: GetCampaignDonationsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<DonationPaginatedResponse1>> {
        if (requestParameters['campaignId'] == null) {
            throw new runtime.RequiredError(
                'campaignId',
                'Required parameter "campaignId" was null or undefined when calling getCampaignDonations().'
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
            path: `/api/public/campaigns/{campaign_id}/donations`.replace(`{${"campaign_id"}}`, encodeURIComponent(String(requestParameters['campaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => DonationPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List donations
     */
    async getCampaignDonations(requestParameters: GetCampaignDonationsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<DonationPaginatedResponse1> {
        const response = await this.getCampaignDonationsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List fitness goals
     */
    async getCampaignFitnessGoalsRaw(requestParameters: GetCampaignFitnessGoalsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<FitnessGoalPaginatedResponse1>> {
        if (requestParameters['campaignId'] == null) {
            throw new runtime.RequiredError(
                'campaignId',
                'Required parameter "campaignId" was null or undefined when calling getCampaignFitnessGoals().'
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
            path: `/api/public/campaigns/{campaign_id}/fitness_goals`.replace(`{${"campaign_id"}}`, encodeURIComponent(String(requestParameters['campaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => FitnessGoalPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List fitness goals
     */
    async getCampaignFitnessGoals(requestParameters: GetCampaignFitnessGoalsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<FitnessGoalPaginatedResponse1> {
        const response = await this.getCampaignFitnessGoalsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List milestones
     */
    async getCampaignMilestonesRaw(requestParameters: GetCampaignMilestonesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<MilestonePaginatedResponse1>> {
        if (requestParameters['campaignId'] == null) {
            throw new runtime.RequiredError(
                'campaignId',
                'Required parameter "campaignId" was null or undefined when calling getCampaignMilestones().'
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
            path: `/api/public/campaigns/{campaign_id}/milestones`.replace(`{${"campaign_id"}}`, encodeURIComponent(String(requestParameters['campaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => MilestonePaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List milestones
     */
    async getCampaignMilestones(requestParameters: GetCampaignMilestonesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<MilestonePaginatedResponse1> {
        const response = await this.getCampaignMilestonesRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Returns a poll by its ID
     * Get campaign poll by ID
     */
    async getCampaignPollbyIdRaw(requestParameters: GetCampaignPollbyIdRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<PollResponse1>> {
        if (requestParameters['pollId'] == null) {
            throw new runtime.RequiredError(
                'pollId',
                'Required parameter "pollId" was null or undefined when calling getCampaignPollbyId().'
            );
        }

        if (requestParameters['campaignId'] == null) {
            throw new runtime.RequiredError(
                'campaignId',
                'Required parameter "campaignId" was null or undefined when calling getCampaignPollbyId().'
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
            path: `/api/public/campaigns/{campaign_id}/polls/{poll_id}`.replace(`{${"poll_id"}}`, encodeURIComponent(String(requestParameters['pollId']))).replace(`{${"campaign_id"}}`, encodeURIComponent(String(requestParameters['campaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => PollResponse1FromJSON(jsonValue));
    }

    /**
     * Returns a poll by its ID
     * Get campaign poll by ID
     */
    async getCampaignPollbyId(requestParameters: GetCampaignPollbyIdRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<PollResponse1> {
        const response = await this.getCampaignPollbyIdRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List polls
     */
    async getCampaignPollsRaw(requestParameters: GetCampaignPollsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<PollPaginatedResponse1>> {
        if (requestParameters['campaignId'] == null) {
            throw new runtime.RequiredError(
                'campaignId',
                'Required parameter "campaignId" was null or undefined when calling getCampaignPolls().'
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
            path: `/api/public/campaigns/{campaign_id}/polls`.replace(`{${"campaign_id"}}`, encodeURIComponent(String(requestParameters['campaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => PollPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List polls
     */
    async getCampaignPolls(requestParameters: GetCampaignPollsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<PollPaginatedResponse1> {
        const response = await this.getCampaignPollsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List rewards
     */
    async getCampaignRewardsRaw(requestParameters: GetCampaignRewardsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<RewardPaginatedResponse1>> {
        if (requestParameters['campaignId'] == null) {
            throw new runtime.RequiredError(
                'campaignId',
                'Required parameter "campaignId" was null or undefined when calling getCampaignRewards().'
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
            path: `/api/public/campaigns/{campaign_id}/rewards`.replace(`{${"campaign_id"}}`, encodeURIComponent(String(requestParameters['campaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => RewardPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List rewards
     */
    async getCampaignRewards(requestParameters: GetCampaignRewardsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<RewardPaginatedResponse1> {
        const response = await this.getCampaignRewardsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List schedules
     */
    async getCampaignSchedulesRaw(requestParameters: GetCampaignSchedulesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<SchedulePaginatedResponse1>> {
        if (requestParameters['campaignId'] == null) {
            throw new runtime.RequiredError(
                'campaignId',
                'Required parameter "campaignId" was null or undefined when calling getCampaignSchedules().'
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
            path: `/api/public/campaigns/{campaign_id}/schedules`.replace(`{${"campaign_id"}}`, encodeURIComponent(String(requestParameters['campaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => SchedulePaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List schedules
     */
    async getCampaignSchedules(requestParameters: GetCampaignSchedulesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<SchedulePaginatedResponse1> {
        const response = await this.getCampaignSchedulesRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List targets
     */
    async getCampaignTargetsRaw(requestParameters: GetCampaignTargetsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<TargetPaginatedResponse1>> {
        if (requestParameters['campaignId'] == null) {
            throw new runtime.RequiredError(
                'campaignId',
                'Required parameter "campaignId" was null or undefined when calling getCampaignTargets().'
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
            path: `/api/public/campaigns/{campaign_id}/targets`.replace(`{${"campaign_id"}}`, encodeURIComponent(String(requestParameters['campaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => TargetPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List targets
     */
    async getCampaignTargets(requestParameters: GetCampaignTargetsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<TargetPaginatedResponse1> {
        const response = await this.getCampaignTargetsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List top donors
     */
    async getCampaignTopDonorsRaw(requestParameters: GetCampaignTopDonorsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<LeaderboardEntryPaginatedResponse1>> {
        if (requestParameters['campaignId'] == null) {
            throw new runtime.RequiredError(
                'campaignId',
                'Required parameter "campaignId" was null or undefined when calling getCampaignTopDonors().'
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
            path: `/api/public/campaigns/{campaign_id}/donor_leaderboard`.replace(`{${"campaign_id"}}`, encodeURIComponent(String(requestParameters['campaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => LeaderboardEntryPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List top donors
     */
    async getCampaignTopDonors(requestParameters: GetCampaignTopDonorsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<LeaderboardEntryPaginatedResponse1> {
        const response = await this.getCampaignTopDonorsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Returns a Campaign by its user slug and campaign slug
     * Get campaign by user slug and campaign slug
     */
    async v5ApiWebPublicCampaignControllerShowSlugRaw(requestParameters: V5ApiWebPublicCampaignControllerShowSlugRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<CampaignResponse1>> {
        if (requestParameters['userSlug'] == null) {
            throw new runtime.RequiredError(
                'userSlug',
                'Required parameter "userSlug" was null or undefined when calling v5ApiWebPublicCampaignControllerShowSlug().'
            );
        }

        if (requestParameters['campaignSlug'] == null) {
            throw new runtime.RequiredError(
                'campaignSlug',
                'Required parameter "campaignSlug" was null or undefined when calling v5ApiWebPublicCampaignControllerShowSlug().'
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
            path: `/api/public/campaigns/by/slugs/{user_slug}/{campaign_slug}`.replace(`{${"user_slug"}}`, encodeURIComponent(String(requestParameters['userSlug']))).replace(`{${"campaign_slug"}}`, encodeURIComponent(String(requestParameters['campaignSlug']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => CampaignResponse1FromJSON(jsonValue));
    }

    /**
     * Returns a Campaign by its user slug and campaign slug
     * Get campaign by user slug and campaign slug
     */
    async v5ApiWebPublicCampaignControllerShowSlug(requestParameters: V5ApiWebPublicCampaignControllerShowSlugRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<CampaignResponse1> {
        const response = await this.v5ApiWebPublicCampaignControllerShowSlugRaw(requestParameters, initOverrides);
        return await response.value();
    }

}

/**
 * @export
 */
export const GetCampaignTopDonorsTimeTypeEnum = {
    Daily: 'daily',
    Weekly: 'weekly',
    Monthly: 'monthly',
    Yearly: 'yearly',
    Ytd: 'ytd',
    All: 'all'
} as const;
export type GetCampaignTopDonorsTimeTypeEnum = typeof GetCampaignTopDonorsTimeTypeEnum[keyof typeof GetCampaignTopDonorsTimeTypeEnum];
