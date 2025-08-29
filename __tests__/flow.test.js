const request = require('supertest');
const app = require('../server');

describe('token renewal flow', () => {
  test('token -> chat -> refresh -> chat', async () => {
    const user = 'alice';
    const tokenRes = await request(app).post('/auth/token').send({ user });
    expect(tokenRes.status).toBe(200);
    const { accessToken, refreshToken } = tokenRes.body;
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();

    const chatRes = await request(app)
      .post('/chat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ message: 'hola' });
    expect(chatRes.status).toBe(200);
    expect(chatRes.body.reply).toBe('Echo: hola');

    await new Promise(r => setTimeout(r, 1100));

    const failRes = await request(app)
      .post('/chat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ message: 'fail' });
    expect(failRes.status).toBe(401);

    const refreshRes = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken });
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeDefined();

    const chatRes2 = await request(app)
      .post('/chat')
      .set('Authorization', `Bearer ${refreshRes.body.accessToken}`)
      .send({ message: 'renewed' });
    expect(chatRes2.status).toBe(200);
    expect(chatRes2.body.reply).toBe('Echo: renewed');
  });
});
