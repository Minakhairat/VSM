// Value Stream Model
class ValueStream {
    constructor(data = {}) {
        this.id = data.id || Date.now() + Math.random();
        this.name = data.name || 'New Value Stream';
        this.description = data.description || '';
        this.version = data.version || '1.0';
        this.createdDate = data.createdDate || new Date().toISOString();
        this.modifiedDate = data.modifiedDate || new Date().toISOString();
        
        // Value Stream Components
        this.processes = data.processes || [];
        this.inventories = data.inventories || [];
        this.supermarkets = data.supermarkets || [];
        this.kanbans = data.kanbans || [];
        
        // Metrics
        this.metrics = data.metrics || {
            taktTime: 0,
            leadTime: 0,
            cycleEfficiency: 0,
            valueAddedRatio: 0,
            inventoryTurns: 0
        };
        
        // Analysis Data
        this.analysis = data.analysis || {
            bottlenecks: [],
            improvementOpportunities: [],
            futureState: null
        };
        
        // Metadata
        this.tags = data.tags || [];
        this.team = data.team || [];
        this.status = data.status || 'draft'; // draft, active, archived
        this.industry = data.industry || 'general';
        
        // Timeline
        this.timeline = data.timeline || {
            phases: [],
            milestones: [],
            lastAnalysisDate: null
        };
    }
    
    // Process Management
    addProcess(process) {
        this.processes.push(process);
        this.modifiedDate = new Date().toISOString();
        this.updateMetrics();
    }
    
    removeProcess(processId) {
        this.processes = this.processes.filter(p => p.id !== processId);
        this.modifiedDate = new Date().toISOString();
        this.updateMetrics();
    }
    
    updateProcess(processId, updates) {
        const index = this.processes.findIndex(p => p.id === processId);
        if (index !== -1) {
            this.processes[index] = { ...this.processes[index], ...updates };
            this.modifiedDate = new Date().toISOString();
            this.updateMetrics();
        }
    }
    
    // Inventory Management
    addInventory(inventory) {
        this.inventories.push(inventory);
        this.modifiedDate = new Date().toISOString();
        this.updateMetrics();
    }
    
    // Metrics Calculation
    updateMetrics() {
        if (this.processes.length === 0) return;
        
        // Calculate lead time
        this.metrics.leadTime = this.calculateTotalLeadTime();
        
        // Calculate value added ratio
        this.metrics.valueAddedRatio = this.calculateValueAddedRatio();
        
        // Calculate process cycle efficiency
        this.metrics.cycleEfficiency = this.calculateProcessCycleEfficiency();
        
        // Calculate inventory turns
        this.metrics.inventoryTurns = this.calculateInventoryTurns();
        
        // Update analysis
        this.updateAnalysis();
    }
    
    calculateTotalLeadTime() {
        let total = 0;
        
        this.processes.forEach(process => {
            if (process.type === 'process') {
                const processLeadTime = this.calculateProcessLeadTime(process);
                total += processLeadTime.totalLeadTime || 0;
            }
        });
        
        // Add inventory waiting time
        this.inventories.forEach(inventory => {
            total += inventory.calculateWaitTime(this.metrics.taktTime) || 0;
        });
        
        return total;
    }
    
    calculateProcessLeadTime(process) {
        const taktTime = this.metrics.taktTime || 4.8;
        const processingTime = process.cycleTime || 0;
        const waitingTime = (process.inventoryBefore || 0) * taktTime;
        const setupTimePerUnit = process.setupTime / (process.batchSize || 1);
        
        return {
            processingTime,
            waitingTime,
            setupTime: setupTimePerUnit,
            moveTime: 5, // Assumed constant
            queueTime: Math.max(0, (process.inventoryBefore || 0) - 1) * taktTime,
            totalLeadTime: processingTime + waitingTime + setupTimePerUnit + 5
        };
    }
    
    calculateValueAddedRatio() {
        const totalVA = this.processes.reduce((sum, process) => {
            return (process.type === 'process' && process.valueAdded) ? 
                   sum + (process.cycleTime || 0) : sum;
        }, 0);
        
        const totalLeadTime = this.metrics.leadTime;
        
        if (totalLeadTime > 0) {
            return (totalVA / totalLeadTime) * 100;
        }
        
        return 0;
    }
    
    calculateProcessCycleEfficiency() {
        const totalProcessingTime = this.processes.reduce((sum, process) => {
            return (process.type === 'process' && process.valueAdded) ? 
                   sum + (process.cycleTime || 0) : sum;
        }, 0);
        
        const totalLeadTime = this.metrics.leadTime;
        
        if (totalLeadTime > 0) {
            return (totalProcessingTime / totalLeadTime) * 100;
        }
        
        return 0;
    }
    
    calculateInventoryTurns() {
        const totalInventory = this.inventories.reduce((sum, inv) => sum + (inv.quantity || 0), 0) +
                             this.processes.reduce((sum, proc) => sum + (proc.inventoryBefore || 0), 0);
        
        const dailyDemand = this.metrics.taktTime > 0 ? 480 / this.metrics.taktTime : 100;
        
        if (totalInventory > 0) {
            return (dailyDemand * 365) / totalInventory;
        }
        
        return 0;
    }
    
    // Analysis Methods
    updateAnalysis() {
        this.analysis.bottlenecks = this.identifyBottlenecks();
        this.analysis.improvementOpportunities = this.identifyImprovementOpportunities();
        this.analysis.flowType = this.analyzeFlowType();
    }
    
    identifyBottlenecks() {
        const bottlenecks = [];
        const taktTime = this.metrics.taktTime || 4.8;
        
        this.processes.forEach((process, index) => {
            if (process.type === 'process' && process.cycleTime) {
                const utilization = process.cycleTime / taktTime;
                if (utilization > 0.8) {
                    bottlenecks.push({
                        process: process.name,
                        utilization: utilization * 100,
                        position: index + 1,
                        severity: this.calculateBottleneckSeverity(utilization)
                    });
                }
            }
        });
        
        return bottlenecks.sort((a, b) => b.utilization - a.utilization);
    }
    
    calculateBottleneckSeverity(utilization) {
        if (utilization > 1.2) return 'critical';
        if (utilization > 1.0) return 'high';
        if (utilization > 0.9) return 'medium';
        return 'low';
    }
    
    identifyImprovementOpportunities() {
        const opportunities = [];
        const lang = this.currentLanguage || 'en';
        
        // High inventory opportunity
        const totalInventory = this.inventories.reduce((sum, inv) => sum + (inv.quantity || 0), 0);
        const dailyDemand = this.metrics.taktTime > 0 ? 480 / this.metrics.taktTime : 100;
        
        if (totalInventory > dailyDemand * 3) {
            opportunities.push({
                type: 'inventory_reduction',
                priority: 'high',
                description: lang === 'ar' ? 
                    `مخزون مرتفع (${totalInventory} وحدة). يمكن تخفيضه بنسبة 50%` :
                    `High inventory (${totalInventory} units). Can be reduced by 50%`,
                estimatedSavings: '20-30% reduction in carrying costs'
            });
        }
        
        // Low efficiency opportunity
        if (this.metrics.cycleEfficiency < 10) {
            opportunities.push({
                type: 'efficiency_improvement',
                priority: 'high',
                description: lang === 'ar' ?
                    `كفاءة منخفضة (${this.metrics.cycleEfficiency.toFixed(1)}%). فرصة كبيرة للتحسين` :
                    `Low efficiency (${this.metrics.cycleEfficiency.toFixed(1)}%). Major improvement opportunity`,
                estimatedSavings: '15-25% productivity increase'
            });
        }
        
        // Non-value added processes
        const nonVACount = this.processes.filter(p => 
            p.type === 'process' && !p.valueAdded
        ).length;
        
        if (nonVACount > 0) {
            opportunities.push({
                type: 'waste_elimination',
                priority: 'medium',
                description: lang === 'ar' ?
                    `${nonVACount} عملية غير ذات قيمة مضافة يمكن تحسينها أو إزالتها` :
                    `${nonVACount} non-value added processes can be improved or eliminated`,
                estimatedSavings: '10-20% time reduction'
            });
        }
        
        return opportunities;
    }
    
    analyzeFlowType() {
        const pushProcesses = this.processes.filter(p => 
            p.type === 'process' && p.flowType === 'push'
        ).length;
        
        const totalProcesses = this.processes.filter(p => p.type === 'process').length;
        
        if (totalProcesses === 0) return 'unknown';
        
        const pushPercentage = (pushProcesses / totalProcesses) * 100;
        
        if (pushPercentage > 80) return 'push_dominant';
        if (pushPercentage > 50) return 'mixed_push';
        if (pushPercentage > 20) return 'mixed_pull';
        return 'pull_dominant';
    }
    
    // Future State Planning
    createFutureState(targets = {}) {
        const futureState = {
            targets: {
                leadTimeReduction: targets.leadTimeReduction || 0.3,
                efficiencyImprovement: targets.efficiencyImprovement || 0.2,
                inventoryReduction: targets.inventoryReduction || 0.5
            },
            processes: JSON.parse(JSON.stringify(this.processes)),
            inventories: JSON.parse(JSON.stringify(this.inventories)),
            improvements: []
        };
        
        // Apply improvements
        this.applyFutureStateImprovements(futureState);
        
        return futureState;
    }
    
    applyFutureStateImprovements(futureState) {
        // Reduce inventories
        futureState.inventories.forEach(inv => {
            const reduction = futureState.targets.inventoryReduction;
            inv.quantity = Math.max(1, Math.floor(inv.quantity * (1 - reduction)));
            futureState.improvements.push({
                type: 'inventory_reduction',
                description: `Reduced ${inv.name} from ${inv.quantity} units`,
                impact: 'medium'
            });
        });
        
        // Improve bottleneck processes
        const bottlenecks = futureState.processes
            .filter(p => p.type === 'process')
            .map(p => ({
                process: p,
                utilization: p.cycleTime / this.metrics.taktTime
            }))
            .sort((a, b) => b.utilization - a.utilization);
        
        // Improve top 3 bottlenecks
        bottlenecks.slice(0, 3).forEach(bottleneck => {
            const improvement = 0.15; // 15% improvement
            bottleneck.process.cycleTime *= (1 - improvement);
            
            futureState.improvements.push({
                type: 'bottleneck_improvement',
                description: `Improved ${bottleneck.process.name} cycle time by ${improvement * 100}%`,
                impact: 'high'
            });
        });
        
        return futureState;
    }
    
    // Export/Import
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            version: this.version,
            createdDate: this.createdDate,
            modifiedDate: this.modifiedDate,
            processes: this.processes.map(p => p.toJSON ? p.toJSON() : p),
            inventories: this.inventories.map(i => i.toJSON ? i.toJSON() : i),
            metrics: this.metrics,
            analysis: this.analysis,
            tags: this.tags,
            team: this.team,
            status: this.status,
            industry: this.industry,
            timeline: this.timeline
        };
    }
    
    static fromJSON(json) {
        const valueStream = new ValueStream(json);
        
        // Convert processes and inventories back to classes
        valueStream.processes = (json.processes || []).map(p => {
            return p.type === 'process' ? VSMProcess.fromJSON(p) : p;
        });
        
        valueStream.inventories = (json.inventories || []).map(i => {
            return i.type === 'inventory' ? Inventory.fromJSON(i) : i;
        });
        
        return valueStream;
    }
    
    // Validation
    validate() {
        const errors = [];
        
        if (!this.name || this.name.trim() === '') {
            errors.push('Value stream name is required');
        }
        
        if (this.processes.length === 0) {
            errors.push('At least one process is required');
        }
        
        // Validate each process
        this.processes.forEach((process, index) => {
            if (process.type === 'process') {
                if (!process.name || process.name.trim() === '') {
                    errors.push(`Process ${index + 1}: Name is required`);
                }
                
                if (!process.cycleTime || process.cycleTime <= 0) {
                    errors.push(`Process ${index + 1}: Cycle time must be positive`);
                }
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}