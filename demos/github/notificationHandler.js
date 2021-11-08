const { sendAdaptiveCardMessage } = require('../lib/messageHelper');
const githubIssueCardTemplate = require('../adaptiveCardPayloads/githubIssue.json');
const { Octokit } = require('@octokit/rest');

async function onReceiveNotification(notificationData, subscription) {
    console.log(`Receiving notification: ${JSON.stringify(notificationData, null, 2)}`);

    if (notificationData.issue) {
        // Step.1: Extract info from 3rd party notification POST body 
        // [REPLACE] this with codes to extract relevant info from 3rd party notification request body and/or headers
        const issue = notificationData.issue;
        const issueTitle = issue.title;
        const issueUrl = issue.html_url;
        const issuerName = issue.user.login;
        const issuerUrl = issue.user.html_url;
        const issueState = issue.state;
        const issueBody = issue.body;
        const issueNumber = issue.number;
        const repoFullName = notificationData.repository.full_name;
        const repoUrl = notificationData.repository.html_url;

        // Step.2(optional): Filter out notifications that user is not interested in, some platform may not have a build-in filtering mechanism.  
        if (notificationData.action !== 'opened') // opened action happens when a new issue is created
        {
            return;
        }

        // Step.3: Transform notification info into RingCentral App adaptive card - design your own adaptive card: https://adaptivecards.io/designer/
        const cardParams = {    // [REPLACE] this with your card that's customized to show info from 3rd party notification and provide interaction
            title: issueTitle,
            url: issueUrl,
            issuerName: issuerName,
            issuerUrl: issuerUrl,
            state: issueState,
            body: issueBody ?? '',
            repoFullName: repoFullName,
            repoUrl: repoUrl,
            issueNumber: issueNumber,
            subscriptionId: subscription.id
        };
        // Send adaptive card to your channel in RingCentral App
        await sendAdaptiveCardMessage(subscription.rcWebhookUri, githubIssueCardTemplate, cardParams);
    }
}

async function onReceiveInteractiveMessage(incomingMessageData, user) {
    // Below tis the section for your customized actions handling
    // testActionType is from adaptiveCard.js - getSampleCard()
    if (incomingMessageData.action === 'addLabel') {
        const octokit = new Octokit({
            auth: user.accessToken
        });
        await octokit.issues.addLabels({
            owner: user.name,
            repo: process.env.TEST_REPO_NAME,
            issue_number: incomingMessageData.issueNumber,
            labels: [incomingMessageData.label]
        });
    }
}

exports.onReceiveNotification = onReceiveNotification;
exports.onReceiveInteractiveMessage = onReceiveInteractiveMessage;