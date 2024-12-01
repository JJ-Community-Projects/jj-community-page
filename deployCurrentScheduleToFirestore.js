import fs from 'fs';
import yaml from 'js-yaml'
import admin from 'firebase-admin';
import serviceAccount from './jingle-jam-firebase-adminsdk.json' assert {type: 'json'};
import {DateTime} from "luxon";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

async function main() {

    // log current directory
    console.log(`Current directory: ${process.cwd()}`);

    const year = 2024;
    await update(year);
}

async function update(year) {

    const now = DateTime.now().setZone('Europe/London');
    try {
        const db = admin.firestore();

        // Read the YAML file
        const fileContents = fs.readFileSync(`./src/content/schedules/${year}.yaml`, 'utf8');

        // Parse the YAML file
        const scheduleData = yaml.load(fileContents);

        const times = scheduleData.times.map(time => {
            return {
                start: time.start.toISOString(),
                end: time.end.toISOString(),
            }
        })

        const schedule = {
            ...scheduleData,
            times,
            weeks: scheduleData.weeks.map(week => {
                return {
                    ...week,
                    days: week.days.map(day => {
                        const path = `./src/content/scheduleDays/${day}.yaml`
                        const dayData = yaml.load(fs.readFileSync(path, 'utf8'));
                        const date = dayData.date
                        const streams = dayData.streams.map(stream => {
                            /*
                            const creators = stream.creators.map(creator => {
                                const path = `src/content/creators/${creator}.yaml`
                                const creatorData = yaml.load(fs.readFileSync(path, 'utf8'));
                                let twitchUser = null;

                                const twitchUserPath = `src/content/twitchUsers/${creatorData.twitch}.yaml`
                                if (fs.existsSync(twitchUserPath)) {
                                    const yaml = fs.readFileSync(twitchUserPath, 'utf8');
                                    twitchUser = yaml.load(yaml);
                                }
                                return {
                                    ...creatorData,
                                    twitchUser
                                }
                            })*/
                            const creators = stream.creators
                            creators.sort()
                            return {...stream, creators}
                        })
                        return {
                            date,
                            streams
                        }
                    })
                }
            })
        }

        const twitchExtensionSchedule = fullScheduleToTESSchedule(schedule)

        console.log(JSON.stringify(twitchExtensionSchedule, null, 2))
        await db.collection('Schedules').doc(`${year}`).set(
            {...schedule, updatedAt: now.toISO()}
        )
        await db.collection('ExtensionSchedules').doc(`${year}`).set(
            {...twitchExtensionSchedule, updatedAt: now.toISO()}
        )
    } catch (e) {
        console.log(e);
    }
}


// region twitch extension schedule data
function fullScheduleToTESSchedule(fullSchedule) {
    const fullDays = fullSchedule.weeks.flatMap(week => week.days)
    const days = fullDays.map(fullDayToTESDay)
    return {
        title: fullSchedule.title,
        days
    }
}

function fullDayToTESDay(fullDay) {
    const streams = fullDay.streams.map(fullStreamToTESStream)
    return {
        date: fullDay.date,
        streams
    }
}

function fullStreamToTESStream(fullStream) {
    return {
        title: fullStream.title,
        subtitle: fullStream.subtitle,
        description: fullStream.description ?? '',
        start: fullStream.start,
        end: fullStream.end,
        twitchVods: twitchVodsFromStream(fullStream),
        creators: creators(fullStream),
        style: {
            background: {
                colors: fullStream.style.background.colors,
                orientation: fullStream.style.background.orientation
            }
        }
    }
}

function twitchVodsFromStream(stream) {
    return stream.vods?.filter((vod) => vod.type === 'twitch')
        .map(vod => {
            return {
                label: vod.label ?? 'VOD',
                url: vod.link
            }
        }) ?? []
}

function creators(stream) {
    console.log('stream', stream)
    let creators = stream.creators?.map(creator => {
        console.log('creator',creator)
        const path = `./src/content/creators/${creator}.yaml`
        const creatorData = yaml.load(fs.readFileSync(path, 'utf8'));
        const name = creatorData.name
        if (!creatorData.twitchUser) {
            // return undefined
        }
        let twitchUser = null;
        if (creatorData.twitchUser) {
            const twitchUserPath = `./src/content/twitchUser/${creatorData.twitchUser}.yaml`
            if (fs.existsSync(twitchUserPath)) {
                twitchUser = yaml.load(fs.readFileSync(twitchUserPath, 'utf8'));
            }
        }

        if (!twitchUser?.login) {
            console.log(`No twitch user for ${creatorData.name}`)
        }

        let label = name // twitchUser?.login ?? creatorData.name
        if (creator === 'lewis') {
            label = name
        }
        const color = creatorData?.style?.primaryColor ?? '#3584BF'

        const imageUrl = twitchUser?.profile_image_url ?? creatorData?.profileImage?.small

        console.log(label, twitchUser)

        const data = {
            id: creator,
            label: label,
            color: color,
            url: twitchUser ? `http://twitch.tv/${twitchUser?.login}` :
                'http://twitch.tv/yogscast',
        }

        if (imageUrl) {
            data['imageUrl'] = imageUrl
        }

        return data
    })?.filter(c => c != undefined) ?? []

    creators.sort((a, b) => {
        return a.label.localeCompare(b.label)
    })

    return creators
}

// endregion

// region jj cron
// eslint-disable-next-line require-jsdoc
export async function jjJob() {
    const fs = admin.firestore();

    // const url = "https://develop.jingle-jam-tracker.pages.dev/api/tiltify";
    const url = "https://dashboard.jinglejam.co.uk/api/tiltify";
    const {jjData, fundraiserData} = await getYogsApiData(url);
    const batch = fs.batch();
    const jjDonationTrackerDoc = fs.collection("JJDonationTracker")
        .doc("2024");
    const jjFundraiserDoc = fs.collection("Fundraiser")
        .doc("2024");
    // batch.set(jjDonationTrackerDoc, jjData);
    batch.set(jjFundraiserDoc, fundraiserData);
    await batch.commit();
    return Promise.resolve();
}

// eslint-disable-next-line require-jsdoc
export async function getYogsApiData(url) {
    let data = undefined;
    try {
        const response = await fetch(url); // await axios.get(url);
        data = await response.json();
    } catch (e) {
        console.error(e);
        return {};
    }
    if (!data) {
        return {};
    }
    const date = data["date"];
    const event = data["event"];
    const avgConversionRate = data["avgConversionRate"];
    const raised = data["raised"];
    const collections = data["collections"];
    const donations = data["donations"];
    const causes = data["causes"];
    const campaigns = data["campaigns"];
    let campaignList = campaigns["list"];
    campaignList.sort((a, b) => b["raised"] - a["raised"]);
    campaignList = campaignList.slice(1, 51);
    const twitchNames = campaignList
        .filter((x) => x["livestream"]["type"] === "twitch")
        .filter((x) => x["livestream"]["channel"])
        .map((x) => {
            const c = x["livestream"]["channel"]?.toLowerCase();
            const user = x["user"]["slug"];
            /*
            if (c === "yogscast") {
                switch (user) {
                    case "crustydoggo":
                        x["livestream"]["channel"] = "kirsty";
                        break;
                    case "pedguin":
                        x["livestream"]["channel"] = "pedguin";
                        break;
                    case "inthelittlewood":
                        x["livestream"]["channel"] = "inthelittlewood";
                        break;
                    case "potatomcwhiskey":
                        x["livestream"]["channel"] = "potatomcwhiskey";
                        break;
                }
            }*/
            return x;
        })
        .map((x) => x["livestream"]["channel"]?.toLowerCase())
        .filter((x) => x !== null);

    let twitchDataM = {};
    if (twitchNames.length > 0) {
        const channels = await getChannels(twitchNames);
        twitchDataM = channels.reduce((acc, d) => {
            acc[d["login"]] = d;
            return acc;
        }, {});
    }
    const streams = await getStreams(twitchNames);
    const liveChannelNames = streams.map((s) => s.user_login);

    const causesNew = causes.map((cause) => {
        const yogscast = cause["raised"]["yogscast"];
        const fundraisers = cause["raised"]["fundraisers"];
        cause["raised"]["fundraisers"] = yogscast + fundraisers;
        cause["raised"]["yogscast"] = yogscast + fundraisers;
        return cause;
    });

    const newCampaignListWithTwitch = campaignList.map((campaign) => {
        let a;
        if (campaign["livestream"]["type"] === "twitch") {
            a = {...campaign, isLive: false};
            const name = campaign["livestream"]["channel"]?.toLowerCase();
            if (name in twitchDataM) {
                a["isLive"] = liveChannelNames.includes(name);
                const twitchData = twitchDataM[name];
                a["twitch_data"] = {
                    "display_name": twitchData["display_name"],
                    "login": twitchData["login"],
                    "profile_image_url": twitchData["profile_image_url"],
                };
            }
        } else {
            a = {...campaign, isLive: false};
        }
        return a;
    });
    console.log("newCampaignListWithTwitch", newCampaignListWithTwitch.length);

    newCampaignListWithTwitch.sort((a, b) => {
        if (a.isLive && b.isLive) {
            return b.amount - a.amount;
        } else if (a.isLive) {
            return -1;
        } else if (b.isLive) {
            return 1;
        }
        return b.amount - a.amount;
    });
    const liveChannel = newCampaignListWithTwitch.filter((c) => c.isLive);
    const yogsLiveChannel = liveChannel
        .filter((c) => c["livestream"]["channel"] === "yogscast");
    const notYogsLiveChannel = liveChannel
        .filter((c) => c["livestream"]["channel"] !== "yogscast");

    const notLiveChannel = newCampaignListWithTwitch.filter((c) => !c.isLive);
    const newCampaignList = [
        ...notYogsLiveChannel,
        ...yogsLiveChannel,
        ...notLiveChannel,
    ];

    newCampaignList.sort((a, b) => {
        if (a.isLive && b.isLive) {
            return b.amount - a.amount;
        } else if (a.isLive) {
            return -1;
        } else if (b.isLive) {
            return 1;
        }
        return b.amount - a.amount;
    });
    const jjData = {
        date,
        avgConversionRate,
        causes: causesNew,
        donations,
        collections,
        raised,
        event,
    };

    const newNewCampaignList = []

    // remove duplicates from newCampaignList
    /*newCampaignList.forEach((campaign) => {
        const campaignIndex = newNewCampaignList.findIndex((c) => c["causeId"] === campaign["causeId"]);
        if (campaignIndex === -1) {
            newNewCampaignList.push(campaign)
        }
    })*/

    const fundraiserData = {
        date,
        avgConversionRate,
        campaigns: newCampaignList,
    };
    return {jjData, fundraiserData, data};
}

const CLIENT_ID = "enowqm8dsfru38ts1iy5094webwgrl";
const SECRET = "yc31xnfvcjpjqeioi9eh8h0ehlrl1y";

// eslint-disable-next-line require-jsdoc
function replaceChannelName(channelName) {
    if (!channelName) {
        return channelName;
    }

    channelName = channelName.replace("https://", "");
    channelName = channelName.replace("http://", "");
    channelName = channelName.replace("twitch.tv/", "");
    channelName = channelName.replace("www.", "");
    channelName = channelName.replace("Twitch.tv/", "");
    channelName = channelName.replace("/stream-manager", "");
    channelName = channelName.replace("dashboard.u/", "");

    if (channelName === "rtgamecrowd") {
        channelName = "rtgame";
    }

    return channelName;
}

// eslint-disable-next-line require-jsdoc,max-len
async function getChannels(channelNames, headers) {
    if (!headers) {
        headers = await getHeader();
    }
    console.log(headers);

    const batchSize = 100;
    const numBatches = Math.ceil(channelNames.length / batchSize);
    const allData = [];

    for (let i = 0; i < numBatches; i++) {
        try {
            const start = i * batchSize;
            const end = (i + 1) * batchSize;
            const currentBatch = channelNames.slice(start, end);
            const queryString = currentBatch
                .map((x) => `login=${replaceChannelName(x)}`).join("&");
            const url = `https://api.twitch.tv/helix/users?${queryString}`;
            const resp = await fetch(url, {
                headers,
            }); // await axios.get(url, {headers});
            const data = (await resp.json()).data;
            allData.push(...data);
        } catch (e) {
            console.error(e);
        }
    }

    return allData;
}

async function getStreams(channelNames, headers) {
    if (!headers) {
        headers = await getHeader();
    }
    console.log(headers);

    const batchSize = 100;
    const numBatches = Math.ceil(channelNames.length / batchSize);
    const allData = [];

    for (let i = 0; i < numBatches; i++) {
        try {
            const start = i * batchSize;
            const end = (i + 1) * batchSize;
            const currentBatch = channelNames.slice(start, end);
            const queryString = currentBatch
                .map((name) => `user_login=${replaceChannelName(name)}`).join("&");
            const url = `https://api.twitch.tv/helix/streams?${queryString}`;
            const resp = await fetch(url, {headers});
            const data = (await resp.json()).data; // Access the 'data' property
            allData.push(...data);
        } catch (e) {
            console.error(e);
        }
    }

    return allData;
}

// eslint-disable-next-line require-jsdoc,max-len
async function getAppTokenFrom(clientId, secret) {
    const url = `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${secret}&grant_type=client_credentials`;
    const resp = await fetch(url, {
        method: "POST",
    }); // await axios.post(url);
    const jsonResp = await resp.json()
    return jsonResp["access_token"];
}

async function getHeader() {
    const token = await getAppTokenFrom(CLIENT_ID, SECRET);
    return {
        "Client-ID": CLIENT_ID,
        "Authorization": `Bearer ${token}`,
    };
}

// endregion



main()
//jjJob()
async function test() {
    const url = "https://dashboard.jinglejam.co.uk/api/tiltify";
    const data = await getYogsApiData(url)
    console.log(data.fundraiserData.campaigns)
}

//test()
