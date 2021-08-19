const axios = require('axios');
const { Subscription } = require('../db/subscriptionModel');
const { User } = require('../db/userModel');

async function notification(req, res) {
    try {
        // ===[Replace]===
        // replace this to use actual 3rd party notification data, transform it, and send to RC_WEBHOOK
        const mockSubscriptionId = req.body.id;
        const subscription = await Subscription.findByPk(mockSubscriptionId);
        const mockUserId = subscription.userId;
        const user = await User.findByPk(mockUserId);
        
        let message = {};
        if(req.body.isAdaptiveCard)
        {
            message = generateGoogleDriveNewFileCard({
                userAvatar : 'https://fonts.gstatic.com/s/i/productlogos/drive_2020q4/v8/web-64dp/logo_drive_2020q4_color_2x_web_64dp.png',
                username: req.body.username,
                userEmail: req.body.userEmail,
                documentIconUrl: 'https://fonts.gstatic.com/s/i/productlogos/drive_2020q4/v8/web-64dp/logo_drive_2020q4_color_2x_web_64dp.png',
                documentName: req.body.documentName,
                fileUrl: 'https://google.com'
            });
        }
        else{
            message = {
                title: `${req.body.username} (${req.body.userEmail}) just shared [${req.body.documentName}](https://google.com) with you.`,
                icon: 'https://fonts.gstatic.com/s/i/productlogos/drive_2020q4/v8/web-64dp/logo_drive_2020q4_color_2x_web_64dp.png'
            };
        }
        await axios.post(user.rcWebhookUri, message, {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            }
          });
    } catch (e) {
        console.error(e);
    }

    res.json({
      result: 'OK',
    });
    res.status(200);
}

function generateGoogleDriveNewFileCard({ userAvatar, username, userEmail, documentIconUrl, documentName, fileUrl }) {
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
                        "text": "New File Shared with You"
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
                                        "url": userAvatar,
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
                        "text": `${username} **shared document**:`,
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
                                        "type": "Image",
                                        "url": documentIconUrl,
                                        "size": "Small",
                                        "height": "16px"
                                    }
                                ],
                                "width": "auto"
                            },
                            {
                                "type": "Column",
                                "items": [
                                    {
                                        "type": "TextBlock",
                                        "text": documentName,
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
                        "title": "View File",
                        "url": fileUrl,
                        "style": "positive"
                    }
                ]
            }
        ]
    };

    return card;
}

exports.notification = notification;