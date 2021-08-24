const { decodeToken } = require('../lib/jwt');
const { User } = require('../db/userModel');
const { Subscription } = require('../db/subscriptionModel');
const constants = require('../lib/constants');
const axios = require('axios');

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
  if (!user || !user.accessToken) {
    res.send('Session expired');
    res.status(401);
    return;
  }
  // create notification subscription
  try {
    // ===[MOCK]===
    // replace this section with the actual subscription call to 3rd party service
    const webhookPayload = {
      name: 'web',
      events: ['push'],
      active: true,
      config: {
        url: `${process.env.APP_SERVER}${constants.route.forThirdParty.NOTIFICATION}`,
        content_type: "json"
      }
    }
    const webhookResponse = await axios.post(`https://api.github.com/repos/${user.name}/${process.env.TEST_REPO_NAME}/hooks`, webhookPayload, {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    // create new subscription in DB
    await Subscription.create({
      id: webhookResponse.data.id,
      userId: userId
    });

    user.subscriptionId = webhookResponse.data.id;
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