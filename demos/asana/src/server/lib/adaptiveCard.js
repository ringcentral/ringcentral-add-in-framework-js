// More info on Adaptive Cards: https://adaptivecards.io/
function getAuthCard({ authorizeUrl, subscriptionId }) {
    const card = {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.3",
        "body": [
            {
                "type": "Container",
                "items": [
                    {
                        "type": "TextBlock",
                        "text": "Hi, please follow steps to connect 3rd party platform for interactive messages.",
                        "wrap": true
                    },
                    {
                        "type": "TextBlock",
                        "text": "**Step 1**: Click following button to authorize",
                        "wrap": true
                    },
                    {
                        "type": "ActionSet",
                        "actions": [
                            {
                                "type": "Action.OpenUrl",
                                "title": "Authorize",
                                "url": authorizeUrl
                            }
                        ]
                    },
                    {
                        "type": "TextBlock",
                        "text": "**Step 2**: Submit token that you get from authorization page.",
                        "wrap": true
                    },
                    {
                        "id": "token",
                        "type": "Input.Text",
                        "placeholder": "Token showed at authorization page",
                        "isRequired": true,
                        "errorMessage": "please input the auth token",
                        "label": "Token"
                    }
                ]
            }
        ],
        "actions": [
            {
                "type": "Action.Submit",
                "title": "Submit",
                "data": {
                    "action": "authorize",
                    "subscriptionId": subscriptionId
                }
            }
        ]
    }
    return card;
}

function getSampleStatusCard({ title, content, link, subscriptionId }) {
    const card = {
        "type": "AdaptiveCard",
        "body": [
            {
                "type": "TextBlock",
                "size": "Large",
                "text": "Notification Card"
            },
            {
                "type": "ColumnSet",
                "columns": [
                    {
                        "type": "Column",
                        "items": [
                            {
                                "type": "TextBlock",
                                "text": title
                            },
                            {
                                "type": "TextBlock",
                                "text": content,
                                "weight": "Bolder"
                            }
                        ]
                    }
                ]
            }
        ],
        "actions": [
            {
                "type": "Action.OpenUrl",
                "title": "Open",
                "url": link,
                "style": "positive"
            },
            {
                "type": "Action.ShowCard",
                "title": "Action Title",
                "card": {
                    "type": "AdaptiveCard",
                    "body": [
                        {
                            "type": "Input.Toggle",
                            "id": "actionTitle",
                            "title": "Action Title",
                            "value": "true",
                            "valueOn": "true",
                            "valueOff": "false"
                        }
                    ],
                    "actions": [
                        {
                            "type": "Action.Submit",
                            "title": "Submit",
                            "data": {
                                "action": "testActionType",
                                "subscriptionId": subscriptionId
                            }
                        }
                    ]
                }
            }
        ],
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "version": "1.2"
    }
    return card;
}

function getAsanaTaskCard({ username, userEmail, taskName, taskUrl, taskGid, subscriptionId }) {
    const card = {
        "type": "AdaptiveCard",
        "body": [
            {
                "type": "TextBlock",
                "size": "Large",
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
                                "url": "https://cdn.iconscout.com/icon/free/png-256/asana-226537.png",
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
                                "text": `${username}(${userEmail}) changed task name to [${taskName}](${taskUrl})`,
                                "weight": "Bolder",
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
                "type": "Action.Submit",
                "title": "Complete Task",
                "data": {
                    "action": "completeTask",
                    "subscriptionId": subscriptionId,
                    "taskId": taskGid,
                }
            }
        ],
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "version": "1.2"
    }
    return card;
}

exports.getAuthCard = getAuthCard;
exports.getSampleStatusCard = getSampleStatusCard;
exports.getAsanaTaskCard = getAsanaTaskCard;