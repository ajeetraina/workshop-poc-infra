const request = require('supertest');
const app = require('../server');

describe('API Routes', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('backends');
      expect(Array.isArray(response.body.backends)).toBe(true);
    });
  });

  describe('GET /api/backends', () => {
    it('should return available backends', async () => {
      const response = await request(app)
        .get('/api/backends')
        .expect(200);

      expect(response.body).toHaveProperty('backends');
      expect(Array.isArray(response.body.backends)).toBe(true);
      
      const backendNames = response.body.backends.map(b => b.name);
      expect(backendNames).toContain('local');
      expect(backendNames).toContain('remote');
      expect(backendNames).toContain('container');
    });
  });

  describe('POST /api/backend/switch', () => {
    it('should switch to valid backend', async () => {
      const response = await request(app)
        .post('/api/backend/switch')
        .send({ backend: 'local' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('backend', 'local');
    });

    it('should reject invalid backend', async () => {
      const response = await request(app)
        .post('/api/backend/switch')
        .send({ backend: 'invalid' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('availableBackends');
    });
  });

  describe('GET /api/files', () => {
    it('should list files with default backend', async () => {
      const response = await request(app)
        .get('/api/files?path=/')
        .expect(200);

      expect(response.body).toHaveProperty('files');
      expect(response.body).toHaveProperty('path', '/');
      expect(response.body).toHaveProperty('backend');
      expect(Array.isArray(response.body.files)).toBe(true);
    });

    it('should list files with specific backend', async () => {
      const response = await request(app)
        .get('/api/files?path=/&backend=remote')
        .expect(200);

      expect(response.body).toHaveProperty('backend', 'remote');
      expect(response.body).toHaveProperty('files');
    });

    it('should handle invalid backend gracefully', async () => {
      const response = await request(app)
        .get('/api/files?path=/&backend=invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/files/content', () => {
    it('should require file path', async () => {
      const response = await request(app)
        .get('/api/files/content')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'File path is required');
    });

    it('should get file content with valid path', async () => {
      const response = await request(app)
        .get('/api/files/content?path=/test.txt&backend=remote')
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('path', '/test.txt');
      expect(response.body).toHaveProperty('backend', 'remote');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not found');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/backend/switch')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });
  });
});

describe('Backend Adapters', () => {
  const localAdapter = require('../adapters/localFileSystem');
  const remoteAdapter = require('../adapters/remoteFileSystem');
  const containerAdapter = require('../adapters/containerFileSystem');

  describe('Local File System Adapter', () => {
    it('should have required properties', () => {
      expect(localAdapter).toHaveProperty('description');
      expect(localAdapter).toHaveProperty('capabilities');
      expect(Array.isArray(localAdapter.capabilities)).toBe(true);
    });

    it('should handle path normalization', () => {
      expect(() => localAdapter.getSafePath('../../../etc/passwd')).toThrow();
      expect(localAdapter.getSafePath('/safe/path')).toBe('safe/path');
      expect(localAdapter.getSafePath('relative/path')).toBe('relative/path');
    });
  });

  describe('Remote File System Adapter', () => {
    it('should have required properties', () => {
      expect(remoteAdapter).toHaveProperty('description');
      expect(remoteAdapter).toHaveProperty('capabilities');
    });

    it('should return mock data for development', async () => {
      const files = await remoteAdapter.listFiles('/');
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should generate appropriate mock content', async () => {
      const content = await remoteAdapter.getFileContent('/test.md');
      expect(content).toContain('Remote File');
      expect(content).toContain('/test.md');
    });
  });

  describe('Container File System Adapter', () => {
    it('should have required properties', () => {
      expect(containerAdapter).toHaveProperty('description');
      expect(containerAdapter).toHaveProperty('capabilities');
    });

    it('should handle container check failures gracefully', async () => {
      // This will fail because we're not in a Docker environment during tests
      try {
        await containerAdapter.checkContainer();
      } catch (error) {
        expect(error.message).toContain('Container check failed');
      }
    });

    it('should parse ls output correctly', () => {
      const mockLsOutput = `total 4
-rw-r--r-- 1 user user 1024 Jan 01 12:00 file.txt
drwxr-xr-x 2 user user 4096 Jan 01 12:00 folder`;

      const files = containerAdapter.parseLsOutput(mockLsOutput, '/');
      expect(files).toHaveLength(2);
      expect(files[0]).toHaveProperty('name', 'file.txt');
      expect(files[0]).toHaveProperty('type', 'file');
      expect(files[1]).toHaveProperty('name', 'folder');
      expect(files[1]).toHaveProperty('type', 'folder');
    });
  });
});
