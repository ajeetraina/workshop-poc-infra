export const tutorialData = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn Docker fundamentals and setup your environment',
    steps: [
      {
        id: 'verify-environment',
        number: 1,
        title: 'Verify Your Environment',
        description: 'First, let\'s make sure Docker is properly installed and working in your environment.',
        commands: [
          'docker --version',
          'docker info'
        ],
        notes: ['You should see Docker version information and system details.']
      },
      {
        id: 'check-containers',
        number: 2,
        title: 'Check Running Containers',
        description: 'See what containers are currently running in your isolated environment.',
        commands: [
          'docker ps',
          'docker ps -a'
        ],
        notes: [
          '⚠️ Isolated Environment: Your environment is isolated for security. You\'ll only see containers created within this workshop.'
        ]
      },
      {
        id: 'first-container',
        number: 3,
        title: 'Your First Container',
        description: 'Let\'s run your first container to test the setup.',
        commands: [
          'docker run hello-world'
        ],
        notes: ['This downloads and runs a test container that displays a welcome message.']
      }
    ]
  },
  {
    id: 'containers',
    title: 'Containers',
    description: 'Learn how to create, manage, and interact with Docker containers',
    steps: [
      {
        id: 'interactive-containers',
        number: 4,
        title: 'Interactive Containers',
        description: 'Run an interactive container where you can execute commands.',
        commands: [
          'docker run -it --name my-ubuntu ubuntu bash',
          '# Inside the container, try these commands:',
          'whoami',
          'pwd', 
          'ls -la',
          'cat /etc/os-release',
          'echo "Hello from inside the container!"',
          'exit'
        ],
        notes: []
      },
      {
        id: 'container-lifecycle',
        number: 5,
        title: 'Container Lifecycle',
        description: 'Learn how to manage container lifecycle with start, stop, and remove operations.',
        commands: [
          '# See all containers (running and stopped)',
          'docker ps -a',
          '# Start a stopped container',
          'docker start my-ubuntu',
          '# Stop a running container',
          'docker stop my-ubuntu',
          '# Remove a container',
          'docker rm my-ubuntu'
        ],
        notes: []
      },
      {
        id: 'web-services',
        number: 6,
        title: 'Running Web Services',
        description: 'Start a web server and learn about port mapping.',
        commands: [
          'docker run -d --name webserver -p 8080:80 nginx:alpine',
          '# Test the web server:',
          'curl http://localhost:8080',
          'docker logs webserver'
        ],
        notes: [
          '✅ Port Forwarding: The workshop environment automatically forwards ports, so you can access services via localhost.'
        ]
      }
    ]
  },
  {
    id: 'images',
    title: 'Images & Builds',
    description: 'Learn how to work with Docker images and build your own',
    steps: [
      {
        id: 'exploring-images',
        number: 7,
        title: 'Exploring Images',
        description: 'Understand Docker images and how to manage them.',
        commands: [
          '# List local images',
          'docker images',
          '# Pull a specific image',
          'docker pull node:18-alpine',
          '# Inspect an image',
          'docker inspect node:18-alpine',
          '# See image layers',
          'docker history node:18-alpine'
        ],
        notes: []
      },
      {
        id: 'building-images',
        number: 8,
        title: 'Building Your First Image',
        description: 'Create a simple Dockerfile and build a custom image.',
        commands: [
          '# Create a simple Dockerfile',
          `cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
EOF`,
          '# Build the image:',
          'docker build -t my-app:latest .'
        ],
        notes: []
      }
    ]
  },
  {
    id: 'compose',
    title: 'Multi-Container',
    description: 'Learn to orchestrate multiple containers using Docker Compose',
    steps: [
      {
        id: 'compose-basics',
        number: 9,
        title: 'Docker Compose Basics',
        description: 'Start the multi-container application stack.',
        commands: [
          '# View the compose configuration',
          'cat docker-compose.yml',
          '# Start all services',
          'docker compose up -d',
          '# Check service status',
          'docker compose ps'
        ],
        notes: []
      },
      {
        id: 'service-communication',
        number: 10,
        title: 'Service Communication',
        description: 'Learn how containers communicate in a compose network.',
        commands: [
          '# Execute commands in running containers',
          'docker compose exec workspace bash',
          '# Inside the container, test connectivity:',
          'ping db',
          'nc -z redis 6379',
          'exit',
          '# View service logs:',
          'docker compose logs -f webapp'
        ],
        notes: []
      }
    ]
  },
  {
    id: 'agentic-compose',
    title: 'Agentic Compose',
    description: 'Building AI Agents with Docker',
    steps: [
      {
        id: 'verify-ai-prerequisites',
        number: 13,
        title: 'Verify Docker AI Prerequisites',
        description: 'First, ensure you have Docker\'s AI features properly installed and running.',
        commands: [
          'docker model status',
          'docker compose version',
          'docker model list'
        ],
        notes: ['You should see Docker Model Runner is active and ready to run AI models locally.']
      },
      {
        id: 'clone-agentic-workshop',
        number: 14,
        title: 'Clone the Agentic Compose Workshop',
        description: 'Get the workshop materials and explore the structure.',
        commands: [
          'git clone https://github.com/ajeetraina/workshop-agentic-compose.git',
          'cd workshop-agentic-compose',
          'ls -la',
          'cat compose.yaml'
        ],
        notes: []
      }
    ]
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Explore advanced Docker concepts and debugging techniques',
    steps: [
      {
        id: 'volume-management',
        number: 11,
        title: 'Volume Management',
        description: 'Work with persistent data using volumes.',
        commands: [
          '# Create a volume',
          'docker volume create my-data',
          '# Run container with volume',
          'docker run -it --rm -v my-data:/data ubuntu bash',
          '# Inside container:',
          'echo "Persistent data!" > /data/test.txt',
          'exit',
          '# Verify data persists:',
          'docker run -it --rm -v my-data:/data ubuntu cat /data/test.txt'
        ],
        notes: []
      },
      {
        id: 'debugging-containers',
        number: 12,
        title: 'Debugging Containers',
        description: 'Learn debugging techniques for containerized applications.',
        commands: [
          '# Inspect running containers',
          'docker inspect [container-name]',
          '# View resource usage',
          'docker stats [container-name]',
          '# Debug inside containers',
          'docker exec -it [container-name] sh',
          '# View container processes',
          'docker top [container-name]'
        ],
        notes: []
      }
    ]
  }
];
