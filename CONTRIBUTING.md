# Contributing to Workshop POC React Conversion

Thank you for your interest in contributing to the Workshop POC React conversion! This guide will help you get started with development and contribution.

## 🚀 Quick Start

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/workshop-poc-infra.git
   cd workshop-poc-infra
   git checkout react-conversion
   ```

2. **Setup Development Environment**
   ```bash
   chmod +x dev-setup.sh
   ./dev-setup.sh
   ```

3. **Start Development**
   ```bash
   # Option 1: Full Docker environment
   docker compose -f compose-react.yaml up -d
   
   # Option 2: Local development
   cd frontend && npm run dev &
   cd backend && npm run dev &
   ```

## 📁 Project Structure

```
workshop-poc-infra/
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── TutorialPanel.jsx
│   │   │   ├── VSCodePanel.jsx
│   │   │   └── FileExplorer.jsx
│   │   ├── data/              # Static data
│   │   └── test/              # Test utilities
│   ├── Dockerfile             # Production build
│   └── package.json
│
├── backend/                     # Express.js backend
│   ├── adapters/              # Swappable file system adapters
│   │   ├── localFileSystem.js
│   │   ├── remoteFileSystem.js
│   │   └── containerFileSystem.js
│   ├── tests/                 # Backend tests
│   └── server.js
│
├── .github/workflows/          # CI/CD pipelines
└── compose-react.yaml         # Docker Compose config
```

## 🛠 Development Guidelines

### Frontend (React)

#### Component Structure
- Keep components focused and single-purpose
- Use functional components with hooks
- Implement proper prop validation
- Follow React best practices

#### Styling
- Use CSS modules or styled-components
- Maintain responsive design
- Follow consistent naming conventions
- Use CSS custom properties for theming

#### State Management
- Use React hooks for local state
- Consider context for global state
- Avoid prop drilling
- Keep state close to where it's used

### Backend (Express.js)

#### API Design
- Follow RESTful conventions
- Use proper HTTP status codes
- Implement comprehensive error handling
- Document all endpoints

#### File System Adapters
- Implement the adapter interface consistently
- Provide both real and mock implementations
- Handle errors gracefully
- Include comprehensive logging

#### Security
- Validate all inputs
- Sanitize file paths
- Implement rate limiting
- Use proper CORS configuration

### Testing

#### Frontend Testing
- Write unit tests for components
- Test user interactions
- Mock external dependencies
- Maintain good test coverage

#### Backend Testing
- Test all API endpoints
- Test adapter implementations
- Include integration tests
- Test error conditions

### Code Style

#### JavaScript/React
- Use ESLint configuration provided
- Follow consistent naming conventions
- Write meaningful comments
- Use modern ES6+ features

#### File Naming
- Components: PascalCase (e.g., `TutorialPanel.jsx`)
- Utilities: camelCase (e.g., `fileUtils.js`)
- Constants: UPPER_SNAKE_CASE
- CSS files: kebab-case

## 🧪 Testing

### Running Tests
```bash
# Frontend tests
cd frontend
npm test                    # Run tests once
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage

# Backend tests
cd backend
npm test                   # Run tests once
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage
```

### Writing Tests
- Write tests for new features
- Update tests for modified code
- Ensure tests are deterministic
- Mock external dependencies

### Test Coverage
- Aim for >80% test coverage
- Focus on critical paths
- Don't sacrifice quality for coverage
- Include edge cases

## 📝 Pull Request Process

### Before Submitting
1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Run Tests**
   ```bash
   npm test  # In both frontend and backend
   ```

3. **Run Linting**
   ```bash
   npm run lint  # In both directories
   ```

4. **Test Docker Build**
   ```bash
   docker compose -f compose-react.yaml build
   ```

### PR Guidelines
- **Clear Title**: Describe what the PR does
- **Detailed Description**: Explain the changes and why
- **Link Issues**: Reference related issues
- **Screenshots**: Include for UI changes
- **Testing**: Describe how you tested
- **Breaking Changes**: Highlight any breaking changes

### PR Checklist
- [ ] Tests pass locally
- [ ] Linting passes
- [ ] Docker builds successfully
- [ ] Documentation updated
- [ ] Screenshots included (if UI changes)
- [ ] No breaking changes (or documented)

## 🔧 Backend Adapter Development

### Creating New Adapters

1. **Implement Interface**
   ```javascript
   class YourAdapter {
     constructor() {
       this.description = 'Your adapter description';
       this.capabilities = ['read', 'write', 'delete', 'create'];
     }

     async listFiles(path) { /* implementation */ }
     async getFileContent(path) { /* implementation */ }
     async createItem(path, type, content) { /* implementation */ }
     async deleteItem(path) { /* implementation */ }
   }
   ```

2. **Add to Server**
   ```javascript
   // In backend/server.js
   const backends = {
     local: require('./adapters/localFileSystem'),
     remote: require('./adapters/remoteFileSystem'),
     your_adapter: require('./adapters/yourAdapter')
   };
   ```

3. **Write Tests**
   ```javascript
   describe('Your Adapter', () => {
     it('should list files', async () => {
       // Test implementation
     });
   });
   ```

### Adapter Guidelines
- Handle errors gracefully
- Provide meaningful error messages
- Implement security checks
- Support async operations
- Include mock data for development

## 🎨 Frontend Component Development

### Creating Components
1. **Component File Structure**
   ```
   components/
   ├── YourComponent/
   │   ├── YourComponent.jsx
   │   ├── YourComponent.css
   │   ├── YourComponent.test.jsx
   │   └── index.js
   ```

2. **Component Template**
   ```jsx
   import React, { useState, useEffect } from 'react';
   import './YourComponent.css';

   const YourComponent = ({ prop1, prop2, onEvent }) => {
     const [state, setState] = useState(initialValue);

     useEffect(() => {
       // Side effects
     }, [dependencies]);

     return (
       <div className="your-component">
         {/* Component JSX */}
       </div>
     );
   };

   export default YourComponent;
   ```

### Component Guidelines
- Keep components small and focused
- Use meaningful prop names
- Implement proper error boundaries
- Handle loading and error states
- Make components reusable

## 🐛 Debugging

### Frontend Debugging
- Use React Developer Tools
- Check browser console
- Use breakpoints in dev tools
- Inspect network requests

### Backend Debugging
- Check server logs
- Use debugger statements
- Test API endpoints with curl
- Check Docker container logs

### Common Issues
1. **Port conflicts**: Check if ports 8080, 8000, 8085 are available
2. **Docker issues**: Ensure Docker is running
3. **Permission errors**: Check file permissions in containers
4. **Network issues**: Verify container networking

## 📚 Documentation

### What to Document
- New features and APIs
- Breaking changes
- Configuration options
- Troubleshooting steps
- Development workflows

### Documentation Style
- Use clear, concise language
- Include code examples
- Provide step-by-step instructions
- Update README files
- Add inline code comments

## 🔒 Security Considerations

### File System Security
- Validate all file paths
- Prevent directory traversal
- Limit file access scope
- Sanitize user inputs

### API Security
- Implement input validation
- Use proper error handling
- Limit request sizes
- Implement rate limiting

### Container Security
- Use non-root users
- Minimize attack surface
- Keep dependencies updated
- Scan for vulnerabilities

## 🚀 Release Process

### Versioning
- Follow semantic versioning (SemVer)
- Update version in package.json files
- Tag releases in git
- Update CHANGELOG.md

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version bumped
- [ ] CHANGELOG updated
- [ ] Docker images built
- [ ] Security scan completed

## 📞 Getting Help

### Where to Ask
- **Issues**: For bugs and feature requests
- **Discussions**: For questions and ideas
- **Discord/Slack**: For real-time chat (if available)

### What to Include
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Relevant logs or screenshots

## 🏆 Recognition

Contributors will be:
- Listed in the project README
- Mentioned in release notes
- Invited to join the contributor team
- Given credit in documentation

Thank you for contributing to Workshop POC! 🎉
