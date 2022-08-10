const crypto = require('crypto');
const Bot = require('ringcentral-chatbot-core/dist/models/Bot').default;
const { Template } = require('adaptivecards-templating');
const textCardTemplate = require('../adaptiveCards/textCard.json');

const { TestModel } = require('../models/testModel');

const cardHandler = async (req, res) => {
    try {
        // Shared secret can be found on RingCentral developer portal, under your app Settings
        const SHARED_SECRET = process.env.RINGCENTRAL_SHARED_SECRET;
        if (SHARED_SECRET) {
            const signature = req.get('X-Glip-Signature', 'sha1=');
            const encryptedBody =
                crypto.createHmac('sha1', SHARED_SECRET).update(JSON.stringify(req.body)).digest('hex');
            if (encryptedBody !== signature) {
                res.status(401).send();
                return;
            }
        }
        const submitData = req.body.data;
        const cardId = req.body.card.id;
        console.log(`=====incomingCard=====\n${JSON.stringify(req.body, null, 2)}`);
        const bot = await Bot.findByPk(submitData.botId);
        let dialogResponse = {
            type: "dialog",
            dialog: null
        };
        if (bot) {
            switch (submitData.actionType) {
                case 'update':
                    await TestModel.update({
                        name: submitData.testName
                    }, {
                        where: {
                            id: submitData.testId
                        }
                    });
                    const template = new Template(textCardTemplate);
                    const cardData = {
                        title: 'Name Updated',
                        text: `Name has been updated to **${submitData.testName}**.`
                    };
                    const card = template.expand({
                        $root: cardData
                    });
                    await bot.updateAdaptiveCard(cardId, card);
                    break;
                case 'openCardDialog':
                    const dialogCardTemplate = new Template(textCardTemplate);
                    const dialogCardData = {
                        title: 'Card in Dialog',
                        text: `This is an Adaptive Card in **Modal Dialog**`
                    };
                    const dialogCard = dialogCardTemplate.expand({
                        $root: dialogCardData
                    });
                    dialogResponse.dialog = getCardDialog({ card: dialogCard });
                    break;
                case 'openIFrameDialog':
                    dialogResponse.dialog = getIframeDialog({ iframeURL: `${process.env.RINGCENTRAL_CHATBOT_SERVER}/iframeDialog` });
                    break;
            }
            if (dialogResponse.dialog) {
                res.status(200);
                res.send(dialogResponse);
            }
            else {
                res.status(200);
                res.send('OK');
            }
        }
        else {
            res.status(400).send('Unknown Bot Id.');
        }
    }
    catch (e) {
        console.log(e);
        res.status(200);
        res.send('OK');
    }
}

function getCardDialog({ title, size, iconURL, card }) {
    const dialog = {
        ...(size !== null && { size }),
        ...(iconURL !== null && { iconURL }),
        ...title, card
    };

    return dialog;
}

function getIframeDialog({ title, size, iconURL, iframeURL }) {
    const dialog = {
        ...(size !== null && { size }),
        ...(iconURL !== null && { iconURL }),
        ...title, iframeURL
    };

    return dialog;
}

exports.cardHandler = cardHandler;