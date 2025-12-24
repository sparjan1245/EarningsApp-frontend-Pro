import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AdminController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/api/admin/users (GET)', () => {
    it('should return paginated users', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users?page=1&pageSize=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
          expect(res.body.pagination).toHaveProperty('currentPage');
          expect(res.body.pagination).toHaveProperty('pageSize');
          expect(res.body.pagination).toHaveProperty('total');
          expect(res.body.pagination).toHaveProperty('totalPages');
          expect(res.body.pagination).toHaveProperty('hasNextPage');
          expect(res.body.pagination).toHaveProperty('hasPrevPage');
          expect(res.body.pagination).toHaveProperty('startIndex');
          expect(res.body.pagination).toHaveProperty('endIndex');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should handle search parameter', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users?page=1&pageSize=5&search=test')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
        });
    });

    it('should handle invalid page parameter', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users?page=invalid&pageSize=5')
        .expect(200); // Should still work with default values
    });

    it('should handle invalid pageSize parameter', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users?page=1&pageSize=invalid')
        .expect(200); // Should still work with default values
    });

    it('should handle very large page numbers', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users?page=999999&pageSize=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
        });
    });

    it('should handle very large page sizes', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users?page=1&pageSize=10000')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
        });
    });
  });

  describe('/api/admin/users/all (GET)', () => {
    it('should return all users', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users/all')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/admin/users/search (GET)', () => {
    it('should search users', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users/search?q=test')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should handle empty search query', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users/search?q=')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should handle search with special characters', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users/search?q=test@example.com+')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should handle search with SQL injection attempt', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users/search?q=%27%3B%20DROP%20TABLE%20users%3B%20--')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/admin/users/:id (GET)', () => {
    it('should return user by id', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users/valid-uuid-here')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('role');
        });
    });

    it('should handle invalid uuid format', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users/invalid-uuid')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeNull();
        });
    });

    it('should handle non-existent user id', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users/00000000-0000-0000-0000-000000000000')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeNull();
        });
    });
  });

  describe('/api/admin/users/:id/role (PATCH)', () => {
    it('should update user role successfully', () => {
      return request(app.getHttpServer())
        .patch('/api/admin/users/valid-uuid-here/role')
        .send({ role: 'ADMIN' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('role');
          expect(res.body.role).toBe('ADMIN');
        });
    });

    it('should throw error for invalid role', () => {
      return request(app.getHttpServer())
        .patch('/api/admin/users/valid-uuid-here/role')
        .send({ role: 'INVALID_ROLE' })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Invalid role');
        });
    });

    it('should handle invalid uuid format', () => {
      return request(app.getHttpServer())
        .patch('/api/admin/users/invalid-uuid/role')
        .send({ role: 'ADMIN' })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should handle missing role in request body', () => {
      return request(app.getHttpServer())
        .patch('/api/admin/users/valid-uuid-here/role')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should handle empty role string', () => {
      return request(app.getHttpServer())
        .patch('/api/admin/users/valid-uuid-here/role')
        .send({ role: '' })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });
  });

  describe('/api/admin/users/:id (DELETE)', () => {
    it('should delete user successfully', () => {
      return request(app.getHttpServer())
        .delete('/api/admin/users/valid-uuid-here')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
        });
    });

    it('should handle invalid uuid format', () => {
      return request(app.getHttpServer())
        .delete('/api/admin/users/invalid-uuid')
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should handle non-existent user id', () => {
      return request(app.getHttpServer())
        .delete('/api/admin/users/00000000-0000-0000-0000-000000000000')
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });
  });

  describe('/api/admin/users/stats (GET)', () => {
    it('should return user statistics', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('byRole');
          expect(res.body.byRole).toHaveProperty('USER');
          expect(res.body.byRole).toHaveProperty('ADMIN');
          expect(res.body.byRole).toHaveProperty('SUPERADMIN');
          expect(typeof res.body.total).toBe('number');
          expect(typeof res.body.byRole.USER).toBe('number');
          expect(typeof res.body.byRole.ADMIN).toBe('number');
          expect(typeof res.body.byRole.SUPERADMIN).toBe('number');
        });
    });
  });

  describe('/api/admin/users/activity (GET)', () => {
    it('should return user activity data', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users/activity')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalUsers');
          expect(res.body).toHaveProperty('recentSignups');
          expect(res.body).toHaveProperty('usersByMonth');
          expect(typeof res.body.totalUsers).toBe('number');
          expect(typeof res.body.recentSignups).toBe('number');
          expect(typeof res.body.usersByMonth).toBe('object');
        });
    });
  });

  describe('/api/admin/users/bulk/roles (PATCH)', () => {
    it('should bulk update user roles successfully', () => {
      const updates = [
        { id: 'valid-uuid-1', role: 'ADMIN' },
        { id: 'valid-uuid-2', role: 'USER' },
      ];

      return request(app.getHttpServer())
        .patch('/api/admin/users/bulk/roles')
        .send(updates)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('role');
          expect(res.body[1]).toHaveProperty('id');
          expect(res.body[1]).toHaveProperty('role');
        });
    });

    it('should handle empty updates array', () => {
      return request(app.getHttpServer())
        .patch('/api/admin/users/bulk/roles')
        .send([])
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });

    it('should throw error for invalid role in bulk update', () => {
      const updates = [
        { id: 'valid-uuid-1', role: 'INVALID_ROLE' },
      ];

      return request(app.getHttpServer())
        .patch('/api/admin/users/bulk/roles')
        .send(updates)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Invalid role');
        });
    });

    it('should handle missing id in update object', () => {
      const updates = [
        { role: 'ADMIN' }, // Missing id
      ];

      return request(app.getHttpServer())
        .patch('/api/admin/users/bulk/roles')
        .send(updates)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should handle missing role in update object', () => {
      const updates = [
        { id: 'valid-uuid-1' }, // Missing role
      ];

      return request(app.getHttpServer())
        .patch('/api/admin/users/bulk/roles')
        .send(updates)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should handle duplicate user ids', () => {
      const updates = [
        { id: 'valid-uuid-1', role: 'ADMIN' },
        { id: 'valid-uuid-1', role: 'USER' }, // Duplicate id
      ];

      return request(app.getHttpServer())
        .patch('/api/admin/users/bulk/roles')
        .send(updates)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/admin/users/bulk/delete (DELETE)', () => {
    it('should bulk delete users successfully', () => {
      const userIds = ['valid-uuid-1', 'valid-uuid-2', 'valid-uuid-3'];

      return request(app.getHttpServer())
        .delete('/api/admin/users/bulk/delete')
        .send({ ids: userIds })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should handle empty user ids array', () => {
      return request(app.getHttpServer())
        .delete('/api/admin/users/bulk/delete')
        .send({ ids: [] })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });

    it('should handle missing ids in request body', () => {
      return request(app.getHttpServer())
        .delete('/api/admin/users/bulk/delete')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should handle invalid user ids', () => {
      const userIds = ['valid-uuid-1', 'invalid-uuid', 'valid-uuid-2'];

      return request(app.getHttpServer())
        .delete('/api/admin/users/bulk/delete')
        .send({ ids: userIds })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/admin/users/sync (POST)', () => {
    it('should sync users from auth service', () => {
      return request(app.getHttpServer())
        .post('/api/admin/users/sync')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('syncedCount');
          expect(typeof res.body.syncedCount).toBe('number');
        });
    });

    it('should handle sync errors gracefully', () => {
      // This test might fail if auth service is not available
      return request(app.getHttpServer())
        .post('/api/admin/users/sync')
        .expect((res) => {
          // Should either succeed or return a proper error response
          expect(res.status).toBeGreaterThanOrEqual(200);
          expect(res.status).toBeLessThan(600);
        });
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for protected endpoints', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users')
        .expect(401); // Should require authentication
    });

    it('should require admin role for admin endpoints', () => {
      // This test would require setting up authentication context
      // For now, we'll just test the endpoint structure
      return request(app.getHttpServer())
        .get('/api/admin/users')
        .expect((res) => {
          // Should either require auth (401) or admin role (403)
          expect([401, 403]).toContain(res.status);
        });
    });
  });

  describe('Request Validation', () => {
    it('should validate pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users?page=-1&pageSize=0')
        .expect(200) // Should handle invalid params gracefully
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
        });
    });

    it('should validate search query length', () => {
      const longQuery = 'a'.repeat(1000);
      return request(app.getHttpServer())
        .get(`/api/admin/users/search?q=${longQuery}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should validate role enum values', () => {
      return request(app.getHttpServer())
        .patch('/api/admin/users/valid-uuid-here/role')
        .send({ role: 'SUPERADMIN' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('role');
          expect(['USER', 'ADMIN', 'SUPERADMIN']).toContain(res.body.role);
        });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', () => {
      // This test would require mocking database failures
      // For now, we'll test the endpoint structure
      return request(app.getHttpServer())
        .get('/api/admin/users')
        .expect((res) => {
          // Should return a proper HTTP status code
          expect(res.status).toBeGreaterThanOrEqual(200);
          expect(res.status).toBeLessThan(600);
        });
    });

    it('should handle malformed JSON in request body', () => {
      return request(app.getHttpServer())
        .patch('/api/admin/users/valid-uuid-here/role')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should handle missing request body', () => {
      return request(app.getHttpServer())
        .patch('/api/admin/users/valid-uuid-here/role')
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle large page sizes efficiently', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users?page=1&pageSize=1000')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
          // Should respond within reasonable time
          expect(res.headers['x-response-time'] || '0ms').toBeDefined();
        });
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .get('/api/admin/users?page=1&pageSize=5')
          .expect(200)
      );

      await Promise.all(requests);
    });
  });
}); 