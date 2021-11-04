
const { Octokit } = require("@octokit/rest");
const releaseVersionName = `v1.1.1`;
const packageJsonPath = './package.json';
const packageJson = require(packageJsonPath);

async function test(){

    const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN
    });
    const releaseBody = {
        owner: process.env.GITHUB_OWNER,
        repo: packageJson.name,
        tag_name: releaseVersionName,
        name: 'test release',
        body: 'test body'
    };
    console.log(releaseBody)
    await octokit.rest.repos.createRelease(releaseBody);
}

test();