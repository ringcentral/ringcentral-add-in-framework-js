const constants = require('../lib/constants');
const { Subscription } = require('../models/subscriptionModel');
const { generate } = require('shortid');
const { Octokit } = require('@octokit/rest');

async function onSubscribe(user, rcWebhookUri) {
    // Generate an unique id
    // Note: notificationCallbackUrl here would contain our subscriptionId so that incoming notifications can be identified
    const subscriptionId = generate();
    const notificationCallbackUrl = `${process.env.APP_SERVER}${constants.route.forThirdParty.NOTIFICATION}?subscriptionId=${subscriptionId}`;

    // Step.1: [INSERT]Create a new webhook subscription on 3rd party platform with their API. For most cases, you would want to define what resources/events you want to subscribe to as well.
    const octokit = new Octokit({
        auth: user.accessToken
      });
    const webhookResponse = await octokit.repos.createWebhook({
        owner: user.name,
        repo: process.env.TEST_REPO_NAME,
        events: ['issues'],
        config: {
          url: notificationCallbackUrl,
          content_type: "json"
        }
      });
      console.log(`Github repo webhook id: ${webhookResponse.data.id}`);
    
    // Step.2: Get data from webhook creation response.
    const webhookData = webhookResponse.data;   // [REPLACE] this with actual API call to 3rd party platform to create a webhook subscription

    // Step.3: Create new subscription in DB. Note: If up till now, it's running correctly, most likely your RingCentral App conversation will receive message in the form of Adaptive Card (exception: Asana - more info: try asana demo with 'npx ringcentral-add-in-framework demo')
    await Subscription.create({
        id: subscriptionId,
        userId: user.id,
        rcWebhookUri: rcWebhookUri,
        thirdPartyWebhookId: webhookData.id   // [REPLACE] this with webhook subscription id from 3rd party platform response
    });

    //If it's all good here, a Notification Card will be sent to your installed chat

}

exports.onSubscribe = onSubscribe;