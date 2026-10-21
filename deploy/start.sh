#!/bin/bash
export PATH=$PATH:/usr/local/bin
cd /home/ec2-user/E-com-site
pm2 start server.js --name ecom
pm2 save