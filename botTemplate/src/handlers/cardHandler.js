const Bot = require('ringcentral-chatbot-core/dist/models/Bot').default;
const { Template } = require('adaptivecards-templating');
const textCardTemplate = require('../adaptiveCards/textCard.json');

const cardHandler = async req => {
    const submitData = req.body.data;
    const cardId = req.body.card.id;
    console.log(`=====incomingCard=====\n${JSON.stringify(req.body, null, 2)}`);
    const bot = await Bot.findByPk(submitData.botId);
    switch (submitData.actionType) {
        case 'update':
            const template = new Template(textCardTemplate);
            const cardData = {
                title: 'Updated',
                text: 'This card has been updated.'
            };
            const card = template.expand({
                $root: cardData
            });
            await bot.updateAdaptiveCard(cardId, card);
            break;
    }
}

exports.cardHandler = cardHandler;