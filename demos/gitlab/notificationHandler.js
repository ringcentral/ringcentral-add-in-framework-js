const { sendAdaptiveCardMessage } = require('../lib/messageHelper');
const { Gitlab } = require('@gitbeaker/node');

const issueCardTemplate = require('../adaptiveCardPayloads/gitlabIssueCard.json');

async function onReceiveNotification(notificationData, subscription, user) {
    console.log(`Receiving notification: ${JSON.stringify(notificationData, null, 2)}`);
    // Step.1: Extract info from 3rd party notification POST body
    const gitlabUser = notificationData.user;
    const gitlabProject = notificationData.project;
    const gitlabIssue = notificationData.object_attributes;
    // Step.2(optional): Filter out notifications that user is not interested in, some platform may not have a build-in filtering mechanism.  
    if (gitlabIssue.state === 'closed') {
        return;
    }

    // Step.3: Transform notification info into RingCentral App adaptive card - design your own adaptive card: https://adaptivecards.io/designer/
    // If this step is successful, go to authorization.js - revokeToken() for the last step
    const cardPayload = {    // [REPLACE] this with your params that's customized to show info from 3rd party notification and provide interaction
        title: `${gitlabUser.name}(${gitlabUser.email}) created an issue on ${gitlabProject.homepage}`,
        content: `${gitlabIssue.title}: ${gitlabIssue.description}`,
        link: gitlabIssue.url,
        issueId: gitlabIssue.iid,
        projectId: gitlabIssue.project_id,
        subscriptionId: subscription.id
    };
    // Send adaptive card to your channel in RingCentral App
    await sendAdaptiveCardMessage(
        subscription.rcWebhookUri,
        issueCardTemplate,
        cardPayload);
}

async function onReceiveInteractiveMessage(incomingMessageData, user) {
    // Below tis the section for your customized actions handling
    // testActionType is from adaptiveCard.js - getSampleCard()
    if (incomingMessageData.action === 'testActionType') {
        // [INSERT] API call to perform action on 3rd party platform 
        const gitlabClient = new Gitlab({
            host: process.env.API_SERVER,
            oauthToken: user.accessToken,
        });
        const closeIssueOption = {
            state_event: 'close'
        }
        await gitlabClient.Issues.edit(incomingMessageData.projectId, incomingMessageData.issueId, closeIssueOption);
    }
}

exports.onReceiveNotification = onReceiveNotification;
exports.onReceiveInteractiveMessage = onReceiveInteractiveMessage;