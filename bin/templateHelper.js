const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

exports.copyTemplate = ({ templatePath, destinationPath, params }) => {
    const template = fs.readFileSync(templatePath, { encoding: 'utf8' });
    const codes = ejs.render(template, params);
    fs.writeFileSync(destinationPath, codes);
    console.log('Created: ', destinationPath);
};

exports.copyFiles = (filePaths) => {
    filePaths.forEach(({ filePath, destinationPath }) => {
        const template = fs.readFileSync(filePath, { encoding: 'utf8' });
        fs.writeFileSync(destinationPath, template);
        console.log('Created: ', destinationPath);
    })
};

exports.createDirs = (dirPaths) => {
    dirPaths.forEach(({ dirPath }) => {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }
    });
}
