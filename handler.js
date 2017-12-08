'use strict';

const crypto = require('crypto');
const AWS = require('aws-sdk');
const pipeline = new AWS.CodePipeline();
const GithubWebhookValidator = require('lambda-github-webhook-validator');

const validator = new GithubWebhookValidator({
  secret: process.env.SECRET
});

module.exports.awsPipelineTrigger = (event, context, callback) => {

    if (validator.isSignatureValid(event, callback)) {

        const body = JSON.parse(event.body);

        const isReleaseEvent = event.headers['X-GitHub-Event'] === 'release';
        const isPublishEvent = body.action === 'published'
        const release = body.release || {};
        const isDraft = release.draft !== false;

        // Only trigger pipeline if
        if (!isReleaseEvent || !isPublishEvent || isDraft) {
            callback(null, {
                statusCode: 200,
                headers: {
                  "Access-Control-Allow-Credentials" : true
                },
                body: "Not a release Event"
            });

            return;
        }

        pipeline.startPipelineExecution({ name: process.env.PIPELINE_NAME }, (err, data) => {

            if (err) {

                callback(null, {
                    statusCode: 500,
                    headers: {
                      "Access-Control-Allow-Credentials" : true
                    },
                    body: JSON.stringify({ message: error.stack })
                });
            } else {

                callback(null, {
                    statusCode: 200,
                    headers: {
                      "Access-Control-Allow-Credentials" : true
                    },
                    body: "Success"
                });
            }
        });
    }
};
