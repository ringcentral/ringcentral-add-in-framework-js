const { Template } = require('adaptivecards-templating');
<% if (useInteractiveMessage) { %>const submitCardTemplate = require('../adaptiveCards/submitCard.json');
const openDialogCardTemplate = require('../adaptiveCards/openDialogCard.json');<% } else { %>
const textCardTemplate = require('../adaptiveCards/textCard.json');<% } %>
const { TestModel } = require('../models/testModel');

const testId = 'testId';

const botHandler = async event => {
    try {
        switch (event.type) {
            case 'BotJoinGroup':
                const { group: joinedGroup, bot: joinedBot } = event;
                await joinedBot.sendMessage(joinedGroup.id, { text: 'welcome' });
                break;
            case 'Message4Bot':
                const { text, group, bot: messageBot } = event;
                console.log(`=====incomingCommand.Message4Bot.${text}=====`);
                switch (text) {
                    case 'hello':
                        await messageBot.sendMessage(group.id, { text: 'hello' });
                        break;
                    case 'card':<% if (useInteractiveMessage) { %>
                        let testData = await TestModel.findByPk(testId);
                        if (!testData) {
                            testData = await TestModel.create({
                                id: testId,
                                name: 'Test Name'
                            })
                        }
                        const template = new Template(submitCardTemplate);
                        const cardData = {
                            botId: messageBot.id,
                            groupId: group.id,
                            testId,
                            testName: testData.name
                        }<% } else { %> 
                        let testData = await TestModel.findByPk(testId);
                        if (!testData) {
                            testData = await TestModel.create({
                                id: testId,
                                name: 'Test Name'
                            })
                        }
                        const template = new Template(textCardTemplate);
                        const cardData = {
                            title: 'Title',
                            text: `This is an adaptive card with ${testData.name}.`
                        };<% } %>
                        const card = template.expand({
                            $root: cardData
                        });
                        await messageBot.sendAdaptiveCard(group.id, card);
                        break;<% if (useInteractiveMessage) { %>
                    case 'dialog':
                        const openDialogTemplate = new Template(openDialogCardTemplate);
                        const openDialogCardData = {
                            botId: messageBot.id,
                            groupId: group.id
                        }
                        const openDialogCard = openDialogTemplate.expand({
                            $root: openDialogCardData
                        });
                        await messageBot.sendAdaptiveCard(group.id, openDialogCard);
                        break;<% } %>
                }
        }
    }
    catch (e) {
        console.log(e);
    }
}

exports.botHandler = botHandler;