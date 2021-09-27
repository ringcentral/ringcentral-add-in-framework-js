const axios = require('axios');
const { Subscription } = require('../models/subscriptionModel');
const { User } = require('../models/userModel');
const { getOAuthApp } = require('../lib/oauth');
const constants = require('../lib/constants');
const crypto = require('crypto');
const { Octokit } = require('@octokit/rest');
const { Template } = require('adaptivecards-templating');


const authCardTemplate = require('../adaptiveCardPayloads/auth.json');
const authCardTemplateString = JSON.stringify(authCardTemplate, null, 2);
const githubIssueCardTemplate = require('../adaptiveCardPayloads/githubIssue.json');
const githubIssueCardTemplateString = JSON.stringify(githubIssueCardTemplate, null, 2);

async function notification(req, res) {
  try {
    console.log(`Receiving notification: ${JSON.stringify(req.body, null, 2)}`);
    // Identify which user or subscription is relevant, normally by 3rd party webhook id or user id. 
    const subscriptionId = req.query.subscriptionId;
    const subscription = await Subscription.findByPk(subscriptionId);

    if (req.body.issue) {
      // Step.1: Extract info from 3rd party notification POST body 
      // [REPLACE] this with codes to extract relevant info from 3rd party notification request body and/or headers
      const issue = req.body.issue;
      const issueTitle = issue.title;
      const issueUrl = issue.html_url;
      const issuerName = issue.user.login;
      const issuerUrl = issue.user.html_url;
      const issueState = issue.state;
      const issueBody = issue.body;
      const issueNumber = issue.number;
      const repoFullName = req.body.repository.full_name;
      const repoUrl = req.body.repository.html_url;

      // Step.2(optional): Filter out notifications that user is not interested in, some platform may not have a build-in filtering mechanism.  
      if(req.body.action !== 'opened') // opened action happens when a new issue is created
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
        subscriptionId: subscriptionId
      };
      // Send adaptive card to your channel in RingCentral App
      await sendAdaptiveCardMessage(subscription.rcWebhookUri, githubIssueCardTemplateString, cardParams);
    }
  } catch (e) {
    console.error(e);
  }

  res.status(200);
  res.json({
    result: 'OK',
  });
}


async function interactiveMessages(req, res) {
  // Shared secret can be found on RingCentral developer portal, under your app Settings
  const SHARED_SECRET = process.env.IM_SHARED_SECRET;
  if (SHARED_SECRET) {
    const signature = req.get('X-Glip-Signature', 'sha1=');
    const encryptedBody =
      crypto.createHmac('sha1', SHARED_SECRET).update(JSON.stringify(req.body)).digest('hex');
    if (encryptedBody !== signature) {
      res.status(401).send();
      return;
    }
  }
  const body = req.body;
  console.log(`Incoming interactive message: ${JSON.stringify(body, null, 2)}`);
  if (!body.data || !body.user) {
    res.status(400);
    res.send('Params error');
    return;
  }
  const subscriptionId = body.data.subscriptionId;
  const subscription = await Subscription.findByPk(subscriptionId);
  if (!subscription) {
    res.status(404);
    res.send('Not found');
    return;
  }
  const oauth = getOAuthApp();
  let user = await User.findOne({ where: { rcUserId: body.user.id } });
  const action = body.data.action;
  let octokit;
  if (action === 'authorize') {
    const buff = Buffer.from(body.data.token, 'base64');
    const authQuery = buff.toString('ascii');
    let token;
    try {
      // same call as 3rd party auth callback to return accessCode to exchange for accessToken
      const callbackUri = `${process.env.APP_SERVER}${constants.route.forThirdParty.AUTH_CALLBACK}${authQuery}`;
      token = await oauth.code.getToken(callbackUri);
      console.log(oauth.code.getUri());
    } catch (e) {
      console.error('Get token error');
      await sendTextMessage(subscription.rcWebhookUri, `Hi ${body.user.firstName} ${body.user.lastName}, the token is invalid.`)
      res.status(200);
      res.send('ok');
      return;
    }
    const { accessToken } = token;

    // create a github rest client
    octokit = new Octokit({
      auth: accessToken
    });
    // Case: when target user exist as known by RingCentral App
    if (user) {
      user.accessToken = accessToken;

      if (!user.rcUserId) {
        user.rcUserId = body.user.id;
      }
      await user.save();
    }
    // Case: when target user doesn't exist as known by RingCentral App
    else {
      // Step.1: Get user info with 3rd party API call
      const { data: userInfo } = await octokit.users.getAuthenticated(); // [REPLACE] userInfoResponse with actual user info API call to 3rd party server
      user = await User.findByPk(userInfo.id);  // [REPLACE] this with actual user id
      // Case: when target user exists only as known by 3rd party platform
      if (user) {
        user.accessToken = accessToken;

        user.rcUserId = body.user.id;
        await user.save();
      }
      // Case: when target user doesn't exist as known by 3rd party platform
      else {
        // Step.2: Create a new user in DB if user doesn't exist
        user = await User.create({
          id: userInfo.id,    // [REPLACE] id with actual id in user info
          name: userInfo.login,    // [REPLACE] name with actual name in user info, this field is optional
          accessToken: accessToken,

          rcUserId: body.user.id,
        });
      }
    }
    await sendTextMessage(subscription.rcWebhookUri, `Hi ${body.user.firstName} ${body.user.lastName}, you have connected successfully. Please click action button again.`);
    res.status(200);
    res.send('ok');
    return;
  }
  // if the action is not 'authorize', then it needs to make sure that authorization is valid for this user
  else {

    // If an unknown user wants to perform actions, we want to authenticate and authorize first
    if (!user || !user.accessToken) {
      await sendAdaptiveCardMessage(
        subscription.rcWebhookUri,
        authCardTemplateString,
        {
          authorizeUrl: oauth.code.getUri(),
          subscriptionId: subscriptionId,
        });
      res.status(200);
      res.send('OK');
      return;
    }
  }

  // Below tis the section for your customized actions handling
  if (action === 'addLabel') {
    // Step.3: Call 3rd party API to perform action that you want to apply
    try {
      // [INSERT] API call to perform action on 3rd party platform 

      // We'll perform an action to Close Issue here - https://octokit.github.io/rest.js/v18#issues
      octokit = new Octokit({
        auth: user.accessToken
      });
      await octokit.issues.addLabels({
        owner: user.name,
        repo: process.env.GITHUB_REPO_NAME,
        issue_number: body.data.issueNumber,
        labels: [body.data.label]
      });
      // notify user the result of the action in RingCentral App conversation
      await sendTextMessage(subscription.rcWebhookUri, `Label added to [Issue](${body.data.issueUrl})`);
    } catch (e) {
      // Case: require auth
      if (e.statusCode === 401) {
        await sendAdaptiveCardMessage(
          subscription.rcWebhookUri,
          authCardTemplateString,
          {
            authorizeUrl: oauth.code.getUri(),
            subscriptionId: subscriptionId,
          });
      }
      console.error(e);
    }
  }
  res.status(200);
  res.json('OK');
}

async function sendTextMessage(rcWebhook, message) {
  await axios.post(rcWebhook, {
    title: message,
    activity: 'Add-In Framework',
  }, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });
}

async function sendAdaptiveCardMessage(rcWebhook, cardTemplate, params) {
  const template = new Template(cardTemplate);
  const card = template.expand({
    $root: params
  });
  console.log(card);
  const response = await axios.post(rcWebhook, {
    attachments: [
      JSON.parse(card),
    ]
  }, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });
  return response;
}

exports.notification = notification;
exports.interactiveMessages = interactiveMessages;