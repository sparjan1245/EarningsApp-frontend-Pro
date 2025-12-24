import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('StockController (e2e)', () => {
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

  describe('/api/stock (GET)', () => {
    it('should return paginated stock data', () => {
      return request(app.getHttpServer())
        .get('/api/stock?page=1&pageSize=5')
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
        .get('/api/stock?page=1&pageSize=5&search=AAPL')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
        });
    });

    it('should handle date parameter', () => {
      return request(app.getHttpServer())
        .get('/api/stock?page=1&pageSize=5&date=2024-01-01')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
        });
    });

    it('should handle invalid page parameter', () => {
      return request(app.getHttpServer())
        .get('/api/stock?page=invalid&pageSize=5')
        .expect(200); // Should still work with default values
    });

    it('should handle invalid pageSize parameter', () => {
      return request(app.getHttpServer())
        .get('/api/stock?page=1&pageSize=invalid')
        .expect(200); // Should still work with default values
    });
  });

  describe('/api/stock/all (GET)', () => {
    it('should return all stock records', () => {
      return request(app.getHttpServer())
        .get('/api/stock/all')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/stock/search (GET)', () => {
    it('should search stock records', () => {
      return request(app.getHttpServer())
        .get('/api/stock/search?q=AAPL')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should handle empty search query', () => {
      return request(app.getHttpServer())
        .get('/api/stock/search?q=')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/stock/today (GET)', () => {
    it('should return today\'s records with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/stock/today?page=1&pageSize=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('/api/stock/yesterday (GET)', () => {
    it('should return yesterday\'s records with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/stock/yesterday?page=1&pageSize=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('/api/stock/tomorrow (GET)', () => {
    it('should return tomorrow\'s records with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/stock/tomorrow?page=1&pageSize=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('/api/stock/this-week (GET)', () => {
    it('should return this week\'s records with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/stock/this-week?page=1&pageSize=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('/api/stock/next-week (GET)', () => {
    it('should return next week\'s records with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/stock/next-week?page=1&pageSize=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('/api/stock/public-preview (GET)', () => {
    it('should return public preview records', () => {
      return request(app.getHttpServer())
        .get('/api/stock/public-preview')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/stock/date-range (GET)', () => {
    it('should return records within date range with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/stock/date-range?startDate=2024-01-01&endDate=2024-01-31&page=1&pageSize=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should return 400 when startDate is missing', () => {
      return request(app.getHttpServer())
        .get('/api/stock/date-range?endDate=2024-01-31&page=1&pageSize=5')
        .expect(400);
    });

    it('should return 400 when endDate is missing', () => {
      return request(app.getHttpServer())
        .get('/api/stock/date-range?startDate=2024-01-01&page=1&pageSize=5')
        .expect(400);
    });
  });

  describe('/api/stock/specific-date (GET)', () => {
    it('should return records for specific date with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/stock/specific-date?date=2024-01-01&page=1&pageSize=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should return 400 when date is missing', () => {
      return request(app.getHttpServer())
        .get('/api/stock/specific-date?page=1&pageSize=5')
        .expect(400);
    });
  });

  describe('/api/stock/month (GET)', () => {
    it('should return records for specific month with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/stock/month?year=2024&month=1&page=1&pageSize=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should return 400 when year is missing', () => {
      return request(app.getHttpServer())
        .get('/api/stock/month?month=1&page=1&pageSize=5')
        .expect(400);
    });

    it('should return 400 when month is missing', () => {
      return request(app.getHttpServer())
        .get('/api/stock/month?year=2024&page=1&pageSize=5')
        .expect(400);
    });

    it('should return 400 when month is invalid', () => {
      return request(app.getHttpServer())
        .get('/api/stock/month?year=2024&month=13&page=1&pageSize=5')
        .expect(400);
    });
  });

  describe('/api/stock/quarter (GET)', () => {
    it('should return records for specific quarter with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/stock/quarter?year=2024&quarter=1&page=1&pageSize=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should return 400 when year is missing', () => {
      return request(app.getHttpServer())
        .get('/api/stock/quarter?quarter=1&page=1&pageSize=5')
        .expect(400);
    });

    it('should return 400 when quarter is missing', () => {
      return request(app.getHttpServer())
        .get('/api/stock/quarter?year=2024&page=1&pageSize=5')
        .expect(400);
    });

    it('should return 400 when quarter is invalid', () => {
      return request(app.getHttpServer())
        .get('/api/stock/quarter?year=2024&quarter=5&page=1&pageSize=5')
        .expect(400);
    });
  });

  describe('/api/stock/add (POST)', () => {
    it('should add a single record', () => {
      const dto = {
        ticker: 'TEST',
        companyName: 'Test Company',
        sector: 'Technology',
        marketCap: 1000000,
        revenue: 50000,
        eps: 2.5,
        peRatio: 20.0,
        earningsDate: '2024-01-01',
        fiscalYear: 2024,
        fiscalQuarter: 'Q1',
        reportTime: 'Pre-Open',
      };

      return request(app.getHttpServer())
        .post('/api/stock/add')
        .send(dto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.ticker).toBe(dto.ticker);
          expect(res.body.companyName).toBe(dto.companyName);
        });
    });
  });

  describe('/api/stock/bulk (POST)', () => {
    it('should bulk upload records', () => {
      const rows = [
        {
          ticker: 'TEST1',
          companyName: 'Test Company 1',
          sector: 'Technology',
          marketCap: 1000000,
          revenue: 50000,
          eps: 2.5,
          peRatio: 20.0,
          earningsDate: '2024-01-01',
          fiscalYear: 2024,
          fiscalQuarter: 'Q1',
          reportTime: 'Pre-Open',
        },
        {
          ticker: 'TEST2',
          companyName: 'Test Company 2',
          sector: 'Technology',
          marketCap: 2000000,
          revenue: 100000,
          eps: 5.0,
          peRatio: 25.0,
          earningsDate: '2024-01-02',
          fiscalYear: 2024,
          fiscalQuarter: 'Q1',
          reportTime: 'Post-Close',
        },
      ];

      return request(app.getHttpServer())
        .post('/api/stock/bulk')
        .send(rows)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body).toHaveProperty('count');
        });
    });
  });
}); 