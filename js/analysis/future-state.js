// Future State VSM Designer
class FutureStateDesigner {
    constructor(vsmApp) {
        this.app = vsmApp;
        this.futureState = {
            processes: [],
            inventories: [],
            improvements: [],
            targets: {}
        };
    }
    
    designFutureState() {
        // Clone current state
        this.futureState.processes = JSON.parse(JSON.stringify(this.app.processes));
        this.futureState.inventories = JSON.parse(JSON.stringify(this.app.inventories));
        
        // Analyze current state
        const currentMetrics = this.analyzeCurrentState();
        
        // Set improvement targets
        this.setImprovementTargets(currentMetrics);
        
        // Apply improvements
        this.applyImprovements();
        
        // Calculate future state metrics
        const futureMetrics = this.calculateFutureMetrics();
        
        return {
            currentState: currentMetrics,
            futureState: futureMetrics,
            improvements: this.futureState.improvements,
            gapAnalysis: this.calculateGap(currentMetrics, futureMetrics)
        };
    }
    
    analyzeCurrentState() {
        const leadTimeCalc = new LeadTimeCalculator(this.app);
        const leanMetrics = new LeanMetricsCalculator(this.app);
        
        return {
            leadTime: leadTimeCalc.calculateTotalValueStreamLeadTime(),
            leanMetrics: leanMetrics.calculateAllMetrics(),
            bottleneck: this.app.identifyBottleneck(),
            flowType: this.app.analyzeFlowType()
        };
    }
    
    setImprovementTargets(currentMetrics) {
        // Set realistic improvement targets (SMART goals)
        this.futureState.targets = {
            leadTimeReduction: 0.3, // 30% reduction
            efficiencyImprovement: 0.15, // 15% improvement
            inventoryReduction: 0.4, // 40% reduction
            throughputIncrease: 0.2, // 20% increase
            qualityImprovement: 0.1 // 10% improvement
        };
    }
    
    applyImprovements() {
        this.futureState.improvements = [];
        
        // 1. Address bottleneck
        const bottleneck = this.app.identifyBottleneck();
        if (bottleneck.process) {
            this.improveBottleneck(bottleneck);
        }
        
        // 2. Reduce inventory
        this.reduceInventory();
        
        // 3. Eliminate waste
        this.eliminateWaste();
        
        // 4. Improve flow
        this.improveFlow();
        
        // 5. Enhance quality
        this.enhanceQuality();
    }
    
    improveBottleneck(bottleneck) {
        const processIndex = this.futureState.processes.findIndex(p => p.id === bottleneck.process.id);
        if (processIndex === -1) return;
        
        const process = this.futureState.processes[processIndex];
        
        // Apply bottleneck improvements
        const improvements = [];
        
        // Reduce cycle time by 15%
        const newCycleTime = process.cycleTime * 0.85;
        improvements.push({
            type: 'cycle_time_reduction',
            description: `Reduce cycle time from ${process.cycleTime} to ${newCycleTime.toFixed(2)} min`,
            impact: 'High',
            implementation: '1-2 weeks'
        });
        process.cycleTime = newCycleTime;
        
        // Improve uptime by 5%
        const newUptime = Math.min(0.98, process.uptime + 0.05);
        improvements.push({
            type: 'uptime_improvement',
            description: `Improve uptime from ${(process.uptime * 100).toFixed(0)}% to ${(newUptime * 100).toFixed(0)}%`,
            impact: 'Medium',
            implementation: '2-4 weeks'
        });
        process.uptime = newUptime;
        
        // Reduce setup time by 50%
        if (process.setupTime > 0) {
            const newSetupTime = process.setupTime * 0.5;
            improvements.push({
                type: 'setup_reduction',
                description: `Reduce setup time from ${process.setupTime} to ${newSetupTime.toFixed(2)} min`,
                impact: 'High',
                implementation: '3-6 weeks'
            });
            process.setupTime = newSetupTime;
        }
        
        this.futureState.improvements.push(...improvements);
    }
    
    reduceInventory() {
        // Reduce all inventories by target percentage
        const targetReduction = this.futureState.targets.inventoryReduction;
        
        this.futureState.inventories.forEach(inventory => {
            const currentQty = inventory.quantity;
            const newQty = Math.max(1, Math.floor(currentQty * (1 - targetReduction)));
            
            if (newQty < currentQty) {
                this.futureState.improvements.push({
                    type: 'inventory_reduction',
                    description: `Reduce ${inventory.name} from ${currentQty} to ${newQty} units`,
                    impact: 'High',
                    implementation: '4-8 weeks'
                });
                
                inventory.quantity = newQty;
                inventory.maxLevel = newQty * 1.5; // Adjust max level
                inventory.reorderPoint = Math.ceil(newQty * 0.3); // Adjust reorder point
            }
        });
        
        // Reduce in-process inventory
        this.futureState.processes.forEach(process => {
            if (process.inventoryBefore > 0) {
                const newInventory = Math.max(1, Math.floor(process.inventoryBefore * (1 - targetReduction)));
                
                if (newInventory < process.inventoryBefore) {
                    this.futureState.improvements.push({
                        type: 'wip_reduction',
                        description: `Reduce WIP before ${process.name} from ${process.inventoryBefore} to ${newInventory} units`,
                        impact: 'Medium',
                        implementation: '2-4 weeks'
                    });
                    
                    process.inventoryBefore = newInventory;
                }
            }
        });
    }
    
    eliminateWaste() {
        // Identify and eliminate non-value added processes
        this.futureState.processes.forEach((process, index) => {
            if (!process.valueAdded) {
                // Consider eliminating or combining with other processes
                const eliminationCost = this.calculateEliminationCost(process);
                
                if (eliminationCost.savings > eliminationCost.cost) {
                    this.futureState.improvements.push({
                        type: 'process_elimination',
                        description: `Eliminate non-value added process: ${process.name}`,
                        impact: 'High',
                        implementation: '1-3 months',
                        savings: eliminationCost.savings,
                        cost: eliminationCost.cost
                    });
                    
                    // Mark for removal (actual removal would be done after analysis)
                    process.markedForElimination = true;
                }
            }
        });
    }
    
    improveFlow() {
        // Convert push to pull where applicable
        this.futureState.processes.forEach(process => {
            if (process.flowType === 'push' && process.inventoryBefore > 5) {
                // Good candidate for pull system
                const kanbanSize = Math.ceil(process.inventoryBefore * 0.5);
                
                this.futureState.improvements.push({
                    type: 'pull_implementation',
                    description: `Implement pull system for ${process.name} with Kanban size of ${kanbanSize}`,
                    impact: 'Medium',
                    implementation: '2-3 months',
                    details: {
                        currentSystem: 'Push',
                        newSystem: 'Pull',
                        kanbanSize: kanbanSize
                    }
                });
                
                process.flowType = 'pull';
                process.kanbanSize = kanbanSize;
                process.inventoryBefore = kanbanSize; // Start with Kanban size
            }
        });
    }
    
    enhanceQuality() {
        // Improve yield across all processes
        const targetImprovement = this.futureState.targets.qualityImprovement;
        
        this.futureState.processes.forEach(process => {
            const currentYield = process.yield;
            const newYield = Math.min(0.999, currentYield + targetImprovement);
            
            if (newYield > currentYield) {
                this.futureState.improvements.push({
                    type: 'quality_improvement',
                    description: `Improve yield for ${process.name} from ${(currentYield * 100).toFixed(1)}% to ${(newYield * 100).toFixed(1)}%`,
                    impact: 'Medium',
                    implementation: '3-6 months',
                    methods: ['Statistical Process Control', 'Mistake Proofing', 'Training']
                });
                
                process.yield = newYield;
            }
        });
    }
    
    calculateEliminationCost(process) {
        // Simplified cost-benefit analysis
        const laborCost = process.operators * 25 * 8 * 20; // $25/hour, 8 hours/day, 20 days/month
        const equipmentCost = process.machines * 5000; // Monthly depreciation
        const spaceCost = 1000; // Monthly space cost
        
        const totalCost = laborCost + equipmentCost + spaceCost;
        const savings = totalCost * 0.8; // 80% of cost as savings
        
        return {
            cost: totalCost,
            savings: savings,
            roi: (savings - totalCost) / totalCost,
            paybackPeriod: totalCost / (savings / 12) // months
        };
    }
    
    calculateFutureMetrics() {
        // Create a temporary app instance with future state data
        const futureApp = {
            processes: this.futureState.processes.filter(p => !p.markedForElimination),
            inventories: this.futureState.inventories,
            taktTime: this.app.taktTime,
            dailyDemand: this.app.dailyDemand,
            availableTime: this.app.availableTime
        };
        
        // Add methods needed by calculators
        futureApp.calculateProcessLeadTime = this.app.calculateProcessLeadTime.bind(futureApp);
        futureApp.identifyBottleneck = this.app.identifyBottleneck.bind(futureApp);
        
        const leadTimeCalc = new LeadTimeCalculator(futureApp);
        const leanMetrics = new LeanMetricsCalculator(futureApp);
        
        return {
            leadTime: leadTimeCalc.calculateTotalValueStreamLeadTime(),
            leanMetrics: leanMetrics.calculateAllMetrics(),
            bottleneck: futureApp.identifyBottleneck(),
            flowType: futureApp.analyzeFlowType ? futureApp.analyzeFlowType() : { type: 'Mixed' }
        };
    }
    
    calculateGap(current, future) {
        return {
            leadTime: {
                current: current.leadTime.totalLeadTime,
                future: future.leadTime.totalLeadTime,
                reduction: ((current.leadTime.totalLeadTime - future.leadTime.totalLeadTime) / 
                          current.leadTime.totalLeadTime * 100).toFixed(1) + '%',
                improvement: 'Lead time reduction'
            },
            efficiency: {
                current: current.leanMetrics.processCycleEfficiency,
                future: future.leanMetrics.processCycleEfficiency,
                improvement: (future.leanMetrics.processCycleEfficiency - 
                            current.leanMetrics.processCycleEfficiency).toFixed(1) + '%',
                impact: 'Process efficiency improvement'
            },
            inventory: {
                current: current.leanMetrics.daysOfInventory,
                future: future.leanMetrics.daysOfInventory,
                reduction: ((current.leanMetrics.daysOfInventory - future.leanMetrics.daysOfInventory) / 
                          current.leanMetrics.daysOfInventory * 100).toFixed(1) + '%',
                benefit: 'Reduced carrying costs'
            }
        };
    }
    
    generateFutureStateReport() {
        const analysis = this.designFutureState();
        
        const report = {
            title: 'Future State VSM Design Report',
            date: new Date().toLocaleDateString(),
            executiveSummary: this.generateExecutiveSummary(analysis),
            currentStateSnapshot: analysis.currentState,
            futureStateDesign: analysis.futureState,
            improvementPlan: this.futureState.improvements,
            gapAnalysis: analysis.gapAnalysis,
            implementationRoadmap: this.generateRoadmap(),
            financialAnalysis: this.generateFinancialAnalysis(analysis)
        };
        
        return report;
    }
    
    generateExecutiveSummary(analysis) {
        const gap = analysis.gapAnalysis;
        
        return `Future State Design proposes a ${gap.leadTime.reduction} reduction in lead time, 
                ${gap.efficiency.improvement} improvement in process efficiency, and 
                ${gap.inventory.reduction} reduction in inventory. 
                Implementation requires ${this.futureState.improvements.length} improvement initiatives 
                over 6-12 months.`;
    }
    
    generateRoadmap() {
        const roadmap = {
            phase1: {
                duration: 'Months 1-3',
                focus: 'Quick Wins & Bottleneck Improvement',
                initiatives: this.futureState.improvements
                    .filter(i => i.implementation.includes('weeks'))
                    .map(i => i.description)
            },
            phase2: {
                duration: 'Months 4-6',
                focus: 'System Improvements & Inventory Reduction',
                initiatives: this.futureState.improvements
                    .filter(i => i.implementation.includes('months') && 
                              !i.implementation.includes('6-12'))
                    .map(i => i.description)
            },
            phase3: {
                duration: 'Months 7-12',
                focus: 'Cultural Change & Sustained Improvement',
                initiatives: this.futureState.improvements
                    .filter(i => i.implementation.includes('6-12'))
                    .map(i => i.description)
            }
        };
        
        return roadmap;
    }
    
    generateFinancialAnalysis(analysis) {
        const gap = analysis.gapAnalysis;
        
        // Simplified financial analysis
        const inventoryValue = 1000; // Average inventory value per unit
        const holdingCost = 0.25; // 25% annual holding cost
        const laborCost = 50; // Hourly labor cost
        
        const inventoryReduction = gap.inventory.reduction;
        const leadTimeReduction = gap.leadTime.reduction;
        
        const annualSavings = {
            inventoryCarrying: (inventoryValue * parseFloat(inventoryReduction) / 100) * holdingCost,
            laborEfficiency: (leadTimeReduction / 100) * laborCost * 8 * 20 * 12, // 8h/day, 20d/mo, 12mo
            qualityImprovement: 50000, // Estimated annual savings from quality improvements
            total: 0
        };
        
        annualSavings.total = annualSavings.inventoryCarrying + 
                             annualSavings.laborEfficiency + 
                             annualSavings.qualityImprovement;
        
        const implementationCost = this.futureState.improvements.reduce((sum, imp) => {
            return sum + (imp.cost || 10000); // Default $10k per improvement if not specified
        }, 0);
        
        return {
            annualSavings,
            implementationCost,
            roi: ((annualSavings.total - implementationCost) / implementationCost * 100).toFixed(1) + '%',
            paybackPeriod: (implementationCost / (annualSavings.total / 12)).toFixed(1) + ' months',
            breakEvenPoint: Math.ceil(implementationCost / (annualSavings.total / 365)) + ' days'
        };
    }
}
