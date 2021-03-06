const { generateAppTemplate } = require('./app-template');
const { generateAppDemo } = require('./app-demo');
const { generateBotTemplate } = require('./bot-template');
const rimraf = require("rimraf");
const path = require('path');
const { readdirSync } = require('fs')

// Below tests are to attempt generating templates so to verify that no error happens in the process
// Generated templates will be deleted after generation
async function test() {
    console.log('start testing...')
    const OAuthAndRefreshConfigWithNoDeploy = {
        appName: 'OAuthAndRefreshConfigWithNoDeploy',
        useOAuth: true,
        useRefreshToken: true,
        setupParams: false,
        deployment: 'none'
    };
    generateAppTemplate(OAuthAndRefreshConfigWithNoDeploy);
    rimraf.sync(__dirname.replace('bin', OAuthAndRefreshConfigWithNoDeploy.appName));
    console.log('OAuthAndRefreshConfigWithNoDeploy test successful.');

    const OAuthAndRefreshConfigWithAWSDeploy = {
        appName: 'OAuthAndRefreshConfigWithAWSDeploy',
        useOAuth: true,
        useRefreshToken: true,
        setupParams: false,
        deployment: 'aws_lambda_and_dynamoDB'
    };
    generateAppTemplate(OAuthAndRefreshConfigWithAWSDeploy);
    rimraf.sync(__dirname.replace('bin', OAuthAndRefreshConfigWithAWSDeploy.appName));
    console.log('OAuthAndRefreshConfigWithAWSDeploy test successful.');

    const OAuthAndRefreshConfigWithHerokuDeploy = {
        appName: 'OAuthAndRefreshConfigWithHerokuDeploy',
        useOAuth: true,
        useRefreshToken: true,
        setupParams: false,
        deployment: 'heroku_with_postgres'
    };
    generateAppTemplate(OAuthAndRefreshConfigWithHerokuDeploy);
    rimraf.sync(__dirname.replace('bin', OAuthAndRefreshConfigWithHerokuDeploy.appName));
    console.log('OAuthAndRefreshConfigWithHerokuDeploy test successful.');

    const OAuthNoRefreshConfig = {
        appName: 'OAuthNoRefresh',
        useOAuth: true,
        useRefreshToken: true,
        setupParams: false,
        deployment: 'none'
    };
    generateAppTemplate(OAuthNoRefreshConfig);
    rimraf.sync(__dirname.replace('bin', OAuthNoRefreshConfig.appName));
    console.log('OAuthNoRefresh test successful.');

    const NoOAuthConfig = {
        appName: 'NoOAuth',
        useOAuth: true,
        useRefreshToken: true,
        setupParams: false,
        deployment: 'none'
    };
    generateAppTemplate(NoOAuthConfig);
    rimraf.sync(__dirname.replace('bin', NoOAuthConfig.appName));
    console.log('NoOAuth test successful.');

    //tests to generate demos
    const demoNames = readdirSync(path.resolve(__dirname, '../demos'));
    for (const demoName of demoNames) {
        console.log(demoName);
        generateAppDemo({
            demoType: demoName,
            isTest: true
        });
        rimraf.sync(__dirname.replace('bin', demoName));
    }
    console.log('demo test successful.');

    //tests to generate bots
    const BotWithInteractiveMessageConfigAWS = {
        botName: 'BotWithInteractiveMessage',
        useInterativeMessage: true,
        deployment: 'aws_lambda_and_dynamoDB'
    };
    generateBotTemplate(BotWithInteractiveMessageConfigAWS);
    rimraf.sync(__dirname.replace('bin', BotWithInteractiveMessageConfigAWS.botName));
    console.log('BotWithInteractiveMessageConfigAWS test successful.');

    const BotWithoutInteractiveMessageConfigAWS = {
        botName: 'BotWithInteractiveMessage',
        useInterativeMessage: false,
        deployment: 'aws_lambda_and_dynamoDB'
    };
    generateBotTemplate(BotWithoutInteractiveMessageConfigAWS);
    rimraf.sync(__dirname.replace('bin', BotWithoutInteractiveMessageConfigAWS.botName));
    console.log('BotWithoutInteractiveMessageConfigAWS test successful.');

    const BotWithInteractiveMessageConfigHeroku = {
        botName: 'BotWithoutInteractiveMessage',
        useInterativeMessage: false,
        deployment: 'heroku_with_postgres'
    };
    generateBotTemplate(BotWithInteractiveMessageConfigHeroku);
    rimraf.sync(__dirname.replace('bin', BotWithInteractiveMessageConfigHeroku.botName));
    console.log('BotWithInteractiveMessageConfigHeroku test successful.');

    const BotWithoutInteractiveMessageConfigHeroku = {
        botName: 'BotWithoutInteractiveMessage',
        useInterativeMessage: false,
        deployment: 'heroku_with_postgres'
    };
    generateBotTemplate(BotWithoutInteractiveMessageConfigHeroku);
    rimraf.sync(__dirname.replace('bin', BotWithoutInteractiveMessageConfigHeroku.botName));
    console.log('BotWithoutInteractiveMessageConfigHeroku test successful.');
}

exports.test = test;