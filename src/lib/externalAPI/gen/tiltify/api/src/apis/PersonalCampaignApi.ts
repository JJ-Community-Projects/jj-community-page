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
  ContributionPaginatedResponse1,
  MilestonePaginatedResponse1,
  NotFound,
  PersonalCampaignPaginatedResponse1,
  PersonalCampaignResponse1,
  PollPaginatedResponse1,
  PollResponse1,
  RewardPaginatedResponse1,
  SchedulePaginatedResponse1,
  TargetPaginatedResponse1,
  Unauthorized,
  UnprocessableEntity,
} from '../models';
import {
    ContributionPaginatedResponse1FromJSON,
    ContributionPaginatedResponse1ToJSON,
    MilestonePaginatedResponse1FromJSON,
    MilestonePaginatedResponse1ToJSON,
    NotFoundFromJSON,
    NotFoundToJSON,
    PersonalCampaignPaginatedResponse1FromJSON,
    PersonalCampaignPaginatedResponse1ToJSON,
    PersonalCampaignResponse1FromJSON,
    PersonalCampaignResponse1ToJSON,
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
} from '../models';

export interface GetPersonalCampaignRequest {
    personalCampaignId: string;
}

export interface GetPersonalCampaignGiftsRequest {
    personalCampaignId: string;
    completedBefore?: string;
    completedAfter?: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetPersonalCampaignMilestonesRequest {
    personalCampaignId: string;
    includeDisabled?: boolean;
    createdBefore?: string;
    createdAfter?: string;
    updatedBefore?: string;
    updatedAfter?: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetPersonalCampaignPollbyIdRequest {
    pollId: string;
    personalCampaignId: string;
}

export interface GetPersonalCampaignPollsRequest {
    personalCampaignId: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetPersonalCampaignRewardsRequest {
    personalCampaignId: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetPersonalCampaignSchedulesRequest {
    personalCampaignId: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetPersonalCampaignSupportingCampaignsRequest {
    personalCampaignId: string;
    status?: GetPersonalCampaignSupportingCampaignsStatusEnum;
    updatedAfter?: string;
    updatedBefore?: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetPersonalCampaignTargetsRequest {
    personalCampaignId: string;
    after?: string;
    before?: string;
    limit?: number;
}

/**
 *
 */
export class PersonalCampaignApi extends runtime.BaseAPI {

    /**
     * Returns a personal campaign by its ID
     * Get by ID
     */
    async getPersonalCampaignRaw(requestParameters: GetPersonalCampaignRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<PersonalCampaignResponse1>> {
        if (requestParameters['personalCampaignId'] == null) {
            throw new runtime.RequiredError(
                'personalCampaignId',
                'Required parameter "personalCampaignId" was null or undefined when calling getPersonalCampaign().'
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
            path: `/api/public/personal-campaigns/{personal_campaign_id}`.replace(`{${"personal_campaign_id"}}`, encodeURIComponent(String(requestParameters['personalCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => PersonalCampaignResponse1FromJSON(jsonValue));
    }

    /**
     * Returns a personal campaign by its ID
     * Get by ID
     */
    async getPersonalCampaign(requestParameters: GetPersonalCampaignRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<PersonalCampaignResponse1> {
        const response = await this.getPersonalCampaignRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List gifts
     */
    async getPersonalCampaignGiftsRaw(requestParameters: GetPersonalCampaignGiftsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ContributionPaginatedResponse1>> {
        if (requestParameters['personalCampaignId'] == null) {
            throw new runtime.RequiredError(
                'personalCampaignId',
                'Required parameter "personalCampaignId" was null or undefined when calling getPersonalCampaignGifts().'
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
            path: `/api/public/personal-campaigns/{personal_campaign_id}/contributions`.replace(`{${"personal_campaign_id"}}`, encodeURIComponent(String(requestParameters['personalCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => ContributionPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List gifts
     */
    async getPersonalCampaignGifts(requestParameters: GetPersonalCampaignGiftsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ContributionPaginatedResponse1> {
        const response = await this.getPersonalCampaignGiftsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List milestones
     */
    async getPersonalCampaignMilestonesRaw(requestParameters: GetPersonalCampaignMilestonesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<MilestonePaginatedResponse1>> {
        if (requestParameters['personalCampaignId'] == null) {
            throw new runtime.RequiredError(
                'personalCampaignId',
                'Required parameter "personalCampaignId" was null or undefined when calling getPersonalCampaignMilestones().'
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
            path: `/api/public/personal-campaigns/{personal_campaign_id}/milestones`.replace(`{${"personal_campaign_id"}}`, encodeURIComponent(String(requestParameters['personalCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => MilestonePaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List milestones
     */
    async getPersonalCampaignMilestones(requestParameters: GetPersonalCampaignMilestonesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<MilestonePaginatedResponse1> {
        const response = await this.getPersonalCampaignMilestonesRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Returns a poll by its ID
     * Get campaign poll by ID
     */
    async getPersonalCampaignPollbyIdRaw(requestParameters: GetPersonalCampaignPollbyIdRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<PollResponse1>> {
        if (requestParameters['pollId'] == null) {
            throw new runtime.RequiredError(
                'pollId',
                'Required parameter "pollId" was null or undefined when calling getPersonalCampaignPollbyId().'
            );
        }

        if (requestParameters['personalCampaignId'] == null) {
            throw new runtime.RequiredError(
                'personalCampaignId',
                'Required parameter "personalCampaignId" was null or undefined when calling getPersonalCampaignPollbyId().'
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
            path: `/api/public/personal-campaigns/{personal_campaign_id}/polls/{poll_id}`.replace(`{${"poll_id"}}`, encodeURIComponent(String(requestParameters['pollId']))).replace(`{${"personal_campaign_id"}}`, encodeURIComponent(String(requestParameters['personalCampaignId']))),
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
    async getPersonalCampaignPollbyId(requestParameters: GetPersonalCampaignPollbyIdRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<PollResponse1> {
        const response = await this.getPersonalCampaignPollbyIdRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List polls
     */
    async getPersonalCampaignPollsRaw(requestParameters: GetPersonalCampaignPollsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<PollPaginatedResponse1>> {
        if (requestParameters['personalCampaignId'] == null) {
            throw new runtime.RequiredError(
                'personalCampaignId',
                'Required parameter "personalCampaignId" was null or undefined when calling getPersonalCampaignPolls().'
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
            path: `/api/public/personal-campaigns/{personal_campaign_id}/polls`.replace(`{${"personal_campaign_id"}}`, encodeURIComponent(String(requestParameters['personalCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => PollPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List polls
     */
    async getPersonalCampaignPolls(requestParameters: GetPersonalCampaignPollsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<PollPaginatedResponse1> {
        const response = await this.getPersonalCampaignPollsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List rewards
     */
    async getPersonalCampaignRewardsRaw(requestParameters: GetPersonalCampaignRewardsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<RewardPaginatedResponse1>> {
        if (requestParameters['personalCampaignId'] == null) {
            throw new runtime.RequiredError(
                'personalCampaignId',
                'Required parameter "personalCampaignId" was null or undefined when calling getPersonalCampaignRewards().'
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
            path: `/api/public/personal-campaigns/{personal_campaign_id}/rewards`.replace(`{${"personal_campaign_id"}}`, encodeURIComponent(String(requestParameters['personalCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => RewardPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List rewards
     */
    async getPersonalCampaignRewards(requestParameters: GetPersonalCampaignRewardsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<RewardPaginatedResponse1> {
        const response = await this.getPersonalCampaignRewardsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List schedules
     */
    async getPersonalCampaignSchedulesRaw(requestParameters: GetPersonalCampaignSchedulesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<SchedulePaginatedResponse1>> {
        if (requestParameters['personalCampaignId'] == null) {
            throw new runtime.RequiredError(
                'personalCampaignId',
                'Required parameter "personalCampaignId" was null or undefined when calling getPersonalCampaignSchedules().'
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
            path: `/api/public/personal-campaigns/{personal_campaign_id}/schedules`.replace(`{${"personal_campaign_id"}}`, encodeURIComponent(String(requestParameters['personalCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => SchedulePaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List schedules
     */
    async getPersonalCampaignSchedules(requestParameters: GetPersonalCampaignSchedulesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<SchedulePaginatedResponse1> {
        const response = await this.getPersonalCampaignSchedulesRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List supporting campaigns
     */
    async getPersonalCampaignSupportingCampaignsRaw(requestParameters: GetPersonalCampaignSupportingCampaignsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<PersonalCampaignPaginatedResponse1>> {
        if (requestParameters['personalCampaignId'] == null) {
            throw new runtime.RequiredError(
                'personalCampaignId',
                'Required parameter "personalCampaignId" was null or undefined when calling getPersonalCampaignSupportingCampaigns().'
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
            path: `/api/public/personal-campaigns/{personal_campaign_id}/supporting_campaigns`.replace(`{${"personal_campaign_id"}}`, encodeURIComponent(String(requestParameters['personalCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => PersonalCampaignPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List supporting campaigns
     */
    async getPersonalCampaignSupportingCampaigns(requestParameters: GetPersonalCampaignSupportingCampaignsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<PersonalCampaignPaginatedResponse1> {
        const response = await this.getPersonalCampaignSupportingCampaignsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List targets
     */
    async getPersonalCampaignTargetsRaw(requestParameters: GetPersonalCampaignTargetsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<TargetPaginatedResponse1>> {
        if (requestParameters['personalCampaignId'] == null) {
            throw new runtime.RequiredError(
                'personalCampaignId',
                'Required parameter "personalCampaignId" was null or undefined when calling getPersonalCampaignTargets().'
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
            path: `/api/public/personal-campaigns/{personal_campaign_id}/targets`.replace(`{${"personal_campaign_id"}}`, encodeURIComponent(String(requestParameters['personalCampaignId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => TargetPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List targets
     */
    async getPersonalCampaignTargets(requestParameters: GetPersonalCampaignTargetsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<TargetPaginatedResponse1> {
        const response = await this.getPersonalCampaignTargetsRaw(requestParameters, initOverrides);
        return await response.value();
    }

}

/**
 * @export
 */
export const GetPersonalCampaignSupportingCampaignsStatusEnum = {
    Published: 'published',
    Retired: 'retired'
} as const;
export type GetPersonalCampaignSupportingCampaignsStatusEnum = typeof GetPersonalCampaignSupportingCampaignsStatusEnum[keyof typeof GetPersonalCampaignSupportingCampaignsStatusEnum];
