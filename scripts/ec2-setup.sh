#!/bin/bash

# Update the system
sudo yum update -y

# Install development tools
sudo yum groupinstall "Development Tools" -y

# Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
nvm install 16
nvm use 16
nvm alias default 16

# Install PM2 globally
npm install -g pm2

# Install other necessary tools
sudo yum install -y git unzip nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure Nginx
sudo tee /etc/nginx/conf.d/quickotech.conf << 'EOL'
server {
    listen 80;
    server_name _;

    # Increase max body size for file uploads
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOL

# Remove default Nginx config
sudo rm -f /etc/nginx/conf.d/default.conf

# Create application directory
mkdir -p ~/quickotech-backend

# Create logs directory
mkdir -p ~/quickotech-backend/logs

# Set up environment variables
cat > ~/quickotech-backend/.env << EOL
NODE_ENV=production
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=quicko-store
AWS_ACCESS_KEY_ID=AKIA3LET52FHTV4IUCWW
AWS_SECRET_ACCESS_KEY=OKabyzHy9lOeT+9uNsKGmJpINVy7YYc5DJX4zorM
EOL

# Secure the .env file
chmod 600 ~/quickotech-backend/.env

# Set up PM2 ecosystem file
cat > ~/quickotech-backend/ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: 'quickotech-backend',
    script: 'src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true
  }]
}
EOL

# Set up PM2 to start on system boot
pm2 startup
sudo env PATH=$PATH:/home/ec2-user/.nvm/versions/node/v16.x/bin /home/ec2-user/.nvm/versions/node/v16.x/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user

# Restart Nginx
sudo systemctl restart nginx

# Print setup completion message
echo "EC2 setup completed successfully!"
echo "Next steps:"
echo "1. Update the .env file with your actual MongoDB URI and JWT secret"
echo "2. Deploy your application using GitHub Actions"
echo "3. Monitor the application using: pm2 monit" 