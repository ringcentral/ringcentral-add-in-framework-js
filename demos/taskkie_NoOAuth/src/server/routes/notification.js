const axios = require('axios');
const { Subscription } = require('../models/subscriptionModel');
const { Task } = require('../models/taskModel');
const { generate } = require('shortid');

const crypto = require('crypto');
const { Template } = require('adaptivecards-templating');

const taskListCardTemplate = require('../adaptiveCards/taskList.json');

async function notification(req, res) {
  try {
    // console.log(`Receiving notification: ${JSON.stringify(req.body, null, 2)}`);
    const subscriptionId = req.query.subscriptionId;
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      res.status(403);
      res.send('Unknown subscription id');
      return;
    }

    // console.log(req.body);

    for (const task of req.body.tasks) {
      await Task.create({
        id: generate(),
        title: task.title,
        description: task.description,
        assignee: task.assignee,
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

    const tasks = await getTaskList(activeTasks);

    // console.log(tasks);
    const taskListData = {
      title: 'Active tasks:',
      tasks: tasks,
    };

    await sendAdaptiveCardMessage(
      subscription.rcWebhookUri,
      taskListCardTemplate,
      taskListData
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
  // console.log(`Incoming interactive message: ${JSON.stringify(body, null, 2)}`);
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

      const tasks = await getTaskList(activeTasks);

      const taskListData = {
        title:
          activeTasks.length === 0
            ? 'Task completed. No active task.'
            : 'Task completed. Remaining active tasks:',
        tasks: tasks,
      };

      await sendAdaptiveCardMessage(
        subscription.rcWebhookUri,
        taskListCardTemplate,
        taskListData
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

async function getTaskList(activeTasks) {
  let taskList = [];

  for (const task of activeTasks) {
    const deadlineTime = new Date(task.deadline);
    const nowTime = new Date();
    taskList.push({
      title: task.title,
      description: task.description,
      assignee: task.assignee,
      assigneeAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignee)}}&background=random&bold=true&rounded=true&color=random&format=png`,
      deadline: task.deadline,
      image: task.image,
      taskId: task.id,
      subscriptionId: task.subscriptionId,
      overdue: nowTime > deadlineTime,
    });
  }
  
  return taskList;
}

async function sendAdaptiveCardMessage(rcWebhook, cardTemplate, cardData) {
  const template = new Template(cardTemplate);
  const card = template.expand({
    $root: cardData,
  });
  // console.log(JSON.stringify(card, null, 2));
  const response = await axios.post(
    rcWebhook,
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
  return response;
}

exports.notification = notification;
exports.interactiveMessages = interactiveMessages;
