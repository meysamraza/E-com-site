#!/bin/bash
export PATH=$PATH:/usr/local/bin
cd /home/ec2-user/E-com-site
cp /home/ec2-user/app.env .env
npm install --omit=dev