const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
const port = 8887;

// Body-parser 설정
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// POST 요청을 통해 셸 스크립트 실행
app.post('/cmd', (req, res) => {
    const command = req.body.text; // Slack Slash Command에서 전달된 명령어 또는 스크립트 이름

    if (!command) {
      return res.status(400).send({
        response_type: 'ephemeral',
        text: '실행할 명령어 또는 스크립트 이름을 입력하세요.'
      });
    }
  
    const sshCommand = `ssh -i /root/.ssh/id_rsa -o StrictHostKeyChecking=no root@192.168.213.191 "${command}"`;

    // 명령어 실행
    exec(sshCommand, { shell: '/bin/bash' }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return res.status(500).send({
          response_type: 'in_channel',
          text: `Error: ${error.message}`
        });
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return res.status(500).send({
          response_type: 'in_channel',
          text: `stderr: ${stderr}`
        });
      }
  
      console.log(`${stdout}`);
      return res.send({
        response_type: 'in_channel',
        text: `${stdout}`
      });
    });
  });
  
  app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
  });