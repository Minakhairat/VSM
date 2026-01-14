// Lean Manufacturing Metrics Calculator
class LeanMetricsCalculator {
    constructor(vsmApp) {
        this.app = vsmApp;
    }
    
    calculateAllMetrics() {
        return {
            taktTime: this.calculateTaktTime(),
            processCycleEfficiency: this.calculateProcessCycleEfficiency(),
            overallEquipmentEffectiveness: this.calculateOEE(),
            firstTimeThrough: this.calculateFTT(),
            valueAddedRatio: this.calculateValueAddedRatio(),
            inventoryTurns: this.calculateInventoryTurns(),
            daysOfInventory: this.calculateDaysOfInventory(),
            capacityUtilization: this.calculateCapacityUtilization()
        };
    }
    
    calculateTaktTime() {
        return this.app.taktTime;
    }
    
    calculateProcessCycleEfficiency() {
        const leadTimeCalc = new LeadTimeCalculator(this.app);
        const leadTimeData = leadTimeCalc.calculateTotalValueStreamLeadTime();
        return leadTimeData.processCycleEfficiency;
    }
    
    calculateOEE() {
        // OEE = Availability × Performance × Quality
        let totalOEE = 0;
        let processCount = 0;
        
        this.app.processes.forEach(process => {
            if (process.type === 'process') {
                // Availability (Uptime)
                const availability = process.uptime;
                
                // Performance (Actual vs Ideal Cycle Time)
                const performance = 1; // Assume 100% for now
                
                // Quality (Yield)
                const quality = process.yield;
                
                const oee = availability * performance * quality;
                totalOEE += oee;
                processCount++;
            }
        });
        
        return processCount > 0 ? (totalOEE / processCount) * 100 : 0;
    }
    
    calculateFTT() {
        // First Time Through quality
        let totalYield = 0;
        let processCount = 0;
        
        this.app.processes.forEach(process => {
            if (process.type === 'process') {
                totalYield += process.yield;
                processCount++;
            }
        });
        
        if (processCount === 0) return 0;
        
        // Compound yield through all processes
        const averageYield = totalYield / processCount;
        const ftt = Math.pow(averageYield, processCount) * 100;
        
        return ftt;
    }
    
    calculateValueAddedRatio() {
        const leadTimeCalc = new LeadTimeCalculator(this.app);
        const leadTimeData = leadTimeCalc.calculateTotalValueStreamLeadTime();
        
        if (leadTimeData.totalLeadTime > 0) {
            return (leadTimeData.valueAddedTime / leadTimeData.totalLeadTime) * 100;
        }
        
        return 0;
    }
    
    calculateInventoryTurns() {
        const totalInventory = this.app.inventories.reduce((sum, inv) => sum + inv.quantity, 0) +
                              this.app.processes.reduce((sum, proc) => sum + proc.inventoryBefore, 0);
        
        if (totalInventory > 0) {
            const dailyUsage = this.app.dailyDemand;
            const inventoryTurns = (dailyUsage * 365) / totalInventory;
            return inventoryTurns;
        }
        
        return 0;
    }
    
    calculateDaysOfInventory() {
        const totalInventory = this.app.inventories.reduce((sum, inv) => sum + inv.quantity, 0) +
                              this.app.processes.reduce((sum, proc) => sum + proc.inventoryBefore, 0);
        
        if (this.app.dailyDemand > 0) {
            return totalInventory / this.app.dailyDemand;
        }
        
        return 0;
    }
    
    calculateCapacityUtilization() {
        const bottleneck = this.app.identifyBottleneck();
        
        if (bottleneck.process) {
            return bottleneck.utilization * 100;
        }
        
        return 0;
    }
    
    generateMetricsReport() {
        const metrics = this.calculateAllMetrics();
        
        return {
            summary: {
                title: 'Lean Manufacturing Metrics Report',
                date: new Date().toLocaleDateString(),
                totalProcesses: this.app.processes.length,
                totalInventory: this.app.inventories.reduce((sum, inv) => sum + inv.quantity, 0)
            },
            metrics: {
                taktTime: {
                    value: metrics.taktTime.toFixed(2),
                    unit: 'min/unit',
                    target: '< Takt Time',
                    status: this.evaluateTaktTime(metrics.taktTime)
                },
                processCycleEfficiency: {
                    value: metrics.processCycleEfficiency.toFixed(1),
                    unit: '%',
                    target: '> 25%',
                    status: this.evaluatePCE(metrics.processCycleEfficiency)
                },
                oee: {
                    value: metrics.overallEquipmentEffectiveness.toFixed(1),
                    unit: '%',
                    target: '> 85%',
                    status: this.evaluateOEE(metrics.overallEquipmentEffectiveness)
                },
                firstTimeThrough: {
                    value: metrics.firstTimeThrough.toFixed(1),
                    unit: '%',
                    target: '> 95%',
                    status: this.evaluateFTT(metrics.firstTimeThrough)
                },
                valueAddedRatio: {
                    value: metrics.valueAddedRatio.toFixed(1),
                    unit: '%',
                    target: '> 30%',
                    status: this.evaluateVAR(metrics.valueAddedRatio)
                },
                inventoryTurns: {
                    value: metrics.inventoryTurns.toFixed(1),
                    unit: 'turns/year',
                    target: '> 12',
                    status: this.evaluateTurns(metrics.inventoryTurns)
                },
                daysOfInventory: {
                    value: metrics.daysOfInventory.toFixed(1),
                    unit: 'days',
                    target: '< 15',
                    status: this.evaluateDOI(metrics.daysOfInventory)
                }
            },
            recommendations: this.generateRecommendations(metrics)
        };
    }
    
    evaluateTaktTime(taktTime) {
        return taktTime > 0 ? 'good' : 'poor';
    }
    
    evaluatePCE(pce) {
        if (pce > 25) return 'excellent';
        if (pce > 15) return 'good';
        if (pce > 5) return 'fair';
        return 'poor';
    }
    
    evaluateOEE(oee) {
        if (oee > 85) return 'excellent';
        if (oee > 75) return 'good';
        if (oee > 65) return 'fair';
        return 'poor';
    }
    
    evaluateFTT(ftt) {
        if (ftt > 95) return 'excellent';
        if (ftt > 90) return 'good';
        if (ftt > 85) return 'fair';
        return 'poor';
    }
    
    evaluateVAR(varRatio) {
        if (varRatio > 30) return 'excellent';
        if (varRatio > 20) return 'good';
        if (varRatio > 10) return 'fair';
        return 'poor';
    }
    
    evaluateTurns(turns) {
        if (turns > 12) return 'excellent';
        if (turns > 8) return 'good';
        if (turns > 4) return 'fair';
        return 'poor';
    }
    
    evaluateDOI(doi) {
        if (doi < 15) return 'excellent';
        if (doi < 30) return 'good';
        if (doi < 45) return 'fair';
        return 'poor';
    }
    
    generateRecommendations(metrics) {
        const recommendations = [];
        
        if (metrics.processCycleEfficiency < 10) {
            recommendations.push({
                priority: 'high',
                area: 'Process Efficiency',
                suggestion: 'Focus on reducing wait time and inventory between processes',
                impact: 'High',
                effort: 'Medium'
            });
        }
        
        if (metrics.valueAddedRatio < 20) {
            recommendations.push({
                priority: 'high',
                area: 'Value Added Activities',
                suggestion: 'Identify and eliminate non-value added activities',
                impact: 'High',
                effort: 'High'
            });
        }
        
        if (metrics.daysOfInventory > 30) {
            recommendations.push({
                priority: 'medium',
                area: 'Inventory Management',
                suggestion: 'Implement pull system and reduce batch sizes',
                impact: 'Medium',
                effort: 'Medium'
            });
        }
        
        if (metrics.firstTimeThrough < 90) {
            recommendations.push({
                priority: 'medium',
                area: 'Quality',
                suggestion: 'Implement mistake-proofing and improve process controls',
                impact: 'Medium',
                effort: 'High'
            });
        }
        
        return recommendations;
    }
}
