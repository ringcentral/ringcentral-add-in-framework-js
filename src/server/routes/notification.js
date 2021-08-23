const axios = require('axios');
const { User } = require('../db/userModel');

async function notification(req, res) {
    try {
        // ===[MOCK]===
        // replace this to use actual 3rd party notification data, transform it, and send to RC_WEBHOOK
        const repoOwnerId = req.body.repository.owner.id;
        const user = await User.findByPk(repoOwnerId);

        if (user) {
            const repoName = req.body.repository.name;
            const repoUrl = req.body.repository.html_url;

            const headCommit = req.body.head_commit;
            const commitMessage = headCommit.message;
            const commitAuthor = headCommit.author.username;
            const commitAuthorEmail = headCommit.author.email;
            const commitUrl = headCommit.url;

            const message = generateGithubPushNotificationCard({
                repoName: repoName,
                repoUrl: repoUrl,
                commitAuthor: commitAuthor,
                commitAuthorEmail: commitAuthorEmail,
                githubIconUrl: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
                commitMessage: commitMessage,
                commitUrl: commitUrl
            });
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

    res.json({
        result: 'OK',
    });
    res.status(200);
}

function generateGithubPushNotificationCard({ repoName, repoUrl, commitAuthor, commitAuthorEmail, githubIconUrl, commitMessage, commitUrl }) {
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
                        "text": "New Commit"
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
                                        "url": githubIconUrl,
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
                                        "text": `${commitAuthor} (${commitAuthorEmail}) **pushed a commit** to [${repoName}](${repoUrl}):`,
                                        "wrap": true
                                    },
                                ],
                                "width": "stretch"
                            }
                        ]
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
                                        "text": `\"${commitMessage}\"`,
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
                        "title": "View Commit",
                        "url": commitUrl,
                        "style": "positive"
                    }
                ]
            }
        ]
    };

    return card;
}

exports.notification = notification;