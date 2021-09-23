const fs = require('fs');
const path = require('path');
const { copyTemplate, copyFiles, createDirs } = require('./copyHelper');

exports.generateTemplate = (
    {
        appName,
        useOAuth,
        useRefreshToken,
        accessTokenUri,
        authorizationUri,
        clientId,
        clientSecret,
        scopes
    }) => {

    let projectName = appName;
    let projectDir;
    if (!projectName) {
        projectName = path.basename(process.cwd());
        projectDir = process.cwd();
    } else {
        projectDir = path.resolve(process.cwd(), projectName);
    }
    if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir);
    }
    if (fs.existsSync(path.resolve(projectDir, 'package.json'))) {
        throw Error('project existed');
    }

    // create dirs
    createDirs([
        { dirPath: path.resolve(projectDir, 'scripts') },
        { dirPath: path.resolve(projectDir, 'serverless-deploy') },
        { dirPath: path.resolve(projectDir, 'tests') },
        { dirPath: path.resolve(projectDir, 'src') },
        { dirPath: path.resolve(projectDir, 'src/server') },
        { dirPath: path.resolve(projectDir, 'src/server/lib') },
        { dirPath: path.resolve(projectDir, 'src/server/routes') },
        { dirPath: path.resolve(projectDir, 'src/server/views') },
        { dirPath: path.resolve(projectDir, 'src/server/models') },
    ]);
    if (useOAuth) {
        createDirs([
            { dirPath: path.resolve(projectDir, 'src/client') },
            { dirPath: path.resolve(projectDir, 'src/client/components') },
            { dirPath: path.resolve(projectDir, 'src/client/lib') },
            { dirPath: path.resolve(projectDir, 'diagram') },
        ]);
    }

    // copy files
    copyFiles([
        { filePath: path.resolve(__dirname, '../template/.babelrc',), destinationPath: path.resolve(projectDir, '.babelrc') },
        { filePath: path.resolve(__dirname, '../template/jest.config.js',), destinationPath: path.resolve(projectDir, 'jest.config.js') },
        { filePath: path.resolve(__dirname, '../template/[TEMPLATE].env.test',), destinationPath: path.resolve(projectDir, '.env.test') },
        { filePath: path.resolve(__dirname, '../template/template.gitignore',), destinationPath: path.resolve(projectDir, '.gitignore') },
        { filePath: path.resolve(__dirname, '../template/scripts/init-db.js',), destinationPath: path.resolve(projectDir, 'scripts/init-db.js') },
        { filePath: path.resolve(__dirname, '../template/scripts/refresh-db.js',), destinationPath: path.resolve(projectDir, 'scripts/refresh-db.js') },
        { filePath: path.resolve(__dirname, '../template/scripts/serverless-deploy.js',), destinationPath: path.resolve(projectDir, 'scripts/serverless-deploy.js') },
        { filePath: path.resolve(__dirname, '../template/scripts/serverless-build.js',), destinationPath: path.resolve(projectDir, 'scripts/serverless-build.js') },
        { filePath: path.resolve(__dirname, '../template/src/lambda.js',), destinationPath: path.resolve(projectDir, 'src/lambda.js') },
        { filePath: path.resolve(__dirname, '../template/src/run-server.js',), destinationPath: path.resolve(projectDir, 'src/run-server.js') },
        { filePath: path.resolve(__dirname, '../template/src/server.js',), destinationPath: path.resolve(projectDir, 'src/server.js') },
        { filePath: path.resolve(__dirname, '../template/src/server/models/sequelize.js',), destinationPath: path.resolve(projectDir, 'src/server/models/sequelize.js') },
        { filePath: path.resolve(__dirname, '../template/src/server/lib/adaptiveCard.js',), destinationPath: path.resolve(projectDir, 'src/server/lib/adaptiveCard.js') },
        { filePath: path.resolve(__dirname, '../template/tests/setup.js',), destinationPath: path.resolve(projectDir, 'tests/setup.js') },
        { filePath: path.resolve(__dirname, '../template/tests/notification.test.js',), destinationPath: path.resolve(projectDir, 'tests/notification.test.js') },
        { filePath: path.resolve(__dirname, '../template/serverless-deploy/env.default.yml',), destinationPath: path.resolve(projectDir, 'serverless-deploy/env.default.yml') },
        { filePath: path.resolve(__dirname, '../template/serverless-deploy/serverless.default.yml',), destinationPath: path.resolve(projectDir, 'serverless-deploy/serverless.default.yml') },
    ])


    if (useOAuth) {
        copyFiles([
            { filePath: path.resolve(__dirname, '../template/src/client/lib/client.js',), destinationPath: path.resolve(projectDir, 'src/client/lib/client.js') },
            { filePath: path.resolve(__dirname, '../template/src/server/views/oauth-callback.pug',), destinationPath: path.resolve(projectDir, 'src/server/views/oauth-callback.pug') },
            { filePath: path.resolve(__dirname, '../template/src/server/views/style.css',), destinationPath: path.resolve(projectDir, 'src/server/views/style.css') },
            { filePath: path.resolve(__dirname, '../template/src/server/lib/jwt.js',), destinationPath: path.resolve(projectDir, 'src/server/lib/jwt.js') },
            { filePath: path.resolve(__dirname, '../template/[OAuth]README.md',), destinationPath: path.resolve(projectDir, 'README.md') },
            { filePath: path.resolve(__dirname, '../template/[OAuth]diagram/flow.svg',), destinationPath: path.resolve(projectDir, 'diagram/flow.svg') },
            { filePath: path.resolve(__dirname, '../template/src/client/components/Root.jsx',), destinationPath: path.resolve(projectDir, 'src/client/components/Root.jsx') },
            { filePath: path.resolve(__dirname, '../template/src/client/app.js',), destinationPath: path.resolve(projectDir, 'src/client/app.js') },
            { filePath: path.resolve(__dirname, '../template/getWebpackBaseConfig.js',), destinationPath: path.resolve(projectDir, 'getWebpackBaseConfig.js') },
            { filePath: path.resolve(__dirname, '../template/webpack-dev-server.config.js',), destinationPath: path.resolve(projectDir, 'webpack-dev-server.config.js') },
            { filePath: path.resolve(__dirname, '../template/webpack-production.config.js',), destinationPath: path.resolve(projectDir, 'webpack-production.config.js') },
            { filePath: path.resolve(__dirname, '../template/tests/authorization.test.js',), destinationPath: path.resolve(projectDir, 'tests/authorization.test.js') },
        ]);
    }
    else {
        copyFiles([
            { filePath: path.resolve(__dirname, '../template/[NoOAuth]README.md',), destinationPath: path.resolve(projectDir, 'README.md') },
            { filePath: path.resolve(__dirname, '../template/src/server/views/style.css',), destinationPath: path.resolve(projectDir, 'src/server/views/style.css') },
        ]);
    }

    // copy templates

    copyTemplate({
        templatePath: path.resolve(__dirname, '../template/src/server/views/[TEMPLATE]setup.pug',),
        destinationPath: path.resolve(projectDir, 'src/server/views/setup.pug'),
        params: {
            useOAuth: useOAuth
        },
    });

    copyTemplate({
        templatePath: path.resolve(__dirname, '../template/src/server/models/[TEMPLATE]userModel.js',),
        destinationPath: path.resolve(projectDir, 'src/server/models/userModel.js'),
        params: {
            useRefreshToken: useRefreshToken
        },
    });

    copyTemplate({
        templatePath: path.resolve(__dirname, '../template/src/server/models/[TEMPLATE]subscriptionModel.js',),
        destinationPath: path.resolve(projectDir, 'src/server/models/subscriptionModel.js'),
        params: {
            useOAuth: useOAuth
        },
    });

    copyTemplate({
        templatePath: path.resolve(__dirname, '../template/[TEMPLATE]package.json',),
        destinationPath: path.resolve(projectDir, 'package.json'),
        params: {
            name: projectName.replace(/\s/g, ''),
            useOAuth: useOAuth
        },
    });

    copyTemplate({
        templatePath: path.resolve(__dirname, '../template/[TEMPLATE].env',),
        destinationPath: path.resolve(projectDir, '.env'),
        params: {
            useOAuth: useOAuth,
            clientId: clientId,
            clientSecret: clientSecret,
            accessTokenUri: accessTokenUri,
            authorizationUri: authorizationUri,
            scopes: scopes
        },
    });

    copyTemplate({
        templatePath: path.resolve(__dirname, '../template/src/server/[TEMPLATE]index.js',),
        destinationPath: path.resolve(projectDir, 'src/server/index.js'),
        params: {
            useOAuth: useOAuth,
            useRefreshToken: useRefreshToken
        },
    });

    copyTemplate({
        templatePath: path.resolve(__dirname, '../template/src/server/routes/[TEMPLATE]notification.js',),
        destinationPath: path.resolve(projectDir, 'src/server/routes/notification.js'),
        params: {
            useOAuth: useOAuth,
            useRefreshToken: useRefreshToken
        },
    });

    copyTemplate({
        templatePath: path.resolve(__dirname, '../template/src/server/routes/[TEMPLATE]subscription.js',),
        destinationPath: path.resolve(projectDir, 'src/server/routes/subscription.js'),
        params: {
            useOAuth: useOAuth,
            useRefreshToken: useRefreshToken
        },
    });

    copyTemplate({
        templatePath: path.resolve(__dirname, '../template/src/server/routes/[TEMPLATE]view.js',),
        destinationPath: path.resolve(projectDir, 'src/server/routes/view.js'),
        params: {
            useOAuth: useOAuth
        },
    });

    copyTemplate({
        templatePath: path.resolve(__dirname, '../template/src/server/lib/[TEMPLATE]constants.js',),
        destinationPath: path.resolve(projectDir, 'src/server/lib/constants.js'),
        params: {
            useOAuth: useOAuth,
            useRefreshToken: useRefreshToken
        },
    });

    // templated files only for OAuth
    if (useOAuth) {
        copyTemplate({
            templatePath: path.resolve(__dirname, '../template/src/server/lib/[TEMPLATE]oauth.js',),
            destinationPath: path.resolve(projectDir, 'src/server/lib/oauth.js'),
            params: {
                useRefreshToken: useRefreshToken
            },
        });

        copyTemplate({
            templatePath: path.resolve(__dirname, '../template/src/server/routes/[TEMPLATE]authorization.js',),
            destinationPath: path.resolve(projectDir, 'src/server/routes/authorization.js'),
            params: {
                useRefreshToken: useRefreshToken
            },
        });
    }
}