const { sendAdaptiveCardMessage } = require('../lib/messageHelper');
const Asana = require('asana');

const asanaTaskCardTemplate = require('../adaptiveCardPayloads/asanaTask.json');

async function onReceiveNotification(notificationData, subscription, user) {
    console.log(`Receiving notification: ${JSON.stringify(notificationData, null, 2)}`);
    const incomingEvents = notificationData.events;
    if (incomingEvents) {
        // Step.1: Extract info from 3rd party notification POST body
        // Asana events don't contain the actual change, we'll just get resource here then fetch the change ourselves
        const event = notificationData.events[0];

        // Step.2(optional): Filter out notifications that user is not interested in, some platform may not have a build-in filtering mechanism.  
        const client = Asana.Client.create().useAccessToken(user.accessToken);
        // get info
        const userChangedTask = await client.users.findById(event.user.gid);
        const taskChanged = await client.tasks.findById(event.resource.gid);
        const username = userChangedTask.name;
        const userEmail = userChangedTask.email;
        const taskName = taskChanged.name;
        const taskUrl = taskChanged.permalink_url;
        const taskGid = taskChanged.gid;

        // Step.3: Transform notification info into RingCentral App adaptive card - design your own adaptive card: https://adaptivecards.io/designer/
        const cardParams = {
            username: username,
            userEmail: userEmail,
            taskName: taskName,
            taskUrl: taskUrl,
            taskGid: taskGid,
            subscriptionId: subscription.id
        };

        // Send adaptive card to your channel in RingCentral App
        await sendAdaptiveCardMessage(subscription.rcWebhookUri, asanaTaskCardTemplate, cardParams);
    }
}

async function onReceiveInteractiveMessage(incomingMessageData, user) {
    if (incomingMessageData.action === 'completeTask') {
        // [INSERT] API call to perform action on 3rd party platform 
        const client = Asana.Client.create().useAccessToken(user.accessToken);
        const taskChange = {
            completed: true
        }
        await client.tasks.update(incomingMessageData.taskId, taskChange);
    }
}

exports.onReceiveNotification = onReceiveNotification;
exports.onReceiveInteractiveMessage = onReceiveInteractiveMessage;