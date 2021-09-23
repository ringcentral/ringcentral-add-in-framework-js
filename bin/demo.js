const fs = require('fs');
const path = require('path');
const { copyDir } = require('./copyHelper');

exports.generateDemo = (
    {
        demoType
    }) => {
    let projectName = demoType;
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
    // copy demo
    copyDir(
        {
            demoPath: path.resolve(__dirname, '../demos', demoType),
            destinationPath: path.resolve(projectDir)
        }
    );
}