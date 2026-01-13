// Lead Time Calculations for Real VSM
class LeadTimeCalculator {
    constructor(vsmApp) {
        this.app = vsmApp;
    }
    
    calculateProcessLeadTime(process) {
        // Real industrial lead time calculation
        const taktTime = this.app.taktTime;
        
        // Processing Time (Value Added)
        const processingTime = process.cycleTime;
        
        // Waiting Time (Non-Value Added)
        const waitingTime = process.inventoryBefore * taktTime;
        
        // Setup Time (Non-Value Added)
        const setupTimePerUnit = process.setupTime / process.batchSize;
        
        // Move Time (Transportation between processes)
        const moveTime = 5; // minutes (assumed)
        
        // Queue Time (Waiting in line)
        const queueTime = Math.max(0, (process.inventoryBefore - 1)) * taktTime;
        
        // Total Lead Time for this process
        const totalLeadTime = processingTime + waitingTime + setupTimePerUnit + moveTime + queueTime;
        
        return {
            processingTime,
            waitingTime,
            setupTime: setupTimePerUnit,
            moveTime,
            queueTime,
            totalLeadTime
        };
    }
    
    calculateTotalValueStreamLeadTime() {
        let totalLeadTime = 0;
        let valueAddedTime = 0;
        let nonValueAddedTime = 0;
        
        this.app.processes.forEach(process => {
            if (process.type === 'process') {
                const leadTime = this.calculateProcessLeadTime(process);
                totalLeadTime += leadTime.totalLeadTime;
                
                if (process.valueAdded) {
                    valueAddedTime += leadTime.processingTime;
                } else {
                    nonValueAddedTime += leadTime.processingTime;
                }
                
                nonValueAddedTime += leadTime.waitingTime + leadTime.setupTime + 
                                   leadTime.moveTime + leadTime.queueTime;
            }
        });
        
        // Add inventory waiting time
        this.app.inventories.forEach(inventory => {
            const waitTime = inventory.calculateWaitTime(this.app.taktTime);
            totalLeadTime += waitTime;
            nonValueAddedTime += waitTime;
        });
        
        return {
            totalLeadTime,
            valueAddedTime,
            nonValueAddedTime,
            processCycleEfficiency: totalLeadTime > 0 ? (valueAddedTime / totalLeadTime) * 100 : 0
        };
    }
    
    calculateLittleLaw() {
        // Little's Law: WIP = Throughput × Lead Time
        const throughput = this.calculateThroughput();
        const leadTime = this.calculateTotalValueStreamLeadTime().totalLeadTime;
        
        const theoreticalWIP = throughput * (leadTime / 60); // Convert to hours
        
        // Actual WIP
        const actualWIP = this.app.processes.reduce((sum, p) => sum + p.inventoryBefore, 0) +
                         this.app.inventories.reduce((sum, i) => sum + i.quantity, 0);
        
        return {
            theoreticalWIP,
            actualWIP,
            difference: actualWIP - theoreticalWIP,
            efficiency: theoreticalWIP > 0 ? (actualWIP / theoreticalWIP) * 100 : 0
        };
    }
    
    calculateThroughput() {
        // Throughput is limited by the bottleneck
        const bottleneck = this.app.identifyBottleneck();
        
        if (bottleneck.process) {
            // Calculate effective throughput considering uptime and yield
            const unitsPerHour = (60 / bottleneck.process.calculateEffectiveCycleTime()) * 
                               bottleneck.process.machines;
            return unitsPerHour;
        }
        
        return 0;
    }
    
    generateLeadTimeReport() {
        const leadTimeData = this.calculateTotalValueStreamLeadTime();
        const littleLaw = this.calculateLittleLaw();
        const throughput = this.calculateThroughput();
        
        return {
            summary: {
                totalLeadTime: leadTimeData.totalLeadTime.toFixed(1),
                valueAddedTime: leadTimeData.valueAddedTime.toFixed(1),
                nonValueAddedTime: leadTimeData.nonValueAddedTime.toFixed(1),
                processCycleEfficiency: leadTimeData.processCycleEfficiency.toFixed(1),
                throughput: throughput.toFixed(1)
            },
            littleLaw: {
                theoreticalWIP: littleLaw.theoreticalWIP.toFixed(1),
                actualWIP: littleLaw.actualWIP.toFixed(1),
                difference: littleLaw.difference.toFixed(1),
                efficiency: littleLaw.efficiency.toFixed(1)
            },
            breakdown: this.getLeadTimeBreakdown()
        };
    }
    
    getLeadTimeBreakdown() {
        const breakdown = {
            processing: 0,
            waiting: 0,
            setup: 0,
            move: 0,
            queue: 0
        };
        
        this.app.processes.forEach(process => {
            if (process.type === 'process') {
                const leadTime = this.calculateProcessLeadTime(process);
                breakdown.processing += leadTime.processingTime;
                breakdown.waiting += leadTime.waitingTime;
                breakdown.setup += leadTime.setupTime;
                breakdown.move += leadTime.moveTime;
                breakdown.queue += leadTime.queueTime;
            }
        });
        
        return breakdown;
    }
}