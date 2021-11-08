const constants = require('../lib/constants');
const { Subscription } = require('../models/subscriptionModel');
const { generate } = require('shortid');
const Asana = require('asana');

async function onSubscribe(user, rcWebhookUri) {
  // Generate an unique id
  // Note: notificationCallbackUrl here would contain our subscriptionId so that incoming notifications can be identified
  const subscriptionId = generate();
  const notificationCallbackUrl = `${process.env.APP_SERVER}${constants.route.forThirdParty.NOTIFICATION}?subscriptionId=${subscriptionId}`;

  // Step.1: [INSERT]Create a new webhook subscription on 3rd party platform with their API. For most cases, you would want to define what resources/events you want to subscribe to as well.
  const client = Asana.Client.create().useAccessToken(user.accessToken);
  // get target resource id for my user task list
  const workspaces = await client.workspaces.findAll();
  const targetWorkspace = workspaces.data[0];
  const taskList = await client.userTaskLists.findByUser("me", { workspace: targetWorkspace.gid });

  // Step.2: Get data from webhook creation response.
  // Here is a workaround to create a DB record before webhook is created on Asana, because Asana need send a handshake message before creating the webhook
  const subscription = await Subscription.create({
    id: subscriptionId,
    userId: user.id,
    rcWebhookUri: rcWebhookUri
  });
  const webhookResponse = await client.webhooks.create(
    taskList.gid,
    notificationCallbackUrl,
    {
      filters: [
        {
          resource_type: 'task',
          action: 'changed',
          fields: [
            'name'
          ]
        }
      ]
    });   // [REPLACE] this with actual API call to 3rd party platform to create a webhook subscription

  // Step.3: Create new subscription in DB
  subscription.thirdPartyWebhookId = webhookResponse.gid   // [REPLACE] this with webhook subscription id from 3rd party platform response
  await subscription.save();

  //If it's all good here, a Notification Card will be sent to your installed chat

}

exports.onSubscribe = onSubscribe;