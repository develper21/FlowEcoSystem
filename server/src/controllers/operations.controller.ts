import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * OPERATIONS Role Controller
 * 
 * CRITICAL: These endpoints enforce that OPERATIONS users can ONLY see ACTIVE data.
 * OPERATIONS role should never see DRAFT or ARCHIVED items to maintain data integrity.
 */

// Get only ACTIVE products for operations
export const getActiveProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { status: 'ACTIVE' }; // CRITICAL: Only ACTIVE products
    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          currentVersion: {
            where: { status: 'ACTIVE' }, // Only ACTIVE versions
          },
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
    console.error('Get active products error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch active products' });
  }
};

// Get only ACTIVE BOMs for operations
export const getActiveBOMs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', productId } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { status: 'ACTIVE' }; // CRITICAL: Only ACTIVE BOMs
    if (productId) {
      where.productVersion = { 
        productId: productId as string,
        status: 'ACTIVE', // Ensure product version is also ACTIVE
      };
    }

    const [boms, total] = await Promise.all([
      prisma.bOM.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          productVersion: {
            include: { 
              product: { 
                select: { id: true, name: true, status: true } 
              } 
            },
          },
          components: {
            include: {
              product: {
                select: { id: true, name: true, status: true },
              },
            },
          },
          operations: { orderBy: { sequence: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bOM.count({ where }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        boms,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    console.error('Get active BOMs error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch active BOMs' });
  }
};

// Get specific ACTIVE product by ID
export const getActiveProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { 
        id,
        status: 'ACTIVE', // CRITICAL: Only if ACTIVE
      },
      include: {
        currentVersion: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!product) {
      res.status(404).json({ 
        status: 'error', 
        message: 'Active product not found or product is not in active status' 
      });
      return;
    }

    res.status(200).json({ status: 'success', data: { product } });
  } catch (error: any) {
    console.error('Get active product error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch active product' });
  }
};

// Get specific ACTIVE BOM by ID
export const getActiveBOMById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const bom = await prisma.bOM.findUnique({
      where: { 
        id,
        status: 'ACTIVE', // CRITICAL: Only if ACTIVE
      },
      include: {
        productVersion: {
          include: { 
            product: true,
          },
        },
        components: {
          include: {
            product: true,
          },
        },
        operations: { orderBy: { sequence: 'asc' } },
      },
    });

    if (!bom) {
      res.status(404).json({ 
        status: 'error', 
        message: 'Active BOM not found or BOM is not in active status' 
      });
      return;
    }

    res.status(200).json({ status: 'success', data: { bom } });
  } catch (error: any) {
    console.error('Get active BOM error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch active BOM' });
  }
};

// Get active product-version-BOM matrix for operations
export const getActiveMatrix = async (_req: Request, res: Response): Promise<void> => {
  try {
    const activeProducts = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: {
        currentVersion: {
          where: { status: 'ACTIVE' },
          include: {
            boms: {
              where: { status: 'ACTIVE' },
              include: {
                _count: {
                  select: {
                    components: true,
                    operations: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const matrix = activeProducts.map(product => ({
      productId: product.id,
      productName: product.name,
      productStatus: product.status,
      currentVersion: product.currentVersion ? {
        versionId: product.currentVersion.id,
        version: product.currentVersion.version,
        salePrice: product.currentVersion.salePrice,
        costPrice: product.currentVersion.costPrice,
        status: product.currentVersion.status,
        activeBOMs: product.currentVersion.boms.map(bom => ({
          bomId: bom.id,
          bomVersion: bom.version,
          bomStatus: bom.status,
          componentCount: bom._count.components,
          operationCount: bom._count.operations,
        })),
      } : null,
    }));

    res.status(200).json({
      status: 'success',
      data: { 
        matrix,
        summary: {
          totalActiveProducts: matrix.length,
          totalActiveBOMs: matrix.reduce((sum, p) => sum + (p.currentVersion?.activeBOMs.length || 0), 0),
        },
      },
    });
  } catch (error: any) {
    console.error('Get active matrix error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch active matrix' });
  }
};
