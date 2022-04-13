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
    const BotWithInteractiveMessageConfig = {
        botName: 'BotWithInteractiveMessage',
        useInterativeMessage: true,
        deployment: 'aws_lambda_and_dynamoDB'
    };
    generateBotTemplate(BotWithInteractiveMessageConfig);
    rimraf.sync(__dirname.replace('bin', BotWithInteractiveMessageConfig.botName));
    console.log('BotWithInteractiveMessageConfig test successful.');

    const BotWithoutInteractiveMessageConfig = {
        botName: 'BotWithoutInteractiveMessage',
        useInterativeMessage: false,
        deployment: 'heroku_with_postgres'
    };
    generateBotTemplate(BotWithoutInteractiveMessageConfig);
    rimraf.sync(__dirname.replace('bin', BotWithoutInteractiveMessageConfig.botName));
    console.log('BotWithoutInteractiveMessageConfig test successful.');
}

exports.test = test;