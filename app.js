const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
const port = 8887;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Root path where scripts are located
const rootPath = "cd /data/lucida-for-docker/polestar/bin && ";

// Helper function to execute SSH command
const executeSSHCommand = (command, res) => {
    const sshCommand = `ssh -i /root/.ssh/id_rsa -o StrictHostKeyChecking=no root@192.168.213.191 "${command}"`;

    exec(sshCommand, { shell: '/bin/bash' }, (error, stdout, stderr) => {
        if (error) {
            console.error(error.message)
            return res.send({
                response_type: 'in_channel',
                text: `Error: ${error.message}`
            });
        }

        if (stderr) {
            return res.send({
                response_type: 'in_channel',
                text: `stderr: ${stderr}`
            });
        }

        return res.send({
            response_type: 'in_channel',
            text: `stdout: ${stdout}`
        });
    });
};

// Docker pull endpoint
app.post('/docker/pull/:service_name', (req, res) => {
    const serviceName = req.params.text;
    const command = `${rootPath} ./script-domain.sh pull ${serviceName}`;
    executeSSHCommand(command, res);
});

// Docker up endpoint
app.post('/docker/up/:service_name', (req, res) => {
    const serviceName = req.params.text;
    const command = `${rootPath} ./script-domain.sh up ${serviceName}`;
    executeSSHCommand(command, res);
});

// Docker logs endpoint
app.post('/docker/logs/:service_name', (req, res) => {
    const serviceName = req.params.text;
    const command = `${rootPath} docker logs | grep ${serviceName}`;
    executeSSHCommand(command, res);
});

// Server start
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
