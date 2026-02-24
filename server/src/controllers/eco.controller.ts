import { Request, Response } from 'express';
import prisma from '../config/database';
import { ECOStatus, ECOType, Prisma, ApprovalStatus, AuditAction, EntityType } from '@prisma/client';
import { sendNotificationToUser } from './notification.controller';

// Internal function to apply ECO (can be called from transaction)
async function applyECOInternal(ecoId: string, userId: string, tx: Prisma.TransactionClient): Promise<any> {
  const eco = await tx.eCO.findUnique({
    where: { id: ecoId },
    include: {
      product: {
        include: {
          currentVersion: true,
        },
      },
      bom: {
        include: {
          components: true,
          operations: true,
          productVersion: true,
        },
      },
    },
  });

  if (!eco) {
    throw new Error('ECO not found');
  }

  const draftData = eco.draftData as any || {};
  const createNewVersion = eco.versionUpdate;
  let result: any = {};

  if (eco.type === 'PRODUCT') {
    const currentVersion = eco.product.currentVersion;

    if (!currentVersion) {
      throw new Error('Product has no current version');
    }

    if (createNewVersion) {
      const versionNumber = parseFloat(currentVersion.version.replace('v', ''));
      const newVersionNumber = `v${(versionNumber + 1.0).toFixed(1)}`;

      await tx.productVersion.update({
        where: { id: currentVersion.id },
        data: { status: 'ARCHIVED' },
      });

      const newVersion = await tx.productVersion.create({
        data: {
          productId: eco.productId,
          version: newVersionNumber,
          salePrice: draftData.product?.salePrice !== undefined
            ? draftData.product.salePrice
            : currentVersion.salePrice,
          costPrice: draftData.product?.costPrice !== undefined
            ? draftData.product.costPrice
            : currentVersion.costPrice,
          attachments: draftData.product?.attachments || currentVersion.attachments,
          status: 'ACTIVE',
        },
      });

      await tx.product.update({
        where: { id: eco.productId },
        data: {
          currentVersionId: newVersion.id,
          status: 'ACTIVE',
        },
      });

      result = {
        action: 'VERSION_CREATED',
        oldVersion: currentVersion.version,
        newVersion: newVersionNumber,
        archivedVersionId: currentVersion.id,
        newVersionId: newVersion.id,
      };

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.VERSION_CREATE,
          entityType: EntityType.PRODUCT_VERSION,
          entityId: newVersion.id,
          ecoId: eco.id,
          oldValue: { versionId: currentVersion.id, version: currentVersion.version },
          newValue: { versionId: newVersion.id, version: newVersionNumber },
          comments: `Product version created via ECO: ${eco.title}`,
        },
      });
    } else {
      await tx.productVersion.update({
        where: { id: currentVersion.id },
        data: {
          salePrice: draftData.product?.salePrice !== undefined
            ? draftData.product.salePrice
            : currentVersion.salePrice,
          costPrice: draftData.product?.costPrice !== undefined
            ? draftData.product.costPrice
            : currentVersion.costPrice,
          attachments: draftData.product?.attachments || currentVersion.attachments,
        },
      });

      result = {
        action: 'VERSION_UPDATED',
        version: currentVersion.version,
        versionId: currentVersion.id,
      };
    }
  }

  if (eco.type === 'BOM' && eco.bomId) {
    const currentBom = eco.bom!;
    const currentVersion = currentBom.version;

    // Fetch draft changes from ECO BOM draft tables
    const componentDrafts = await tx.eCOBOMComponentDraft.findMany({
      where: { ecoId },
      include: { product: true }
    });

    const operationDrafts = await tx.eCOBOMOperationDraft.findMany({
      where: { ecoId },
      orderBy: { sequence: 'asc' }
    });

    if (createNewVersion) {
      const versionNumber = parseFloat(currentVersion.replace('v', ''));
      const newVersionNumber = `v${(versionNumber + 1.0).toFixed(1)}`;

      await tx.bOM.update({
        where: { id: eco.bomId },
        data: { status: 'ARCHIVED' },
      });

      const newBom = await tx.bOM.create({
        data: {
          productVersionId: currentBom.productVersionId,
          version: newVersionNumber,
          status: 'ACTIVE',
        },
      });

      // Apply component changes from drafts
      // Start with existing components, apply modifications and removals
      const componentMap = new Map();
      
      // Add all current components first
      for (const comp of currentBom.components) {
        componentMap.set(comp.id, { productId: comp.productId, quantity: comp.quantity });
      }

      // Apply draft changes
      for (const draft of componentDrafts) {
        if (draft.changeType === 'ADDED') {
          // Add new component
          componentMap.set(`new_${draft.id}`, { productId: draft.productId, quantity: draft.quantity });
        } else if (draft.changeType === 'MODIFIED' && draft.originalComponentId) {
          // Modify existing component
          componentMap.set(draft.originalComponentId, { productId: draft.productId, quantity: draft.quantity });
        } else if (draft.changeType === 'REMOVED' && draft.originalComponentId) {
          // Remove component
          componentMap.delete(draft.originalComponentId);
        }
      }

      // Create all final components in new BOM
      for (const [_key, comp] of componentMap.entries()) {
        await tx.bOMComponent.create({
          data: {
            bomId: newBom.id,
            productId: comp.productId,
            quantity: comp.quantity,
          },
        });
      }

      // Apply operation changes from drafts
      const operationMap = new Map();
      
      // Add all current operations first
      for (const op of currentBom.operations) {
        operationMap.set(op.id, { name: op.name, workCenter: op.workCenter, time: op.time, sequence: op.sequence });
      }

      // Apply draft changes
      for (const draft of operationDrafts) {
        if (draft.changeType === 'ADDED') {
          operationMap.set(`new_${draft.id}`, { name: draft.name, workCenter: draft.workCenter, time: draft.time, sequence: draft.sequence });
        } else if (draft.changeType === 'MODIFIED' && draft.originalOperationId) {
          operationMap.set(draft.originalOperationId, { name: draft.name, workCenter: draft.workCenter, time: draft.time, sequence: draft.sequence });
        } else if (draft.changeType === 'REMOVED' && draft.originalOperationId) {
          operationMap.delete(draft.originalOperationId);
        }
      }

      // Create all final operations in new BOM
      for (const [_key, op] of operationMap.entries()) {
        await tx.bOMOperation.create({
          data: {
            bomId: newBom.id,
            name: op.name,
            workCenter: op.workCenter,
            time: op.time,
            sequence: op.sequence,
          },
        });
      }

      result = {
        action: 'VERSION_CREATED',
        oldVersion: currentVersion,
        newVersion: newVersionNumber,
        archivedBomId: eco.bomId,
        newBomId: newBom.id,
      };

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.VERSION_CREATE,
          entityType: EntityType.BOM,
          entityId: newBom.id,
          ecoId: eco.id,
          oldValue: { bomId: eco.bomId, version: currentVersion },
          newValue: { bomId: newBom.id, version: newVersionNumber },
          comments: `BOM version created via ECO: ${eco.title}`,
        },
      });
    } else {
      await tx.bOMComponent.deleteMany({ where: { bomId: eco.bomId } });
      await tx.bOMOperation.deleteMany({ where: { bomId: eco.bomId } });

      const newComponents = draftData.bom?.components || currentBom.components;
      for (const comp of newComponents) {
        await tx.bOMComponent.create({
          data: {
            bomId: eco.bomId,
            productId: comp.productId,
            quantity: comp.quantity,
          },
        });
      }

      const newOperations = draftData.bom?.operations || currentBom.operations;
      for (const op of newOperations) {
        await tx.bOMOperation.create({
          data: {
            bomId: eco.bomId,
            name: op.name,
            workCenter: op.workCenter,
            time: op.time,
            sequence: op.sequence || 0,
          },
        });
      }

      result = {
        action: 'VERSION_UPDATED',
        version: currentVersion,
        bomId: eco.bomId,
      };
    }
  }

  await tx.eCO.update({
    where: { id: ecoId },
    data: {
      status: ECOStatus.APPLIED,
    },
  });

  await tx.auditLog.create({
    data: {
      userId,
      action: AuditAction.UPDATE,
      entityType: EntityType.ECO,
      entityId: ecoId,
      ecoId: ecoId,
      oldValue: { status: 'APPROVED' },
      newValue: { status: 'APPLIED', appliedAt: new Date() },
      comments: `ECO applied: ${eco.title}`,
    },
  });

  return result;
}

// Create ECO
export const createECO = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, type, productId, bomId, draftData, effectiveDate, versionUpdate } = req.body;
    const userId = (req as any).user.userId;

    if (!title || !type || !productId) {
      res.status(400).json({ status: 'error', message: 'Title, type, and product ID are required' });
      return;
    }

    // CRITICAL FIX: Validate product is not archived
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
        message: `Cannot create ECO for archived product "${product.name}". Archived products cannot be modified.`
      });
      return;
    }

    // CRITICAL FIX: Validate BOM is not archived (if BOM ECO)
    if (bomId) {
      const bom = await prisma.bOM.findUnique({
        where: { id: bomId },
        select: { status: true, version: true }
      });

      if (!bom) {
        res.status(404).json({ status: 'error', message: 'BOM not found' });
        return;
      }

      if (bom.status === 'ARCHIVED') {
        res.status(400).json({
          status: 'error',
          message: `Cannot create ECO for archived BOM (version ${bom.version}). Archived BOMs cannot be modified.`
        });
        return;
      }
    }

    const eco = await prisma.eCO.create({
      data: {
        title,
        type: type as ECOType,
        status: ECOStatus.DRAFT,
        productId,
        bomId,
        createdBy: userId,
        currentStage: 'New',
        draftData: draftData || {},
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        versionUpdate: versionUpdate !== undefined ? versionUpdate : true,
      },
      include: {
        product: true,
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    // CRITICAL FIX: Add audit log for ECO creation
    await prisma.auditLog.create({
      data: {
        action: AuditAction.CREATE,
        entityType: EntityType.ECO,
        entityId: eco.id,
        userId,
        ecoId: eco.id,
        newValue: { title, type, productId, bomId, status: 'DRAFT' },
        comments: `ECO created: ${title}`,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'ECO created successfully',
      data: { eco },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to create ECO' });
  }
};

// Get all ECOs
export const getAllECOs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type, productId, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (productId) where.productId = productId;

    const [ecos, total] = await Promise.all([
      prisma.eCO.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          product: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true, email: true } },
          _count: { select: { approvals: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.eCO.count({ where }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        ecos,
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch ECOs' });
  }
};

// Get ECO by ID
export const getECOById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const eco = await prisma.eCO.findUnique({
      where: { id },
      include: {
        product: true,
        bom: {
          include: {
            components: { include: { product: true } },
            operations: { orderBy: { sequence: 'asc' } },
            productVersion: { include: { product: true } }
          }
        },
        creator: { select: { id: true, name: true, email: true } },
        approvals: { include: { stage: true, approver: { select: { name: true, email: true } } } },
        attachments: true,
        componentDrafts: { 
          include: { product: { select: { id: true, name: true, status: true } } },
          orderBy: { createdAt: 'asc' }
        },
        operationDrafts: { orderBy: { sequence: 'asc' } },
      },
    });

    if (!eco) {
      res.status(404).json({ status: 'error', message: 'ECO not found' });
      return;
    }

    res.status(200).json({ status: 'success', data: { eco } });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch ECO' });
  }
};

// Update ECO
export const updateECO = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, draftData } = req.body;

    const eco = await prisma.eCO.findUnique({ where: { id } });
    if (!eco) {
      res.status(404).json({ status: 'error', message: 'ECO not found' });
      return;
    }

    if (eco.status !== ECOStatus.DRAFT) {
      res.status(400).json({ status: 'error', message: 'Can only update ECOs in DRAFT status' });
      return;
    }

    const updated = await prisma.eCO.update({
      where: { id },
      data: { title, draftData },
    });

    res.status(200).json({
      status: 'success',
      message: 'ECO updated successfully',
      data: { eco: updated },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to update ECO' });
  }
};

// Submit ECO for approval
export const submitECO = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const eco = await prisma.eCO.findUnique({ where: { id } });
    if (!eco) {
      res.status(404).json({ status: 'error', message: 'ECO not found' });
      return;
    }

    if (eco.status !== ECOStatus.DRAFT) {
      res.status(400).json({ status: 'error', message: 'ECO already submitted' });
      return;
    }

    // CRITICAL FIX: Validate mandatory fields before submission
    if (!eco.title || eco.title.trim() === '') {
      res.status(400).json({
        status: 'error',
        message: 'Cannot submit ECO: Title is required'
      });
      return;
    }

    // Validate based on ECO type
    if (eco.type === 'BOM') {
      // For BOM ECOs, check draft tables
      const [componentCount, operationCount] = await Promise.all([
        prisma.eCOBOMComponentDraft.count({ where: { ecoId: id } }),
        prisma.eCOBOMOperationDraft.count({ where: { ecoId: id } })
      ]);

      if (componentCount === 0 && operationCount === 0) {
        res.status(400).json({
          status: 'error',
          message: 'Cannot submit BOM ECO: At least one component or operation change is required'
        });
        return;
      }

      // Validate BOM is ACTIVE
      if (eco.bomId) {
        const bom = await prisma.bOM.findUnique({
          where: { id: eco.bomId },
          select: { status: true }
        });

        if (!bom || bom.status !== 'ACTIVE') {
          res.status(400).json({
            status: 'error',
            message: 'Cannot submit ECO: Target BOM must be ACTIVE'
          });
          return;
        }
      }
    } else if (eco.type === 'PRODUCT') {
      // For Product ECOs, check draftData
      if (!eco.draftData || Object.keys(eco.draftData).length === 0) {
        res.status(400).json({
          status: 'error',
          message: 'Cannot submit Product ECO: Draft changes are required'
        });
        return;
      }

      const draft = eco.draftData as any;
      if (!draft.product || Object.keys(draft.product).length === 0) {
        res.status(400).json({
          status: 'error',
          message: 'Product ECO must include product changes'
        });
        return;
      }
    }

    // Get the first approval stage that requires approval
    const firstApprovalStage = await prisma.approvalStage.findFirst({
      where: { requiresApproval: true },
      orderBy: { order: 'asc' }
    });

    if (!firstApprovalStage) {
      res.status(500).json({
        status: 'error',
        message: 'No approval stages configured in the system'
      });
      return;
    }

    const updated = await prisma.eCO.update({
      where: { id },
      data: { 
        status: ECOStatus.IN_PROGRESS,
        currentStage: firstApprovalStage.name
      },
    });

    // CRITICAL FIX: Add audit log for ECO submission
    await prisma.auditLog.create({
      data: {
        action: AuditAction.UPDATE,
        entityType: EntityType.ECO,
        entityId: id,
        userId,
        ecoId: id,
        oldValue: { status: 'DRAFT' },
        newValue: { status: 'IN_PROGRESS' },
        comments: 'ECO submitted for approval',
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'ECO submitted for approval',
      data: { eco: updated },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to submit ECO' });
  }
};

// Approve/Reject ECO
// Supports fullApproval: true - approves all remaining stages in one click
export const reviewECO = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { approved, comments, fullApproval } = req.body; // fullApproval = approve all stages at once
    const userId = (req as any).user.userId;

    const eco = await prisma.eCO.findUnique({ where: { id } });

    if (!eco) {
      res.status(404).json({ status: 'error', message: 'ECO not found' });
      return;
    }

    if (eco.status !== ECOStatus.IN_PROGRESS) {
      res.status(400).json({ status: 'error', message: 'ECO is not pending approval' });
      return;
    }

    // Get all approval stages
    const allStages = await prisma.approvalStage.findMany({ orderBy: { order: 'asc' } });
    
    // Get current stage
    const currentStage = allStages.find(s => s.name === eco.currentStage);

    if (!currentStage) {
      console.error(`❌ Invalid approval stage: ECO ${id} has currentStage="${eco.currentStage}" which doesn't exist in approval_stages table`);
      res.status(400).json({ 
        status: 'error', 
        message: `Invalid approval stage: "${eco.currentStage}". Please contact system administrator.` 
      });
      return;
    }

    // FULL APPROVAL MODE: Approve all remaining stages at once
    if (fullApproval && approved) {
      const result = await prisma.$transaction(async (tx) => {
        const currentStageIndex = allStages.findIndex(s => s.id === currentStage.id);
        const remainingStages = allStages.slice(currentStageIndex);
        
        // Create approval records for all remaining stages
        for (const stage of remainingStages) {
          // Skip if approval already exists for this stage
          const existingApproval = await tx.eCOApproval.findFirst({
            where: { ecoId: id, stageId: stage.id }
          });
          
          if (!existingApproval) {
            await tx.eCOApproval.create({
              data: {
                ecoId: id,
                stageId: stage.id,
                approvedBy: userId,
                approvedAt: new Date(),
                status: ApprovalStatus.APPROVED,
                comments: stage.isFinal ? comments : `Auto-approved (Full Approval by Admin)`,
              },
            });
          }
        }

        // Create audit log for full approval
        await tx.auditLog.create({
          data: {
            action: AuditAction.APPROVE,
            entityType: EntityType.ECO_APPROVAL,
            entityId: id,
            userId,
            ecoId: id,
            stage: 'Full Approval',
            oldValue: { stage: eco.currentStage, status: eco.status },
            newValue: { approved: true, fullApproval: true, comments, timestamp: new Date() },
            comments: `ECO fully approved (all stages) from stage: ${eco.currentStage}`,
          },
        });

        // Get final stage
        const finalStage = allStages[allStages.length - 1];

        // Update ECO to final stage and APPROVED status
        await tx.eCO.update({
          where: { id },
          data: {
            currentStage: finalStage.name,
            status: ECOStatus.APPROVED,
          },
        });

        // Auto-apply the ECO
        const appliedResult = await applyECOInternal(id, userId, tx);

        await tx.auditLog.create({
          data: {
            action: AuditAction.UPDATE,
            entityType: EntityType.ECO,
            entityId: id,
            userId,
            ecoId: id,
            oldValue: { status: 'APPROVED' },
            newValue: { status: 'APPLIED' },
            comments: 'ECO automatically applied after full approval',
          },
        });

        return { newStatus: ECOStatus.APPLIED, appliedResult };
      });

      res.status(200).json({
        status: 'success',
        message: 'ECO fully approved and applied successfully',
        data: {
          newStatus: result.newStatus,
          appliedResult: result.appliedResult
        },
      });

      // Notify Creator
      if (eco.createdBy) {
        await sendNotificationToUser(eco.createdBy, {
          type: 'ECO_APPROVED',
          title: 'ECO Fully Approved',
          message: `Your ECO "${eco.title}" has been FULLY APPROVED and APPLIED`,
          data: { ecoId: eco.id }
        });
      }

      return;
    }

    // STANDARD SINGLE-STAGE APPROVAL (original behavior)
    // CRITICAL FIX: Wrap entire review process in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create approval record
      await tx.eCOApproval.create({
        data: {
          ecoId: id,
          stageId: currentStage.id,
          approvedBy: userId,
          approvedAt: new Date(),
          status: approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
          comments,
        },
      });

      // CRITICAL FIX: Add audit log for approval/rejection
      await tx.auditLog.create({
        data: {
          action: approved ? AuditAction.APPROVE : AuditAction.REJECT,
          entityType: EntityType.ECO_APPROVAL,
          entityId: id,
          userId,
          ecoId: id,
          stage: eco.currentStage,
          oldValue: { stage: eco.currentStage, status: eco.status },
          newValue: { approved, comments, timestamp: new Date() },
          comments: approved ? `ECO approved at stage: ${eco.currentStage}` : `ECO rejected at stage: ${eco.currentStage}`,
        },
      });

      let newStatus: string = eco.status;
      let appliedEcoResult: any = null;

      if (approved) {
        // Check if this is the last stage
        const stages = await tx.approvalStage.findMany({ orderBy: { order: 'asc' } });
        const currentStageIndex = stages.findIndex((s) => s.id === currentStage.id);

        if (currentStageIndex < stages.length - 1) {
          // Move to next stage
          const nextStage = stages[currentStageIndex + 1];
          await tx.eCO.update({
            where: { id },
            data: {
              currentStage: nextStage.name,
            },
          });

          // CRITICAL FIX: Add audit log for stage transition
          await tx.auditLog.create({
            data: {
              action: AuditAction.STAGE_TRANSITION,
              entityType: EntityType.ECO,
              entityId: id,
              userId,
              ecoId: id,
              stage: nextStage.name,
              oldValue: { stage: eco.currentStage },
              newValue: { stage: nextStage.name },
              comments: `ECO moved from "${eco.currentStage}" to "${nextStage.name}"`,
            },
          });

          newStatus = ECOStatus.IN_PROGRESS;
        } else {
          // CRITICAL FIX: Final stage reached - auto-apply ECO
          // First set status to APPROVED
          await tx.eCO.update({
            where: { id },
            data: { status: ECOStatus.APPROVED },
          });

          // CRITICAL FIX: Auto-apply the ECO if final stage is approved
          if (currentStage.isFinal) {
            appliedEcoResult = await applyECOInternal(id, userId, tx);
            newStatus = ECOStatus.APPLIED;

            await tx.auditLog.create({
              data: {
                action: AuditAction.UPDATE,
                entityType: EntityType.ECO,
                entityId: id,
                userId,
                ecoId: id,
                oldValue: { status: 'APPROVED' },
                newValue: { status: 'APPLIED' },
                comments: 'ECO automatically applied after final stage approval',
              },
            });
          } else {
            newStatus = ECOStatus.APPROVED;
          }
        }
      } else {
        // Rejected
        await tx.eCO.update({
          where: { id },
          data: { status: ECOStatus.REJECTED },
        });
        newStatus = ECOStatus.REJECTED;
      }

      return { newStatus, appliedResult: appliedEcoResult };
    });

    res.status(200).json({
      status: 'success',
      message: approved
        ? (result.newStatus === ECOStatus.APPLIED ? 'ECO approved and applied successfully' : 'ECO approved')
        : 'ECO rejected',
      data: {
        newStatus: result.newStatus,
        appliedResult: result.appliedResult
      },
    });

    // Notify Creator
    if (eco.createdBy) {
      const message = approved
        ? `Your ECO "${eco.title}" has been APPROVED at stage: ${eco.currentStage}`
        : `Your ECO "${eco.title}" has been REJECTED at stage: ${eco.currentStage}`;

      await sendNotificationToUser(eco.createdBy, {
        type: approved ? 'ECO_APPROVED' : 'ECO_REJECTED',
        title: `ECO ${approved ? 'Approved' : 'Rejected'}`,
        message,
        data: { ecoId: eco.id }
      });
    }
  } catch (error: any) {
    console.error('Review ECO error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to review ECO' });
  }
};

// Apply approved ECO with version auto-increment and archiving
export const applyECO = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

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
            components: true,
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

    if (eco.status !== ECOStatus.APPROVED) {
      res.status(400).json({ status: 'error', message: 'Can only apply approved ECOs' });
      return;
    }

    // CRITICAL FIX: Verify all approval stages are completed (stage bypass protection)
    const allStages = await prisma.approvalStage.findMany({ orderBy: { order: 'asc' } });
    const completedApprovals = await prisma.eCOApproval.count({
      where: {
        ecoId: id,
        status: 'APPROVED',
      },
    });

    if (allStages.length > 0 && completedApprovals < allStages.length) {
      res.status(400).json({
        status: 'error',
        message: `Cannot apply ECO: Only ${completedApprovals} of ${allStages.length} approval stages completed. All stages must be approved before applying.`,
      });
      return;
    }

    // Apply ECO within transaction
    const result = await prisma.$transaction(async (tx) => {
      return await applyECOInternal(id, userId, tx);
    });

    res.status(200).json({
      status: 'success',
      message: 'ECO applied successfully',
      data: { result },
    });
  } catch (error: any) {
    console.error('Apply ECO error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to apply ECO' });
  }
};

// ========================================
// ECO BOM DRAFT MANAGEMENT
// ========================================

// Add component to ECO BOM draft
export const addECOComponentDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { productId, quantity, changeType, originalComponentId } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      res.status(400).json({ status: 'error', message: 'Product ID and valid quantity are required' });
      return;
    }

    // Validate ECO exists and is in DRAFT status
    const eco = await prisma.eCO.findUnique({
      where: { id },
      select: { status: true, type: true, bomId: true }
    });

    if (!eco) {
      res.status(404).json({ status: 'error', message: 'ECO not found' });
      return;
    }

    if (eco.status !== 'DRAFT') {
      res.status(400).json({ status: 'error', message: 'Can only edit drafts in DRAFT status' });
      return;
    }

    if (eco.type !== 'BOM') {
      res.status(400).json({ status: 'error', message: 'This endpoint is only for BOM ECOs' });
      return;
    }

    // Validate product exists and is ACTIVE
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
        message: `Cannot use archived product "${product.name}" in BOM ECO`
      });
      return;
    }

    const componentDraft = await prisma.eCOBOMComponentDraft.create({
      data: {
        ecoId: id,
        productId,
        quantity,
        changeType: changeType || 'ADDED',
        originalComponentId: originalComponentId || null,
      },
      include: {
        product: { select: { id: true, name: true, status: true } }
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Component draft added successfully',
      data: { componentDraft },
    });
  } catch (error: any) {
    console.error('Add component draft error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add component draft' });
  }
};

// Update component draft
export const updateECOComponentDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, draftId } = req.params;
    const { quantity, changeType } = req.body;

    const eco = await prisma.eCO.findUnique({
      where: { id },
      select: { status: true }
    });

    if (!eco || eco.status !== 'DRAFT') {
      res.status(400).json({ status: 'error', message: 'Can only edit drafts in DRAFT status' });
      return;
    }

    const updates: any = {};
    if (quantity !== undefined) {
      if (quantity <= 0) {
        res.status(400).json({ status: 'error', message: 'Quantity must be greater than 0' });
        return;
      }
      updates.quantity = quantity;
    }
    if (changeType !== undefined) updates.changeType = changeType;

    const componentDraft = await prisma.eCOBOMComponentDraft.update({
      where: { id: draftId },
      data: updates,
      include: {
        product: { select: { id: true, name: true, status: true } }
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Component draft updated successfully',
      data: { componentDraft },
    });
  } catch (error: any) {
    console.error('Update component draft error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update component draft' });
  }
};

// Remove component draft
export const removeECOComponentDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, draftId } = req.params;

    const eco = await prisma.eCO.findUnique({
      where: { id },
      select: { status: true }
    });

    if (!eco || eco.status !== 'DRAFT') {
      res.status(400).json({ status: 'error', message: 'Can only edit drafts in DRAFT status' });
      return;
    }

    await prisma.eCOBOMComponentDraft.delete({
      where: { id: draftId }
    });

    res.status(200).json({
      status: 'success',
      message: 'Component draft removed successfully',
    });
  } catch (error: any) {
    console.error('Remove component draft error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to remove component draft' });
  }
};

// Add operation to ECO BOM draft
export const addECOOperationDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, time, workCenter, sequence, changeType, originalOperationId } = req.body;

    if (!name || time === undefined || time < 0) {
      res.status(400).json({ status: 'error', message: 'Name and valid time are required' });
      return;
    }

    const eco = await prisma.eCO.findUnique({
      where: { id },
      select: { status: true, type: true }
    });

    if (!eco) {
      res.status(404).json({ status: 'error', message: 'ECO not found' });
      return;
    }

    if (eco.status !== 'DRAFT') {
      res.status(400).json({ status: 'error', message: 'Can only edit drafts in DRAFT status' });
      return;
    }

    if (eco.type !== 'BOM') {
      res.status(400).json({ status: 'error', message: 'This endpoint is only for BOM ECOs' });
      return;
    }

    const operationDraft = await prisma.eCOBOMOperationDraft.create({
      data: {
        ecoId: id,
        name,
        time,
        workCenter: workCenter || 'Default',
        sequence: sequence !== undefined ? sequence : 0,
        changeType: changeType || 'ADDED',
        originalOperationId: originalOperationId || null,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Operation draft added successfully',
      data: { operationDraft },
    });
  } catch (error: any) {
    console.error('Add operation draft error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add operation draft' });
  }
};

// Update operation draft
export const updateECOOperationDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, draftId } = req.params;
    const { name, time, workCenter, sequence, changeType } = req.body;

    const eco = await prisma.eCO.findUnique({
      where: { id },
      select: { status: true }
    });

    if (!eco || eco.status !== 'DRAFT') {
      res.status(400).json({ status: 'error', message: 'Can only edit drafts in DRAFT status' });
      return;
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (time !== undefined) {
      if (time < 0) {
        res.status(400).json({ status: 'error', message: 'Time cannot be negative' });
        return;
      }
      updates.time = time;
    }
    if (workCenter !== undefined) updates.workCenter = workCenter;
    if (sequence !== undefined) updates.sequence = sequence;
    if (changeType !== undefined) updates.changeType = changeType;

    const operationDraft = await prisma.eCOBOMOperationDraft.update({
      where: { id: draftId },
      data: updates,
    });

    res.status(200).json({
      status: 'success',
      message: 'Operation draft updated successfully',
      data: { operationDraft },
    });
  } catch (error: any) {
    console.error('Update operation draft error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update operation draft' });
  }
};

// Remove operation draft
export const removeECOOperationDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, draftId } = req.params;

    const eco = await prisma.eCO.findUnique({
      where: { id },
      select: { status: true }
    });

    if (!eco || eco.status !== 'DRAFT') {
      res.status(400).json({ status: 'error', message: 'Can only edit drafts in DRAFT status' });
      return;
    }

    await prisma.eCOBOMOperationDraft.delete({
      where: { id: draftId }
    });

    res.status(200).json({
      status: 'success',
      message: 'Operation draft removed successfully',
    });
  } catch (error: any) {
    console.error('Remove operation draft error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to remove operation draft' });
  }
};
