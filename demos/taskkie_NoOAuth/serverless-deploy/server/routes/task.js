const axios = require('axios');
const { Subscription } = require('../models/subscriptionModel');
const { Task } = require('../models/taskModel');
const { generate } = require('shortid');

const crypto = require('crypto');
const { Template } = require('adaptivecards-templating');

async function newTask(req, res) {
  try {
    console.log(`Receiving notification: ${JSON.stringify(req.body, null, 2)}`);
    const subscriptionId = req.query.subscriptionId;
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      res.status(403);
      res.send('Unknown subscription id');
      return;
    }

    for (const task of req.body.tasks) {
      await Task.create({
        id: generate(),
        title: task.title,
        description: task.description,
        assignee: task.assignee,
        status: 'open',
        image: task.image,
        deadline: task.deadline,
        subscriptionId: subscriptionId,
        isCompleted: false,
      });
    }

    const activeTasks = await Task.findAll({
      where: {
        subscriptionId: subscriptionId,
      },
    });
    let taskComps = [];

    for (const task of activeTasks) {
      taskComps.push(
        generateTaskComp({
          title: task.title,
          description: task.description,
          assignee: task.assignee,
          deadline: task.deadline,
          image: task.image,
          taskId: task.id,
          subscriptionId: task.subscriptionId,
        })
      );
    }

    const cardTitle = 'Active tasks:';
    const card = generateTaskList({
      title: cardTitle,
      taskComps: taskComps,
    });

    await axios.post(
      subscription.rcWebhookUri,
      {
        attachments: [card],
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
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
    const encryptedBody = crypto
      .createHmac('sha1', SHARED_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');
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
  try {
    const taskId = req.body.data.taskId;
    const task = await Task.findByPk(taskId);
    if (!task) {
      res.status(403);
      res.send('Unknown task id');
      return;
    }

    const subscriptionId = req.body.data.subscriptionId;
    if (!subscriptionId) {
      res.status(403);
      res.send('Require subscription id');
      return;
    }

    if (body.data.action === 'completeTask') {
      await Task.destroy({
        where: {
          id: taskId,
        },
      });

      const subscription = await Subscription.findByPk(subscriptionId);
      const activeTasks = await Task.findAll({
        where: {
          subscriptionId: subscriptionId,
        },
      });

      let taskComps = [];

      for (const task of activeTasks) {
        taskComps.push(
          generateTaskComp({
            title: task.title,
            description: task.description,
            assignee: task.assignee,
            deadline: task.deadline,
            image: task.image,
            taskId: task.id,
            subscriptionId: task.subscriptionId,
          })
        );
      }

      const cardTitle =
        activeTasks.length === 0
          ? 'Task completed. No active task.'
          : 'Task completed. Remaining active tasks:';
      const card = generateTaskList({
        title: cardTitle,
        taskComps: taskComps,
      });

      await axios.post(
        subscription.rcWebhookUri,
        {
          attachments: [card],
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (e) {
    console.error(e);
  }

  res.status(200);
  res.json({
    result: 'OK',
  });
}

async function sendTextMessage(rcWebhook, message) {
  await axios.post(
    rcWebhook,
    {
      title: message,
      activity: 'Add-In Framework',
    },
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );
}

async function sendAdaptiveCardMessage(rcWebhook, cardTemplate, cardPayload) {
  const template = new Template(cardTemplate);
  const card = template.expand({
    $root: cardPayload,
  });
  console.log(card);
  const response = await axios.post(
    rcWebhook,
    {
      attachments: [JSON.parse(card)],
    },
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );
  return response;
}

function generateTaskList({ title, taskComps }) {
  return {
    type: 'AdaptiveCard',
    body: [
      {
        type: 'TextBlock',
        text: title,
        wrap: true,
      },
      {
        type: 'Container',
        items: taskComps,
        bleed: true,
      },
    ],
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.2',
  };
}

function generateTaskComp({
  title,
  description,
  assignee,
  status,
  deadline,
  image,
  taskId,
  subscriptionId,
}) {
  return {
    type: 'ColumnSet',
    columns: [
      {
        type: 'Column',
        items: [
          {
            type: 'TextBlock',
            size: 'Large',
            weight: 'Bolder',
            text: `${title} - ${description} - ${assignee} - ${status} - ${deadline}`,
            wrap: true,
          },
        ],
        width: 'stretch',
      },
      {
        type: 'Column',
        items: [
          {
            type: 'Image',
            url: image,
            altText: '',
            height: '30px',
          },
        ],
        width: 'auto',
      },
      {
        type: 'Column',
        items: [
          {
            type: 'ActionSet',
            actions: [
              {
                type: 'Action.Submit',
                title: 'Complete',
                data: {
                  action: 'completeTask',
                  taskId: taskId,
                  subscriptionId: subscriptionId,
                },
              },
            ],
          },
        ],
        width: 'auto',
      },
    ],
  };
}

exports.newTask = newTask;
exports.interactiveMessages = interactiveMessages;
