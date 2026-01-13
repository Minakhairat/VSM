// VSM Process Model
class VSMProcess {
    constructor(data = {}) {
        this.id = data.id || Date.now() + Math.random();
        this.type = 'process';
        this.name = data.name || 'Unnamed Process';
        this.cycleTime = data.cycleTime || 0; // minutes per unit
        this.setupTime = data.setupTime || 0; // minutes per batch
        this.operators = data.operators || 1;
        this.machines = data.machines || 1;
        this.uptime = data.uptime || 0.95; // 95%
        this.yield = data.yield || 0.98; // 98%
        this.processType = data.processType || 'manufacturing'; // manufacturing, assembly, inspection
        this.valueAdded = data.valueAdded !== undefined ? data.valueAdded : true;
        this.flowType = data.flowType || 'push'; // push or pull
        this.inventoryBefore = data.inventoryBefore || 0;
        this.inventoryAfter = data.inventoryAfter || 0;
        this.kanbanSize = data.kanbanSize || 0; // for pull systems
        this.batchSize = data.batchSize || 1;
        this.changeoverTime = data.changeoverTime || 0;
        
        // Calculated properties
        this.utilization = 0;
        this.leadTime = 0;
        this.throughput = 0;
    }
    
    calculateUtilization(taktTime) {
        if (taktTime > 0) {
            this.utilization = this.cycleTime / taktTime;
        }
        return this.utilization;
    }
    
    calculateLeadTime(taktTime, inventoryBefore = 0) {
        // Lead Time = Processing Time + Waiting Time
        const processingTime = this.cycleTime;
        const waitingTime = inventoryBefore * taktTime;
        this.leadTime = processingTime + waitingTime;
        return this.leadTime;
    }
    
    calculateThroughput() {
        // Throughput = (Units per hour) considering uptime and yield
        const unitsPerHour = (60 / this.cycleTime) * this.machines;
        this.throughput = unitsPerHour * this.uptime * this.yield;
        return this.throughput;
    }
    
    calculateEffectiveCycleTime() {
        // Considering yield and uptime
        return this.cycleTime / (this.uptime * this.yield);
    }
    
    calculateCapacity(availableTime) {
        // Daily capacity considering all factors
        const availableMinutes = availableTime * this.uptime;
        const unitsPerDay = (availableMinutes / this.calculateEffectiveCycleTime()) * this.machines;
        return unitsPerDay;
    }
    
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            cycleTime: this.cycleTime,
            setupTime: this.setupTime,
            operators: this.operators,
            machines: this.machines,
            uptime: this.uptime,
            yield: this.yield,
            processType: this.processType,
            valueAdded: this.valueAdded,
            flowType: this.flowType,
            inventoryBefore: this.inventoryBefore,
            inventoryAfter: this.inventoryAfter,
            kanbanSize: this.kanbanSize,
            batchSize: this.batchSize,
            changeoverTime: this.changeoverTime
        };
    }
    
    static fromJSON(json) {
        return new VSMProcess(json);
    }
}