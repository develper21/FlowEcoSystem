import { Request, Response } from 'express';
import prisma from '../config/database';

// Create BoM
export const createBOM = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productVersionId, version, components, operations } = req.body;

    if (!productVersionId || !version) {
      res.status(400).json({ status: 'error', message: 'Product version ID and version are required' });
      return;
    }

    // CRITICAL FIX: Validate all component products are not archived
    if (components && components.length > 0) {
      const componentProductIds = components.map((c: any) => c.productId);
      const archivedProducts = await prisma.product.findMany({
        where: {
          id: { in: componentProductIds },
          status: 'ARCHIVED',
        },
        select: { id: true, name: true },
      });

      if (archivedProducts.length > 0) {
        res.status(400).json({
          status: 'error',
          message: `Cannot use archived products in BOM: ${archivedProducts.map(p => p.name).join(', ')}`,
        });
        return;
      }
    }

    const bom = await prisma.bOM.create({
      data: {
        productVersionId,
        version,
        status: 'DRAFT',
        components: {
          create: components?.map((c: any) => ({
            productId: c.productId,
            quantity: c.quantity,
          })) || [],
        },
        operations: {
          create: operations?.map((o: any, index: number) => ({
            name: o.name,
            time: o.time || 0,
            workCenter: o.workCenter || 'Default',
            sequence: index + 1,
          })) || [],
        },
      },
      include: {
        components: true,
        operations: { orderBy: { sequence: 'asc' } },
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'BoM created successfully',
      data: { bom },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to create BoM' });
  }
};

// Get all BoMs
export const getAllBOMs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const where: any = { status: { not: 'ARCHIVED' } };
    if (productId) where.productVersion = { productId: productId };

    const [boms, total] = await Promise.all([
      prisma.bOM.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          productVersion: { include: { product: { select: { id: true, name: true } } } },
          _count: { select: { components: true, operations: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bOM.count({ where }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        boms,
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch BoMs' });
  }
};

// Get BoM by ID
export const getBOMById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const bom = await prisma.bOM.findUnique({
      where: { id },
      include: {
        productVersion: { include: { product: true } },
        components: { include: { product: true }, orderBy: { createdAt: 'asc' } },
        operations: { orderBy: { sequence: 'asc' } },
      },
    });

    if (!bom) {
      res.status(404).json({ status: 'error', message: 'BoM not found' });
      return;
    }

    res.status(200).json({ status: 'success', data: { bom } });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch BoM' });
  }
};

// Update BoM
export const updateBOM = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { version, status } = req.body;

    // CRITICAL FIX: Prevent editing ACTIVE and ARCHIVED BOMs (must use ECO workflow)
    const existingBom = await prisma.bOM.findUnique({ 
      where: { id },
      select: { status: true, version: true }
    });

    if (!existingBom) {
      res.status(404).json({ status: 'error', message: 'BoM not found' });
      return;
    }

    if (existingBom.status === 'ACTIVE') {
      res.status(400).json({ 
        status: 'error', 
        message: 'Cannot directly edit ACTIVE BOMs. Use ECO workflow to modify active BOMs to maintain version history.' 
      });
      return;
    }

    if (existingBom.status === 'ARCHIVED') {
      res.status(400).json({ 
        status: 'error', 
        message: 'Cannot modify archived BOMs. Archived data is read-only for traceability.' 
      });
      return;
    }

    // Only allow updates to DRAFT BOMs
    const bom = await prisma.bOM.update({
      where: { id },
      data: { version, status },
    });

    res.status(200).json({
      status: 'success',
      message: 'BoM updated successfully',
      data: { bom },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to update BoM' });
  }
};

// Add component to BoM
export const addComponent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { productId, quantity } = req.body;

    // Validate inputs
    if (!productId) {
      res.status(400).json({ status: 'error', message: 'Product ID is required' });
      return;
    }

    if (!quantity || quantity <= 0) {
      res.status(400).json({ status: 'error', message: 'Quantity must be greater than 0' });
      return;
    }

    // CRITICAL FIX: Check if BOM is archived
    const bom = await prisma.bOM.findUnique({ 
      where: { id },
      select: { status: true }
    });

    if (!bom) {
      res.status(404).json({ status: 'error', message: 'BoM not found' });
      return;
    }

    if (bom.status === 'ARCHIVED') {
      res.status(400).json({ 
        status: 'error', 
        message: 'Cannot add components to archived BOMs' 
      });
      return;
    }

    // CRITICAL FIX: Validate product exists and is ACTIVE
    const product = await prisma.product.findUnique({ 
      where: { id: productId },
      select: { status: true, name: true }
    });

    if (!product) {
      res.status(404).json({ status: 'error', message: 'Product not found' });
      return;
    }

    if (product.status === 'ARCHIVED') {
      res.status(400).json({ 
        status: 'error', 
        message: `Cannot use archived product "${product.name}" as a component. Only active products can be used in BOMs.` 
      });
      return;
    }

    const component = await prisma.bOMComponent.create({
      data: {
        bomId: id,
        productId,
        quantity,
      },
      include: {
        product: { select: { id: true, name: true, status: true } }
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Component added successfully',
      data: { component },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to add component' });
  }
};

// Add operation to BoM
export const addOperation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, time, workCenter, sequence } = req.body;

    // Validate inputs
    if (!name || !name.trim()) {
      res.status(400).json({ status: 'error', message: 'Operation name is required' });
      return;
    }

    if (time === undefined || time < 0) {
      res.status(400).json({ status: 'error', message: 'Operation time must be 0 or greater' });
      return;
    }

    // CRITICAL FIX: Check if BOM is archived
    const bom = await prisma.bOM.findUnique({ 
      where: { id },
      select: { status: true }
    });

    if (!bom) {
      res.status(404).json({ status: 'error', message: 'BoM not found' });
      return;
    }

    if (bom.status === 'ARCHIVED') {
      res.status(400).json({ 
        status: 'error', 
        message: 'Cannot add operations to archived BOMs' 
      });
      return;
    }

    // Auto-calculate sequence if not provided
    let operationSequence = sequence;
    if (!operationSequence || operationSequence <= 0) {
      const lastOp = await prisma.bOMOperation.findFirst({
        where: { bomId: id },
        orderBy: { sequence: 'desc' },
      });
      operationSequence = (lastOp?.sequence || 0) + 1;
    }

    const operation = await prisma.bOMOperation.create({
      data: {
        bomId: id,
        name,
        time: time || 0,
        workCenter: workCenter || 'Default',
        sequence: operationSequence,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Operation added successfully',
      data: { operation },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to add operation' });
  }
};

// CRITICAL FIX: Remove component from BOM with ARCHIVED protection
export const removeComponent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, componentId } = req.params;

    // Check if BOM exists and is not archived
    const bom = await prisma.bOM.findUnique({ 
      where: { id },
      select: { status: true }
    });

    if (!bom) {
      res.status(404).json({ status: 'error', message: 'BoM not found' });
      return;
    }

    // CRITICAL: Prevent removal from ARCHIVED BOMs
    if (bom.status === 'ARCHIVED') {
      res.status(400).json({ 
        status: 'error', 
        message: 'Cannot remove components from archived BOMs. Use ECO workflow for changes.' 
      });
      return;
    }

    // Check if component exists
    const component = await prisma.bOMComponent.findUnique({ where: { id: componentId } });
    if (!component) {
      res.status(404).json({ status: 'error', message: 'Component not found' });
      return;
    }

    // Delete component
    await prisma.bOMComponent.delete({ where: { id: componentId } });

    res.status(200).json({
      status: 'success',
      message: 'Component removed successfully',
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to remove component' });
  }
};

// CRITICAL FIX: Remove operation from BOM with ARCHIVED protection
export const removeOperation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, operationId } = req.params;

    // Check if BOM exists and is not archived
    const bom = await prisma.bOM.findUnique({ 
      where: { id },
      select: { status: true }
    });

    if (!bom) {
      res.status(404).json({ status: 'error', message: 'BoM not found' });
      return;
    }

    // CRITICAL: Prevent removal from ARCHIVED BOMs
    if (bom.status === 'ARCHIVED') {
      res.status(400).json({ 
        status: 'error', 
        message: 'Cannot remove operations from archived BOMs. Use ECO workflow for changes.' 
      });
      return;
    }

    // Check if operation exists
    const operation = await prisma.bOMOperation.findUnique({ where: { id: operationId } });
    if (!operation) {
      res.status(404).json({ status: 'error', message: 'Operation not found' });
      return;
    }

    // Delete operation
    await prisma.bOMOperation.delete({ where: { id: operationId } });

    res.status(200).json({
      status: 'success',
      message: 'Operation removed successfully',
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to remove operation' });
  }
};

// Publish BOM (DRAFT → ACTIVE)
export const publishBOM = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Fetch BOM with components and operations
    const bom = await prisma.bOM.findUnique({
      where: { id },
      include: {
        productVersion: { select: { status: true, version: true, product: { select: { name: true } } } },
        components: true,
        operations: true,
      },
    });

    if (!bom) {
      res.status(404).json({ status: 'error', message: 'BoM not found' });
      return;
    }

    // Validation: Must be DRAFT
    if (bom.status !== 'DRAFT') {
      res.status(400).json({
        status: 'error',
        message: `Cannot publish BOM with status ${bom.status}. Only DRAFT BOMs can be published.`,
      });
      return;
    }

    // Validation: Must have at least one component
    if (!bom.components || bom.components.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'Cannot publish BOM without components. Please add at least one component.',
      });
      return;
    }

    // Validation: Must have at least one operation
    if (!bom.operations || bom.operations.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'Cannot publish BOM without operations. Please add at least one operation.',
      });
      return;
    }

    // Validation: Product version must be ACTIVE
    if (bom.productVersion.status !== 'ACTIVE') {
      res.status(400).json({
        status: 'error',
        message: `Cannot publish BOM for ${bom.productVersion.status} product version. Product version must be ACTIVE.`,
      });
      return;
    }

    // Update BOM to ACTIVE
    const publishedBom = await prisma.bOM.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: {
        productVersion: { include: { product: true } },
        components: { include: { product: true } },
        operations: { orderBy: { sequence: 'asc' } },
      },
    });

    res.status(200).json({
      status: 'success',
      message: `BOM ${bom.version} for ${bom.productVersion.product.name} v${bom.productVersion.version} published successfully`,
      data: { bom: publishedBom },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to publish BOM' });
  }
};
