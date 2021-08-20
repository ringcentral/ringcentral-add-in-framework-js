const { decodeToken } = require('../lib/jwt');
const { User } = require('../db/userModel');
const { Subscription } = require('../db/subscriptionModel');

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
    // ===[Replace]===
    // replace this section with the actual subscription call to 3rd party service
    const mockSubscriptionResponse = {
      id : "sub-123456",
    }

    // ===[Replace]===
    // replace this section with access token expiry handling
    if(mockSubscriptionResponse == null)
    {
      const mockRefreshTokenResponse = {
        newAccessToken : "newAccessToken",
        newRefreshToken : "newRefreshToken"
      };
      user.tokens = {
        accessToken : mockRefreshTokenResponse.newAccessToken,
        refreshToken : mockRefreshTokenResponse.newRefreshToken
      }

      // Call subscribe API again with new access token
      const mockSubscriptionResponse = {
        id : "sub-123456",
      }
    }

    // create new subscription in DB
    await Subscription.create({
      id: mockSubscriptionResponse.id,
      userId: userId
    });

    user.subscriptionId = mockSubscriptionResponse.id;
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