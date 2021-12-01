const { Template } = require('adaptivecards-templating');
<% if (useInteractiveMessage) { %>
const updateButtonCardTemplate = require('../adaptiveCards/updateButtonCard.json');<% } else { %>
const textCardTemplate = require('../adaptiveCards/textCard.json');<%}%>

const botHandler = async event => {
    try {
        switch (event.type) {
            case 'Message4Bot':
                const { text, group, bot } = event;
                console.log(`=====incomingCommand.Message4Bot.${text}=====`);
                switch (text) {
                    case 'hello':
                        await bot.sendMessage(group.id, { text: 'hello' });
                        break;
                    case 'card':<% if (useInteractiveMessage) { %>
                        const template = new Template(updateButtonCardTemplate);
                        const cardData = {
                            botId: bot.id,
                            groupId: group.id
                        }<% } else { %>
                        const template = new Template(textCardTemplate);
                        const cardData = {
                            title: 'Title',
                            text: 'This is an adaptive card.'
                        };<% } %>
                        const card = template.expand({
                            $root: cardData
                        });
                        await bot.sendAdaptiveCard(group.id, card);
                        break;
                }
        }
    }
    catch (e) {
        console.log(e);
    }
}

exports.botHandler = botHandler;