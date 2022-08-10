const { extendApp } = require('ringcentral-chatbot-core');
const { botHandler } = require('./handlers/botHandler');
const { TestModel } = require('./models/testModel');
<% if (useInteractiveMessage) { %>
const { cardHandler } = require('./handlers/cardHandler');
const path = require('path');<% } %>

// extends or override express app as you need
exports.appExtend = (app) => {
const skills = [];
const botConfig = {
    adminRoute: '/admin', // optional
    botRoute: '/bot', // optional
    models: { // optional
        TestModel
    }
}

extendApp(app, skills, botHandler, botConfig);

if (process.env.NODE_ENV !== 'test') {
    app.listen(process.env.PORT || process.env.RINGCENTRAL_CHATBOT_EXPRESS_PORT);
}

console.log('server running...');
console.log(`bot oauth uri: ${process.env.RINGCENTRAL_CHATBOT_SERVER}${botConfig.botRoute}/oauth`);

<% if (useInteractiveMessage) { %>
app.post('/interactive-messages', cardHandler);
console.log(`card interactive message uri: ${process.env.RINGCENTRAL_CHATBOT_SERVER}/interactive-messages`);
app.get('/iframeDialog', function (req, res) {
    res.sendFile(path.join(__dirname, 'static/dialog.html'));
});
<% } %>
}