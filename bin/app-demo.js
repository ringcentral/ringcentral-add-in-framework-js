const fs = require('fs');
const path = require('path');
const { copyFiles } = require('./copyHelper');
const { generateAppTemplate: generateTemplate } = require('./app-template');

exports.generateAppDemo = (
    {
        demoType,
        isTest
    }) => {
    let projectName = demoType;
    let projectDir;
    if (!projectName) {
        projectName = path.basename(process.cwd());
        projectDir = !isTest ? process.cwd() : `${process.cwd()}/test`;
    } else {
        projectDir = path.resolve(process.cwd(), projectName);
    }
    if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir);
    }
    if (fs.existsSync(path.resolve(projectDir, 'package.json'))) {
        throw Error('project existed');
    }
    // get config
    const demoPath = path.resolve(__dirname, '../demos', demoType);
    const config = require(path.resolve(demoPath, 'config.json'));

    // generate base template
    generateTemplate({
        appName: projectName,
        useOAuth: config.useOAuth,
        useRefreshToken: config.useRefreshToken,
        accessTokenUri: config.tokenUri,
        authorizationUri: config.authUri,
        scopes: config.scopes,
        deployment: config.deployment
    });

    // add and overwrite demo files
    for (const file of config.adds) {
        copyFiles([
            { filePath: path.resolve(demoPath, file.fileName), destinationPath: path.resolve(projectDir, file.destination) }
        ]);
    }
    for (const file of config.overwrites) {
        copyFiles([
            { filePath: path.resolve(demoPath, file.fileName), destinationPath: path.resolve(projectDir, file.destination) }
        ]);
    }

    // add additional environment variables if any
    if (config.additionalEnvVar) {
        let envFileText = fs.readFileSync(path.resolve(projectDir, '.env'), 'utf-8');
        let newText = 'IM_SHARED_SECRET=';
        for (const envVar of config.additionalEnvVar) {
            
            newText += `\n\n${envVar.name}=${envVar.value}`;
        }
        envFileText = envFileText.replace('IM_SHARED_SECRET=', newText);
        fs.writeFileSync(path.resolve(projectDir, '.env'), envFileText);
    }
}