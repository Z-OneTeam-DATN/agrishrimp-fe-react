pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    APP_NAME = 'agrishrimp-fe'
    APP_PORT = '3004'
    NEXT_PUBLIC_API_URL = 'https://api.agrishrimp.io.vn/api'  // absolute URL — bake vào bundle
    NEXT_PUBLIC_APP_URL = 'https://agrishrimp.io.vn'
    NEXT_PUBLIC_BACKEND_ORIGIN = 'https://api.agrishrimp.io.vn'
    NEXT_PUBLIC_SOCKET_URL = 'https://api.agrishrimp.io.vn'
    JAVA_API_URL = 'http://localhost:8004/api'                // server-side SSR
  }

  stages {
    stage('Checkout main') {
      steps {
        checkout scm
        sh 'git checkout main'
        sh 'git pull --ff-only origin main || true'
      }
    }

    stage('Install') {
      steps {
        sh 'chmod +x scripts/deploy.sh'
        sh 'npm ci'
      }
    }

    stage('Build') {
      steps {
        sh 'NEXT_TELEMETRY_DISABLED=1 npm run build'
      }
    }

    stage('Deploy') {
      steps {
        sh './scripts/deploy.sh'
      }
    }

    stage('Health check') {
      steps {
        sh 'sleep 8 && curl -I http://127.0.0.1:${APP_PORT} | head -n1'
      }
    }
  }

  post {
    success {
      echo "FE deployed: http://<server-ip>:${APP_PORT}"
    }
    failure {
      echo 'Build/deploy FE failed. Check console logs.'
    }
  }
}
