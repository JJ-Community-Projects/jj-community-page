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
  AuctionBidPaginatedResponse1,
  AuctionHouseResponse1,
  AuctionItemPaginatedResponse1,
  AuctionItemResponse1,
  NotFound,
  Unauthorized,
  UnprocessableEntity,
} from '../models';
import {
    AuctionBidPaginatedResponse1FromJSON,
    AuctionBidPaginatedResponse1ToJSON,
    AuctionHouseResponse1FromJSON,
    AuctionHouseResponse1ToJSON,
    AuctionItemPaginatedResponse1FromJSON,
    AuctionItemPaginatedResponse1ToJSON,
    AuctionItemResponse1FromJSON,
    AuctionItemResponse1ToJSON,
    NotFoundFromJSON,
    NotFoundToJSON,
    UnauthorizedFromJSON,
    UnauthorizedToJSON,
    UnprocessableEntityFromJSON,
    UnprocessableEntityToJSON,
} from '../models';

export interface GetAuctionHouseRequest {
    auctionHouseId: string;
}

export interface GetAuctionHouseAuctionItemAuctionBidsRequest {
    auctionHouseId: string;
    auctionItemId: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface GetAuctionHouseAuctionItemByIdRequest {
    auctionHouseId: string;
    auctionItemId: string;
}

export interface GetAuctionHouseAuctionItemsRequest {
    auctionHouseId: string;
    createdBefore?: string;
    createdAfter?: string;
    updatedBefore?: string;
    updatedAfter?: string;
    status?: string;
    after?: string;
    before?: string;
    limit?: number;
}

export interface V5ApiWebPublicAuctionHouseControllerShowCauseSlugRequest {
    causeSlug: string;
    auctionHouseSlug: string;
}

export interface V5ApiWebPublicAuctionHouseControllerShowUserSlugRequest {
    userSlug: string;
    auctionHouseSlug: string;
}

/**
 *
 */
export class AuctionHouseApi extends runtime.BaseAPI {

    /**
     * Returns a auction house by its ID
     * Get by ID
     */
    async getAuctionHouseRaw(requestParameters: GetAuctionHouseRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<AuctionHouseResponse1>> {
        if (requestParameters['auctionHouseId'] == null) {
            throw new runtime.RequiredError(
                'auctionHouseId',
                'Required parameter "auctionHouseId" was null or undefined when calling getAuctionHouse().'
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
            path: `/api/public/auction_houses/{auction_house_id}`.replace(`{${"auction_house_id"}}`, encodeURIComponent(String(requestParameters['auctionHouseId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => AuctionHouseResponse1FromJSON(jsonValue));
    }

    /**
     * Returns a auction house by its ID
     * Get by ID
     */
    async getAuctionHouse(requestParameters: GetAuctionHouseRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<AuctionHouseResponse1> {
        const response = await this.getAuctionHouseRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List auction bids for an auction item
     */
    async getAuctionHouseAuctionItemAuctionBidsRaw(requestParameters: GetAuctionHouseAuctionItemAuctionBidsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<AuctionBidPaginatedResponse1>> {
        if (requestParameters['auctionHouseId'] == null) {
            throw new runtime.RequiredError(
                'auctionHouseId',
                'Required parameter "auctionHouseId" was null or undefined when calling getAuctionHouseAuctionItemAuctionBids().'
            );
        }

        if (requestParameters['auctionItemId'] == null) {
            throw new runtime.RequiredError(
                'auctionItemId',
                'Required parameter "auctionItemId" was null or undefined when calling getAuctionHouseAuctionItemAuctionBids().'
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
            path: `/api/public/auction_houses/{auction_house_id}/auction_items/{auction_item_id}/auction_bids`.replace(`{${"auction_house_id"}}`, encodeURIComponent(String(requestParameters['auctionHouseId']))).replace(`{${"auction_item_id"}}`, encodeURIComponent(String(requestParameters['auctionItemId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => AuctionBidPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List auction bids for an auction item
     */
    async getAuctionHouseAuctionItemAuctionBids(requestParameters: GetAuctionHouseAuctionItemAuctionBidsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<AuctionBidPaginatedResponse1> {
        const response = await this.getAuctionHouseAuctionItemAuctionBidsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Returns a auction item by its ID
     * Get auction house auction item by ID
     */
    async getAuctionHouseAuctionItemByIdRaw(requestParameters: GetAuctionHouseAuctionItemByIdRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<AuctionItemResponse1>> {
        if (requestParameters['auctionHouseId'] == null) {
            throw new runtime.RequiredError(
                'auctionHouseId',
                'Required parameter "auctionHouseId" was null or undefined when calling getAuctionHouseAuctionItemById().'
            );
        }

        if (requestParameters['auctionItemId'] == null) {
            throw new runtime.RequiredError(
                'auctionItemId',
                'Required parameter "auctionItemId" was null or undefined when calling getAuctionHouseAuctionItemById().'
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
            path: `/api/public/auction_houses/{auction_house_id}/auction_items/{auction_item_id}`.replace(`{${"auction_house_id"}}`, encodeURIComponent(String(requestParameters['auctionHouseId']))).replace(`{${"auction_item_id"}}`, encodeURIComponent(String(requestParameters['auctionItemId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => AuctionItemResponse1FromJSON(jsonValue));
    }

    /**
     * Returns a auction item by its ID
     * Get auction house auction item by ID
     */
    async getAuctionHouseAuctionItemById(requestParameters: GetAuctionHouseAuctionItemByIdRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<AuctionItemResponse1> {
        const response = await this.getAuctionHouseAuctionItemByIdRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * List auction items
     */
    async getAuctionHouseAuctionItemsRaw(requestParameters: GetAuctionHouseAuctionItemsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<AuctionItemPaginatedResponse1>> {
        if (requestParameters['auctionHouseId'] == null) {
            throw new runtime.RequiredError(
                'auctionHouseId',
                'Required parameter "auctionHouseId" was null or undefined when calling getAuctionHouseAuctionItems().'
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
            path: `/api/public/auction_houses/{auction_house_id}/auction_items`.replace(`{${"auction_house_id"}}`, encodeURIComponent(String(requestParameters['auctionHouseId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => AuctionItemPaginatedResponse1FromJSON(jsonValue));
    }

    /**
     * List auction items
     */
    async getAuctionHouseAuctionItems(requestParameters: GetAuctionHouseAuctionItemsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<AuctionItemPaginatedResponse1> {
        const response = await this.getAuctionHouseAuctionItemsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Returns an auction house by its cause slug and auction house slug
     * Get auction house by cause slug and auction house slug
     */
    async v5ApiWebPublicAuctionHouseControllerShowCauseSlugRaw(requestParameters: V5ApiWebPublicAuctionHouseControllerShowCauseSlugRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<AuctionHouseResponse1>> {
        if (requestParameters['causeSlug'] == null) {
            throw new runtime.RequiredError(
                'causeSlug',
                'Required parameter "causeSlug" was null or undefined when calling v5ApiWebPublicAuctionHouseControllerShowCauseSlug().'
            );
        }

        if (requestParameters['auctionHouseSlug'] == null) {
            throw new runtime.RequiredError(
                'auctionHouseSlug',
                'Required parameter "auctionHouseSlug" was null or undefined when calling v5ApiWebPublicAuctionHouseControllerShowCauseSlug().'
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
            path: `/api/public/auction_houses/by/cause/slugs/{cause_slug}/{auction_house_slug}`.replace(`{${"cause_slug"}}`, encodeURIComponent(String(requestParameters['causeSlug']))).replace(`{${"auction_house_slug"}}`, encodeURIComponent(String(requestParameters['auctionHouseSlug']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => AuctionHouseResponse1FromJSON(jsonValue));
    }

    /**
     * Returns an auction house by its cause slug and auction house slug
     * Get auction house by cause slug and auction house slug
     */
    async v5ApiWebPublicAuctionHouseControllerShowCauseSlug(requestParameters: V5ApiWebPublicAuctionHouseControllerShowCauseSlugRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<AuctionHouseResponse1> {
        const response = await this.v5ApiWebPublicAuctionHouseControllerShowCauseSlugRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Returns an auction house by its user slug and auction house slug
     * Get auction house by user slug and auction house slug
     */
    async v5ApiWebPublicAuctionHouseControllerShowUserSlugRaw(requestParameters: V5ApiWebPublicAuctionHouseControllerShowUserSlugRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<AuctionHouseResponse1>> {
        if (requestParameters['userSlug'] == null) {
            throw new runtime.RequiredError(
                'userSlug',
                'Required parameter "userSlug" was null or undefined when calling v5ApiWebPublicAuctionHouseControllerShowUserSlug().'
            );
        }

        if (requestParameters['auctionHouseSlug'] == null) {
            throw new runtime.RequiredError(
                'auctionHouseSlug',
                'Required parameter "auctionHouseSlug" was null or undefined when calling v5ApiWebPublicAuctionHouseControllerShowUserSlug().'
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
            path: `/api/public/auction_houses/by/user/slugs/{user_slug}/{auction_house_slug}`.replace(`{${"user_slug"}}`, encodeURIComponent(String(requestParameters['userSlug']))).replace(`{${"auction_house_slug"}}`, encodeURIComponent(String(requestParameters['auctionHouseSlug']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => AuctionHouseResponse1FromJSON(jsonValue));
    }

    /**
     * Returns an auction house by its user slug and auction house slug
     * Get auction house by user slug and auction house slug
     */
    async v5ApiWebPublicAuctionHouseControllerShowUserSlug(requestParameters: V5ApiWebPublicAuctionHouseControllerShowUserSlugRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<AuctionHouseResponse1> {
        const response = await this.v5ApiWebPublicAuctionHouseControllerShowUserSlugRaw(requestParameters, initOverrides);
        return await response.value();
    }

}
