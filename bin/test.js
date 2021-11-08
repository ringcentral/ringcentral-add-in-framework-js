const { generateTemplate } = require('./template');
const { generateDemo } = require('./demo');
const rimraf = require("rimraf");
const path = require('path');
const { readdirSync } = require('fs')

// Below tests are to attempt generating templates so to verify that no error happens in the process
// Generated templates will be deleted after generation
const OAuthAndRefreshConfigWithNoDeploy = {
    appName: 'OAuthAndRefreshConfigWithNoDeploy',
    useOAuth: true,
    useRefreshToken: true,
    setupParams: false,
    deployment: 'none'
};
generateTemplate(OAuthAndRefreshConfigWithNoDeploy);
rimraf.sync(__dirname.replace('bin', OAuthAndRefreshConfigWithNoDeploy.appName));
console.log('OAuthAndRefreshConfigWithNoDeploy test successful.');

const OAuthAndRefreshConfigWithAWSDeploy = {
    appName: 'OAuthAndRefreshConfigWithAWSDeploy',
    useOAuth: true,
    useRefreshToken: true,
    setupParams: false,
    deployment: 'aws_lambda_and_dynamoDB'
};
generateTemplate(OAuthAndRefreshConfigWithAWSDeploy);
rimraf.sync(__dirname.replace('bin', OAuthAndRefreshConfigWithAWSDeploy.appName));
console.log('OAuthAndRefreshConfigWithAWSDeploy test successful.');

const OAuthAndRefreshConfigWithHerokuDeploy = {
    appName: 'OAuthAndRefreshConfigWithHerokuDeploy',
    useOAuth: true,
    useRefreshToken: true,
    setupParams: false,
    deployment: 'heroku_with_postgres'
};
generateTemplate(OAuthAndRefreshConfigWithHerokuDeploy);
rimraf.sync(__dirname.replace('bin', OAuthAndRefreshConfigWithHerokuDeploy.appName));
console.log('OAuthAndRefreshConfigWithHerokuDeploy test successful.');

const OAuthNoRefreshConfig = {
    appName: 'OAuthNoRefresh',
    useOAuth: true,
    useRefreshToken: true,
    setupParams: false,
    deployment: 'none'
};
generateTemplate(OAuthNoRefreshConfig);
rimraf.sync(__dirname.replace('bin', OAuthNoRefreshConfig.appName));
console.log('OAuthNoRefresh test successful.');

const NoOAuthConfig = {
    appName: 'NoOAuth',
    useOAuth: true,
    useRefreshToken: true,
    setupParams: false,
    deployment: 'none'
};
generateTemplate(NoOAuthConfig);
rimraf.sync(__dirname.replace('bin', NoOAuthConfig.appName));
console.log('NoOAuth test successful.');

//tests to generate demos
const demoNames = readdirSync(path.resolve(__dirname, '../demos'));
for (const demoName of demoNames) {
    console.log(demoName);
    generateDemo({
        demoType: demoName,
        isTest: true
    });
    rimraf.sync(__dirname.replace('bin', demoName));
}
console.log('demo test successful.');