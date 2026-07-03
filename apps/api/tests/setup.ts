// runs before each test file imports anything from src,
// so the prisma client picks up the test database
const base = process.env.TEST_DATABASE_BASE ?? 'postgresql://postgres@localhost:5433';
process.env.DATABASE_URL = `${base}/omnes_test`;
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.SMTP_TRANSPORT = 'console';
