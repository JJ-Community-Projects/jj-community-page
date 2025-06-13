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
import type { DonationMatch } from './DonationMatch';
import {
    DonationMatchFromJSON,
    DonationMatchFromJSONTyped,
    DonationMatchToJSON,
    DonationMatchToJSONTyped,
} from './DonationMatch';

/**
 * 
 * @export
 * @interface Donation
 */
export interface Donation {
    /**
     * The amount donated.
     * @type {Money}
     * @memberof Donation
     */
    amount: Money;
    /**
     * ID of the campaign donated to
     * @type {string}
     * @memberof Donation
     */
    campaignId: string | null;
    /**
     * ID of the cause donated to
     * @type {string}
     * @memberof Donation
     */
    causeId: string;
    /**
     * Timestamp of when the donation was completed.
     * @type {Date}
     * @memberof Donation
     */
    completedAt: Date | null;
    /**
     * 
     * @type {Array<DonationMatch>}
     * @memberof Donation
     */
    donationMatches: Array<DonationMatch> | null;
    /**
     * Note left by donor
     * @type {string}
     * @memberof Donation
     */
    donorComment: string | null;
    /**
     * Publically visible donor name. This may be set to 'Anonymous' if the donation was anonymous or moderated.
     * @type {string}
     * @memberof Donation
     */
    donorName: string;
    /**
     * ID of the fundraising event donated to
     * @type {string}
     * @memberof Donation
     */
    fundraisingEventId: string | null;
    /**
     * Unique Identifier for the donation.
     * @type {string}
     * @memberof Donation
     */
    id: string;
    /**
     * Legacy numeric ID of the object. If your app is dependent on this field, please migrate to id. This will be deprecated in the next version of the API.
     * @type {number}
     * @memberof Donation
     * @deprecated
     */
    legacyId: number;
    /**
     * The ID for a Poll, if one was donated toward.
     * @type {string}
     * @memberof Donation
     */
    pollId: string | null;
    /**
     * The ID for a PollOption, if one was donated toward.
     * @type {string}
     * @memberof Donation
     */
    pollOptionId: string | null;
    /**
     * 
     * @type {Array<RewardClaim>}
     * @memberof Donation
     */
    rewardClaims: Array<RewardClaim> | null;
    /**
     * The ID for a Reward, if one was donated toward. Deprecated because donations may now have multiple rewards.
     * @type {string}
     * @memberof Donation
     * @deprecated
     */
    rewardId: string | null;
    /**
     * Whether or not the donation is a part of a monthly donation.
     * @type {boolean}
     * @memberof Donation
     */
    sustained: boolean | null;
    /**
     * The ID for a Target, if one was donated toward.
     * @type {string}
     * @memberof Donation
     */
    targetId: string | null;
    /**
     * The ID of a team event if it exists
     * @type {string}
     * @memberof Donation
     */
    teamEventId: string | null;
}

/**
 * Check if a given object implements the Donation interface.
 */
export function instanceOfDonation(value: object): value is Donation {
    if (!('amount' in value) || value['amount'] === undefined) return false;
    if (!('campaignId' in value) || value['campaignId'] === undefined) return false;
    if (!('causeId' in value) || value['causeId'] === undefined) return false;
    if (!('completedAt' in value) || value['completedAt'] === undefined) return false;
    if (!('donationMatches' in value) || value['donationMatches'] === undefined) return false;
    if (!('donorComment' in value) || value['donorComment'] === undefined) return false;
    if (!('donorName' in value) || value['donorName'] === undefined) return false;
    if (!('fundraisingEventId' in value) || value['fundraisingEventId'] === undefined) return false;
    if (!('id' in value) || value['id'] === undefined) return false;
    if (!('legacyId' in value) || value['legacyId'] === undefined) return false;
    if (!('pollId' in value) || value['pollId'] === undefined) return false;
    if (!('pollOptionId' in value) || value['pollOptionId'] === undefined) return false;
    if (!('rewardClaims' in value) || value['rewardClaims'] === undefined) return false;
    if (!('rewardId' in value) || value['rewardId'] === undefined) return false;
    if (!('sustained' in value) || value['sustained'] === undefined) return false;
    if (!('targetId' in value) || value['targetId'] === undefined) return false;
    if (!('teamEventId' in value) || value['teamEventId'] === undefined) return false;
    return true;
}

export function DonationFromJSON(json: any): Donation {
    return DonationFromJSONTyped(json, false);
}

export function DonationFromJSONTyped(json: any, ignoreDiscriminator: boolean): Donation {
    if (json == null) {
        return json;
    }
    return {
        
        'amount': MoneyFromJSON(json['amount']),
        'campaignId': json['campaign_id'],
        'causeId': json['cause_id'],
        'completedAt': (json['completed_at'] == null ? null : new Date(json['completed_at'])),
        'donationMatches': (json['donation_matches'] == null ? null : (json['donation_matches'] as Array<any>).map(DonationMatchFromJSON)),
        'donorComment': json['donor_comment'],
        'donorName': json['donor_name'],
        'fundraisingEventId': json['fundraising_event_id'],
        'id': json['id'],
        'legacyId': json['legacy_id'],
        'pollId': json['poll_id'],
        'pollOptionId': json['poll_option_id'],
        'rewardClaims': (json['reward_claims'] == null ? null : (json['reward_claims'] as Array<any>).map(RewardClaimFromJSON)),
        'rewardId': json['reward_id'],
        'sustained': json['sustained'],
        'targetId': json['target_id'],
        'teamEventId': json['team_event_id'],
    };
}

export function DonationToJSON(json: any): Donation {
    return DonationToJSONTyped(json, false);
}

export function DonationToJSONTyped(value?: Donation | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'amount': MoneyToJSON(value['amount']),
        'campaign_id': value['campaignId'],
        'cause_id': value['causeId'],
        'completed_at': (value['completedAt'] == null ? null : (value['completedAt'] as any).toISOString()),
        'donation_matches': (value['donationMatches'] == null ? null : (value['donationMatches'] as Array<any>).map(DonationMatchToJSON)),
        'donor_comment': value['donorComment'],
        'donor_name': value['donorName'],
        'fundraising_event_id': value['fundraisingEventId'],
        'id': value['id'],
        'legacy_id': value['legacyId'],
        'poll_id': value['pollId'],
        'poll_option_id': value['pollOptionId'],
        'reward_claims': (value['rewardClaims'] == null ? null : (value['rewardClaims'] as Array<any>).map(RewardClaimToJSON)),
        'reward_id': value['rewardId'],
        'sustained': value['sustained'],
        'target_id': value['targetId'],
        'team_event_id': value['teamEventId'],
    };
}

