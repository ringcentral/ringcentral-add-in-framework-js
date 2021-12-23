const { sendAdaptiveCardMessage } = require('../lib/messageHelper');

const sampleCardTemplate = require('../adaptiveCardPayloads/sample.json');

async function onReceiveNotification(notificationData, subscription, user) {
    console.log(`Receiving notification: ${JSON.stringify(notificationData, null, 2)}`);
    // Step.1: Extract info from 3rd party notification POST body
    const testNotificationInfo = {    // [REPLACE] this with codes to extract relevant info from 3rd party notification request body and/or headers
        title: "This is a test title",
        message: "This is a test message",
        linkToPage: "about:blank"
    }
    // Step.2(optional): Filter out notifications that user is not interested in, some platform may not have a build-in filtering mechanism.  

    // Step.3: Transform notification info into RingCentral App adaptive card - design your own adaptive card: https://adaptivecards.io/designer/
    // If this step is successful, go to authorization.js - revokeToken() for the last step
    const cardData = {    // [REPLACE] this with your params that's customized to show info from 3rd party notification and provide interaction
        title: testNotificationInfo.title,
        content: testNotificationInfo.message,
        link: testNotificationInfo.linkToPage,
        subscriptionId: subscription.id
    };
    // Send adaptive card to your channel in RingCentral App
    await sendAdaptiveCardMessage(
        subscription.rcWebhookUri,
        sampleCardTemplate,
        cardData);
}

async function onReceiveInteractiveMessage(incomingMessageData, user) {
    // Below tis the section for your customized actions handling
    // testActionType is from adaptiveCard.js - getSampleCard()
    if (incomingMessageData.action === 'testActionType') {
        // [INSERT] API call to perform action on 3rd party platform 
    }
}

exports.onReceiveNotification = onReceiveNotification;
exports.onReceiveInteractiveMessage = onReceiveInteractiveMessage;