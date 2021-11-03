const { generateTemplate } = require('./template');
const rimraf = require("rimraf");

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

const OAuthAndRefreshConfigWithAWSDeploy = {
    appName: 'OAuthAndRefreshConfigWithAWSDeploy',
    useOAuth: true,
    useRefreshToken: true,
    setupParams: false,
    deployment: 'aws_lambda_and_dynamoDB'
};
generateTemplate(OAuthAndRefreshConfigWithAWSDeploy);
rimraf.sync(__dirname.replace('bin', OAuthAndRefreshConfigWithAWSDeploy.appName));

const OAuthAndRefreshConfigWithHerokuDeploy = {
    appName: 'OAuthAndRefreshConfigWithHerokuDeploy',
    useOAuth: true,
    useRefreshToken: true,
    setupParams: false,
    deployment: 'heroku_with_postgres'
};
generateTemplate(OAuthAndRefreshConfigWithHerokuDeploy);
rimraf.sync(__dirname.replace('bin', OAuthAndRefreshConfigWithHerokuDeploy.appName));

const OAuthNoRefreshConfig = {
    appName: 'OAuthNoRefresh',
    useOAuth: true,
    useRefreshToken: true,
    setupParams: false,
    deployment: 'none'
};
generateTemplate(OAuthNoRefreshConfig);
rimraf.sync(__dirname.replace('bin', OAuthNoRefreshConfig.appName));

const NoOAuthConfig = {
    appName: 'NoOAuth',
    useOAuth: true,
    useRefreshToken: true,
    setupParams: false,
    deployment: 'none'
};
generateTemplate(NoOAuthConfig);
rimraf.sync(__dirname.replace('bin', NoOAuthConfig.appName));
