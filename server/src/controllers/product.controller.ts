import { Request, Response } from 'express';
import prisma from '../config/database';

// Create product
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, salePrice, costPrice } = req.body;

    if (!name) {
      res.status(400).json({ status: 'error', message: 'Product name is required' });
      return;
    }

    // Validate prices
    const sale = salePrice ? parseFloat(salePrice) : 0;
    const cost = costPrice ? parseFloat(costPrice) : 0;

    if (sale < 0 || cost < 0) {
      res.status(400).json({ status: 'error', message: 'Prices must be greater than or equal to 0' });
      return;
    }

    const product = await prisma.product.create({
      data: {
        name,
        status: 'ACTIVE', // Products are created as ACTIVE
        versions: {
          create: {
            version: 'v1.0',
            salePrice: sale,
            costPrice: cost,
            status: 'ACTIVE', // Initial version is ACTIVE
          },
        },
      },
      include: { 
        versions: true,
        currentVersion: true
      },
    });

    // Set the first version as current version
    if (product.versions[0]) {
      await prisma.product.update({
        where: { id: product.id },
        data: { currentVersionId: product.versions[0].id },
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Product created successfully',
      data: { product },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to create product' });
  }
};

// Get all products
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', search, archived } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }
    if (archived !== undefined) where.status = archived === 'true' ? 'ARCHIVED' : { not: 'ARCHIVED' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          currentVersion: true,
          _count: { select: { versions: true, ecos: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch products' });
  }
};

// Get product by ID
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { createdAt: 'desc' } },
        currentVersion: true,
      },
    });

    if (!product) {
      res.status(404).json({ status: 'error', message: 'Product not found' });
      return;
    }

    res.status(200).json({ status: 'success', data: { product } });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch product' });
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const existingProduct = await prisma.product.findUnique({ 
      where: { id },
      select: { status: true, name: true }
    });

    if (!existingProduct) {
      res.status(404).json({ status: 'error', message: 'Product not found' });
      return;
    }

    // CRITICAL: Prevent edits to ARCHIVED products
    if (existingProduct.status === 'ARCHIVED') {
      res.status(400).json({ 
        status: 'error', 
        message: 'Cannot edit archived products. Archived data is read-only for traceability.' 
      });
      return;
    }

    // Allow product name changes for ACTIVE products (metadata only)
    // Price/version changes must go through ECO workflow
    const product = await prisma.product.update({
      where: { id },
      data: { name },
    });

    res.status(200).json({
      status: 'success',
      message: 'Product updated successfully',
      data: { product },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to update product' });
  }
};

// Archive product with cascading
export const archiveProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { cascadeArchive = true } = req.query; // Default to true for data consistency

    // CRITICAL FIX: Use transaction for cascading archive
    await prisma.$transaction(async (tx) => {
      // Archive the product
      await tx.product.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      });

      // CASCADE: Archive all product versions if requested
      if (cascadeArchive === 'true' || cascadeArchive === true) {
        await tx.productVersion.updateMany({
          where: { 
            productId: id,
            status: { not: 'ARCHIVED' }
          },
          data: { status: 'ARCHIVED' },
        });

        // CASCADE: Archive all BOMs linked to this product's versions
        const versions = await tx.productVersion.findMany({
          where: { productId: id },
          select: { id: true }
        });

        const versionIds = versions.map(v => v.id);
        if (versionIds.length > 0) {
          await tx.bOM.updateMany({
            where: {
              productVersionId: { in: versionIds },
              status: { not: 'ARCHIVED' }
            },
            data: { status: 'ARCHIVED' },
          });
        }
      }
    });

    res.status(200).json({
      status: 'success',
      message: cascadeArchive === 'true' || cascadeArchive === true 
        ? 'Product and all related versions/BOMs archived successfully'
        : 'Product archived successfully',
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to archive product' });
  }
};

// Create new version
export const createProductVersion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get latest version
    const latestVersion = await prisma.productVersion.findFirst({
      where: { productId: id },
      orderBy: { createdAt: 'desc' },
    });

    // Parse version number
    const currentVersionNum = latestVersion?.version.replace('v', '') || '1.0';
    const nextVersion = `v${parseFloat(currentVersionNum) + 0.1}`;

    // Create new version
    const newVersion = await prisma.productVersion.create({
      data: {
        productId: id,
        version: nextVersion,
        salePrice: latestVersion?.salePrice || 0,
        costPrice: latestVersion?.costPrice || 0,
        status: 'ACTIVE',
      },
    });

    // Set as current version
    await prisma.product.update({
      where: { id },
      data: { currentVersionId: newVersion.id, status: 'ACTIVE' },
    });

    res.status(201).json({
      status: 'success',
      message: 'New version created successfully',
      data: { version: newVersion },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to create version' });
  }
};

// CRITICAL: Product versions are immutable once created (use ECO workflow for changes)
export const updateProductVersion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingVersion = await prisma.productVersion.findUnique({ 
      where: { id },
      select: { status: true, version: true, productId: true }
    });

    if (!existingVersion) {
      res.status(404).json({ status: 'error', message: 'Product version not found' });
      return;
    }

    // CRITICAL: Versions are immutable - all changes must go through ECO workflow
    if (existingVersion.status === 'ACTIVE') {
      res.status(400).json({ 
        status: 'error', 
        message: 'Cannot modify active product versions. Use ECO workflow to create new versions.' 
      });
      return;
    }

    if (existingVersion.status === 'ARCHIVED') {
      res.status(400).json({ 
        status: 'error', 
        message: 'Cannot modify archived versions. Archived data is immutable for traceability.' 
      });
      return;
    }

    res.status(400).json({
      status: 'error',
      message: 'Product versions cannot be edited. Use ECO workflow for all modifications.',
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to update product version' });
  }
};

// Delete product - only ARCHIVED products can be deleted (requires explicit confirmation)
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: { status: true, name: true }
    });

    if (!product) {
      res.status(404).json({ status: 'error', message: 'Product not found' });
      return;
    }

    // CRITICAL: ACTIVE products cannot be deleted - must archive first
    if (product.status === 'ACTIVE') {
      res.status(400).json({ 
        status: 'error', 
        message: 'Cannot delete active products. Archive the product first.' 
      });
      return;
    }

    // Only ARCHIVED products can be deleted (for cleanup/compliance)
    await prisma.product.delete({ where: { id } });

    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to delete product' });
  }
};
