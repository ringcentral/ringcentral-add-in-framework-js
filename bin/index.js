#! /usr/bin/env node
const commander = require('commander');
const program = new commander.Command();
const { version } = require('../package.json');

const { generateAppTemplate } = require('./app-template');
const { generateAppDemo } = require('./app-demo');

const { generateBotTemplate } = require('./bot-template');


const { release } = require('./release')
const path = require('path');
const { readdirSync } = require('fs')
const { test } = require('./test');
const inquirer = require('inquirer');

program.version(version).description('RingCentral Add-In Framework');

program
    .command('help')
    .alias('h')
    .description('help:')
    .action(() => {
        console.log('To install an app template:');
        console.log('   npx create-rc-ad-in app');
        console.log('To install an app demo:');
        console.log('   npx create-rc-ad-in app-demo');
        console.log('To install a bot template:');
        console.log('   npx create-rc-ad-in bot');
    });

program
    .command('bot-template')
    .alias('bot')
    .description('install a new bot template')
    .action(() => {
        inquirer
            .prompt([
                {
                    type: 'input',
                    name: 'botName',
                    message: 'Enter bot name:',
                    default: 'bot-template'
                },
                {
                    type: 'confirm',
                    name: 'useInteractiveMessage',
                    message: 'Add interactive message(outbound webhook) support?',
                    default: true
                },
                {
                    type: 'list',
                    name: 'deployment',
                    message: 'We provide a few pre-configured deployment methods. If not listed, please select none, and implement your own deployment method.',
                    choices: ['aws_lambda_and_dynamoDB', 'heroku_with_postgres'],
                }
            ]
            ).then((answers) => {
                generateBotTemplate(answers);
            })
    })

program
    .command('app-template')
    .alias('app')
    .description('install a new app template')
    .action(() => {
        inquirer
            .prompt([
                {
                    type: 'input',
                    name: 'appName',
                    message: 'Enter app name:',
                    default: 'app-template'
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
                },
                {
                    type: 'list',
                    name: 'deployment',
                    message: 'We provide a few pre-configured deployment methods. If not listed, please select none, and implement your own deployment method.',
                    choices: ['none', 'aws_lambda_and_dynamoDB', 'heroku_with_postgres'],
                }
            ])
            .then((answers) => {
                generateAppTemplate(answers);
            })
    });

program
    .command('app-demo')
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
                generateAppDemo(answers);
            })
    }
    );

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
                release(answers);
            })
    });

program
    .command('test')
    .alias('t')
    .action(() => {
        test();
    });

program.parse(process.argv);