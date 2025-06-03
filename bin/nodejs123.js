#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { WebAppStack } = require('../lib/nodejs123-stack');

const app = new cdk.App();
const envName = app.node.tryGetContext("env") || "dev"; // mặc định là dev

new WebAppStack(app, 'Nodejs123Stack-${envName}', {
envName});
