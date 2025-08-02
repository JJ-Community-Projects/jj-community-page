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

import { mapValues } from '../runtime';
import type { Money } from './Money';
import {
    MoneyFromJSON,
    MoneyFromJSONTyped,
    MoneyToJSON,
    MoneyToJSONTyped,
} from './Money';
import type { RewardClaim } from './RewardClaim';
import {
    RewardClaimFromJSON,
    RewardClaimFromJSONTyped,
    RewardClaimToJSON,
    RewardClaimToJSONTyped,
} from './RewardClaim';
import type { GiftMatch } from './GiftMatch';
import {
    GiftMatchFromJSON,
    GiftMatchFromJSONTyped,
    GiftMatchToJSON,
    GiftMatchToJSONTyped,
} from './GiftMatch';

/**
 * 
 * @export
 * @interface Contribution
 */
export interface Contribution {
    /**
     * The amount donated.
     * @type {Money}
     * @memberof Contribution
     */
    amount: Money;
    /**
     * Timestamp of when the contribution was completed.
     * @type {Date}
     * @memberof Contribution
     */
    completedAt: Date | null;
    /**
     * Note left by donor
     * @type {string}
     * @memberof Contribution
     */
    donorComment: string | null;
    /**
     * Publically visible donor name. This may be set to 'Anonymous' if the contribution was anonymous or moderated.
     * @type {string}
     * @memberof Contribution
     */
    donorName: string;
    /**
     * The list of matches consumed by this contribution
     * @type {Array<GiftMatch>}
     * @memberof Contribution
     */
    giftMatches: Array<GiftMatch>;
    /**
     * Unique Identifier for the contribution.
     * @type {string}
     * @memberof Contribution
     */
    id: string;
    /**
     * Whether or not the contribution is the result of a GiftMatch
     * @type {boolean}
     * @memberof Contribution
     */
    isMatch: boolean;
    /**
     * ID of the campaign donated to
     * @type {string}
     * @memberof Contribution
     */
    personalCampaignId: string | null;
    /**
     * The ID for a Poll, if one was donated toward.
     * @type {string}
     * @memberof Contribution
     */
    pollId: string | null;
    /**
     * The ID for a PollOption, if one was donated toward.
     * @type {string}
     * @memberof Contribution
     */
    pollOptionId: string | null;
    /**
     * 
     * @type {Array<RewardClaim>}
     * @memberof Contribution
     */
    rewardClaims: Array<RewardClaim> | null;
    /**
     * The ID for a Target, if one was donated toward.
     * @type {string}
     * @memberof Contribution
     */
    targetId: string | null;
}

/**
 * Check if a given object implements the Contribution interface.
 */
export function instanceOfContribution(value: object): value is Contribution {
    if (!('amount' in value) || value['amount'] === undefined) return false;
    if (!('completedAt' in value) || value['completedAt'] === undefined) return false;
    if (!('donorComment' in value) || value['donorComment'] === undefined) return false;
    if (!('donorName' in value) || value['donorName'] === undefined) return false;
    if (!('giftMatches' in value) || value['giftMatches'] === undefined) return false;
    if (!('id' in value) || value['id'] === undefined) return false;
    if (!('isMatch' in value) || value['isMatch'] === undefined) return false;
    if (!('personalCampaignId' in value) || value['personalCampaignId'] === undefined) return false;
    if (!('pollId' in value) || value['pollId'] === undefined) return false;
    if (!('pollOptionId' in value) || value['pollOptionId'] === undefined) return false;
    if (!('rewardClaims' in value) || value['rewardClaims'] === undefined) return false;
    if (!('targetId' in value) || value['targetId'] === undefined) return false;
    return true;
}

export function ContributionFromJSON(json: any): Contribution {
    return ContributionFromJSONTyped(json, false);
}

export function ContributionFromJSONTyped(json: any, ignoreDiscriminator: boolean): Contribution {
    if (json == null) {
        return json;
    }
    return {
        
        'amount': MoneyFromJSON(json['amount']),
        'completedAt': (json['completed_at'] == null ? null : new Date(json['completed_at'])),
        'donorComment': json['donor_comment'],
        'donorName': json['donor_name'],
        'giftMatches': ((json['gift_matches'] as Array<any>).map(GiftMatchFromJSON)),
        'id': json['id'],
        'isMatch': json['is_match'],
        'personalCampaignId': json['personal_campaign_id'],
        'pollId': json['poll_id'],
        'pollOptionId': json['poll_option_id'],
        'rewardClaims': (json['reward_claims'] == null ? null : (json['reward_claims'] as Array<any>).map(RewardClaimFromJSON)),
        'targetId': json['target_id'],
    };
}

export function ContributionToJSON(json: any): Contribution {
    return ContributionToJSONTyped(json, false);
}

export function ContributionToJSONTyped(value?: Contribution | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'amount': MoneyToJSON(value['amount']),
        'completed_at': (value['completedAt'] == null ? null : (value['completedAt'] as any).toISOString()),
        'donor_comment': value['donorComment'],
        'donor_name': value['donorName'],
        'gift_matches': ((value['giftMatches'] as Array<any>).map(GiftMatchToJSON)),
        'id': value['id'],
        'is_match': value['isMatch'],
        'personal_campaign_id': value['personalCampaignId'],
        'poll_id': value['pollId'],
        'poll_option_id': value['pollOptionId'],
        'reward_claims': (value['rewardClaims'] == null ? null : (value['rewardClaims'] as Array<any>).map(RewardClaimToJSON)),
        'target_id': value['targetId'],
    };
}

