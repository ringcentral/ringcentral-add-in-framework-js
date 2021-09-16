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

const copySingleFile = ({ filePath, destinationPath }) => {
    const file = fs.readFileSync(filePath, { encoding: 'utf8' });
    fs.writeFileSync(destinationPath, file);
    console.log('Created: ', destinationPath);
  };

const copyDir = ({ demoPath, destinationPath }) => {
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath);
    }
    const files = fs.readdirSync(demoPath);
    files.forEach((fileName) => {
      const filePath = path.resolve(demoPath, fileName);
      const file = fs.lstatSync(filePath);
      if (file.isDirectory()) {
        copyDir({
          demoPath: filePath,
          destinationPath: path.resolve(destinationPath, fileName),
        });
        return;
      }
      copySingleFile({
        filePath: filePath,
        destinationPath: path.resolve(destinationPath, fileName),
      });
    });
  };

exports.copyDir = copyDir;