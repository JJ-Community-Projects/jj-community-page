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
import type { Team } from './Team';
import {
    TeamFromJSON,
    TeamFromJSONTyped,
    TeamToJSON,
    TeamToJSONTyped,
} from './Team';
import type { Image } from './Image';
import {
    ImageFromJSON,
    ImageFromJSONTyped,
    ImageToJSON,
    ImageToJSONTyped,
} from './Image';
import type { TeamCampaignLivestream } from './TeamCampaignLivestream';
import {
    TeamCampaignLivestreamFromJSON,
    TeamCampaignLivestreamFromJSONTyped,
    TeamCampaignLivestreamToJSON,
    TeamCampaignLivestreamToJSONTyped,
} from './TeamCampaignLivestream';

/**
 * 
 * @export
 * @interface TeamCampaign
 */
export interface TeamCampaign {
    /**
     * The amount raised directly by this team campaign
     * @type {Money}
     * @memberof TeamCampaign
     */
    amountRaised: Money;
    /**
     * 
     * @type {Image}
     * @memberof TeamCampaign
     */
    avatar: Image | null;
    /**
     * The currency code used by this team campaign.
     * @type {string}
     * @memberof TeamCampaign
     */
    currencyCode: string;
    /**
     * A short description about this team campaign
     * @type {string}
     * @memberof TeamCampaign
     */
    description: string | null;
    /**
     * This is the donate url for the team campaign.
     * @type {string}
     * @memberof TeamCampaign
     */
    donateUrl: string;
    /**
     * The current goal of the team campaign
     * @type {Money}
     * @memberof TeamCampaign
     */
    goal: Money | null;
    /**
     * Whether or not this campaign has schedule items
     * @type {boolean}
     * @memberof TeamCampaign
     */
    hasSchedule: boolean;
    /**
     * Unique Identifier for the Object. UUID
     * @type {string}
     * @memberof TeamCampaign
     */
    id: string;
    /**
     * When the team campaign was created
     * @type {Date}
     * @memberof TeamCampaign
     */
    insertedAt: Date;
    /**
     * Legacy numeric ID of the object. If your app is dependent on this field, please migrate to id. This will be deprecated in the next version of the API.
     * @type {number}
     * @memberof TeamCampaign
     * @deprecated
     */
    legacyId: number;
    /**
     * 
     * @type {TeamCampaignLivestream}
     * @memberof TeamCampaign
     */
    livestream: TeamCampaignLivestream | null;
    /**
     * The name of this team campaign
     * @type {string}
     * @memberof TeamCampaign
     */
    name: string;
    /**
     * The original goal of the campaign
     * @type {Money}
     * @memberof TeamCampaign
     */
    originalGoal: Money;
    /**
     * When the team campaign was last published
     * @type {Date}
     * @memberof TeamCampaign
     */
    publishedAt: Date;
    /**
     * When the team campaign was retired
     * @type {Date}
     * @memberof TeamCampaign
     */
    retiredAt: Date | null;
    /**
     * This is a url slug used for the given resource.
     * @type {string}
     * @memberof TeamCampaign
     */
    slug: string;
    /**
     * The status of this campaign
     * @type {string}
     * @memberof TeamCampaign
     */
    status: TeamCampaignStatusEnum;
    /**
     * The amount raised by this campaign and all supporting campaigns
     * @type {string}
     * @memberof TeamCampaign
     */
    supportable: TeamCampaignSupportableEnum;
    /**
     * The amount raised by any supporting campaigns
     * @type {Money}
     * @memberof TeamCampaign
     */
    supportingAmountRaised: Money;
    /**
     * The Team that owns this campaign.
     * @type {Team}
     * @memberof TeamCampaign
     */
    team: Team | null;
    /**
     * The ID for a Team that owns this campaign.
     * @type {string}
     * @memberof TeamCampaign
     */
    teamId: string | null;
    /**
     * The amount raised by this team campaign and all supporting campaigns
     * @type {Money}
     * @memberof TeamCampaign
     */
    totalAmountRaised: Money;
    /**
     * When the team campaign details were last updated
     * @type {Date}
     * @memberof TeamCampaign
     */
    updatedAt: Date;
    /**
     * This is the full url for the team campaign.
     * @type {string}
     * @memberof TeamCampaign
     */
    url: string;
}


/**
 * @export
 */
export const TeamCampaignStatusEnum = {
    Unpublished: 'unpublished',
    Published: 'published',
    Retired: 'retired'
} as const;
export type TeamCampaignStatusEnum = typeof TeamCampaignStatusEnum[keyof typeof TeamCampaignStatusEnum];

/**
 * @export
 */
export const TeamCampaignSupportableEnum = {
    None: 'none',
    Public: 'public',
    Private: 'private',
    InviteOnly: 'invite_only'
} as const;
export type TeamCampaignSupportableEnum = typeof TeamCampaignSupportableEnum[keyof typeof TeamCampaignSupportableEnum];


/**
 * Check if a given object implements the TeamCampaign interface.
 */
export function instanceOfTeamCampaign(value: object): value is TeamCampaign {
    if (!('amountRaised' in value) || value['amountRaised'] === undefined) return false;
    if (!('avatar' in value) || value['avatar'] === undefined) return false;
    if (!('currencyCode' in value) || value['currencyCode'] === undefined) return false;
    if (!('description' in value) || value['description'] === undefined) return false;
    if (!('donateUrl' in value) || value['donateUrl'] === undefined) return false;
    if (!('goal' in value) || value['goal'] === undefined) return false;
    if (!('hasSchedule' in value) || value['hasSchedule'] === undefined) return false;
    if (!('id' in value) || value['id'] === undefined) return false;
    if (!('insertedAt' in value) || value['insertedAt'] === undefined) return false;
    if (!('legacyId' in value) || value['legacyId'] === undefined) return false;
    if (!('livestream' in value) || value['livestream'] === undefined) return false;
    if (!('name' in value) || value['name'] === undefined) return false;
    if (!('originalGoal' in value) || value['originalGoal'] === undefined) return false;
    if (!('publishedAt' in value) || value['publishedAt'] === undefined) return false;
    if (!('retiredAt' in value) || value['retiredAt'] === undefined) return false;
    if (!('slug' in value) || value['slug'] === undefined) return false;
    if (!('status' in value) || value['status'] === undefined) return false;
    if (!('supportable' in value) || value['supportable'] === undefined) return false;
    if (!('supportingAmountRaised' in value) || value['supportingAmountRaised'] === undefined) return false;
    if (!('team' in value) || value['team'] === undefined) return false;
    if (!('teamId' in value) || value['teamId'] === undefined) return false;
    if (!('totalAmountRaised' in value) || value['totalAmountRaised'] === undefined) return false;
    if (!('updatedAt' in value) || value['updatedAt'] === undefined) return false;
    if (!('url' in value) || value['url'] === undefined) return false;
    return true;
}

export function TeamCampaignFromJSON(json: any): TeamCampaign {
    return TeamCampaignFromJSONTyped(json, false);
}

export function TeamCampaignFromJSONTyped(json: any, ignoreDiscriminator: boolean): TeamCampaign {
    if (json == null) {
        return json;
    }
    return {
        
        'amountRaised': MoneyFromJSON(json['amount_raised']),
        'avatar': ImageFromJSON(json['avatar']),
        'currencyCode': json['currency_code'],
        'description': json['description'],
        'donateUrl': json['donate_url'],
        'goal': MoneyFromJSON(json['goal']),
        'hasSchedule': json['has_schedule'],
        'id': json['id'],
        'insertedAt': (new Date(json['inserted_at'])),
        'legacyId': json['legacy_id'],
        'livestream': TeamCampaignLivestreamFromJSON(json['livestream']),
        'name': json['name'],
        'originalGoal': MoneyFromJSON(json['original_goal']),
        'publishedAt': (new Date(json['published_at'])),
        'retiredAt': (json['retired_at'] == null ? null : new Date(json['retired_at'])),
        'slug': json['slug'],
        'status': json['status'],
        'supportable': json['supportable'],
        'supportingAmountRaised': MoneyFromJSON(json['supporting_amount_raised']),
        'team': TeamFromJSON(json['team']),
        'teamId': json['team_id'],
        'totalAmountRaised': MoneyFromJSON(json['total_amount_raised']),
        'updatedAt': (new Date(json['updated_at'])),
        'url': json['url'],
    };
}

export function TeamCampaignToJSON(json: any): TeamCampaign {
    return TeamCampaignToJSONTyped(json, false);
}

export function TeamCampaignToJSONTyped(value?: TeamCampaign | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'amount_raised': MoneyToJSON(value['amountRaised']),
        'avatar': ImageToJSON(value['avatar']),
        'currency_code': value['currencyCode'],
        'description': value['description'],
        'donate_url': value['donateUrl'],
        'goal': MoneyToJSON(value['goal']),
        'has_schedule': value['hasSchedule'],
        'id': value['id'],
        'inserted_at': ((value['insertedAt']).toISOString()),
        'legacy_id': value['legacyId'],
        'livestream': TeamCampaignLivestreamToJSON(value['livestream']),
        'name': value['name'],
        'original_goal': MoneyToJSON(value['originalGoal']),
        'published_at': ((value['publishedAt']).toISOString()),
        'retired_at': (value['retiredAt'] == null ? null : (value['retiredAt'] as any).toISOString()),
        'slug': value['slug'],
        'status': value['status'],
        'supportable': value['supportable'],
        'supporting_amount_raised': MoneyToJSON(value['supportingAmountRaised']),
        'team': TeamToJSON(value['team']),
        'team_id': value['teamId'],
        'total_amount_raised': MoneyToJSON(value['totalAmountRaised']),
        'updated_at': ((value['updatedAt']).toISOString()),
        'url': value['url'],
    };
}

