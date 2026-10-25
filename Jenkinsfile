pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code from GitHub'
                checkout scm
            }
        }

        stage('Test') {
            steps {
                echo 'Running automated application tests'

                sh '''
                    docker run --rm \
                      -u "$(id -u):$(id -g)" \
                      -v "$WORKSPACE:/app" \
                      -w /app \
                      node:22-alpine \
                      sh -c "npm ci --no-audit --no-fund && npm test"
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build \
                      -t docker-cicd-demo:${BUILD_NUMBER} \
                      .
                '''
            }
        }

        stage('Deploy to Staging') {
            steps {
                sh '''
                    docker rm -f docker-cicd-staging 2>/dev/null || true

                    docker run -d \
                      --name docker-cicd-staging \
                      -p 3001:3000 \
                      docker-cicd-demo:${BUILD_NUMBER}

                    for attempt in $(seq 1 15); do
                      if curl -fsS http://127.0.0.1:3001/health; then
                        echo
                        echo "Staging health check passed"
                        exit 0
                      fi
                      sleep 2
                    done

                    docker logs docker-cicd-staging
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            echo 'CI/CD pipeline completed successfully'
        }

        failure {
            echo 'Pipeline failed. Review the stage logs.'
        }
    }
}
