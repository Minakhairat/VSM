// Takt Time Calculator Module
class TaktTimeCalculator {
    constructor(vsmApp) {
        this.app = vsmApp;
    }
    
    calculateTaktTime(dailyDemand = null, availableTime = null) {
        const demand = dailyDemand || this.app.dailyDemand;
        const time = availableTime || this.app.availableTime;
        
        if (demand <= 0) {
            return {
                value: 0,
                status: 'invalid',
                message: this.app.currentLanguage === 'ar' ? 
                    'الطلب اليومي يجب أن يكون أكبر من صفر' : 
                    'Daily demand must be greater than zero'
            };
        }
        
        const taktTime = time / demand;
        
        return {
            value: taktTime,
            formatted: `${taktTime.toFixed(2)} ${this.app.currentLanguage === 'ar' ? 'دقيقة/وحدة' : 'min/unit'}`,
            status: this.evaluateTaktTime(taktTime),
            unitsPerHour: (60 / taktTime).toFixed(2),
            unitsPerShift: ((time * 60) / taktTime).toFixed(0),
            recommendations: this.generateTaktRecommendations(taktTime, demand, time)
        };
    }
    
    evaluateTaktTime(taktTime) {
        if (taktTime < 0.5) return 'very_fast';
        if (taktTime < 1) return 'fast';
        if (taktTime < 5) return 'optimal';
        if (taktTime < 10) return 'slow';
        return 'very_slow';
    }
    
    generateTaktRecommendations(taktTime, demand, time) {
        const recommendations = [];
        const lang = this.app.currentLanguage;
        
        if (taktTime < 0.5) {
            recommendations.push({
                type: 'warning',
                message: lang === 'ar' ?
                    'وقت التاكت سريع جداً. قد تحتاج إلى خطوط إنتاج متعددة أو تحسين الكفاءة' :
                    'Takt time is very fast. May need multiple production lines or efficiency improvements'
            });
        }
        
        if (taktTime > 10) {
            recommendations.push({
                type: 'warning',
                message: lang === 'ar' ?
                    'وقت التاكت بطيء جداً. فكر في زيادة الطلب أو تقليل وقت الإنتاج المتاح' :
                    'Takt time is very slow. Consider increasing demand or reducing available production time'
            });
        }
        
        // Check if takt time matches process capabilities
        const bottleneck = this.app.identifyBottleneck();
        if (bottleneck && bottleneck.process) {
            const cycleTime = bottleneck.process.cycleTime;
            if (cycleTime > taktTime) {
                recommendations.push({
                    type: 'critical',
                    message: lang === 'ar' ?
                        `عملية ${bottleneck.process.name} أبطأ من وقت التاكت (${cycleTime.toFixed(2)} > ${taktTime.toFixed(2)})` :
                        `${bottleneck.process.name} process is slower than takt time (${cycleTime.toFixed(2)} > ${taktTime.toFixed(2)})`
                });
            }
        }
        
        return recommendations;
    }
    
    calculateRequiredResources(taktTime) {
        const resources = {
            operators: 0,
            machines: 0,
            shifts: 1
        };
        
        this.app.processes.forEach(process => {
            if (process.type === 'process') {
                // Calculate operators needed based on cycle time and takt time
                const operatorsPerProcess = Math.ceil(process.cycleTime / taktTime);
                resources.operators += operatorsPerProcess * process.machines;
                resources.machines += process.machines;
            }
        });
        
        // Calculate if multiple shifts are needed
        const dailyProduction = this.app.dailyDemand;
        const productionPerShift = (this.app.availableTime * 60) / taktTime;
        
        if (dailyProduction > productionPerShift) {
            resources.shifts = Math.ceil(dailyProduction / productionPerShift);
        }
        
        return resources;
    }
    
    simulateDemandChange(newDemand) {
        const currentTakt = this.calculateTaktTime();
        const newTakt = this.calculateTaktTime(newDemand, this.app.availableTime);
        
        return {
            current: currentTakt,
            new: newTakt,
            change: ((newTakt.value - currentTakt.value) / currentTakt.value * 100).toFixed(1) + '%',
            impact: this.calculateDemandChangeImpact(newDemand)
        };
    }
    
    calculateDemandChangeImpact(newDemand) {
        const impact = {
            production: {},
            resources: {},
            financial: {}
        };
        
        const currentTakt = this.app.taktTime;
        const newTakt = this.app.availableTime / newDemand;
        
        // Production impact
        impact.production.taktTimeChange = ((newTakt - currentTakt) / currentTakt * 100).toFixed(1) + '%';
        impact.production.throughputChange = ((newDemand - this.app.dailyDemand) / this.app.dailyDemand * 100).toFixed(1) + '%';
        
        // Resource impact
        const currentResources = this.calculateRequiredResources(currentTakt);
        const newResources = this.calculateRequiredResources(newTakt);
        
        impact.resources.operatorsChange = newResources.operators - currentResources.operators;
        impact.resources.machinesChange = newResources.machines - currentResources.machines;
        impact.resources.shiftsChange = newResources.shifts - currentResources.shifts;
        
        // Financial impact
        const operatorCost = 25; // $ per hour
        const machineCost = 50; // $ per hour
        
        impact.financial.additionalLaborCost = impact.resources.operatorsChange * operatorCost * 8 * 20; // Monthly
        impact.financial.additionalMachineCost = impact.resources.machinesChange * machineCost * 8 * 20;
        impact.financial.totalAdditionalCost = impact.financial.additionalLaborCost + impact.financial.additionalMachineCost;
        
        return impact;
    }
    
    optimizeTaktTime(targetUtilization = 0.85) {
        const bottleneck = this.app.identifyBottleneck();
        if (!bottleneck || !bottleneck.process) return null;
        
        const optimalCycleTime = bottleneck.process.cycleTime / targetUtilization;
        const optimalDemand = Math.floor(this.app.availableTime / optimalCycleTime);
        
        return {
            targetUtilization: targetUtilization * 100 + '%',
            optimalCycleTime: optimalCycleTime.toFixed(2),
            optimalDemand: optimalDemand,
            optimalTaktTime: optimalCycleTime.toFixed(2),
            currentUtilization: (bottleneck.utilization * 100).toFixed(1) + '%',
            improvement: ((bottleneck.utilization - targetUtilization) / bottleneck.utilization * 100).toFixed(1) + '%'
        };
    }
    
    generateTaktReport() {
        const taktAnalysis = this.calculateTaktTime();
        const resourceAnalysis = this.calculateRequiredResources(taktAnalysis.value);
        const optimization = this.optimizeTaktTime();
        const lang = this.app.currentLanguage;
        
        return {
            title: lang === 'ar' ? 'تقرير تحليل وقت التاكت' : 'Takt Time Analysis Report',
            date: new Date().toLocaleDateString(),
            currentState: {
                dailyDemand: this.app.dailyDemand,
                availableTime: this.app.availableTime,
                taktTime: taktAnalysis
            },
            resourceRequirements: resourceAnalysis,
            optimizationOpportunities: optimization,
            demandSensitivity: this.analyzeDemandSensitivity(),
            recommendations: this.generateStrategicRecommendations(taktAnalysis)
        };
    }
    
    analyzeDemandSensitivity() {
        const scenarios = [-30, -20, -10, 10, 20, 30]; // Percentage changes
        
        return scenarios.map(change => {
            const newDemand = this.app.dailyDemand * (1 + change/100);
            return this.simulateDemandChange(newDemand);
        });
    }
    
    generateStrategicRecommendations(taktAnalysis) {
        const recommendations = [];
        const lang = this.app.currentLanguage;
        
        if (taktAnalysis.status === 'very_fast') {
            recommendations.push({
                priority: 'high',
                area: 'capacity',
                recommendation: lang === 'ar' ?
                    'إضافة خط إنتاج إضافي أو زيادة عدد الورديات' :
                    'Add additional production line or increase number of shifts',
                rationale: lang === 'ar' ?
                    'وقت التاكت سريع جداً لسعة الإنتاج الحالية' :
                    'Takt time is too fast for current production capacity'
            });
        }
        
        if (taktAnalysis.status === 'very_slow') {
            recommendations.push({
                priority: 'medium',
                area: 'demand',
                recommendation: lang === 'ar' ?
                    'زيادة الطلب أو تقليل وقت الإنتاج المتاح' :
                    'Increase demand or reduce available production time',
                rationale: lang === 'ar' ?
                    'سعة الإنتاج أعلى من الطلب الحالي' :
                    'Production capacity exceeds current demand'
            });
        }
        
        return recommendations;
    }
}