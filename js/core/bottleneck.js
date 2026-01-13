// Bottleneck Analysis Module
class BottleneckAnalyzer {
    constructor(vsmApp) {
        this.app = vsmApp;
    }
    
    identifyBottleneck() {
        let bottleneck = null;
        let highestUtilization = 0;
        let highestCycleTime = 0;
        
        this.app.processes.forEach(process => {
            if (process.type === 'process') {
                const utilization = process.cycleTime / this.app.taktTime;
                const totalTime = process.cycleTime + (process.setupTime / process.batchSize);
                
                // Calculate impact on overall flow
                const flowImpact = this.calculateFlowImpact(process);
                
                if (utilization > highestUtilization || 
                    (utilization === highestUtilization && flowImpact > 0.8)) {
                    highestUtilization = utilization;
                    highestCycleTime = totalTime;
                    bottleneck = {
                        process: process,
                        utilization: utilization,
                        cycleTime: process.cycleTime,
                        totalTime: totalTime,
                        flowImpact: flowImpact,
                        isCritical: utilization > 1 || flowImpact > 0.9,
                        type: this.determineBottleneckType(process, utilization)
                    };
                }
            }
        });
        
        if (bottleneck) {
            bottleneck.efficiency = this.calculateBottleneckEfficiency(bottleneck);
            bottleneck.improvementOpportunities = this.generateImprovementSuggestions(bottleneck);
            bottleneck.impactOnLeadTime = this.calculateLeadTimeImpact(bottleneck);
        }
        
        return bottleneck;
    }
    
    calculateFlowImpact(process) {
        const processIndex = this.app.processes.findIndex(p => p.id === process.id);
        const totalProcesses = this.app.processes.length;
        
        if (processIndex === -1 || totalProcesses === 0) return 0;
        
        // Processes later in the flow have higher impact
        const positionImpact = (processIndex + 1) / totalProcesses;
        
        // Processes with high inventory before them have buffer protection
        const bufferProtection = process.inventoryBefore > 0 ? 
            Math.min(1, process.inventoryBefore / 10) : 0;
        
        // Processes with multiple operators/machines have redundancy
        const redundancy = process.machines > 1 ? 0.8 : 1;
        
        return (positionImpact * redundancy) - (bufferProtection * 0.3);
    }
    
    determineBottleneckType(process, utilization) {
        if (utilization > 1.2) return 'critical_bottleneck';
        if (utilization > 1) return 'bottleneck';
        if (utilization > 0.9) return 'potential_bottleneck';
        if (utilization > 0.8) return 'capacity_constraint';
        return 'balanced';
    }
    
    calculateBottleneckEfficiency(bottleneck) {
        const idealCycleTime = this.app.taktTime;
        const actualCycleTime = bottleneck.process.cycleTime;
        
        const cycleTimeEfficiency = idealCycleTime / actualCycleTime;
        const uptimeEfficiency = bottleneck.process.uptime;
        const yieldEfficiency = bottleneck.process.yield;
        
        return {
            cycleTime: cycleTimeEfficiency * 100,
            uptime: uptimeEfficiency * 100,
            yield: yieldEfficiency * 100,
            overall: (cycleTimeEfficiency * uptimeEfficiency * yieldEfficiency) * 100
        };
    }
    
    generateImprovementSuggestions(bottleneck) {
        const suggestions = [];
        const lang = this.app.currentLanguage;
        
        // Cycle time reduction
        if (bottleneck.process.cycleTime > this.app.taktTime) {
            suggestions.push({
                priority: 'high',
                area: 'cycle_time',
                suggestion: lang === 'ar' ? 
                    `تقليل وقت الدورة من ${bottleneck.process.cycleTime} إلى ${this.app.taktTime.toFixed(2)} دقيقة` :
                    `Reduce cycle time from ${bottleneck.process.cycleTime} to ${this.app.taktTime.toFixed(2)} minutes`,
                impact: 'high',
                effort: 'medium',
                methods: lang === 'ar' ? 
                    ['تحسين أساليب العمل', 'تبسيط العمليات', 'تقليل الحركات غير الضرورية'] :
                    ['Work method improvement', 'Process simplification', 'Reduce unnecessary movements']
            });
        }
        
        // Setup time reduction
        if (bottleneck.process.setupTime > 0) {
            suggestions.push({
                priority: 'medium',
                area: 'setup_time',
                suggestion: lang === 'ar' ?
                    `تقليل وقت الإعداد بنسبة 50% (${bottleneck.process.setupTime} → ${bottleneck.process.setupTime * 0.5} دقيقة)` :
                    `Reduce setup time by 50% (${bottleneck.process.setupTime} → ${bottleneck.process.setupTime * 0.5} minutes)`,
                impact: 'medium',
                effort: 'low',
                methods: lang === 'ar' ?
                    ['تطبيق SMED', 'تحسين أدوات الإعداد', 'توحيد الإجراءات'] :
                    ['Implement SMED', 'Improve setup tools', 'Standardize procedures']
            });
        }
        
        // Add parallel processing
        if (bottleneck.process.machines < 2) {
            suggestions.push({
                priority: 'low',
                area: 'capacity',
                suggestion: lang === 'ar' ?
                    `إضافة ماكينة ثانية لزيادة السعة` :
                    `Add second machine to increase capacity`,
                impact: 'high',
                effort: 'high',
                cost: 'high',
                methods: lang === 'ar' ?
                    ['شراء معدات إضافية', 'التدريب على التشغيل المتوازي'] :
                    ['Purchase additional equipment', 'Parallel operation training']
            });
        }
        
        // Improve uptime
        if (bottleneck.process.uptime < 0.95) {
            suggestions.push({
                priority: 'medium',
                area: 'uptime',
                suggestion: lang === 'ar' ?
                    `تحسين وقت التشغيل من ${(bottleneck.process.uptime * 100).toFixed(0)}% إلى 95%` :
                    `Improve uptime from ${(bottleneck.process.uptime * 100).toFixed(0)}% to 95%`,
                impact: 'medium',
                effort: 'medium',
                methods: lang === 'ar' ?
                    ['الصيانة الوقائية', 'تحسين قطع الغيار', 'تدريب المشغلين'] :
                    ['Preventive maintenance', 'Spare parts improvement', 'Operator training']
            });
        }
        
        return suggestions;
    }
    
    calculateLeadTimeImpact(bottleneck) {
        const currentLeadTime = this.app.calculateProcessLeadTime(bottleneck.process);
        const idealLeadTime = bottleneck.process.cycleTime;
        
        const waitTimeImpact = currentLeadTime - idealLeadTime;
        const totalProcessImpact = waitTimeImpact * (this.app.processes.length || 1);
        
        return {
            currentLeadTime,
            idealLeadTime,
            waitTimeImpact,
            totalProcessImpact,
            percentageImpact: (waitTimeImpact / currentLeadTime) * 100
        };
    }
    
    analyzeMultipleBottlenecks() {
        const bottlenecks = [];
        const utilizationThreshold = 0.8;
        
        this.app.processes.forEach(process => {
            if (process.type === 'process') {
                const utilization = process.cycleTime / this.app.taktTime;
                if (utilization > utilizationThreshold) {
                    bottlenecks.push({
                        process: process,
                        utilization: utilization,
                        severity: this.calculateSeverity(utilization),
                        position: this.app.processes.indexOf(process) + 1
                    });
                }
            }
        });
        
        // Sort by severity
        bottlenecks.sort((a, b) => b.severity - a.severity);
        
        return {
            count: bottlenecks.length,
            bottlenecks: bottlenecks,
            hasCritical: bottlenecks.some(b => b.severity > 0.9),
            recommendedActions: this.generateMultiBottleneckActions(bottlements)
        };
    }
    
    calculateSeverity(utilization) {
        if (utilization > 1.2) return 1.0;
        if (utilization > 1.1) return 0.9;
        if (utilization > 1.0) return 0.8;
        if (utilization > 0.9) return 0.7;
        if (utilization > 0.8) return 0.6;
        return 0;
    }
    
    generateMultiBottleneckActions(bottlenecks) {
        const actions = [];
        const lang = this.app.currentLanguage;
        
        if (bottlenecks.length >= 2) {
            actions.push({
                type: 'balancing',
                description: lang === 'ar' ?
                    'إعادة توزيع العمل بين العمليات لتحقيق التوازن' :
                    'Redistribute work between processes for balancing',
                priority: 'high',
                expectedImprovement: '15-25%'
            });
        }
        
        if (bottlenecks.length > this.app.processes.length / 2) {
            actions.push({
                type: 'system_design',
                description: lang === 'ar' ?
                    'إعادة تصميم تدفق العمل بأكمله' :
                    'Redesign entire workflow',
                priority: 'high',
                expectedImprovement: '30-50%'
            });
        }
        
        return actions;
    }
    
    simulateBottleneckImprovement(bottleneck, improvementType, improvementValue) {
        const simulatedProcess = JSON.parse(JSON.stringify(bottleneck.process));
        let improvementImpact = 0;
        
        switch (improvementType) {
            case 'cycle_time':
                simulatedProcess.cycleTime *= (1 - improvementValue);
                improvementImpact = (bottleneck.process.cycleTime - simulatedProcess.cycleTime) / 
                                   bottleneck.process.cycleTime * 100;
                break;
                
            case 'setup_time':
                simulatedProcess.setupTime *= (1 - improvementValue);
                improvementImpact = 10; // Simplified impact calculation
                break;
                
            case 'machines':
                simulatedProcess.machines += improvementValue;
                improvementImpact = (improvementValue / bottleneck.process.machines) * 100;
                break;
                
            case 'uptime':
                simulatedProcess.uptime += improvementValue;
                improvementImpact = improvementValue * 100;
                break;
        }
        
        const newUtilization = simulatedProcess.cycleTime / this.app.taktTime;
        const isStillBottleneck = newUtilization > 0.9;
        
        return {
            originalUtilization: bottleneck.utilization,
            newUtilization: newUtilization,
            improvementImpact: improvementImpact,
            isStillBottleneck: isStillBottleneck,
            nextBottleneck: isStillBottleneck ? this.identifyNextBottleneck(bottleneck) : null,
            throughputImprovement: this.calculateThroughputImprovement(bottleneck, simulatedProcess)
        };
    }
    
    identifyNextBottleneck(currentBottleneck) {
        let nextBottleneck = null;
        let nextHighestUtilization = 0;
        
        this.app.processes.forEach(process => {
            if (process.id !== currentBottleneck.process.id && process.type === 'process') {
                const utilization = process.cycleTime / this.app.taktTime;
                if (utilization > nextHighestUtilization) {
                    nextHighestUtilization = utilization;
                    nextBottleneck = process;
                }
            }
        });
        
        return nextBottleneck ? {
            process: nextBottleneck,
            utilization: nextHighestUtilization
        } : null;
    }
    
    calculateThroughputImprovement(originalProcess, improvedProcess) {
        const originalThroughput = (60 / originalProcess.cycleTime) * originalProcess.machines * 
                                 originalProcess.uptime * originalProcess.yield;
        const newThroughput = (60 / improvedProcess.cycleTime) * improvedProcess.machines * 
                            improvedProcess.uptime * improvedProcess.yield;
        
        return {
            originalThroughput: originalThroughput,
            newThroughput: newThroughput,
            improvement: ((newThroughput - originalThroughput) / originalThroughput) * 100
        };
    }
    
    generateBottleneckReport() {
        const bottleneck = this.identifyBottleneck();
        const multiAnalysis = this.analyzeMultipleBottlenecks();
        const lang = this.app.currentLanguage;
        
        const report = {
            title: lang === 'ar' ? 'تقرير تحليل الاختناقات' : 'Bottleneck Analysis Report',
            date: new Date().toLocaleDateString(),
            taktTime: this.app.taktTime,
            primaryBottleneck: bottleneck ? {
                name: bottleneck.process.name,
                type: bottleneck.type,
                utilization: (bottleneck.utilization * 100).toFixed(1) + '%',
                cycleTime: bottleneck.process.cycleTime,
                impact: bottleneck.impactOnLeadTime
            } : null,
            multipleBottlenecks: multiAnalysis,
            efficiencyAnalysis: bottleneck ? bottleneck.efficiency : null,
            improvementSuggestions: bottleneck ? bottleneck.improvementOpportunities : [],
            simulationResults: bottleneck ? 
                this.simulateBottleneckImprovement(bottleneck, 'cycle_time', 0.15) : null
        };
        
        return report;
    }
}