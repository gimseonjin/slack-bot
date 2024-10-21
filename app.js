const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const axios = require('axios');

const app = express();
const port = 8887;

const slackWebhookUrl = 'https://hooks.slack.com/services/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';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const rootPath = "cd /data/lucida-for-docker/polestar/bin && ";

// 서비스 리스트
const serviceList = ['doms', 'builder'];
const serviceMapper = {
    'doms': 'app-doms',
    'builder': 'app-builder'
}

// Helper function to send formatted message to Slack using Block Kit
const sendToSlack = (blocks) => {
    return axios.post(slackWebhookUrl, { blocks })
        .then(() => console.log('Result sent to Slack!'))
        .catch(err => console.error('Failed to send result to Slack:', err.message));
};

// Helper function to execute SSH command and send result to Slack
const executeSSHCommand = (command) => {
    const sshCommand = `ssh root@192.168.213.191 "${command}"`;

    exec(sshCommand, { shell: '/bin/bash', maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        let result;
        if (error) {
            result = `*오류가 발생했습니다* :\n\`${error.message}\``;
        } else if (stderr) {
            result = `*결과 :* \n\`\`\`${stderr}\`\`\``;
        } else {
            result = `*결과 :* \n\`\`\`${stdout}\`\`\``;
        }

        const blocks = [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: result
                }
            }
        ];

        sendToSlack(blocks);
    });
};

// 이쁘게 꾸민 '받았다!' 응답
const sendReceivedMessage = (res) => {
    const blocks = [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "*명령어를 받았습니다!*"
            }
        },
        {
            type: "divider"
        },
        {
            type: "section",
            text: {
                type: "plain_text",
                text: ":white_check_mark: 명령어가 성공적으로 전송되었으며 처리 중입니다.",
                emoji: true
            }
        }
    ];

    return res.send({
        response_type: 'in_channel',
        blocks: blocks
    });
};

// Help 메시지
const sendHelpMessage = (res) => {
    const serviceBlocks = serviceList.map(service => {
        return {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `• \`${service}\``
            }
        };
    });

    const blocks = [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: ":information_source: *사용 가능한 서비스 목록* :"
            }
        },
        ...serviceBlocks
    ];

    return res.send({
        response_type: 'in_channel',
        blocks: blocks
    });
};

// Docker pull endpoint
app.post('/docker/pull', (req, res) => {
    const serviceName = req.body.text;

    const mappedServiceName = serviceMapper[serviceName];
    if (!mappedServiceName) {
        return res.send({
            response_type: 'in_channel',
            text: `알 수 없는 서비스입니다: ${serviceName}`
        });
    }

    const command = `${rootPath} ./script-domain.sh pull ${mappedServiceName}`;
    executeSSHCommand(command);
    return sendReceivedMessage(res);
});

// Docker up endpoint
app.post('/docker/up', (req, res) => {
    const serviceName = req.body.text;

    const mappedServiceName = serviceMapper[serviceName];
    if (!mappedServiceName) {
        return res.send({
            response_type: 'in_channel',
            text: `알 수 없는 서비스입니다: ${serviceName}`
        });
    }

    const command = `${rootPath} ./script-domain.sh up ${mappedServiceName}`;
    executeSSHCommand(command);
    return sendReceivedMessage(res);
});

// Docker logs endpoint
app.post('/docker/logs', (req, res) => {
    const serviceName = req.body.text;

    const mappedServiceName = serviceMapper[serviceName];
    if (!mappedServiceName) {
        return res.send({
            response_type: 'in_channel',
            text: `알 수 없는 서비스입니다: ${serviceName}`
        });
    }

    const command = `${rootPath} docker logs ${mappedServiceName}`;
    executeSSHCommand(command);
    return sendReceivedMessage(res);
});

// Help endpoint
app.post('/help', (req, res) => {
    return sendHelpMessage(res);
});

// Server start
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
