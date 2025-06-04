#!/bin/bash

# Cập nhật hệ thống và cài đặt các gói cần thiết
sudo yum update -y
sudo yum install -y ruby wget httpd

# Khởi động và enable Apache Web Server
sudo systemctl start httpd
sudo systemctl enable httpd

# Tạo nội dung trang chủ test
echo "Hello" | sudo tee /var/www/html/index.html

# Di chuyển về thư mục home để tải agent
cd /home/ec2-user

# Cài đặt AWS CodeDeploy Agent (chỉnh region nếu không phải us-east-1)
wget https://aws-codedeploy-us-east-1.s3.us-east-1.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto

# Khởi động và enable CodeDeploy Agent
sudo systemctl start codedeploy-agent
sudo systemctl enable codedeploy-agent
