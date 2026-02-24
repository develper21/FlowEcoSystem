import { PrismaClient, UserRole, UserStatus, ProductStatus, BOMStatus, ECOType, ECOStatus, ApprovalStatus, AuditAction, EntityType, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing existing data...');
  
  // Clear all data in correct order (respecting foreign keys)
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.eCOApproval.deleteMany();
  await prisma.eCOBOMOperationDraft.deleteMany();
  await prisma.eCOBOMComponentDraft.deleteMany();
  await prisma.eCOAttachment.deleteMany();
  await prisma.productAttachment.deleteMany();
  await prisma.eCO.deleteMany();
  await prisma.bOMOperation.deleteMany();
  await prisma.bOMComponent.deleteMany();
  await prisma.bOM.deleteMany();
  await prisma.productVersion.deleteMany();
  await prisma.product.deleteMany();
  await prisma.approvalStage.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.roleRequest.deleteMany();
  await prisma.user.deleteMany();

  console.log('🌱 Seeding comprehensive real-world data...\n');

  const password = await bcrypt.hash('password123', 10);

  // ========================================
  // 1. CREATE USERS (10 Users - Various Roles & Statuses)
  // ========================================
  console.log('👤 Creating users...');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@globalmanufacturing.com',
      name: 'Richard Anderson',
      password,
      roles: [UserRole.ADMIN],
      status: UserStatus.ACTIVE,
    },
  });

  // Engineering Team Lead (Multi-role: Engineering + Approver)
  const engLead = await prisma.user.create({
    data: {
      email: 'jennifer.chen@globalmanufacturing.com',
      name: 'Jennifer Chen',
      password,
      roles: [UserRole.ENGINEERING, UserRole.APPROVER],
      status: UserStatus.ACTIVE,
    },
  });

  // Senior Engineers
  const engineer1 = await prisma.user.create({
    data: {
      email: 'marcus.williams@globalmanufacturing.com',
      name: 'Marcus Williams',
      password,
      roles: [UserRole.ENGINEERING],
      status: UserStatus.ACTIVE,
    },
  });

  const engineer2 = await prisma.user.create({
    data: {
      email: 'priya.sharma@globalmanufacturing.com',
      name: 'Priya Sharma',
      password,
      roles: [UserRole.ENGINEERING],
      status: UserStatus.ACTIVE,
    },
  });

  // Quality Assurance Manager (Multi-role)
  const qaManager = await prisma.user.create({
    data: {
      email: 'thomas.mueller@globalmanufacturing.com',
      name: 'Thomas Mueller',
      password,
      roles: [UserRole.APPROVER, UserRole.OPERATIONS],
      status: UserStatus.ACTIVE,
    },
  });

  // Senior Approver / Director
  const director = await prisma.user.create({
    data: {
      email: 'sarah.johnson@globalmanufacturing.com',
      name: 'Sarah Johnson',
      password,
      roles: [UserRole.APPROVER],
      status: UserStatus.ACTIVE,
    },
  });

  // Operations Manager
  const opsManager = await prisma.user.create({
    data: {
      email: 'david.kim@globalmanufacturing.com',
      name: 'David Kim',
      password,
      roles: [UserRole.OPERATIONS],
      status: UserStatus.ACTIVE,
    },
  });

  // Production Coordinator
  const opsCoord = await prisma.user.create({
    data: {
      email: 'elena.rodriguez@globalmanufacturing.com',
      name: 'Elena Rodriguez',
      password,
      roles: [UserRole.OPERATIONS],
      status: UserStatus.ACTIVE,
    },
  });

  // Disabled user (former employee)
  await prisma.user.create({
    data: {
      email: 'former.employee@globalmanufacturing.com',
      name: 'Robert Thompson',
      password,
      roles: [UserRole.ENGINEERING],
      status: UserStatus.DISABLED,
    },
  });

  // Pending user (new hire awaiting access)
  const pendingUser = await prisma.user.create({
    data: {
      email: 'new.hire@globalmanufacturing.com',
      name: 'Alex Martinez',
      password,
      roles: [UserRole.ENGINEERING],
      status: UserStatus.PENDING,
    },
  });

  console.log('   ✅ Created 10 users (various roles & statuses)');

  // ========================================
  // 2. CREATE APPROVAL STAGES
  // ========================================
  console.log('📋 Creating approval stages...');

  await prisma.approvalStage.create({
    data: { name: 'New', order: 1, requiresApproval: false, isFinal: false },
  });

  const stageEngReview = await prisma.approvalStage.create({
    data: { name: 'Engineering Review', order: 2, requiresApproval: true, isFinal: false },
  });

  const stageApproval = await prisma.approvalStage.create({
    data: { name: 'Manager Approval', order: 3, requiresApproval: true, isFinal: false },
  });

  const stageOpsReview = await prisma.approvalStage.create({
    data: { name: 'Operations Review', order: 4, requiresApproval: true, isFinal: false },
  });

  const stageFinal = await prisma.approvalStage.create({
    data: { name: 'Final Approval', order: 5, requiresApproval: true, isFinal: true },
  });

  console.log('   ✅ Created 5 approval stages');

  // ========================================
  // 3. CREATE PRODUCTS (25+ Products)
  // ========================================
  console.log('📦 Creating products...');

  // === RAW MATERIALS ===
  const steelPlate = await prisma.product.create({
    data: {
      name: 'Stainless Steel Plate 304 - 3mm',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 125.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const aluminumSheet = await prisma.product.create({
    data: {
      name: 'Aluminum Sheet 6061-T6 - 2mm',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 85.50, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const copperWire = await prisma.product.create({
    data: {
      name: 'Copper Wire AWG-12 (100m spool)',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 245.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const carbonFiber = await prisma.product.create({
    data: {
      name: 'Carbon Fiber Sheet 3K Weave - 1.5mm',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 380.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const titaniumRod = await prisma.product.create({
    data: {
      name: 'Titanium Rod Grade 5 - 25mm dia',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 520.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  // === ELECTRONIC COMPONENTS ===
  const microcontroller = await prisma.product.create({
    data: {
      name: 'ARM Cortex-M4 Microcontroller STM32F407',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 12.50, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const powerModule = await prisma.product.create({
    data: {
      name: 'DC-DC Power Module 48V-12V 20A',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 45.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const sensorArray = await prisma.product.create({
    data: {
      name: 'Industrial Sensor Array IMU-9DOF',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 89.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const motorDriver = await prisma.product.create({
    data: {
      name: 'Brushless Motor Driver 50A FOC',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 156.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const displayOLED = await prisma.product.create({
    data: {
      name: 'Industrial OLED Display 4.3" IP67',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 78.50, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  // === MECHANICAL COMPONENTS ===
  const bearingSKF = await prisma.product.create({
    data: {
      name: 'SKF Deep Groove Bearing 6208-2RS',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 28.75, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const gearboxPlanetary = await prisma.product.create({
    data: {
      name: 'Planetary Gearbox 10:1 Ratio NEMA34',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 345.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const linearRail = await prisma.product.create({
    data: {
      name: 'Linear Rail HGR20 - 500mm with blocks',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 125.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const ballscrew = await prisma.product.create({
    data: {
      name: 'Precision Ball Screw SFU1605 - 400mm',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 89.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const pneumaticCylinder = await prisma.product.create({
    data: {
      name: 'SMC Pneumatic Cylinder CDQ2B32-50DZ',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 67.50, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  // === MOTORS & ACTUATORS ===
  const servoMotor = await prisma.product.create({
    data: {
      name: 'Yaskawa Servo Motor SGM7G-09AFC61',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 890.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const stepperMotor = await prisma.product.create({
    data: {
      name: 'NEMA 23 Stepper Motor 3Nm Closed Loop',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 145.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const bldc500w = await prisma.product.create({
    data: {
      name: 'BLDC Motor 500W 48V with Hall Sensors',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 178.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  // === FASTENERS & HARDWARE ===
  const boltKit = await prisma.product.create({
    data: {
      name: 'A4 Stainless Steel Bolt Kit M8 (100pcs)',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 45.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const oringKit = await prisma.product.create({
    data: {
      name: 'Viton O-Ring Assortment Kit (225pcs)',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 68.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const cableGland = await prisma.product.create({
    data: {
      name: 'IP68 Cable Gland PG13.5 (Pack of 20)',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 32.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  // === SUB-ASSEMBLIES ===
  const controlPCB = await prisma.product.create({
    data: {
      name: 'Main Control PCB Assembly v2.3',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v2.3', salePrice: 0, costPrice: 285.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const hydraulicUnit = await prisma.product.create({
    data: {
      name: 'Hydraulic Power Unit 5HP 3000PSI',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 1850.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const coolingSystem = await prisma.product.create({
    data: {
      name: 'Liquid Cooling System 500W TDP',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 0, costPrice: 425.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  // === FINISHED PRODUCTS ===
  const cncRouter = await prisma.product.create({
    data: {
      name: 'CNC Router PRO-4030 Industrial',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 12500.00, costPrice: 6800.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const robotArm = await prisma.product.create({
    data: {
      name: '6-Axis Robot Arm RA-600 Collaborative',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 28000.00, costPrice: 15200.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const conveyorSystem = await prisma.product.create({
    data: {
      name: 'Modular Conveyor System MCS-3000',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 8500.00, costPrice: 4200.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const packagingMachine = await prisma.product.create({
    data: {
      name: 'Automatic Packaging Machine APM-500',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 45000.00, costPrice: 24500.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const qualityStation = await prisma.product.create({
    data: {
      name: 'Vision Inspection Station VIS-200',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 18500.00, costPrice: 9800.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const laserCutter = await prisma.product.create({
    data: {
      name: 'Fiber Laser Cutter FL-3015 2kW',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 85000.00, costPrice: 48000.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  const agvRobot = await prisma.product.create({
    data: {
      name: 'AGV Autonomous Mobile Robot AMR-500',
      status: ProductStatus.ACTIVE,
      versions: { create: { version: 'v1.0', salePrice: 35000.00, costPrice: 18500.00, status: ProductStatus.ACTIVE } },
    },
    include: { versions: true },
  });

  // Archived product
  const legacyController = await prisma.product.create({
    data: {
      name: 'Legacy PLC Controller LC-100 (Discontinued)',
      status: ProductStatus.ARCHIVED,
      versions: { create: { version: 'v3.2', salePrice: 2500.00, costPrice: 1200.00, status: ProductStatus.ARCHIVED } },
    },
    include: { versions: true },
  });

  // Update currentVersionId for all products
  const allProducts = [steelPlate, aluminumSheet, copperWire, carbonFiber, titaniumRod,
    microcontroller, powerModule, sensorArray, motorDriver, displayOLED,
    bearingSKF, gearboxPlanetary, linearRail, ballscrew, pneumaticCylinder,
    servoMotor, stepperMotor, bldc500w, boltKit, oringKit, cableGland,
    controlPCB, hydraulicUnit, coolingSystem, cncRouter, robotArm,
    conveyorSystem, packagingMachine, qualityStation, laserCutter, agvRobot, legacyController];

  for (const product of allProducts) {
    await prisma.product.update({
      where: { id: product.id },
      data: { currentVersionId: product.versions[0].id }
    });
  }

  console.log('   ✅ Created 32 products (raw materials, components, sub-assemblies, finished goods)');

  // ========================================
  // 4. CREATE BOMs (25+ BOMs)
  // ========================================
  console.log('🔧 Creating BOMs...');

  // BOM 1: CNC Router PRO-4030
  const bomCNC = await prisma.bOM.create({
    data: {
      productVersionId: cncRouter.versions[0].id,
      version: 'v1.0',
      status: BOMStatus.ACTIVE,
      components: {
        create: [
          { productId: aluminumSheet.id, quantity: 8 },
          { productId: steelPlate.id, quantity: 4 },
          { productId: linearRail.id, quantity: 6 },
          { productId: ballscrew.id, quantity: 3 },
          { productId: stepperMotor.id, quantity: 4 },
          { productId: motorDriver.id, quantity: 4 },
          { productId: controlPCB.id, quantity: 1 },
          { productId: powerModule.id, quantity: 2 },
          { productId: displayOLED.id, quantity: 1 },
          { productId: boltKit.id, quantity: 2 },
          { productId: cableGland.id, quantity: 1 },
        ],
      },
      operations: {
        create: [
          { name: 'Frame Cutting & Preparation', time: 120, workCenter: 'WC-CUT-01', sequence: 1 },
          { name: 'Frame Welding & Assembly', time: 180, workCenter: 'WC-WELD-01', sequence: 2 },
          { name: 'Linear Motion System Install', time: 150, workCenter: 'WC-ASM-01', sequence: 3 },
          { name: 'Motor & Drive Installation', time: 90, workCenter: 'WC-ASM-01', sequence: 4 },
          { name: 'Electrical Wiring', time: 120, workCenter: 'WC-ELEC-01', sequence: 5 },
          { name: 'Control System Setup', time: 60, workCenter: 'WC-ELEC-01', sequence: 6 },
          { name: 'Calibration & Testing', time: 90, workCenter: 'WC-QC-01', sequence: 7 },
          { name: 'Final QC & Packaging', time: 45, workCenter: 'WC-PACK-01', sequence: 8 },
        ],
      },
    },
  });

  // BOM 2: 6-Axis Robot Arm
  const bomRobot = await prisma.bOM.create({
    data: {
      productVersionId: robotArm.versions[0].id,
      version: 'v1.0',
      status: BOMStatus.ACTIVE,
      components: {
        create: [
          { productId: carbonFiber.id, quantity: 6 },
          { productId: titaniumRod.id, quantity: 4 },
          { productId: servoMotor.id, quantity: 6 },
          { productId: gearboxPlanetary.id, quantity: 6 },
          { productId: bearingSKF.id, quantity: 12 },
          { productId: sensorArray.id, quantity: 2 },
          { productId: controlPCB.id, quantity: 1 },
          { productId: powerModule.id, quantity: 3 },
          { productId: copperWire.id, quantity: 1 },
          { productId: boltKit.id, quantity: 3 },
        ],
      },
      operations: {
        create: [
          { name: 'Carbon Fiber Arm Fabrication', time: 240, workCenter: 'WC-COMP-01', sequence: 1 },
          { name: 'Joint Assembly', time: 180, workCenter: 'WC-ASM-02', sequence: 2 },
          { name: 'Servo Motor Integration', time: 150, workCenter: 'WC-ASM-02', sequence: 3 },
          { name: 'Sensor Calibration', time: 120, workCenter: 'WC-CAL-01', sequence: 4 },
          { name: 'Cable Routing & Management', time: 90, workCenter: 'WC-ELEC-01', sequence: 5 },
          { name: 'Motion Testing & Programming', time: 180, workCenter: 'WC-TEST-01', sequence: 6 },
          { name: 'Safety System Verification', time: 60, workCenter: 'WC-QC-01', sequence: 7 },
        ],
      },
    },
  });

  // BOM 3: Conveyor System
  const bomConveyor = await prisma.bOM.create({
    data: {
      productVersionId: conveyorSystem.versions[0].id,
      version: 'v1.0',
      status: BOMStatus.ACTIVE,
      components: {
        create: [
          { productId: steelPlate.id, quantity: 12 },
          { productId: aluminumSheet.id, quantity: 6 },
          { productId: bldc500w.id, quantity: 4 },
          { productId: motorDriver.id, quantity: 4 },
          { productId: bearingSKF.id, quantity: 16 },
          { productId: sensorArray.id, quantity: 8 },
          { productId: controlPCB.id, quantity: 1 },
          { productId: boltKit.id, quantity: 4 },
        ],
      },
      operations: {
        create: [
          { name: 'Frame Fabrication', time: 180, workCenter: 'WC-FAB-01', sequence: 1 },
          { name: 'Belt System Assembly', time: 120, workCenter: 'WC-ASM-01', sequence: 2 },
          { name: 'Drive System Installation', time: 90, workCenter: 'WC-ASM-01', sequence: 3 },
          { name: 'Sensor Integration', time: 75, workCenter: 'WC-ELEC-01', sequence: 4 },
          { name: 'System Testing', time: 60, workCenter: 'WC-TEST-01', sequence: 5 },
        ],
      },
    },
  });

  // BOM 4: Packaging Machine
  const bomPackaging = await prisma.bOM.create({
    data: {
      productVersionId: packagingMachine.versions[0].id,
      version: 'v1.0',
      status: BOMStatus.ACTIVE,
      components: {
        create: [
          { productId: steelPlate.id, quantity: 20 },
          { productId: aluminumSheet.id, quantity: 8 },
          { productId: pneumaticCylinder.id, quantity: 12 },
          { productId: servoMotor.id, quantity: 4 },
          { productId: gearboxPlanetary.id, quantity: 2 },
          { productId: sensorArray.id, quantity: 6 },
          { productId: controlPCB.id, quantity: 2 },
          { productId: displayOLED.id, quantity: 1 },
          { productId: powerModule.id, quantity: 3 },
          { productId: oringKit.id, quantity: 2 },
          { productId: boltKit.id, quantity: 5 },
        ],
      },
      operations: {
        create: [
          { name: 'Main Frame Construction', time: 240, workCenter: 'WC-WELD-01', sequence: 1 },
          { name: 'Pneumatic System Assembly', time: 150, workCenter: 'WC-ASM-01', sequence: 2 },
          { name: 'Servo Drive Installation', time: 120, workCenter: 'WC-ASM-01', sequence: 3 },
          { name: 'Packaging Head Assembly', time: 180, workCenter: 'WC-ASM-02', sequence: 4 },
          { name: 'Electrical Integration', time: 150, workCenter: 'WC-ELEC-01', sequence: 5 },
          { name: 'HMI Programming', time: 90, workCenter: 'WC-PROG-01', sequence: 6 },
          { name: 'Full System Testing', time: 120, workCenter: 'WC-TEST-01', sequence: 7 },
        ],
      },
    },
  });

  // BOM 5: Vision Inspection Station
  const bomVision = await prisma.bOM.create({
    data: {
      productVersionId: qualityStation.versions[0].id,
      version: 'v1.0',
      status: BOMStatus.ACTIVE,
      components: {
        create: [
          { productId: aluminumSheet.id, quantity: 4 },
          { productId: steelPlate.id, quantity: 2 },
          { productId: linearRail.id, quantity: 2 },
          { productId: stepperMotor.id, quantity: 2 },
          { productId: microcontroller.id, quantity: 2 },
          { productId: displayOLED.id, quantity: 2 },
          { productId: controlPCB.id, quantity: 1 },
          { productId: coolingSystem.id, quantity: 1 },
          { productId: powerModule.id, quantity: 2 },
        ],
      },
      operations: {
        create: [
          { name: 'Enclosure Fabrication', time: 90, workCenter: 'WC-FAB-01', sequence: 1 },
          { name: 'Camera Mount Assembly', time: 60, workCenter: 'WC-ASM-01', sequence: 2 },
          { name: 'Lighting System Setup', time: 45, workCenter: 'WC-ASM-01', sequence: 3 },
          { name: 'Vision System Calibration', time: 120, workCenter: 'WC-CAL-01', sequence: 4 },
          { name: 'AI Model Integration', time: 90, workCenter: 'WC-PROG-01', sequence: 5 },
          { name: 'Accuracy Verification', time: 60, workCenter: 'WC-QC-01', sequence: 6 },
        ],
      },
    },
  });

  // BOM 6: Laser Cutter
  const bomLaser = await prisma.bOM.create({
    data: {
      productVersionId: laserCutter.versions[0].id,
      version: 'v1.0',
      status: BOMStatus.ACTIVE,
      components: {
        create: [
          { productId: steelPlate.id, quantity: 30 },
          { productId: aluminumSheet.id, quantity: 10 },
          { productId: linearRail.id, quantity: 8 },
          { productId: ballscrew.id, quantity: 4 },
          { productId: servoMotor.id, quantity: 4 },
          { productId: gearboxPlanetary.id, quantity: 2 },
          { productId: controlPCB.id, quantity: 2 },
          { productId: coolingSystem.id, quantity: 2 },
          { productId: powerModule.id, quantity: 4 },
          { productId: displayOLED.id, quantity: 1 },
          { productId: cableGland.id, quantity: 3 },
          { productId: boltKit.id, quantity: 6 },
        ],
      },
      operations: {
        create: [
          { name: 'Heavy Frame Welding', time: 360, workCenter: 'WC-WELD-01', sequence: 1 },
          { name: 'Precision Surface Grinding', time: 180, workCenter: 'WC-GRIND-01', sequence: 2 },
          { name: 'Gantry Assembly', time: 240, workCenter: 'WC-ASM-02', sequence: 3 },
          { name: 'Laser Source Installation', time: 120, workCenter: 'WC-LASER-01', sequence: 4 },
          { name: 'Beam Path Alignment', time: 150, workCenter: 'WC-CAL-01', sequence: 5 },
          { name: 'Cooling System Integration', time: 90, workCenter: 'WC-ASM-01', sequence: 6 },
          { name: 'Control System Setup', time: 120, workCenter: 'WC-ELEC-01', sequence: 7 },
          { name: 'Cutting Tests & Calibration', time: 180, workCenter: 'WC-TEST-01', sequence: 8 },
          { name: 'Safety Certification', time: 60, workCenter: 'WC-QC-01', sequence: 9 },
        ],
      },
    },
  });

  // BOM 7: AGV Robot
  const bomAGV = await prisma.bOM.create({
    data: {
      productVersionId: agvRobot.versions[0].id,
      version: 'v1.0',
      status: BOMStatus.ACTIVE,
      components: {
        create: [
          { productId: steelPlate.id, quantity: 6 },
          { productId: aluminumSheet.id, quantity: 8 },
          { productId: bldc500w.id, quantity: 4 },
          { productId: motorDriver.id, quantity: 4 },
          { productId: bearingSKF.id, quantity: 8 },
          { productId: sensorArray.id, quantity: 4 },
          { productId: microcontroller.id, quantity: 2 },
          { productId: controlPCB.id, quantity: 1 },
          { productId: powerModule.id, quantity: 2 },
          { productId: displayOLED.id, quantity: 1 },
          { productId: copperWire.id, quantity: 1 },
        ],
      },
      operations: {
        create: [
          { name: 'Chassis Fabrication', time: 150, workCenter: 'WC-FAB-01', sequence: 1 },
          { name: 'Drive System Assembly', time: 120, workCenter: 'WC-ASM-01', sequence: 2 },
          { name: 'LIDAR & Sensor Integration', time: 90, workCenter: 'WC-ASM-02', sequence: 3 },
          { name: 'Battery System Installation', time: 60, workCenter: 'WC-ELEC-01', sequence: 4 },
          { name: 'Navigation Software Setup', time: 120, workCenter: 'WC-PROG-01', sequence: 5 },
          { name: 'Path Testing & Mapping', time: 90, workCenter: 'WC-TEST-01', sequence: 6 },
          { name: 'Safety System Validation', time: 45, workCenter: 'WC-QC-01', sequence: 7 },
        ],
      },
    },
  });

  // BOM 8: Control PCB Assembly (Sub-assembly with its own BOM)
  const bomControlPCB = await prisma.bOM.create({
    data: {
      productVersionId: controlPCB.versions[0].id,
      version: 'v2.3',
      status: BOMStatus.ACTIVE,
      components: {
        create: [
          { productId: microcontroller.id, quantity: 1 },
          { productId: powerModule.id, quantity: 1 },
          { productId: copperWire.id, quantity: 0.1 },
        ],
      },
      operations: {
        create: [
          { name: 'PCB SMT Population', time: 30, workCenter: 'WC-SMT-01', sequence: 1 },
          { name: 'Reflow Soldering', time: 15, workCenter: 'WC-SMT-01', sequence: 2 },
          { name: 'Through-Hole Components', time: 20, workCenter: 'WC-ASM-01', sequence: 3 },
          { name: 'ICT Testing', time: 10, workCenter: 'WC-TEST-01', sequence: 4 },
          { name: 'Firmware Programming', time: 15, workCenter: 'WC-PROG-01', sequence: 5 },
          { name: 'Functional Test', time: 20, workCenter: 'WC-QC-01', sequence: 6 },
        ],
      },
    },
  });

  // BOM 9: Cooling System (Sub-assembly)
  const bomCooling = await prisma.bOM.create({
    data: {
      productVersionId: coolingSystem.versions[0].id,
      version: 'v1.0',
      status: BOMStatus.ACTIVE,
      components: {
        create: [
          { productId: aluminumSheet.id, quantity: 2 },
          { productId: copperWire.id, quantity: 0.5 },
          { productId: bldc500w.id, quantity: 2 },
          { productId: oringKit.id, quantity: 1 },
        ],
      },
      operations: {
        create: [
          { name: 'Radiator Assembly', time: 60, workCenter: 'WC-ASM-01', sequence: 1 },
          { name: 'Pump Integration', time: 30, workCenter: 'WC-ASM-01', sequence: 2 },
          { name: 'Leak Testing', time: 45, workCenter: 'WC-TEST-01', sequence: 3 },
          { name: 'Performance Validation', time: 30, workCenter: 'WC-QC-01', sequence: 4 },
        ],
      },
    },
  });

  // BOM 10: Hydraulic Unit (Sub-assembly)
  const bomHydraulic = await prisma.bOM.create({
    data: {
      productVersionId: hydraulicUnit.versions[0].id,
      version: 'v1.0',
      status: BOMStatus.ACTIVE,
      components: {
        create: [
          { productId: steelPlate.id, quantity: 4 },
          { productId: bldc500w.id, quantity: 1 },
          { productId: bearingSKF.id, quantity: 4 },
          { productId: oringKit.id, quantity: 2 },
          { productId: cableGland.id, quantity: 1 },
        ],
      },
      operations: {
        create: [
          { name: 'Tank Fabrication', time: 90, workCenter: 'WC-WELD-01', sequence: 1 },
          { name: 'Pump Assembly', time: 60, workCenter: 'WC-ASM-01', sequence: 2 },
          { name: 'Valve Block Integration', time: 45, workCenter: 'WC-ASM-01', sequence: 3 },
          { name: 'Pressure Testing', time: 60, workCenter: 'WC-TEST-01', sequence: 4 },
          { name: 'Certification', time: 30, workCenter: 'WC-QC-01', sequence: 5 },
        ],
      },
    },
  });

  // Additional DRAFT BOMs
  await prisma.bOM.create({
    data: {
      productVersionId: cncRouter.versions[0].id,
      version: 'v2.0-draft',
      status: BOMStatus.DRAFT,
      components: {
        create: [
          { productId: carbonFiber.id, quantity: 4 },
          { productId: aluminumSheet.id, quantity: 6 },
          { productId: linearRail.id, quantity: 6 },
          { productId: ballscrew.id, quantity: 3 },
          { productId: servoMotor.id, quantity: 4 },
          { productId: motorDriver.id, quantity: 4 },
          { productId: controlPCB.id, quantity: 1 },
        ],
      },
      operations: {
        create: [
          { name: 'Carbon Fiber Frame Assembly', time: 180, workCenter: 'WC-COMP-01', sequence: 1 },
          { name: 'Servo System Integration', time: 120, workCenter: 'WC-ASM-01', sequence: 2 },
        ],
      },
    },
  });

  // More draft/archived BOMs for variety
  await prisma.bOM.create({
    data: {
      productVersionId: robotArm.versions[0].id,
      version: 'v2.0-draft',
      status: BOMStatus.DRAFT,
      components: {
        create: [
          { productId: carbonFiber.id, quantity: 8 },
          { productId: titaniumRod.id, quantity: 6 },
          { productId: servoMotor.id, quantity: 7 },
        ],
      },
      operations: {
        create: [
          { name: 'Enhanced Arm Fabrication', time: 300, workCenter: 'WC-COMP-01', sequence: 1 },
        ],
      },
    },
  });

  // Legacy BOM (archived)
  await prisma.bOM.create({
    data: {
      productVersionId: legacyController.versions[0].id,
      version: 'v3.2',
      status: BOMStatus.ARCHIVED,
      components: {
        create: [
          { productId: microcontroller.id, quantity: 1 },
          { productId: powerModule.id, quantity: 1 },
        ],
      },
      operations: {
        create: [
          { name: 'Legacy Assembly', time: 60, workCenter: 'WC-ASM-01', sequence: 1 },
        ],
      },
    },
  });

  // Additional active BOMs for more products
  for (let i = 0; i < 10; i++) {
    const products = [steelPlate, aluminumSheet, bearingSKF, motorDriver, controlPCB];
    await prisma.bOM.create({
      data: {
        productVersionId: products[i % products.length].versions[0].id,
        version: `v1.${i}`,
        status: BOMStatus.ACTIVE,
        components: {
          create: [
            { productId: copperWire.id, quantity: 0.5 + i * 0.1 },
            { productId: boltKit.id, quantity: 1 + i },
          ],
        },
        operations: {
          create: [
            { name: 'Standard Assembly', time: 30 + i * 5, workCenter: 'WC-ASM-01', sequence: 1 },
            { name: 'Quality Check', time: 15, workCenter: 'WC-QC-01', sequence: 2 },
          ],
        },
      },
    });
  }

  console.log('   ✅ Created 23 BOMs (active, draft, archived with full components & operations)');

  // ========================================
  // 5. CREATE ECOs (25+ ECOs - All Statuses)
  // ========================================
  console.log('📝 Creating ECOs...');

  // ECO 1: APPLIED - Completed upgrade
  const eco1 = await prisma.eCO.create({
    data: {
      title: 'Upgrade CNC Router to Servo Motors',
      type: ECOType.BOM,
      productId: cncRouter.id,
      bomId: bomCNC.id,
      createdBy: engineer1.id,
      effectiveDate: new Date('2026-01-10'),
      versionUpdate: true,
      currentStage: 'Final Approval',
      status: ECOStatus.APPLIED,
      draftData: JSON.stringify({
        reason: 'Replace stepper motors with servo motors for improved precision and speed',
        changes: [
          { type: 'component', action: 'replace', from: 'NEMA 23 Stepper Motor', to: 'Yaskawa Servo Motor', quantity: 4 },
          { type: 'operation', action: 'update', operation: 'Calibration & Testing', from: 90, to: 120 },
        ],
      }),
    },
  });

  // ECO 2: APPLIED - Cost reduction
  const eco2 = await prisma.eCO.create({
    data: {
      title: 'Robot Arm Weight Reduction Initiative',
      type: ECOType.BOM,
      productId: robotArm.id,
      bomId: bomRobot.id,
      createdBy: engineer2.id,
      effectiveDate: new Date('2026-01-05'),
      versionUpdate: false,
      currentStage: 'Final Approval',
      status: ECOStatus.APPLIED,
      draftData: JSON.stringify({
        reason: 'Reduce arm weight by 15% using optimized carbon fiber layup',
        changes: [
          { type: 'component', action: 'update', component: 'Carbon Fiber Sheet', from: 6, to: 5 },
        ],
      }),
    },
  });

  // ECO 3: APPROVED - Waiting for implementation
  const eco3 = await prisma.eCO.create({
    data: {
      title: 'Conveyor System Safety Upgrade',
      type: ECOType.BOM,
      productId: conveyorSystem.id,
      bomId: bomConveyor.id,
      createdBy: engLead.id,
      effectiveDate: new Date('2026-02-01'),
      versionUpdate: true,
      currentStage: 'Final Approval',
      status: ECOStatus.APPROVED,
      draftData: JSON.stringify({
        reason: 'Add emergency stop sensors and safety barriers per new regulations',
        changes: [
          { type: 'component', action: 'add', component: 'Industrial Sensor Array', quantity: 4 },
          { type: 'operation', action: 'add', operation: 'Safety System Integration', time: 60 },
        ],
      }),
    },
  });

  // ECO 4: APPROVED - Product enhancement
  const eco4 = await prisma.eCO.create({
    data: {
      title: 'Packaging Machine Speed Optimization',
      type: ECOType.PRODUCT,
      productId: packagingMachine.id,
      bomId: bomPackaging.id,
      createdBy: engineer1.id,
      effectiveDate: new Date('2026-02-15'),
      versionUpdate: true,
      currentStage: 'Final Approval',
      status: ECOStatus.APPROVED,
      draftData: JSON.stringify({
        reason: 'Increase packaging speed from 30 to 45 units per minute',
        changes: [
          { type: 'product', action: 'update', field: 'Speed Rating', from: '30 UPM', to: '45 UPM' },
          { type: 'component', action: 'update', component: 'Servo Motor', from: 4, to: 6 },
        ],
      }),
    },
  });

  // ECO 5: IN_PROGRESS - Operations Review stage
  const eco5 = await prisma.eCO.create({
    data: {
      title: 'Vision Station AI Algorithm Update',
      type: ECOType.BOM,
      productId: qualityStation.id,
      bomId: bomVision.id,
      createdBy: engineer2.id,
      effectiveDate: new Date('2026-02-20'),
      versionUpdate: false,
      currentStage: 'Operations Review',
      status: ECOStatus.IN_PROGRESS,
      draftData: JSON.stringify({
        reason: 'Upgrade to new AI model with 99.9% defect detection accuracy',
        changes: [
          { type: 'operation', action: 'update', operation: 'AI Model Integration', from: 90, to: 120 },
        ],
      }),
    },
  });

  // ECO 6: IN_PROGRESS - Manager Approval stage
  const eco6 = await prisma.eCO.create({
    data: {
      title: 'Laser Cutter Power Upgrade to 3kW',
      type: ECOType.PRODUCT,
      productId: laserCutter.id,
      bomId: bomLaser.id,
      createdBy: engLead.id,
      effectiveDate: new Date('2026-03-01'),
      versionUpdate: true,
      currentStage: 'Manager Approval',
      status: ECOStatus.IN_PROGRESS,
      draftData: JSON.stringify({
        reason: 'Increase cutting capability for thicker materials',
        changes: [
          { type: 'product', action: 'update', field: 'Laser Power', from: '2kW', to: '3kW' },
          { type: 'component', action: 'add', component: 'Liquid Cooling System', quantity: 1 },
        ],
      }),
    },
  });

  // ECO 7: IN_PROGRESS - Engineering Review stage
  const eco7 = await prisma.eCO.create({
    data: {
      title: 'AGV Battery Life Extension',
      type: ECOType.BOM,
      productId: agvRobot.id,
      bomId: bomAGV.id,
      createdBy: engineer1.id,
      effectiveDate: new Date('2026-03-15'),
      versionUpdate: false,
      currentStage: 'Engineering Review',
      status: ECOStatus.IN_PROGRESS,
      draftData: JSON.stringify({
        reason: 'Extend battery runtime from 8 hours to 12 hours',
        changes: [
          { type: 'component', action: 'update', component: 'Power Module', from: 2, to: 3 },
        ],
      }),
    },
  });

  // ECO 8-12: DRAFT status ECOs
  const eco8 = await prisma.eCO.create({
    data: {
      title: 'CNC Router Dust Collection System',
      type: ECOType.BOM,
      productId: cncRouter.id,
      bomId: bomCNC.id,
      createdBy: engineer2.id,
      effectiveDate: null,
      versionUpdate: true,
      currentStage: 'New',
      status: ECOStatus.DRAFT,
      draftData: JSON.stringify({
        reason: 'Add integrated dust collection for cleaner operation',
        changes: [],
      }),
    },
  });

  await prisma.eCO.create({
    data: {
      title: 'Robot Arm Gripper Options Package',
      type: ECOType.PRODUCT,
      productId: robotArm.id,
      bomId: bomRobot.id,
      createdBy: engineer1.id,
      effectiveDate: null,
      versionUpdate: true,
      currentStage: 'New',
      status: ECOStatus.DRAFT,
      draftData: JSON.stringify({
        reason: 'Offer multiple gripper options as standard accessories',
      }),
    },
  });

  await prisma.eCO.create({
    data: {
      title: 'Conveyor Belt Material Change',
      type: ECOType.BOM,
      productId: conveyorSystem.id,
      bomId: bomConveyor.id,
      createdBy: engLead.id,
      effectiveDate: null,
      versionUpdate: false,
      currentStage: 'New',
      status: ECOStatus.DRAFT,
      draftData: JSON.stringify({
        reason: 'Switch to food-grade belt material for food industry applications',
      }),
    },
  });

  await prisma.eCO.create({
    data: {
      title: 'Packaging Machine HMI Upgrade',
      type: ECOType.PRODUCT,
      productId: packagingMachine.id,
      bomId: bomPackaging.id,
      createdBy: engineer2.id,
      effectiveDate: null,
      versionUpdate: false,
      currentStage: 'New',
      status: ECOStatus.DRAFT,
      draftData: JSON.stringify({
        reason: 'Upgrade to 7" touchscreen with multi-language support',
      }),
    },
  });

  await prisma.eCO.create({
    data: {
      title: 'Control PCB Revision 2.4 Planning',
      type: ECOType.BOM,
      productId: controlPCB.id,
      bomId: bomControlPCB.id,
      createdBy: engineer1.id,
      effectiveDate: null,
      versionUpdate: true,
      currentStage: 'New',
      status: ECOStatus.DRAFT,
      draftData: JSON.stringify({
        reason: 'Add CAN bus interface for Industry 4.0 connectivity',
      }),
    },
  });

  // ECO 13-16: REJECTED ECOs
  const eco13 = await prisma.eCO.create({
    data: {
      title: 'Replace Steel with Plastic for CNC Frame',
      type: ECOType.BOM,
      productId: cncRouter.id,
      bomId: bomCNC.id,
      createdBy: pendingUser.id,
      effectiveDate: null,
      versionUpdate: false,
      currentStage: 'Engineering Review',
      status: ECOStatus.REJECTED,
      draftData: JSON.stringify({
        reason: 'Cost reduction by using reinforced plastic instead of steel',
        rejectionReason: 'Plastic frame does not meet rigidity requirements for precision machining',
      }),
    },
  });

  const eco14 = await prisma.eCO.create({
    data: {
      title: 'Remove Safety Sensors from AGV',
      type: ECOType.BOM,
      productId: agvRobot.id,
      bomId: bomAGV.id,
      createdBy: engineer2.id,
      effectiveDate: null,
      versionUpdate: false,
      currentStage: 'Manager Approval',
      status: ECOStatus.REJECTED,
      draftData: JSON.stringify({
        reason: 'Cost reduction initiative',
        rejectionReason: 'Safety sensors are mandatory per ISO 3691-4 standards',
      }),
    },
  });

  const eco15 = await prisma.eCO.create({
    data: {
      title: 'Use Refurbished Motors in Robot Arm',
      type: ECOType.BOM,
      productId: robotArm.id,
      bomId: bomRobot.id,
      createdBy: engineer1.id,
      effectiveDate: null,
      versionUpdate: false,
      currentStage: 'Operations Review',
      status: ECOStatus.REJECTED,
      draftData: JSON.stringify({
        reason: 'Environmental initiative using refurbished components',
        rejectionReason: 'Refurbished motors cannot meet repeatability specs for collaborative robots',
      }),
    },
  });

  await prisma.eCO.create({
    data: {
      title: 'Remove Cooling System from Laser Cutter',
      type: ECOType.BOM,
      productId: laserCutter.id,
      bomId: bomLaser.id,
      createdBy: engineer2.id,
      effectiveDate: null,
      versionUpdate: false,
      currentStage: 'Engineering Review',
      status: ECOStatus.REJECTED,
      draftData: JSON.stringify({
        reason: 'Simplify design by removing active cooling',
        rejectionReason: 'Active cooling is essential for fiber laser source longevity',
      }),
    },
  });

  // ECOs 17-25: More variety
  await prisma.eCO.create({
    data: {
      title: 'Hydraulic Unit Efficiency Improvement',
      type: ECOType.BOM,
      productId: hydraulicUnit.id,
      bomId: bomHydraulic.id,
      createdBy: engLead.id,
      effectiveDate: new Date('2026-01-20'),
      versionUpdate: false,
      currentStage: 'Final Approval',
      status: ECOStatus.APPLIED,
      draftData: JSON.stringify({
        reason: 'Upgrade pump for 15% efficiency gain',
      }),
    },
  });

  await prisma.eCO.create({
    data: {
      title: 'Cooling System Noise Reduction',
      type: ECOType.BOM,
      productId: coolingSystem.id,
      bomId: bomCooling.id,
      createdBy: engineer1.id,
      effectiveDate: new Date('2026-01-18'),
      versionUpdate: false,
      currentStage: 'Final Approval',
      status: ECOStatus.APPLIED,
      draftData: JSON.stringify({
        reason: 'Replace fans with quieter models for office environments',
      }),
    },
  });

  const eco19 = await prisma.eCO.create({
    data: {
      title: 'Vision Station Multi-Camera Support',
      type: ECOType.PRODUCT,
      productId: qualityStation.id,
      bomId: bomVision.id,
      createdBy: engineer2.id,
      effectiveDate: new Date('2026-02-28'),
      versionUpdate: true,
      currentStage: 'Final Approval',
      status: ECOStatus.APPROVED,
      draftData: JSON.stringify({
        reason: 'Support up to 4 cameras for 360-degree inspection',
      }),
    },
  });

  await prisma.eCO.create({
    data: {
      title: 'Packaging Machine Quick-Change Tooling',
      type: ECOType.BOM,
      productId: packagingMachine.id,
      bomId: bomPackaging.id,
      createdBy: engLead.id,
      effectiveDate: null,
      versionUpdate: true,
      currentStage: 'New',
      status: ECOStatus.DRAFT,
      draftData: JSON.stringify({
        reason: 'Enable tool-free format changes under 5 minutes',
      }),
    },
  });

  await prisma.eCO.create({
    data: {
      title: 'AGV Fleet Management Integration',
      type: ECOType.PRODUCT,
      productId: agvRobot.id,
      bomId: bomAGV.id,
      createdBy: engineer1.id,
      effectiveDate: new Date('2026-03-20'),
      versionUpdate: true,
      currentStage: 'Engineering Review',
      status: ECOStatus.IN_PROGRESS,
      draftData: JSON.stringify({
        reason: 'Add fleet management capability for multi-robot coordination',
      }),
    },
  });

  await prisma.eCO.create({
    data: {
      title: 'Laser Cutter Auto-Focus Enhancement',
      type: ECOType.BOM,
      productId: laserCutter.id,
      bomId: bomLaser.id,
      createdBy: engineer2.id,
      effectiveDate: new Date('2026-03-25'),
      versionUpdate: false,
      currentStage: 'Manager Approval',
      status: ECOStatus.IN_PROGRESS,
      draftData: JSON.stringify({
        reason: 'Improve auto-focus accuracy from 0.1mm to 0.05mm',
      }),
    },
  });

  await prisma.eCO.create({
    data: {
      title: 'CNC Router Spindle Upgrade',
      type: ECOType.BOM,
      productId: cncRouter.id,
      bomId: bomCNC.id,
      createdBy: engLead.id,
      effectiveDate: new Date('2026-04-01'),
      versionUpdate: true,
      currentStage: 'Operations Review',
      status: ECOStatus.IN_PROGRESS,
      draftData: JSON.stringify({
        reason: 'Upgrade to 3HP spindle for harder materials',
      }),
    },
  });

  await prisma.eCO.create({
    data: {
      title: 'Conveyor Modular Extension Kit',
      type: ECOType.PRODUCT,
      productId: conveyorSystem.id,
      bomId: bomConveyor.id,
      createdBy: engineer1.id,
      effectiveDate: new Date('2026-04-10'),
      versionUpdate: true,
      currentStage: 'Final Approval',
      status: ECOStatus.APPROVED,
      draftData: JSON.stringify({
        reason: 'Create modular extension kit for flexible line configurations',
      }),
    },
  });

  await prisma.eCO.create({
    data: {
      title: 'Robot Arm Payload Increase',
      type: ECOType.PRODUCT,
      productId: robotArm.id,
      bomId: bomRobot.id,
      createdBy: engineer2.id,
      effectiveDate: new Date('2026-04-15'),
      versionUpdate: true,
      currentStage: 'Engineering Review',
      status: ECOStatus.IN_PROGRESS,
      draftData: JSON.stringify({
        reason: 'Increase payload capacity from 6kg to 10kg',
      }),
    },
  });

  console.log('   ✅ Created 25 ECOs (all statuses: Draft, In Progress, Approved, Rejected, Applied)');

  // ========================================
  // 6. CREATE ECO APPROVALS
  // ========================================
  console.log('✅ Creating ECO approvals...');

  // Approvals for Applied ECOs (all stages approved)
  const appliedECOs = [eco1, eco2];
  for (const eco of appliedECOs) {
    await prisma.eCOApproval.createMany({
      data: [
        { ecoId: eco.id, stageId: stageEngReview.id, approvedBy: engLead.id, approvedAt: new Date('2026-01-03'), status: ApprovalStatus.APPROVED, comments: 'Engineering review complete. Design verified.' },
        { ecoId: eco.id, stageId: stageApproval.id, approvedBy: director.id, approvedAt: new Date('2026-01-05'), status: ApprovalStatus.APPROVED, comments: 'Business case approved. Proceed.' },
        { ecoId: eco.id, stageId: stageOpsReview.id, approvedBy: opsManager.id, approvedAt: new Date('2026-01-07'), status: ApprovalStatus.APPROVED, comments: 'Production schedule accommodated.' },
        { ecoId: eco.id, stageId: stageFinal.id, approvedBy: qaManager.id, approvedAt: new Date('2026-01-09'), status: ApprovalStatus.APPROVED, comments: 'Final approval granted. Ready for implementation.' },
      ],
    });
  }

  // Approvals for Approved ECOs
  const approvedECOs = [eco3, eco4, eco19];
  for (const eco of approvedECOs) {
    await prisma.eCOApproval.createMany({
      data: [
        { ecoId: eco.id, stageId: stageEngReview.id, approvedBy: engineer1.id, approvedAt: new Date('2026-01-20'), status: ApprovalStatus.APPROVED, comments: 'Technical review passed.' },
        { ecoId: eco.id, stageId: stageApproval.id, approvedBy: director.id, approvedAt: new Date('2026-01-22'), status: ApprovalStatus.APPROVED, comments: 'Approved per budget allocation.' },
        { ecoId: eco.id, stageId: stageOpsReview.id, approvedBy: opsCoord.id, approvedAt: new Date('2026-01-24'), status: ApprovalStatus.APPROVED, comments: 'Materials and capacity confirmed.' },
        { ecoId: eco.id, stageId: stageFinal.id, approvedBy: qaManager.id, approvedAt: new Date('2026-01-25'), status: ApprovalStatus.APPROVED, comments: 'Quality standards met. Implementation approved.' },
      ],
    });
  }

  // Approvals for In Progress ECOs
  await prisma.eCOApproval.createMany({
    data: [
      // ECO 5 - Operations Review (3 stages done)
      { ecoId: eco5.id, stageId: stageEngReview.id, approvedBy: engLead.id, approvedAt: new Date('2026-01-22'), status: ApprovalStatus.APPROVED, comments: 'Algorithm improvements validated.' },
      { ecoId: eco5.id, stageId: stageApproval.id, approvedBy: director.id, approvedAt: new Date('2026-01-23'), status: ApprovalStatus.APPROVED, comments: 'Budget approved for AI upgrade.' },
      { ecoId: eco5.id, stageId: stageOpsReview.id, status: ApprovalStatus.PENDING },

      // ECO 6 - Manager Approval (1 stage done)
      { ecoId: eco6.id, stageId: stageEngReview.id, approvedBy: engineer2.id, approvedAt: new Date('2026-01-24'), status: ApprovalStatus.APPROVED, comments: 'Power upgrade feasibility confirmed.' },
      { ecoId: eco6.id, stageId: stageApproval.id, status: ApprovalStatus.PENDING },

      // ECO 7 - Engineering Review (pending first approval)
      { ecoId: eco7.id, stageId: stageEngReview.id, status: ApprovalStatus.PENDING },
    ],
  });

  // Approvals for Rejected ECOs
  await prisma.eCOApproval.createMany({
    data: [
      { ecoId: eco13.id, stageId: stageEngReview.id, approvedBy: engLead.id, approvedAt: new Date('2026-01-15'), status: ApprovalStatus.REJECTED, comments: 'Rejected: Plastic frame insufficient rigidity for precision work.' },

      { ecoId: eco14.id, stageId: stageEngReview.id, approvedBy: engineer1.id, approvedAt: new Date('2026-01-12'), status: ApprovalStatus.APPROVED, comments: 'Technically feasible.' },
      { ecoId: eco14.id, stageId: stageApproval.id, approvedBy: director.id, approvedAt: new Date('2026-01-14'), status: ApprovalStatus.REJECTED, comments: 'Rejected: Cannot compromise on safety compliance.' },

      { ecoId: eco15.id, stageId: stageEngReview.id, approvedBy: engLead.id, approvedAt: new Date('2026-01-10'), status: ApprovalStatus.APPROVED, comments: 'Environmental initiative appreciated.' },
      { ecoId: eco15.id, stageId: stageApproval.id, approvedBy: director.id, approvedAt: new Date('2026-01-11'), status: ApprovalStatus.APPROVED, comments: 'Approved with quality conditions.' },
      { ecoId: eco15.id, stageId: stageOpsReview.id, approvedBy: opsManager.id, approvedAt: new Date('2026-01-13'), status: ApprovalStatus.REJECTED, comments: 'Rejected: Refurbished motors fail repeatability spec for collaborative robots.' },
    ],
  });

  console.log('   ✅ Created ECO approvals for all workflow stages');

  // ========================================
  // 7. CREATE AUDIT LOGS
  // ========================================
  console.log('📜 Creating audit logs...');

  const auditLogs = [];
  const baseDate = new Date('2026-01-01');

  // User activity logs
  auditLogs.push(
    { action: AuditAction.CREATE, entityType: EntityType.USER, entityId: engineer1.id, userId: admin.id, newValue: JSON.stringify({ email: 'marcus.williams@globalmanufacturing.com' }), createdAt: new Date(baseDate.getTime() + 1000 * 60 * 60 * 8) },
    { action: AuditAction.CREATE, entityType: EntityType.USER, entityId: engineer2.id, userId: admin.id, newValue: JSON.stringify({ email: 'priya.sharma@globalmanufacturing.com' }), createdAt: new Date(baseDate.getTime() + 1000 * 60 * 60 * 9) },
  );

  // Product creation logs
  const productLogs = [cncRouter, robotArm, conveyorSystem, packagingMachine, qualityStation, laserCutter, agvRobot];
  for (let i = 0; i < productLogs.length; i++) {
    auditLogs.push({
      action: AuditAction.CREATE,
      entityType: EntityType.PRODUCT,
      entityId: productLogs[i].id,
      userId: admin.id,
      newValue: JSON.stringify({ name: productLogs[i].name }),
      createdAt: new Date(baseDate.getTime() + 1000 * 60 * 60 * (10 + i)),
    });
  }

  // ECO workflow logs
  auditLogs.push(
    { action: AuditAction.CREATE, entityType: EntityType.ECO, entityId: eco1.id, userId: engineer1.id, ecoId: eco1.id, newValue: JSON.stringify({ title: eco1.title }), createdAt: new Date('2026-01-02T09:00:00') },
    { action: AuditAction.STAGE_TRANSITION, entityType: EntityType.ECO, entityId: eco1.id, userId: engineer1.id, ecoId: eco1.id, stage: 'Engineering Review', createdAt: new Date('2026-01-02T10:00:00') },
    { action: AuditAction.APPROVE, entityType: EntityType.ECO_APPROVAL, entityId: eco1.id, userId: engLead.id, ecoId: eco1.id, stage: 'Engineering Review', comments: 'Engineering review complete', createdAt: new Date('2026-01-03T14:00:00') },
    { action: AuditAction.STAGE_TRANSITION, entityType: EntityType.ECO, entityId: eco1.id, userId: engLead.id, ecoId: eco1.id, stage: 'Manager Approval', createdAt: new Date('2026-01-03T14:05:00') },
    { action: AuditAction.APPROVE, entityType: EntityType.ECO_APPROVAL, entityId: eco1.id, userId: director.id, ecoId: eco1.id, stage: 'Manager Approval', comments: 'Approved', createdAt: new Date('2026-01-05T11:00:00') },
  );

  // Rejection logs
  auditLogs.push(
    { action: AuditAction.CREATE, entityType: EntityType.ECO, entityId: eco13.id, userId: pendingUser.id, ecoId: eco13.id, newValue: JSON.stringify({ title: eco13.title }), createdAt: new Date('2026-01-14T09:00:00') },
    { action: AuditAction.REJECT, entityType: EntityType.ECO_APPROVAL, entityId: eco13.id, userId: engLead.id, ecoId: eco13.id, stage: 'Engineering Review', comments: 'Plastic frame insufficient', createdAt: new Date('2026-01-15T16:00:00') },
  );

  // Login/activity logs
  const users = [admin, engineer1, engineer2, engLead, director, opsManager, opsCoord, qaManager];
  for (const user of users) {
    auditLogs.push({
      action: AuditAction.UPDATE,
      entityType: EntityType.USER,
      entityId: user.id,
      userId: user.id,
      comments: 'User logged in',
      createdAt: new Date('2026-01-25T08:00:00'),
    });
  }

  await prisma.auditLog.createMany({ data: auditLogs });

  console.log('   ✅ Created 25+ audit log entries');

  // ========================================
  // 8. CREATE NOTIFICATIONS
  // ========================================
  console.log('🔔 Creating notifications...');

  const notifications = [
    // Pending approvals
    { type: NotificationType.APPROVAL_REQUIRED, title: 'Approval Required', message: 'ECO "Vision Station AI Algorithm Update" needs your review at Operations Review stage', userId: opsManager.id, data: JSON.stringify({ ecoId: eco5.id }), read: false },
    { type: NotificationType.APPROVAL_REQUIRED, title: 'Approval Required', message: 'ECO "Laser Cutter Power Upgrade to 3kW" awaiting Manager Approval', userId: director.id, data: JSON.stringify({ ecoId: eco6.id }), read: false },
    { type: NotificationType.APPROVAL_REQUIRED, title: 'Approval Required', message: 'ECO "AGV Battery Life Extension" needs Engineering Review', userId: engLead.id, data: JSON.stringify({ ecoId: eco7.id }), read: false },

    // Completed approvals
    { type: NotificationType.ECO_APPROVED, title: 'ECO Approved', message: 'Your ECO "Conveyor System Safety Upgrade" has been fully approved', userId: engLead.id, data: JSON.stringify({ ecoId: eco3.id }), read: true },
    { type: NotificationType.ECO_APPROVED, title: 'ECO Approved', message: 'ECO "Packaging Machine Speed Optimization" approved for implementation', userId: engineer1.id, data: JSON.stringify({ ecoId: eco4.id }), read: false },

    // Rejections
    { type: NotificationType.ECO_REJECTED, title: 'ECO Rejected', message: 'Your ECO "Replace Steel with Plastic for CNC Frame" was rejected at Engineering Review', userId: pendingUser.id, data: JSON.stringify({ ecoId: eco13.id }), read: false },
    { type: NotificationType.ECO_REJECTED, title: 'ECO Rejected', message: 'ECO "Remove Safety Sensors from AGV" rejected - safety compliance required', userId: engineer2.id, data: JSON.stringify({ ecoId: eco14.id }), read: true },

    // Applied ECOs
    { type: NotificationType.ECO_APPLIED, title: 'ECO Applied', message: 'ECO "Upgrade CNC Router to Servo Motors" has been applied to production', userId: engineer1.id, data: JSON.stringify({ ecoId: eco1.id }), read: true },
    { type: NotificationType.ECO_APPLIED, title: 'ECO Applied', message: 'ECO "Robot Arm Weight Reduction Initiative" successfully implemented', userId: engineer2.id, data: JSON.stringify({ ecoId: eco2.id }), read: true },

    // Stage changes
    { type: NotificationType.STAGE_CHANGED, title: 'Stage Changed', message: 'ECO "Vision Station AI Algorithm Update" moved to Operations Review', userId: engineer2.id, data: JSON.stringify({ ecoId: eco5.id }), read: false },
    { type: NotificationType.STAGE_CHANGED, title: 'Stage Changed', message: 'ECO "Laser Cutter Power Upgrade" advanced to Manager Approval', userId: engLead.id, data: JSON.stringify({ ecoId: eco6.id }), read: false },

    // Version created
    { type: NotificationType.VERSION_CREATED, title: 'New Version Created', message: 'CNC Router PRO-4030 v1.1 created from ECO implementation', userId: null, data: JSON.stringify({ productId: cncRouter.id }), read: false },
    { type: NotificationType.VERSION_CREATED, title: 'New Version Created', message: '6-Axis Robot Arm v1.1 released with weight reduction', userId: null, data: JSON.stringify({ productId: robotArm.id }), read: false },

    // ECO created notifications
    { type: NotificationType.ECO_CREATED, title: 'New ECO Created', message: 'New ECO "CNC Router Dust Collection System" created by Priya Sharma', userId: engLead.id, data: JSON.stringify({ ecoId: eco8.id }), read: false },
    { type: NotificationType.ECO_SUBMITTED, title: 'ECO Submitted', message: 'ECO "AGV Battery Life Extension" submitted for review', userId: engLead.id, data: JSON.stringify({ ecoId: eco7.id }), read: false },
  ];

  await prisma.notification.createMany({ data: notifications });

  console.log('   ✅ Created 15 notifications (all types)');

  // ========================================
  // 9. CREATE ROLE REQUESTS
  // ========================================
  console.log('📋 Creating role requests...');

  await prisma.roleRequest.createMany({
    data: [
      {
        userId: pendingUser.id,
        requestedRoles: [UserRole.ENGINEERING, UserRole.OPERATIONS],
        reason: 'Need Operations access to review production schedules for ECO planning',
        status: 'PENDING',
      },
      {
        userId: engineer1.id,
        requestedRoles: [UserRole.APPROVER],
        reason: 'Promoted to Senior Engineer, need approval rights for junior ECOs',
        status: 'APPROVED',
        reviewedBy: admin.id,
        reviewedAt: new Date('2026-01-20'),
      },
      {
        userId: opsCoord.id,
        requestedRoles: [UserRole.ENGINEERING],
        reason: 'Cross-training program - want to contribute to engineering tasks',
        status: 'REJECTED',
        reviewedBy: admin.id,
        reviewedAt: new Date('2026-01-18'),
      },
    ],
  });

  console.log('   ✅ Created 3 role requests (pending, approved, rejected)');

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n' + '═'.repeat(60));
  console.log('✨ SEED COMPLETED SUCCESSFULLY!');
  console.log('═'.repeat(60));
  console.log('\n📊 Data Summary:');
  console.log('   • 10 Users (multi-role, active, disabled, pending)');
  console.log('   • 5 Approval Stages');
  console.log('   • 32 Products (raw materials, components, sub-assemblies, finished goods)');
  console.log('   • 23 BOMs (active, draft, archived with operations)');
  console.log('   • 25 ECOs (Draft, In Progress, Approved, Rejected, Applied)');
  console.log('   • Complete approval workflows');
  console.log('   • 25+ Audit log entries');
  console.log('   • 15 Notifications (all types)');
  console.log('   • 3 Role requests\n');

  console.log('🔐 Login Credentials (password: password123):');
  console.log('─'.repeat(50));
  console.log('   ADMIN:      admin@globalmanufacturing.com');
  console.log('   ENG LEAD:   jennifer.chen@globalmanufacturing.com (multi-role)');
  console.log('   ENGINEER:   marcus.williams@globalmanufacturing.com');
  console.log('   ENGINEER:   priya.sharma@globalmanufacturing.com');
  console.log('   QA MANAGER: thomas.mueller@globalmanufacturing.com (multi-role)');
  console.log('   DIRECTOR:   sarah.johnson@globalmanufacturing.com');
  console.log('   OPS MGR:    david.kim@globalmanufacturing.com');
  console.log('   OPS COORD:  elena.rodriguez@globalmanufacturing.com');
  console.log('   DISABLED:   former.employee@globalmanufacturing.com');
  console.log('   PENDING:    new.hire@globalmanufacturing.com\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
