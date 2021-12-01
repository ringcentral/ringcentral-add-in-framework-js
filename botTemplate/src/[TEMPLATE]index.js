const { extendApp } = require('ringcentral-chatbot-core');
const express = require('express');
const { botHandler } = require('./handlers/botHandler');
<% if (useInteractiveMessage) { %>
const { cardHandler } = require('./handlers/cardHandler');<% } %>

const skills = [];
const botConfig = {
    adminRoute: '/admin', // optional
    botRoute: '/bot', // optional
    models: { // optional
    }
}

const app = express();
extendApp(app, skills, botHandler, botConfig);
app.listen(process.env.RINGCENTRAL_CHATBOT_EXPRESS_PORT);

console.log('server running...');
console.log(`bot oauth uri: ${process.env.RINGCENTRAL_CHATBOT_SERVER}${botConfig.botRoute}/oauth`);

<% if (useInteractiveMessage) { %>
const cardRoute = '/interactive-messages';
app.post(cardRoute, async (req, res) => {
    try {
        await cardHandler(req);
    }
    catch (e) {
        console.log(e);
    }

    res.status(200);
    res.json('OK');
});
console.log(`card interactive message uri: ${process.env.RINGCENTRAL_CHATBOT_SERVER}${cardRoute}`);
<% } %>