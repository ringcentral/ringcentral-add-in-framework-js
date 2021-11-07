const axios = require('axios');
const { Template } = require('adaptivecards-templating');

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
            card,
        ]
    }, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        }
    });
    return response;
}

exports.sendTextMessage = sendTextMessage;
exports.sendAdaptiveCardMessage = sendAdaptiveCardMessage;