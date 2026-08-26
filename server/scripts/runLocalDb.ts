import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../src/modules/users/user.model';
import { ParkingLotModel } from '../src/modules/parking/parking.model';
import { ParkingVerificationModel } from '../src/modules/verification/verification.model';

async function seed() {
  const adminPass = await bcrypt.hash('Admin@123', 10);
  const admin = await UserModel.create({
    name: 'Dev Admin',
    email: 'admin@dev.local',
    password: adminPass,
    role: 'admin',
    isEmailVerified: true
  });

  const ownerPass = await bcrypt.hash('Owner@123', 10);
  const owner = await UserModel.create({
    name: 'Dev Owner',
    email: 'owner@dev.local',
    password: ownerPass,
    role: 'owner',
    isEmailVerified: true
  });

  const customerPass = await bcrypt.hash('Customer@123', 10);
  const customer = await UserModel.create({
    name: 'Dev Customer',
    email: 'customer@dev.local',
    password: customerPass,
    role: 'customer',
    isEmailVerified: true
  });

  const verifiedLot = await ParkingLotModel.create({
    owner: owner._id,
    name: 'Verified Dev Lot',
    slug: 'verified-dev-lot',
    description: 'A verified parking lot for testing',
    address: { street: '123 Main St', city: 'Dev City', state: 'DC', country: 'Test', zipCode: '12345' },
    location: { type: 'Point', coordinates: [77.2090, 28.6139] },
    capacity: 50,
    availableSlots: 50,
    pricing: { baseRate: 10, currency: 'USD' },
    status: 'active',
    verificationStatus: 'VERIFIED',
    verificationLevel: 'PARKIQ_VERIFIED',
    facilities: ['cctv', 'covered']
  });

  await ParkingVerificationModel.create({
    parkingId: verifiedLot._id,
    ownerId: owner._id,
    status: 'VERIFIED',
    verificationType: 'PROPERTY_OWNER',
    adminNotes: 'Looks good for dev environment.',
  });

  await ParkingLotModel.create({
    owner: owner._id,
    name: 'Unverified Dev Lot',
    slug: 'unverified-dev-lot',
    description: 'An unverified parking lot for testing',
    address: { street: '456 Side St', city: 'Dev City', state: 'DC', country: 'Test', zipCode: '12345' },
    location: { type: 'Point', coordinates: [77.2100, 28.6140] },
    capacity: 20,
    availableSlots: 20,
    pricing: { baseRate: 5, currency: 'USD' },
    status: 'active',
    verificationStatus: 'DRAFT',
    facilities: ['open']
  });

  console.log('✅ Dev data seeded successfully!');
  console.log('Admin: admin@dev.local / Admin@123');
  console.log('Owner: owner@dev.local / Owner@123');
  console.log('Customer: customer@dev.local / Customer@123');
}

async function start() {
  const mongoServer = await MongoMemoryServer.create({
    instance: { port: 27018 }
  });
  const uri = mongoServer.getUri();
  console.log(`\n🟢 MongoDB Memory Server running at: ${uri}`);
  
  await mongoose.connect(uri);
  console.log('🟢 Connected to MongoDB. Seeding data...');
  await seed();
  
  console.log('\n⏳ Server is running. Press Ctrl+C to stop.\n');
  
  // Keep alive
  process.stdin.resume();
}

start().catch(console.error);



