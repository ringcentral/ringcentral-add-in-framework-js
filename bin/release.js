#! /usr/bin/env node
const simpleGit = require('simple-git');
const git = simpleGit();
const packageJsonPath = '../package.json';
const packageJson = require(packageJsonPath);
const fs = require('fs').promises;
const { resolve } = require('path');
const { Octokit } = require("@octokit/rest");
const { test } = require('./test')

async function release({
    releaseType,
    commit
}) {
    try {
        console.log('doing release...');
        await test();
        console.log('fetching for changes...');
        const fetchResponse = await git.fetch();

        if (fetchResponse.remote) {
            console.warn('New changes are fetched from the remote. Please pull the latest changes.');
            return;
        }

        console.log('no change from remote, proceed releasing...');

        console.log(`current version: ${packageJson.version}`);
        const versionNumbers = packageJson.version.split('.');
        let major = versionNumbers[0];
        let minor = versionNumbers[1];
        let patch = versionNumbers[2];
        if (releaseType === "major") {
            major = Number(major) + 1;
            minor = 0;
            patch = 0;
        }
        else if (releaseType === "minor") {
            minor = Number(minor) + 1;
            patch = 0;
        }
        else if (releaseType === "patch") {
            patch = Number(patch) + 1;
        }
        const newVersionNumber = `${major}.${minor}.${patch}`;
        const versionTag = `v${newVersionNumber}`;
        packageJson.version = newVersionNumber;
        console.log(`new version: ${newVersionNumber}`);
        await fs.writeFile(resolve(__dirname, packageJsonPath), JSON.stringify(packageJson, null, 4));
        console.log('package.json version updated.');
        await git.add('*').commit(commit).push().addTag(versionTag);
        console.log(`git pushed with tag: ${versionTag}`);

        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        await octokit.rest.repos.createRelease({
            owner: process.env.GITHUB_OWNER,
            repo: 'ringcentral-add-in-framework-js',
            tag_name: versionTag,
            name: versionTag,
            body: commit
        });
    }
    catch (e) {
        console.log(e);
    }
}

exports.release = release;