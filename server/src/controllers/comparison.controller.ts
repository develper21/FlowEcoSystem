import { Request, Response } from 'express';
import prisma from '../config/database';

// Get ECO comparison - shows changes between old and new versions
export const getECOComparison = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get ECO with related data
    const eco = await prisma.eCO.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            currentVersion: true,
          },
        },
        bom: {
          include: {
            components: {
              include: {
                product: {
                  include: {
                    currentVersion: true,
                  },
                },
              },
            },
            operations: true,
            productVersion: true,
          },
        },
      },
    });

    if (!eco) {
      res.status(404).json({ status: 'error', message: 'ECO not found' });
      return;
    }

    const draftData = eco.draftData as any || {};
    const comparison: any = {
      ecoId: eco.id,
      title: eco.title,
      type: eco.type,
      status: eco.status,
      currentStage: eco.currentStage,
      changes: {},
    };

    // Product comparison
    if (eco.type === 'PRODUCT' && eco.product) {
      const oldVersion = eco.product.currentVersion;
      const newProductData = draftData.product || {};

      if (!oldVersion) {
        res.status(404).json({ status: 'error', message: 'Product has no current version' });
        return;
      }

      comparison.changes.product = {
        name: {
          old: eco.product.name,
          new: newProductData.name || eco.product.name,
          changed: newProductData.name !== undefined && newProductData.name !== eco.product.name,
        },
        salePrice: {
          old: parseFloat(oldVersion.salePrice.toString()),
          new: newProductData.salePrice !== undefined ? parseFloat(newProductData.salePrice) : parseFloat(oldVersion.salePrice.toString()),
          changed: newProductData.salePrice !== undefined && parseFloat(newProductData.salePrice) !== parseFloat(oldVersion.salePrice.toString()),
          difference:
            newProductData.salePrice !== undefined
              ? parseFloat(newProductData.salePrice) - parseFloat(oldVersion.salePrice.toString())
              : 0,
        },
        costPrice: {
          old: parseFloat(oldVersion.costPrice.toString()),
          new: newProductData.costPrice !== undefined ? parseFloat(newProductData.costPrice) : parseFloat(oldVersion.costPrice.toString()),
          changed: newProductData.costPrice !== undefined && parseFloat(newProductData.costPrice) !== parseFloat(oldVersion.costPrice.toString()),
          difference:
            newProductData.costPrice !== undefined
              ? parseFloat(newProductData.costPrice) - parseFloat(oldVersion.costPrice.toString())
              : 0,
        },
        attachments: {
          old: oldVersion.attachments || [],
          new: newProductData.attachments || oldVersion.attachments || [],
          changed: JSON.stringify(newProductData.attachments || []) !== JSON.stringify(oldVersion.attachments || []),
        },
      };
    }

    // BoM comparison
    if (eco.type === 'BOM' && eco.bom) {
      const oldBom = eco.bom;
      const newBomData = draftData.bom || {};

      // Component comparison
      const oldComponents = oldBom.components || [];
      const newComponents = newBomData.components || oldComponents;
      
      const componentChanges = [];
      const oldCompMap = new Map(oldComponents.map((c: any) => [c.productId, c]));
      const newCompMap = new Map(newComponents.map((c: any) => [c.productId, c]));

      // Check added/modified components
      for (const [productId, newComp] of newCompMap) {
        const oldComp = oldCompMap.get(productId);
        if (!oldComp) {
          componentChanges.push({
            productId,
            productName: (newComp as any).product?.name || 'Unknown',
            type: 'ADDED',
            oldQuantity: 0,
            newQuantity: (newComp as any).quantity,
            difference: (newComp as any).quantity,
          });
        } else if ((oldComp as any).quantity !== (newComp as any).quantity) {
          componentChanges.push({
            productId,
            productName: (newComp as any).product?.name || (oldComp as any).product?.name || 'Unknown',
            type: 'MODIFIED',
            oldQuantity: (oldComp as any).quantity,
            newQuantity: (newComp as any).quantity,
            difference: (newComp as any).quantity - (oldComp as any).quantity,
          });
        } else {
          componentChanges.push({
            productId,
            productName: (newComp as any).product?.name || 'Unknown',
            type: 'UNCHANGED',
            oldQuantity: (oldComp as any).quantity,
            newQuantity: (newComp as any).quantity,
            difference: 0,
          });
        }
      }

      // Check removed components
      for (const [productId, oldComp] of oldCompMap) {
        if (!newCompMap.has(productId)) {
          componentChanges.push({
            productId,
            productName: (oldComp as any).product?.name || 'Unknown',
            type: 'REMOVED',
            oldQuantity: (oldComp as any).quantity,
            newQuantity: 0,
            difference: -(oldComp as any).quantity,
          });
        }
      }

      // Operation comparison
      const oldOperations = oldBom.operations || [];
      const newOperations = newBomData.operations || oldOperations;
      
      const operationChanges = [];
      const oldOpMap = new Map(oldOperations.map((o: any) => [o.name, o]));
      const newOpMap = new Map(newOperations.map((o: any) => [o.name, o]));

      // Check added/modified operations
      for (const [name, newOp] of newOpMap) {
        const oldOp = oldOpMap.get(name);
        if (!oldOp) {
          operationChanges.push({
            name,
            type: 'ADDED',
            oldTime: 0,
            newTime: (newOp as any).time,
            oldWorkCenter: '',
            newWorkCenter: (newOp as any).workCenter,
            timeDifference: (newOp as any).time,
          });
        } else if (
          (oldOp as any).time !== (newOp as any).time ||
          (oldOp as any).workCenter !== (newOp as any).workCenter
        ) {
          operationChanges.push({
            name,
            type: 'MODIFIED',
            oldTime: (oldOp as any).time,
            newTime: (newOp as any).time,
            oldWorkCenter: (oldOp as any).workCenter,
            newWorkCenter: (newOp as any).workCenter,
            timeDifference: (newOp as any).time - (oldOp as any).time,
          });
        } else {
          operationChanges.push({
            name,
            type: 'UNCHANGED',
            oldTime: (oldOp as any).time,
            newTime: (newOp as any).time,
            oldWorkCenter: (oldOp as any).workCenter,
            newWorkCenter: (newOp as any).workCenter,
            timeDifference: 0,
          });
        }
      }

      // Check removed operations
      for (const [name, oldOp] of oldOpMap) {
        if (!newOpMap.has(name)) {
          operationChanges.push({
            name,
            type: 'REMOVED',
            oldTime: (oldOp as any).time,
            newTime: 0,
            oldWorkCenter: (oldOp as any).workCenter,
            newWorkCenter: '',
            timeDifference: -(oldOp as any).time,
          });
        }
      }

      comparison.changes.bom = {
        components: componentChanges,
        operations: operationChanges,
        summary: {
          componentsAdded: componentChanges.filter((c) => c.type === 'ADDED').length,
          componentsRemoved: componentChanges.filter((c) => c.type === 'REMOVED').length,
          componentsModified: componentChanges.filter((c) => c.type === 'MODIFIED').length,
          operationsAdded: operationChanges.filter((o) => o.type === 'ADDED').length,
          operationsRemoved: operationChanges.filter((o) => o.type === 'REMOVED').length,
          operationsModified: operationChanges.filter((o) => o.type === 'MODIFIED').length,
        },
      };
    }

    res.status(200).json({
      status: 'success',
      data: comparison,
    });
  } catch (error: any) {
    console.error('Get ECO comparison error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to get ECO comparison' });
  }
};

// Get product version history
export const getProductVersionHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const versions = await prisma.productVersion.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        version: true,
        salePrice: true,
        costPrice: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      status: 'success',
      data: { productId, versions },
    });
  } catch (error: any) {
    console.error('Get product version history error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to get version history' });
  }
};

// Get BoM version comparison
export const getBomVersionComparison = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bomId, oldVersion, newVersion } = req.params;

    const [oldBom, newBom] = await Promise.all([
      prisma.bOM.findFirst({
        where: { id: bomId, version: oldVersion },
        include: {
          components: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
          operations: true,
        },
      }),
      prisma.bOM.findFirst({
        where: { id: bomId, version: newVersion },
        include: {
          components: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
          operations: true,
        },
      }),
    ]);

    if (!oldBom || !newBom) {
      res.status(404).json({ status: 'error', message: 'BoM version not found' });
      return;
    }

    // Component comparison
    const oldCompMap = new Map(oldBom.components.map((c: any) => [c.productId, c]));
    const newCompMap = new Map(newBom.components.map((c: any) => [c.productId, c]));
    const componentChanges = [];

    for (const [productId, newComp] of newCompMap) {
      const oldComp = oldCompMap.get(productId);
      if (!oldComp) {
        componentChanges.push({
          productId,
          productName: (newComp as any).product?.name,
          type: 'ADDED',
          oldQuantity: 0,
          newQuantity: (newComp as any).quantity,
        });
      } else if ((oldComp as any).quantity !== (newComp as any).quantity) {
        componentChanges.push({
          productId,
          productName: (newComp as any).product?.name,
          type: 'MODIFIED',
          oldQuantity: (oldComp as any).quantity,
          newQuantity: (newComp as any).quantity,
        });
      }
    }

    for (const [productId, oldComp] of oldCompMap) {
      if (!newCompMap.has(productId)) {
        componentChanges.push({
          productId,
          productName: (oldComp as any).product?.name,
          type: 'REMOVED',
          oldQuantity: (oldComp as any).quantity,
          newQuantity: 0,
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        bomId,
        oldVersion,
        newVersion,
        componentChanges,
      },
    });
  } catch (error: any) {
    console.error('Get BoM version comparison error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to get BoM comparison' });
  }
};
