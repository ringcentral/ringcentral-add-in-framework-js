const fs = require('fs');
const path = require('path');
const { copyTemplate, copyFiles, createDirs } = require('./copyHelper');

exports.generateBotTemplate = (
    {
        botName,
        useInteractiveMessage,
        deployment
    }
) => {
    let projectName = botName;
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
        { dirPath: path.resolve(projectDir, 'src') },
        { dirPath: path.resolve(projectDir, 'src/adaptiveCards') },
        { dirPath: path.resolve(projectDir, 'src/handlers') },
        { dirPath: path.resolve(projectDir, 'src/models') },
        { dirPath: path.resolve(projectDir, 'tests') }
    ]);
    if (useInteractiveMessage) {
        createDirs([
            { dirPath: path.resolve(projectDir, 'src/static') }
        ]);
    }

    // copy files
    copyFiles([
        { filePath: path.resolve(__dirname, '../botTemplate/src/adaptiveCards/textCard.json',), destinationPath: path.resolve(projectDir, 'src/adaptiveCards/textCard.json') },
        { filePath: path.resolve(__dirname, '../botTemplate/src/models/testModel.js',), destinationPath: path.resolve(projectDir, 'src/models/testModel.js') },
        { filePath: path.resolve(__dirname, '../botTemplate/tests/botHandler.test.js',), destinationPath: path.resolve(projectDir, 'tests/botHandler.test.js') },
        { filePath: path.resolve(__dirname, '../botTemplate/tests/cardHandler.test.js',), destinationPath: path.resolve(projectDir, 'tests/cardHandler.test.js') },
        { filePath: path.resolve(__dirname, '../botTemplate/tests/setup.js',), destinationPath: path.resolve(projectDir, 'tests/setup.js') },
        { filePath: path.resolve(__dirname, '../botTemplate/.env.test',), destinationPath: path.resolve(projectDir, '.env.test') },
        { filePath: path.resolve(__dirname, '../botTemplate/jest.config.js',), destinationPath: path.resolve(projectDir, 'jest.config.js') },
        { filePath: path.resolve(__dirname, '../botTemplate/src/server.js',), destinationPath: path.resolve(projectDir, 'src/server.js') },
    ]);

    if (useInteractiveMessage) {
        copyFiles([
            { filePath: path.resolve(__dirname, '../botTemplate/src/handlers/cardHandler.js',), destinationPath: path.resolve(projectDir, 'src/handlers/cardHandler.js') },
            { filePath: path.resolve(__dirname, '../botTemplate/src/adaptiveCards/submitCard.json',), destinationPath: path.resolve(projectDir, 'src/adaptiveCards/submitCard.json') },
            { filePath: path.resolve(__dirname, '../botTemplate/src/adaptiveCards/openDialogCard.json',), destinationPath: path.resolve(projectDir, 'src/adaptiveCards/openDialogCard.json') },
            { filePath: path.resolve(__dirname, '../botTemplate/src/static/dialog.html',), destinationPath: path.resolve(projectDir, 'src/static/dialog.html') },
        ]);
    }

    // copy templates
    copyTemplate({
        templatePath: path.resolve(__dirname, '../botTemplate/src/[TEMPLATE]index.js',),
        destinationPath: path.resolve(projectDir, 'src/index.js'),
        params: {
            useInteractiveMessage: useInteractiveMessage
        },
    });
    copyTemplate({
        templatePath: path.resolve(__dirname, '../botTemplate/src/handlers/[TEMPLATE]botHandler.js',),
        destinationPath: path.resolve(projectDir, 'src/handlers/botHandler.js'),
        params: {
            useInteractiveMessage: useInteractiveMessage
        },
    });
    copyTemplate({
        templatePath: path.resolve(__dirname, '../botTemplate/src/models/[TEMPLATE]sequelize.js',),
        destinationPath: path.resolve(projectDir, 'src/models/sequelize.js'),
        params: {
            deployment: deployment
        },
    });

    copyTemplate({
        templatePath: path.resolve(__dirname, '../botTemplate/[TEMPLATE]package.json',),
        destinationPath: path.resolve(projectDir, 'package.json'),
        params: {
            name: botName,
            useInteractiveMessage: useInteractiveMessage,
            deployment: deployment
        },
    });

    copyTemplate({
        templatePath: path.resolve(__dirname, '../botTemplate/[TEMPLATE].env',),
        destinationPath: path.resolve(projectDir, '.env'),
        params: {
            name: botName,
            useInteractiveMessage: useInteractiveMessage
        },
    });

    copyTemplate({
        templatePath: path.resolve(__dirname, '../botTemplate/[TEMPLATE]README.md',),
        destinationPath: path.resolve(projectDir, 'README.md'),
        params: {
            useInteractiveMessage: useInteractiveMessage,
            deployment: deployment
        },
    });

    switch (deployment) {
        case 'none':
            break;
        case 'aws_lambda_and_dynamoDB':
            createDirs([
                { dirPath: path.resolve(projectDir, 'serverless-deploy') },
                { dirPath: path.resolve(projectDir, 'scripts') },
            ]);
            copyFiles([
                { filePath: path.resolve(__dirname, '../botTemplate/scripts/serverless-deploy.js',), destinationPath: path.resolve(projectDir, 'scripts/serverless-deploy.js') },
                { filePath: path.resolve(__dirname, '../botTemplate/scripts/serverless-build.js',), destinationPath: path.resolve(projectDir, 'scripts/serverless-build.js') },
                { filePath: path.resolve(__dirname, '../botTemplate/serverless-deploy/env.sample.yml',), destinationPath: path.resolve(projectDir, 'serverless-deploy/env.yml') },
                { filePath: path.resolve(__dirname, '../botTemplate/serverless-deploy/serverless.sample.yml',), destinationPath: path.resolve(projectDir, 'serverless-deploy/serverless.yml') },
                { filePath: path.resolve(__dirname, '../botTemplate/src/lambda.js',), destinationPath: path.resolve(projectDir, 'src/lambda.js') },
            ]);
            break;
        case 'heroku_with_postgres':
            copyFiles([
                { filePath: path.resolve(__dirname, '../botTemplate/app.json',), destinationPath: path.resolve(projectDir, 'app.json') },
                { filePath: path.resolve(__dirname, '../botTemplate/Procfile',), destinationPath: path.resolve(projectDir, 'Procfile') },
            ]);
            break;
    }

}