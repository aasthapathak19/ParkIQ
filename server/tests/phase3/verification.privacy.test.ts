import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { verificationService } from '../../src/modules/verification/verification.service';
import { ParkingVerificationModel } from '../../src/modules/verification/verification.model';
import { ParkingLotModel } from '../../src/modules/parking/parking.model';

// Mock audit service to prevent side effects
jest.mock('../../src/modules/audit/audit.service', () => ({
  auditService: { log: jest.fn() },
}));

describe('VerificationService Privacy & Logic', () => {
  let parkingId: string;
  let ownerId: string;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await ParkingVerificationModel.deleteMany({});
    await ParkingLotModel.deleteMany({});

    await ParkingLotModel.syncIndexes();
    await ParkingVerificationModel.syncIndexes();
    ownerId = new mongoose.Types.ObjectId().toString();
    const lot = await ParkingLotModel.create({
      owner: new mongoose.Types.ObjectId(ownerId),
      name: 'Test Lot',
      slug: 'test-lot',
      address: { street: '123 Test St', city: 'Test City', state: 'TS', country: 'Test' },
      location: { type: 'Point', coordinates: [77.1, 28.1] },
      pricing: { baseRate: 100 },
      status: 'pending',
      verificationStatus: 'DRAFT'
    });
    parkingId = lot._id.toString();
  });

  it('should create draft and not allow other owners to view it', async () => {
    await verificationService.createDraft(parkingId, ownerId, 'PROPERTY_OWNER');
    
    const ver = await verificationService.getForOwner(parkingId, ownerId);
    expect(ver.verificationType).toBe('PROPERTY_OWNER');
    expect(ver.status).toBe('DRAFT');
    expect((ver as any).adminNotes).toBeUndefined();
    expect((ver as any).evidenceRefs).toBeUndefined();

    const otherOwner = new mongoose.Types.ObjectId().toString();
    await expect(verificationService.getForOwner(parkingId, otherOwner))
      .rejects.toThrow('You do not have permission to perform this action');
  });
});


