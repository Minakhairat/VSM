// Inventory Model
class Inventory {
    constructor(data = {}) {
        this.id = data.id || Date.now() + Math.random();
        this.type = 'inventory';
        this.name = data.name || 'Inventory';
        this.quantity = data.quantity || 0;
        this.location = data.location || 'between_processes'; // before_process, between_processes, after_process
        this.inventoryType = data.inventoryType || 'buffer'; // buffer, supermarket, fifo, safety_stock
        this.maxLevel = data.maxLevel || data.quantity || 0;
        this.minLevel = data.minLevel || 0;
        this.reorderPoint = data.reorderPoint || 0;
        this.leadTime = data.leadTime || 0; // replenishment lead time
        this.turnoverRate = data.turnoverRate || 0;
        this.costPerUnit = data.costPerUnit || 0;
        
        // Calculated properties
        this.waitTime = 0;
        this.inventoryCost = 0;
    }
    
    calculateWaitTime(taktTime) {
        this.waitTime = this.quantity * taktTime;
        return this.waitTime;
    }
    
    calculateInventoryCost() {
        this.inventoryCost = this.quantity * this.costPerUnit;
        return this.inventoryCost;
    }
    
    calculateTurnover(dailyUsage) {
        if (dailyUsage > 0) {
            this.turnoverRate = dailyUsage / this.quantity;
        }
        return this.turnoverRate;
    }
    
    calculateDaysOfSupply(dailyUsage) {
        if (dailyUsage > 0) {
            return this.quantity / dailyUsage;
        }
        return 0;
    }
    
    isBelowReorderPoint() {
        return this.quantity <= this.reorderPoint;
    }
    
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            quantity: this.quantity,
            location: this.location,
            inventoryType: this.inventoryType,
            maxLevel: this.maxLevel,
            minLevel: this.minLevel,
            reorderPoint: this.reorderPoint,
            leadTime: this.leadTime,
            turnoverRate: this.turnoverRate,
            costPerUnit: this.costPerUnit
        };
    }
    
    static fromJSON(json) {
        return new Inventory(json);
    }
}