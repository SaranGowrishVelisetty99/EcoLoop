import { createScanService, ScanService } from '../scanService';

interface MockDoc {
  get: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

interface MockCollection {
  add: jest.Mock;
  doc: jest.Mock;
  where: jest.Mock;
}

interface MockDb {
  collection: jest.Mock;
  batch: jest.Mock;
}

interface MockFieldValue {
  serverTimestamp: jest.Mock;
  increment: jest.Mock;
}

describe('ScanService', () => {
  let mockDb: MockDb;
  let mockFieldValue: MockFieldValue;
  let service: ScanService;
  let mockCollection: MockCollection;
  let mockDoc: MockDoc;

  beforeEach(() => {
    mockDoc = {
      get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockCollection = {
      add: jest.fn(() => Promise.resolve({ id: 'scan-123' })),
      doc: jest.fn(() => mockDoc),
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ docs: [] })),
      })),
    };

    mockDb = {
      collection: jest.fn(() => mockCollection),
      batch: jest.fn(() => ({
        delete: jest.fn(),
        commit: jest.fn(),
      })),
    };

    mockFieldValue = {
      serverTimestamp: jest.fn(() => ({ _seconds: Date.now() / 1000 })),
      increment: jest.fn(),
    };

    service = createScanService(mockDb, mockFieldValue);
  });

  describe('createScan', () => {
    it('creates a new scan and returns scanId and result', async () => {
      const input = {
        userId: 'user-1',
        imageDataUrl: 'data:image/png;base64,test',
        detectedObject: 'Plastic bottle',
        materialType: 'Plastic',
        conditionAssessment: 'Good',
        confidenceScore: 0.95,
        suggestions: [],
      };

      const result = await service.createScan(input);

      expect(result.scanId).toBe('scan-123');
      expect(result.result).toMatchObject({
        id: 'scan-123',
        userId: 'user-1',
        detectedObject: 'Plastic bottle',
        materialType: 'Plastic',
        conditionAssessment: 'Good',
        confidenceScore: 0.95,
      });
      expect(mockDb.collection).toHaveBeenCalledWith('scans');
    });

    it('includes serverTimestamp in created scan', async () => {
      const input = { userId: 'user-1', imageDataUrl: 'test' };
      await service.createScan(input);

      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: expect.any(Object),
          updatedAt: expect.any(Object),
        })
      );
    });
  });

  describe('updateScan', () => {
    it('updates scan with serverTimestamp', async () => {
      await service.updateScan('scan-1', { confidenceScore: 0.8 });

      expect(mockDoc.update).toHaveBeenCalledWith(
        expect.objectContaining({
          confidenceScore: 0.8,
          updatedAt: expect.any(Object),
        })
      );
    });
  });

  describe('getScan', () => {
    it('returns scan when exists', async () => {
      const mockScan = { detectedObject: 'Bottle', userId: 'user-1' };
      mockDoc.get.mockResolvedValue({
        exists: true,
        id: 'scan-1',
        data: () => mockScan,
      });

      const result = await service.getScan('scan-1');

      expect(result).toEqual({ id: 'scan-1', ...mockScan });
    });

    it('returns null when not exists', async () => {
      mockDoc.get.mockResolvedValue({
        exists: false,
      });

      const result = await service.getScan('scan-1');

      expect(result).toBeNull();
    });
  });

  describe('deleteScan', () => {
    it('deletes scan and related projects', async () => {
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn(),
      };
      mockDb.batch.mockReturnValue(mockBatch);
      mockCollection.where.mockReturnValue({
        get: jest.fn(() => Promise.resolve({ docs: [] })),
      });

      await service.deleteScan('scan-1');

      expect(mockDb.batch).toHaveBeenCalled();
      expect(mockBatch.delete).toHaveBeenCalledWith(mockDoc);
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });
});