#! /usr/bin/env node
const commander = require('commander');
const program = new commander.Command();
const { version } = require('../package.json');
const { generateTemplate } = require('./template');
const { release } = require('./release')
const path = require('path');
const { readdirSync } = require('fs')

const inquirer = require('inquirer');
const { generateDemo } = require('./demo');

program.version(version).description('RingCentral Add-In Framework');

program
    .command('template')
    .alias('t')
    .description('install a new template')
    .action(() => {
        inquirer
            .prompt([
                {
                    type: 'input',
                    name: 'appName',
                    message: 'Enter app name:',
                    default: 'template'
                },
                {
                    type: 'confirm',
                    name: 'useOAuth',
                    message: 'Use OAuth?',
                    default: false
                },
                {
                    type: 'confirm',
                    name: 'useRefreshToken',
                    message: 'Use refresh token?',
                    default: false,
                    when: (answers) => answers.useOAuth
                }, {
                    type: 'confirm',
                    name: 'setupParams',
                    message: 'Do you want to setup 3rd party config now?',
                    default: false,
                    when: (answers) => answers.useOAuth
                },
                {
                    type: 'input',
                    name: 'authorizationUri',
                    message: '3rd party authorization uri(optional):',
                    default: '',
                    when: (answers) => answers.useOAuth && answers.setupParams
                },
                {
                    type: 'input',
                    name: 'accessTokenUri',
                    message: '3rd party access token uri(optional):',
                    default: '',
                    when: (answers) => answers.useOAuth && answers.setupParams
                },
                {
                    type: 'input',
                    name: 'clientId',
                    message: '3rd party app client id(optional):',
                    default: '',
                    when: (answers) => answers.useOAuth && answers.setupParams
                },
                {
                    type: 'input',
                    name: 'clientSecret',
                    message: '3rd party app client secret(optional):',
                    default: '',
                    when: (answers) => answers.useOAuth && answers.setupParams
                },
                {
                    type: 'input',
                    name: 'scopes',
                    message: '3rd party app scopes, separate with ","(optional):',
                    default: '',
                    when: (answers) => answers.useOAuth && answers.setupParams
                }
            ])
            .then((answers) => {
                generateTemplate(answers);
            })
    });

program
    .command('demo')
    .alias('d')
    .description('install a new demo')
    .action(() => {
        inquirer
            .prompt([
                {
                    type: 'list',
                    name: 'demoType',
                    message: 'Which demo your want to install?',
                    choices: readdirSync(path.resolve(__dirname, '../demos')),
                }
            ])
            .then((answers) => {
                generateDemo(answers);
            })
    }
    );

program
    .command('test')
    .description('simple test for template installation')
    .action(() => {
        let answers = {
            appName: '1',
            useOAuth: true,
            useRefreshToken: true,
            setupParams: false
        };
        generateTemplate(answers);
        answers = {
            appName: '2',
            useOAuth: true,
            useRefreshToken: false,
            setupParams: false
        };
        generateTemplate(answers);
        answers = {
            appName: '3',
            useOAuth: false,
            setupParams: false
        }
        generateTemplate(answers);
    });

program
    .command('release')
    .alias('r')
    .description('create a new release')
    .action(() => {
        inquirer
            .prompt([
                {
                    type: 'list',
                    name: 'releaseType',
                    message: 'Choose a release type:',
                    choices: [
                        'major',
                        'minor',
                        'patch'
                    ],
                },
                {
                    type: 'input',
                    name: 'commit',
                    message: 'Enter commit description:',
                    default: ''
                },
            ])
            .then((answers) => {
                console.log('doing release...');
                release(answers);
            })
    });

program.parse(process.argv);