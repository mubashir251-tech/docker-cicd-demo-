pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        DOCKERHUB_IMAGE = 'lovehashim/docker-cicd-demo'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
            steps {
                sh '''
                    docker run --rm \
                      -u "$(id -u):$(id -g)" \
                      -e HOME=/tmp \
                      -e npm_config_cache=/tmp/npm-cache \
                      -v "$WORKSPACE:/src:ro" \
                      node:22-alpine \
                      sh -c '
                        mkdir -p /tmp/project &&
                        cp /src/package.json /src/package-lock.json \
                           /src/app.js /src/app.test.js /tmp/project/ &&
                        cd /tmp/project &&
                        npm ci --no-audit --no-fund &&
                        npm test
                      '
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

        stage('Push to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKERHUB_USERNAME',
                        passwordVariable: 'DOCKERHUB_TOKEN'
                    )
                ]) {
                    sh '''
                        set +x
                        echo "$DOCKERHUB_TOKEN" | docker login \
                          --username "$DOCKERHUB_USERNAME" \
                          --password-stdin

                        docker tag docker-cicd-demo:${BUILD_NUMBER} \
                          "$DOCKERHUB_IMAGE:${BUILD_NUMBER}"

                        docker tag docker-cicd-demo:${BUILD_NUMBER} \
                          "$DOCKERHUB_IMAGE:latest"

                        docker push "$DOCKERHUB_IMAGE:${BUILD_NUMBER}"
                        docker push "$DOCKERHUB_IMAGE:latest"

                        docker logout
                    '''
                }
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

        always {
            sh 'docker logout >/dev/null 2>&1 || true'
        }
    }
}
