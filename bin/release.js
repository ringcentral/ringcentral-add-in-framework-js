const simpleGit = require('simple-git');
const git = simpleGit();
const packageJsonPath = '../package.json';
const packageJson = require(packageJsonPath);
const fs = require('fs');
const npmPublish = require("@jsdevtools/npm-publish");

async function release({
    releaseType,
    commit
}) {
    try {
        console.log(`current version: ${packageJson.version}`);
        const versionNumbers = packageJson.version.split('.');
        let major = versionNumbers[0];
        let minor = versionNumbers[1];
        let patch = versionNumbers[2];
        if (releaseType === "major") {
            major = Number(major) + 1;
        }
        else if (releaseType === "minor") {
            minor = Number(minor) + 1;
        }
        else if (releaseType === "patch") {
            patch = Number(patch) + 1;
        }
        const newVersionNumber = `${major}.${minor}.${patch}`;
        packageJson.version = newVersionNumber;
        console.log(`new version: ${newVersionNumber}`);
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4), function(err){if (err) {
            console.log(`write file failed with ${err}`)
          } else {       
               console.log(`write file successful.`)
          }});
        console.log('package.json version updated.');
        await git.add('*').commit(commit).push().addTag(packageJson.version);
        console.log(`git pushed with tag: ${packageJson.version}`);
        console.log('npm publishing...');
        await npmPublish({
            token: process.env.INPUT_TOKEN
        });
        console.log(`npm published: ${newVersionNumber}`);
    }
    catch (e) {
        console.log(e);
    }
}

exports.release = release;