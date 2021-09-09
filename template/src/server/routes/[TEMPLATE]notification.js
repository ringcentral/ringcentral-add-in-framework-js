const axios = require('axios');
const { Subscription } = require('../model/subscriptionModel');
<%if (useRefreshToken) {%>const { User } = require('../model/userModel');
const { checkAndRefreshAccessToken } = require('../lib/oauth');<%}%>


// Note: for practicality, incoming notification should be validated with 'x-hook-secret' header during  webhook creation handshake (https://developers.asana.com/docs/webhooks)
async function notification(req, res) {
    try {
        console.log(`Receiving notification: ${JSON.stringify(req.body, null, 2)}`);
        // Step.1: Identify which user or subscription is relevant, normally by 3rd party webhook id or user id. 
        // Note: How we get subscriptionId from notification would depend on which flow we choose in `subscription.js` when we create our webhook subscription
        const subscriptionId = "subscriptionId" // [REPLACE] this with actual subscriptionId from req
        const subscription = await Subscription.findByPk(subscriptionId);
        <%if (useRefreshToken) {%>// check token refresh condition
        const user = await User.findByPk(userId);
        await checkAndRefreshAccessToken(user);<%}%>
        // Step.2: Extract info from 3rd party notification POST body
        const testNotificationInfo = {
            title: "This is a test title",
            user: "Random Kong Developer",
            userEmail: "test@test.com",
            userIcon: "https://avatars.githubusercontent.com/u/41028904?v=4",
            message: "This is a test message",
            linkToPage: ""
        }

        // Step.3(optional): Filter out notifications that user is not interested in, because some platform may not have a build-in filtering mechanism.

        // Step.4: Transform notification info into RingCentral App adaptive card - design your own adaptive card: https://adaptivecards.io/designer/
        const testAdaptiveCard = {
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
                            "text": testNotificationInfo.title
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
                                            "url": testNotificationInfo.userIcon,
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
                                            "text": testNotificationInfo.user,
                                            "wrap": true
                                        },
                                        {
                                            "type": "TextBlock",
                                            "spacing": "None",
                                            "text": testNotificationInfo.userEmail,
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
                            "text": testNotificationInfo.message,
                            "wrap": true
                        }
                    ],
                    "actions": [
                        {
                            "type": "Action.OpenUrl",
                            "title": "Open Link",
                            "url": testNotificationInfo.linkToPage,
                            "style": "positive"
                        }
                    ]
                }
            ]
        }

        // Step.5: Send adaptive card to your channel in RingCentral App
        await axios.post(subscription.rcWebhookUri, testAdaptiveCard, { // [REPLACE] testAdaptiveCard with your actual card
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        });
    } catch (e) {
        console.error(e);
    }

    res.status(200);
    res.json({
        result: 'OK',
    });
}

exports.notification = notification;