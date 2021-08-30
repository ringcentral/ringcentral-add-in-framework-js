const axios = require('axios');
const { Subscription } = require('../db/subscriptionModel');
const { User } = require('../db/userModel');
const Asana = require('asana');
const constants = require('../lib/constants')
const { refreshAccessToken } = require('../routes/authorization');

// Note: for practicality, incoming notification should be validated with 'x-hook-secret' header during  webhook creation handshake (https://developers.asana.com/docs/webhooks)
async function notification(req, res) {
    try {
        // ===[MOCK]===
        // replace this to use actual 3rd party notification data, transform it, and send to RC_WEBHOOK

        const incomingEvents = req.body.events;
        if (incomingEvents) {
            // Asana events don't contain the actual change, we'll just get resource here then fetch the change ourselves
            const event = req.body.events[0];
            console.log(`[DEBUG]Incoming event:\n ${JSON.stringify(event, null, 2)}`);
            let user = await User.findByPk(req.query.userId);

            const nowDate = new Date();
            // refresh accessToken when accessToken expires. It expires after 1 hour = 3600 seconds
            if (nowDate - user.tokenUpdatedDate > constants.oauth.tokenExpiry) {
                console.log('[DEBUG] accessToken expired. Refreshing...');
                user = await refreshAccessToken(user);
            }
            
            const client = Asana.Client.create().useAccessToken(user.tokens.accessToken);

            // get info
            const userChangedTask = await client.users.findById(event.user.gid);
            const taskChanged = await client.tasks.findById(event.resource.gid);

            // compose RingCentral App adaptive card
            const message = generateAsanaTaskNameChangeCard({
                asanaIcon: 'https://cdn.iconscout.com/icon/free/png-256/asana-226537.png',
                username: userChangedTask.name,
                userEmail: userChangedTask.email,
                taskName: taskChanged.name,
                taskUrl: taskChanged.permalink_url
            });

            // ===[MOCK_END]===
            await axios.post(user.rcWebhookUri, message, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            });
        }
    } catch (e) {
        console.error(e);
    }

    // required by Asana for handshake (https://developers.asana.com/docs/webhooks)
    if (req.headers['x-hook-secret']) {
        res.set("X-Hook-Secret", req.headers['x-hook-secret']);
    }
    res.json({
        result: 'OK',
    });
    res.status(200);
}

function generateAsanaTaskNameChangeCard({ asanaIcon, username, userEmail, taskName, taskUrl }) {
    const card = {
        "attachments": [
            {
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "type": "AdaptiveCard",
                "version": "1.3",
                "body": [
                    {
                        "type": "TextBlock",
                        "size": "Large",
                        "weight": "Bolder",
                        "text": "Task Name Changed"
                    },
                    {
                        "type": "ColumnSet",
                        "columns": [
                            {
                                "type": "Column",
                                "items": [
                                    {
                                        "type": "Image",
                                        "style": "Person",
                                        "url": asanaIcon,
                                        "size": "Small"
                                    }
                                ],
                                "width": "auto"
                            },
                            {
                                "type": "Column",
                                "items": [
                                    {
                                        "type": "TextBlock",
                                        "weight": "Bolder",
                                        "text": username,
                                        "wrap": true
                                    },
                                    {
                                        "type": "TextBlock",
                                        "spacing": "None",
                                        "text": userEmail,
                                        "isSubtle": true,
                                        "wrap": true
                                    }
                                ],
                                "width": "stretch"
                            }
                        ]
                    },
                    {
                        "type": "TextBlock",
                        "text": `${username} **changed task name to**:`,
                        "wrap": true
                    },
                    {
                        "type": "ColumnSet",
                        "separator": true,
                        "columns": [
                            {
                                "type": "Column",
                                "items": [
                                    {
                                        "type": "TextBlock",
                                        "text": taskName,
                                        "wrap": true
                                    }
                                ],
                                "width": "stretch"
                            }
                        ]
                    }
                ],
                "actions": [
                    {
                        "type": "Action.OpenUrl",
                        "title": "View Task",
                        "url": taskUrl,
                        "style": "positive"
                    }
                ]
            }
        ]
    };

    return card;
}

exports.notification = notification;