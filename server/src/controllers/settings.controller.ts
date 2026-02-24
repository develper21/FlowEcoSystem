import { Request, Response } from 'express';
import prisma from '../config/database';

// Get all stages
export const getAllStages = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stages = await prisma.approvalStage.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { approvals: true },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: stages,
    });
  } catch (error: any) {
    console.error('Get all stages error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to get stages' });
  }
};

// Get stage by ID
export const getStageById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const stage = await prisma.approvalStage.findUnique({
      where: { id },
      include: {
        approvals: {
          include: {
            eco: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!stage) {
      res.status(404).json({ status: 'error', message: 'Stage not found' });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: stage,
    });
  } catch (error: any) {
    console.error('Get stage by ID error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to get stage' });
  }
};

// Create new stage
export const createStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, order, requiresApproval = true, isFinal = false } = req.body;

    if (!name || order === undefined) {
      res.status(400).json({ status: 'error', message: 'Name and order are required' });
      return;
    }

    // Check if order already exists
    const existingStage = await prisma.approvalStage.findFirst({
      where: { order },
    });

    if (existingStage) {
      res.status(400).json({ status: 'error', message: `Stage with order ${order} already exists` });
      return;
    }

    const stage = await prisma.approvalStage.create({
      data: {
        name,
        order,
        requiresApproval,
        isFinal,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Stage created successfully',
      data: stage,
    });
  } catch (error: any) {
    console.error('Create stage error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to create stage' });
  }
};

// Update stage
export const updateStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, order, requiresApproval, isFinal } = req.body;

    const stage = await prisma.approvalStage.findUnique({
      where: { id },
    });

    if (!stage) {
      res.status(404).json({ status: 'error', message: 'Stage not found' });
      return;
    }

    // Check if order conflicts with another stage
    if (order !== undefined && order !== stage.order) {
      const conflictingStage = await prisma.approvalStage.findFirst({
        where: { order, id: { not: id } },
      });

      if (conflictingStage) {
        res.status(400).json({ status: 'error', message: `Stage with order ${order} already exists` });
        return;
      }
    }

    const updatedStage = await prisma.approvalStage.update({
      where: { id },
      data: {
        name,
        order,
        requiresApproval,
        isFinal,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Stage updated successfully',
      data: updatedStage,
    });
  } catch (error: any) {
    console.error('Update stage error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to update stage' });
  }
};

// Delete stage
export const deleteStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const stage = await prisma.approvalStage.findUnique({
      where: { id },
      include: {
        _count: {
          select: { approvals: true },
        },
      },
    });

    if (!stage) {
      res.status(404).json({ status: 'error', message: 'Stage not found' });
      return;
    }

    // Prevent deletion if stage has approvals
    if (stage._count.approvals > 0) {
      res.status(400).json({
        status: 'error',
        message: `Cannot delete stage with ${stage._count.approvals} existing approvals`,
      });
      return;
    }

    await prisma.approvalStage.delete({
      where: { id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Stage deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete stage error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to delete stage' });
  }
};

// Get next stage by current order
export const getNextStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentOrder } = req.params;
    const order = parseInt(currentOrder, 10);

    if (isNaN(order)) {
      res.status(400).json({ status: 'error', message: 'Invalid order number' });
      return;
    }

    const nextStage = await prisma.approvalStage.findFirst({
      where: {
        order: { gt: order },
      },
      orderBy: { order: 'asc' },
    });

    if (!nextStage) {
      res.status(404).json({ status: 'error', message: 'No next stage found' });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: nextStage,
    });
  } catch (error: any) {
    console.error('Get next stage error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to get next stage' });
  }
};
