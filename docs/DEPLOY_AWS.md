# ============================================================
# AWS Deployment Guide - SmartDoc AI
# Deploy on: EC2 + RDS PostgreSQL + S3
# ============================================================

# STEP 1: Launch EC2 Instance
# - Go to AWS Console > EC2 > Launch Instance
# - Choose: Ubuntu Server 22.04 LTS (t2.medium or better)
# - Security Group: Allow ports 22, 80, 443, 8000, 3000
# - Download your .pem key file

# STEP 2: Connect to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP

# STEP 3: Install dependencies on EC2
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git python3-pip nginx

# STEP 4: Clone your repo
git clone https://github.com/YOUR_USERNAME/smartdoc-ai.git
cd smartdoc-ai

# STEP 5: Set environment variables
cat > .env << EOF
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/smartdoc
OPENAI_API_KEY=your_openai_api_key_here
EOF

# STEP 6: Launch with Docker Compose
sudo docker-compose up -d --build

# STEP 7: Setup Nginx reverse proxy
sudo tee /etc/nginx/sites-available/smartdoc << 'NGINX'
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
NGINX

sudo ln -s /etc/nginx/sites-available/smartdoc /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# STEP 8: Set up RDS PostgreSQL (optional, for production)
# - AWS Console > RDS > Create Database
# - Engine: PostgreSQL 15
# - Instance: db.t3.micro (free tier)
# - Note the endpoint URL and update DATABASE_URL above

# ============================================================
# QUICK DEPLOY (no RDS - uses Docker PostgreSQL)
# ============================================================
sudo docker-compose up -d --build
# App will be at: http://YOUR_EC2_PUBLIC_IP:3000
# API will be at: http://YOUR_EC2_PUBLIC_IP:8000/docs

# ============================================================
# AWS FREE TIER CHECKLIST
# ============================================================
# ✅ EC2 t2.micro - 750 hours/month free
# ✅ RDS db.t3.micro - 750 hours/month free
# ✅ S3 - 5GB free storage
# ✅ Total cost: $0/month on free tier
