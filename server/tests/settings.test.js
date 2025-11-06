const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Setting = require('../models/Setting');

let authToken;

beforeAll(async () => {
  // Connect to test database
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Create test user and get auth token
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });
  
  authToken = res.body.token;
});

afterAll(async () => {
  // Clean up test data
  await Setting.deleteMany({});
  await mongoose.connection.close();
});

describe('Settings API', () => {
  it('should get default settings', async () => {
    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.settings).toHaveProperty('theme');
    expect(res.body.settings.theme).toHaveProperty('primaryColor', '#1976d2');
  });

  it('should update settings', async () => {
    const updates = {
      theme: {
        primaryColor: '#2196f3',
        mode: 'dark'
      }
    };

    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${authToken}`)
      .send(updates);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.settings.theme.primaryColor).toBe('#2196f3');
    expect(res.body.settings.theme.mode).toBe('dark');
  });

  it('should reset to default settings', async () => {
    const res = await request(app)
      .post('/api/settings/reset')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.settings.theme.primaryColor).toBe('#1976d2');
    expect(res.body.message).toContain('reset');
  });
});
