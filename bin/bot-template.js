const fs = require('fs');
const path = require('path');
const { copyTemplate, copyFiles, createDirs } = require('./copyHelper');

exports.generateBotTemplate = (
    {
        botName,
        useInteractiveMessage
    }
) => {
    let projectName = botName;
    let projectDir;
    const isWin = process.platform === "win32";
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
        { dirPath: path.resolve(projectDir, 'src/handlers') }
    ]);

    // copy files
    copyFiles([
        { filePath: path.resolve(__dirname, '../botTemplate/sample.env',), destinationPath: path.resolve(projectDir, '.env') },
        { filePath: path.resolve(__dirname, '../botTemplate/src/adaptiveCards/textCard.json',), destinationPath: path.resolve(projectDir, 'src/adaptiveCards/textCard.json') },
    ]);

    if (useInteractiveMessage) {
        copyFiles([
            { filePath: path.resolve(__dirname, '../botTemplate/src/handlers/cardHandler.js',), destinationPath: path.resolve(projectDir, 'src/handlers/cardHandler.js') },
            { filePath: path.resolve(__dirname, '../botTemplate/src/adaptiveCards/updateButtonCard.json',), destinationPath: path.resolve(projectDir, 'src/adaptiveCards/updateButtonCard.json') },
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
        templatePath: path.resolve(__dirname, '../botTemplate/[TEMPLATE]package.json',),
        destinationPath: path.resolve(projectDir, 'package.json'),
        params: {
            botName: botName,
            useInteractiveMessage: useInteractiveMessage
        },
    });

}