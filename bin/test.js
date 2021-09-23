const { generateTemplate } = require('./template');
const rimraf = require("rimraf");

// Below tests are to attempt generating templates so to verify that no error happens in the process
// Generated templates will be deleted after generation
const OAuthAndRefreshConfig = {
    appName: 'OAuthAndRefresh',
    useOAuth: true,
    useRefreshToken: true,
    setupParams: false
};
generateTemplate(OAuthAndRefreshConfig);
rimraf.sync(__dirname.replace('bin', OAuthAndRefreshConfig.appName));

const OAuthNoRefreshConfig = {
    appName: 'OAuthNoRefresh',
    useOAuth: true,
    useRefreshToken: true,
    setupParams: false
};
generateTemplate(OAuthNoRefreshConfig);
rimraf.sync(__dirname.replace('bin', OAuthNoRefreshConfig.appName));

const NoOAuthConfig = {
    appName: 'NoOAuth',
    useOAuth: true,
    useRefreshToken: true,
    setupParams: false
};
generateTemplate(NoOAuthConfig);
rimraf.sync(__dirname.replace('bin', NoOAuthConfig.appName));
