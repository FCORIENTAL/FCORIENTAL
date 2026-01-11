# FC ORIENTAL 풋살 앱 AWS 배포 가이드

## 1. EC2를 이용한 배포 (권장)

### 1-1. EC2 인스턴스 생성
1. AWS Console에서 EC2 서비스로 이동
2. "인스턴스 시작" 클릭
3. 다음 설정으로 인스턴스 생성:
   - AMI: Ubuntu Server 22.04 LTS
   - 인스턴스 유형: t3.micro (프리티어) 또는 t3.small
   - 키 페어: 새로 생성하거나 기존 키 사용
   - 보안 그룹: HTTP(80), HTTPS(443), SSH(22) 포트 열기

### 1-2. 서버 환경 설정
```bash
# EC2 인스턴스에 SSH 접속
ssh -i your-key.pem ubuntu@your-ec2-ip

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Node.js 20 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 설치 (프로세스 관리자)
sudo npm install -g pm2

# Nginx 설치
sudo apt install nginx -y
```

### 1-3. 앱 배포
```bash
# 프로젝트 클론 (Git 사용 시)
git clone your-repository-url
cd your-project

# 또는 파일 직접 업로드
scp -i your-key.pem -r ./project-folder ubuntu@your-ec2-ip:~/

# 의존성 설치 및 빌드
npm install
npm run build

# PM2로 앱 실행
pm2 start "npm run start" --name "fc-oriental-app"
pm2 startup
pm2 save
```

### 1-4. Nginx 설정
```bash
sudo nano /etc/nginx/sites-available/fc-oriental
```

다음 내용 추가:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 도메인이 있는 경우

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 설정 활성화
sudo ln -s /etc/nginx/sites-available/fc-oriental /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 2. AWS App Runner를 이용한 배포 (더 쉬운 방법)

### 2-1. 소스 코드를 GitHub에 업로드
1. GitHub 리포지토리 생성
2. 프로젝트 코드 푸시

### 2-2. App Runner 서비스 생성
1. AWS Console에서 App Runner 검색
2. "서비스 생성" 클릭
3. 소스: GitHub 연결
4. 런타임: Node.js 20
5. 빌드 명령어: `npm install && npm run build`
6. 시작 명령어: `npm run start`
7. 포트: 5000

## 3. Elastic Beanstalk를 이용한 배포

### 3-1. 앱 패키징
```bash
# 프로젝트 루트에서
zip -r fc-oriental-app.zip . -x "node_modules/*" ".git/*"
```

### 3-2. Elastic Beanstalk 배포
1. AWS Console에서 Elastic Beanstalk 검색
2. "애플리케이션 생성" 클릭
3. 플랫폼: Node.js
4. 소스 코드: fc-oriental-app.zip 업로드
5. 배포 클릭

## 4. Docker를 이용한 배포

### 4-1. Docker 이미지 빌드
```bash
# 로컬에서 이미지 빌드
docker build -t fc-oriental-app .

# 이미지 테스트
docker run -p 5000:5000 fc-oriental-app
```

### 4-2. ECR에 이미지 업로드
```bash
# ECR 리포지토리 생성
aws ecr create-repository --repository-name fc-oriental-app

# 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin your-account.dkr.ecr.ap-northeast-2.amazonaws.com

# 태그 및 푸시
docker tag fc-oriental-app:latest your-account.dkr.ecr.ap-northeast-2.amazonaws.com/fc-oriental-app:latest
docker push your-account.dkr.ecr.ap-northeast-2.amazonaws.com/fc-oriental-app:latest
```

### 4-3. ECS에서 실행
1. ECS 클러스터 생성
2. 태스크 정의 생성 (ECR 이미지 사용)
3. 서비스 생성 및 실행

## 5. 환경 변수 설정

모든 배포 방법에서 다음 환경 변수 설정 필요:
```bash
NODE_ENV=production
PORT=5000
```

## 6. HTTPS 설정 (선택사항)

### SSL 인증서 적용
```bash
# Let's Encrypt 사용
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 추천 배포 순서

1. **초보자**: AWS App Runner → 가장 간단
2. **중급자**: EC2 + PM2 + Nginx → 유연성과 제어권
3. **고급자**: Docker + ECS → 확장성과 관리 편의성

## 7. CI/CD 자동화 (GitHub Actions)

프로젝트에 포함된 `.github/workflows/aws-deploy.yml` 파일을 사용하여 GitHub에 코드를 푸시할 때마다 자동으로 AWS ECR로 이미지를 빌드하고 푸시할 수 있습니다.

### 설정 방법:
1. GitHub 리포지토리의 **Settings > Secrets and variables > Actions**로 이동합니다.
2. 다음 Repository secrets를 추가합니다:
   - `AWS_ACCESS_KEY_ID`: AWS IAM 사용자의 액세스 키
   - `AWS_SECRET_ACCESS_KEY`: AWS IAM 사용자의 비밀 액세스 키
   - `AWS_APP_RUNNER_SERVICE_ARN`: (App Runner 사용 시) 서비스의 ARN

이 설정이 완료되면 `main` 브랜치에 푸시할 때마다 자동으로 배포 프로세스가 시작됩니다.
