import { useEffect, useState } from 'react';
import { AlertTriangle, Package, FileText, AlertCircle } from 'lucide-react';

interface ImpactData {
    usedInBOMs?: Array<{
        bomId: string;
        bomVersion: string;
        productName: string;
        productId: string;
    }>;
    componentImpacts?: Array<{
        componentId: string;
        componentName: string;
        quantity: number;
        sharedUsageCount: number;
        usedInOtherBOMs: Array<{
            bomId: string;
            bomVersion: string;
            productName: string;
        }>;
    }>;
    activeECOs?: Array<{
        ecoId: string;
        ecoNumber: string;
        status: string;
    }>;
    totalBOMsAffected?: number;
    uniqueProductsAffected?: number;
    warnings?: string[];
}

interface ImpactAnalysisProps {
    data: ImpactData | null;
    loading: boolean;
    entityType: 'PRODUCT' | 'BOM';
}

export default function ImpactAnalysis({ data, loading, entityType }: ImpactAnalysisProps) {
    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                    Impact Analysis
                </h3>
                <p className="text-gray-500">No impact data available</p>
            </div>
        );
    }

    const hasWarnings = data.warnings && data.warnings.length > 0;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                Impact Analysis
            </h3>

            {/* Warnings Section */}
            {hasWarnings && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Impact Warnings</h4>
                            <ul className="space-y-1 text-sm text-yellow-700">
                                {data.warnings.map((warning, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-yellow-600 mt-0.5">•</span>
                                        <span>{warning}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Impact: Where is this product used? */}
            {entityType === 'PRODUCT' && data.usedInBOMs && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="text-sm text-blue-600 font-medium">BOMs Using This Product</div>
                            <div className="text-2xl font-bold text-blue-700 mt-1">
                                {data.totalBOMsAffected || 0}
                            </div>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                            <div className="text-sm text-purple-600 font-medium">Products Affected</div>
                            <div className="text-2xl font-bold text-purple-700 mt-1">
                                {data.uniqueProductsAffected || 0}
                            </div>
                        </div>
                    </div>

                    {data.usedInBOMs.length > 0 && (
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Used in Bills of Materials
                            </h4>
                            <div className="space-y-2">
                                {data.usedInBOMs.map((bom) => (
                                    <div
                                        key={bom.bomId}
                                        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-medium text-gray-900">{bom.productName}</div>
                                                <div className="text-sm text-gray-500">
                                                    BOM Version: {bom.bomVersion}
                                                </div>
                                            </div>
                                            <a
                                                href={`/boms/${bom.bomId}`}
                                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                View BOM →
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* BOM Impact: Which components are shared? */}
            {entityType === 'BOM' && data.componentImpacts && (
                <div className="space-y-4">
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Component Impact Analysis
                    </h4>
                    <div className="space-y-3">
                        {data.componentImpacts.map((component) => (
                            <div
                                key={component.componentId}
                                className={`p-4 border rounded-lg ${
                                    component.sharedUsageCount > 0
                                        ? 'border-yellow-300 bg-yellow-50'
                                        : 'border-gray-200 bg-white'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <div className="font-medium text-gray-900">{component.componentName}</div>
                                        <div className="text-sm text-gray-500">Quantity: {component.quantity}</div>
                                    </div>
                                    {component.sharedUsageCount > 0 && (
                                        <div className="flex items-center gap-1 text-yellow-700 bg-yellow-100 px-2 py-1 rounded text-sm font-medium">
                                            <AlertTriangle className="w-4 h-4" />
                                            Shared Component
                                        </div>
                                    )}
                                </div>

                                {component.usedInOtherBOMs.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-yellow-200">
                                        <div className="text-sm text-yellow-800 font-medium mb-2">
                                            Also used in {component.sharedUsageCount} other BOM(s):
                                        </div>
                                        <div className="space-y-1">
                                            {component.usedInOtherBOMs.map((bom) => (
                                                <div
                                                    key={bom.bomId}
                                                    className="text-sm text-gray-700 flex items-center gap-2"
                                                >
                                                    <span className="text-yellow-600">•</span>
                                                    <span>
                                                        {bom.productName} (v{bom.bomVersion})
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active ECOs Section */}
            {data.activeECOs && data.activeECOs.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Active Engineering Change Orders
                    </h4>
                    <div className="space-y-2">
                        {data.activeECOs.map((eco) => (
                            <div
                                key={eco.ecoId}
                                className="p-3 border border-orange-200 bg-orange-50 rounded-lg"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-gray-900">{eco.ecoNumber}</div>
                                        <div className="text-sm text-gray-600">Status: {eco.status}</div>
                                    </div>
                                    <a
                                        href={`/ecos/${eco.ecoId}`}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        View ECO →
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Impact Message */}
            {entityType === 'PRODUCT' && (!data.usedInBOMs || data.usedInBOMs.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>This product is not currently used in any BOMs</p>
                </div>
            )}
        </div>
    );
}
