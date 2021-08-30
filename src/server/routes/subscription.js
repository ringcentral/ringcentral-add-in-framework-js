const { decodeToken } = require('../lib/jwt');
const { User } = require('../db/userModel');
const { Subscription } = require('../db/subscriptionModel');
const Asana = require('asana');
const constants = require('../lib/constants')

async function subscribe(req, res) {
  // validate jwt
  const jwtToken = req.body.token;
  if (!jwtToken) {
    res.send('Params invalid.');
    res.status(403);
    return;
  }
  const decodedToken = decodeToken(jwtToken);
  if (!decodedToken) {
    res.send('Token invalid');
    res.status(401);
    return;
  }

  // get user
  const userId = decodedToken.id;
  const user = await User.findByPk(userId);
  if (!user || !user.tokens) {
    res.send('Session expired');
    res.status(401);
    return;
  }
  // create notification subscription
  try {
    // ===[MOCK]===
    // replace this section with the actual subscription call to 3rd party service
    // typically you would include notification callback url in the payload

    const client = Asana.Client.create().useAccessToken(user.tokens.accessToken);
    // get target resource id for my user task list
    const workspaces = await client.workspaces.findAll();
    const targetWorkspace = workspaces.data[0];
    const taskList = await client.userTaskLists.findByUser("me", { workspace: targetWorkspace.gid });

    console.log(`[DEBUG]resource id: ${taskList.gid}`);

    // create subscription webhook
    const webhookResponse = await client.webhooks.create(
      taskList.gid,
      `${process.env.APP_SERVER}${constants.route.forThirdParty.NOTIFICATION}?userId=${user.id}`,
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
      });

    console.log(`[DEBUG]webhook id: ${webhookResponse.gid}`);

    // create new subscription in DB
    await Subscription.create({
      id: webhookResponse.gid,
      userId: userId
    });

    user.subscriptionId = webhookResponse.gid;
    // ===[MOCK_END]===
    await user.save();

    res.json({
      result: 'ok'
    });
    res.status(200);
  }
  catch (e) {
    console.error(e);
    if (e.response && e.response.status === 401) {
      res.send('Unauthorized');
      res.status(401);
      return;
    }
    console.error(e);
    res.send('Internal server error');
    res.status(500);
    return;
  }
}

exports.subscribe = subscribe;