// Continuous Improvement Module
class ImprovementAnalyzer {
    constructor(vsmApp) {
        this.app = vsmApp;
    }
    
    analyzeImprovementOpportunities() {
        const opportunities = [];
        const lang = this.app.currentLanguage;
        
        // 1. Bottleneck Analysis
        const bottleneck = this.app.identifyBottleneck();
        if (bottleneck && bottleneck.process) {
            opportunities.push({
                id: 'bottleneck_01',
                type: 'bottleneck',
                priority: 'high',
                title: lang === 'ar' ? 'تحسين عملية الاختناق' : 'Bottleneck Process Improvement',
                description: lang === 'ar' ?
                    `عملية ${bottleneck.process.name} هي الاختناق الرئيسي (استخدام ${(bottleneck.utilization * 100).toFixed(1)}%)` :
                    `${bottleneck.process.name} is the primary bottleneck (${(bottleneck.utilization * 100).toFixed(1)}% utilization)`,
                impact: 'high',
                effort: 'medium',
                estimatedSavings: lang === 'ar' ? 'زيادة الإنتاجية بنسبة 15-25%' : '15-25% productivity increase',
                actions: this.generateBottleneckActions(bottleneck, lang)
            });
        }
        
        // 2. Inventory Reduction
        const inventoryAnalysis = this.analyzeInventory();
        if (inventoryAnalysis.hasExcess) {
            opportunities.push({
                id: 'inventory_01',
                type: 'inventory',
                priority: 'high',
                title: lang === 'ar' ? 'تقليل المخزون الزائد' : 'Excess Inventory Reduction',
                description: lang === 'ar' ?
                    `${inventoryAnalysis.excessUnits} وحدة مخزون زائدة (${inventoryAnalysis.excessPercentage}%)` :
                    `${inventoryAnalysis.excessUnits} units of excess inventory (${inventoryAnalysis.excessPercentage}%)`,
                impact: 'high',
                effort: 'low',
                estimatedSavings: lang === 'ar' ? 'تخفيض تكاليف التخزين بنسبة 20-30%' : '20-30% storage cost reduction',
                actions: this.generateInventoryActions(inventoryAnalysis, lang)
            });
        }
        
        // 3. Non-Value Added Activities
        const wasteAnalysis = this.analyzeWaste();
        if (wasteAnalysis.totalWasteTime > 0) {
            opportunities.push({
                id: 'waste_01',
                type: 'waste',
                priority: 'medium',
                title: lang === 'ar' ? 'إزالة الهدر' : 'Waste Elimination',
                description: lang === 'ar' ?
                    `${wasteAnalysis.nonVAProcesses} عملية غير ذات قيمة مضافة (${wasteAnalysis.totalWasteTime.toFixed(1)} دقيقة)` :
                    `${wasteAnalysis.nonVAProcesses} non-value added processes (${wasteAnalysis.totalWasteTime.toFixed(1)} minutes)`,
                impact: 'medium',
                effort: 'high',
                estimatedSavings: lang === 'ar' ? 'توفير وقت بنسبة 10-20%' : '10-20% time savings',
                actions: this.generateWasteActions(wasteAnalysis, lang)
            });
        }
        
        // 4. Quality Improvement
        const qualityAnalysis = this.analyzeQuality();
        if (qualityAnalysis.defectRate > 0.02) {
            opportunities.push({
                id: 'quality_01',
                type: 'quality',
                priority: 'medium',
                title: lang === 'ar' ? 'تحسين الجودة' : 'Quality Improvement',
                description: lang === 'ar' ?
                    `معدل العيوب ${(qualityAnalysis.defectRate * 100).toFixed(1)}% (${qualityAnalysis.defectCost} تكلفة)` :
                    `${(qualityAnalysis.defectRate * 100).toFixed(1)}% defect rate (${qualityAnalysis.defectCost} cost)`,
                impact: 'medium',
                effort: 'medium',
                estimatedSavings: lang === 'ar' ? 'تخفيض العيوب بنسبة 30-50%' : '30-50% defect reduction',
                actions: this.generateQualityActions(qualityAnalysis, lang)
            });
        }
        
        // 5. Flow Improvement
        const flowAnalysis = this.analyzeFlow();
        if (flowAnalysis.flowEfficiency < 0.3) {
            opportunities.push({
                id: 'flow_01',
                type: 'flow',
                priority: 'high',
                title: lang === 'ar' ? 'تحسين تدفق العمل' : 'Workflow Improvement',
                description: lang === 'ar' ?
                    `كفاءة التدفق ${(flowAnalysis.flowEfficiency * 100).toFixed(1)}% (منخفض)` :
                    `${(flowAnalysis.flowEfficiency * 100).toFixed(1)}% flow efficiency (low)`,
                impact: 'high',
                effort: 'high',
                estimatedSavings: lang === 'ar' ? 'تقليل وقت الإنتاج بنسبة 25-40%' : '25-40% lead time reduction',
                actions: this.generateFlowActions(flowAnalysis, lang)
            });
        }
        
        return opportunities.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }
    
    analyzeInventory() {
        const totalInventory = this.app.inventories.reduce((sum, inv) => sum + inv.quantity, 0) +
                             this.app.processes.reduce((sum, proc) => sum + proc.inventoryBefore, 0);
        
        const dailyDemand = this.app.dailyDemand || 100;
        const optimalInventory = dailyDemand * 1.5; // 1.5 days buffer
        
        const excessUnits = Math.max(0, totalInventory - optimalInventory);
        const excessPercentage = totalInventory > 0 ? (excessUnits / totalInventory) * 100 : 0;
        
        return {
            totalInventory,
            optimalInventory,
            excessUnits,
            excessPercentage: excessPercentage.toFixed(1),
            hasExcess: excessUnits > (dailyDemand * 0.5), // More than half day excess
            inventoryValue: this.calculateInventoryValue()
        };
    }
    
    calculateInventoryValue() {
        const avgCostPerUnit = 100; // Assume average cost
        const totalUnits = this.app.inventories.reduce((sum, inv) => sum + inv.quantity, 0) +
                          this.app.processes.reduce((sum, proc) => sum + proc.inventoryBefore, 0);
        
        return totalUnits * avgCostPerUnit;
    }
    
    generateInventoryActions(analysis, lang) {
        return lang === 'ar' ? [
            'تطبيق نظام JIT (التصنيع في الوقت المحدد)',
            'تقليل حجم الدفعات',
            'تحسين تخطيط الإنتاج',
            'تطبيق نظام Kanban للتحكم بالمخزون'
        ] : [
            'Implement JIT (Just-In-Time) system',
            'Reduce batch sizes',
            'Improve production planning',
            'Implement Kanban system for inventory control'
        ];
    }
    
    analyzeWaste() {
        const nonVAProcesses = this.app.processes.filter(p => p.type === 'process' && !p.valueAdded);
        const totalWasteTime = nonVAProcesses.reduce((sum, proc) => sum + proc.cycleTime, 0);
        const totalProcessTime = this.app.processes.reduce((sum, proc) => 
            proc.type === 'process' ? sum + proc.cycleTime : sum, 0);
        
        return {
            nonVAProcesses: nonVAProcesses.length,
            totalWasteTime,
            wastePercentage: totalProcessTime > 0 ? (totalWasteTime / totalProcessTime) * 100 : 0,
            processes: nonVAProcesses.map(p => ({
                name: p.name,
                cycleTime: p.cycleTime,
                type: p.processType
            }))
        };
    }
    
    generateWasteActions(analysis, lang) {
        return lang === 'ar' ? [
            'تحليل وتقييم كل عملية غير ذات قيمة مضافة',
            'دمج العمليات المتشابهة',
            'إعادة تصميم العمليات لتحويلها إلى قيمة مضافة',
            'التخلص من العمليات غير الضرورية'
        ] : [
            'Analyze and evaluate each non-value added process',
            'Combine similar processes',
            'Redesign processes to convert to value-added',
            'Eliminate unnecessary processes'
        ];
    }
    
    analyzeQuality() {
        const totalYield = this.app.processes.reduce((sum, proc) => 
            proc.type === 'process' ? sum + proc.yield : sum, 0);
        const processCount = this.app.processes.filter(p => p.type === 'process').length;
        
        const avgYield = processCount > 0 ? totalYield / processCount : 1;
        const defectRate = 1 - avgYield;
        
        const dailyDefects = this.app.dailyDemand * defectRate;
        const defectCost = dailyDefects * 50; // Assume $50 cost per defect
        
        return {
            avgYield: avgYield * 100,
            defectRate,
            dailyDefects: dailyDefects.toFixed(1),
            defectCost: `$${defectCost.toFixed(0)}/day`,
            qualityScore: this.calculateQualityScore(avgYield)
        };
    }
    
    calculateQualityScore(yield) {
        if (yield > 0.99) return 'excellent';
        if (yield > 0.97) return 'good';
        if (yield > 0.95) return 'fair';
        return 'poor';
    }
    
    generateQualityActions(analysis, lang) {
        return lang === 'ar' ? [
            'تطبيق نظام Poka-Yoke (منع الخطأ)',
            'تحسين ضبط الجودة في المصدر',
            'تدريب الموظفين على معايير الجودة',
            'تطبيق التحكم الإحصائي في العمليات (SPC)'
        ] : [
            'Implement Poka-Yoke (Error Proofing)',
            'Improve quality control at source',
            'Train employees on quality standards',
            'Implement Statistical Process Control (SPC)'
        ];
    }
    
    analyzeFlow() {
        const leadTimeCalc = new LeadTimeCalculator(this.app);
        const leadTimeData = leadTimeCalc.calculateTotalValueStreamLeadTime();
        
        const valueAddedTime = leadTimeData.valueAddedTime || 0;
        const totalLeadTime = leadTimeData.totalLeadTime || 1;
        
        const flowEfficiency = valueAddedTime / totalLeadTime;
        const waitTimePercentage = ((totalLeadTime - valueAddedTime) / totalLeadTime) * 100;
        
        return {
            flowEfficiency,
            waitTimePercentage: waitTimePercentage.toFixed(1),
            valueAddedTime,
            totalLeadTime,
            flowType: this.app.analyzeFlowType()
        };
    }
    
    generateFlowActions(analysis, lang) {
        return lang === 'ar' ? [
            'تحويل النظام من الدفع إلى السحب',
            'تقليل وقت الانتظار بين العمليات',
            'تحسين تخطيط تدفق المواد',
            'تطبيق نظام الخلايا التصنيعية'
        ] : [
            'Convert from push to pull system',
            'Reduce wait time between processes',
            'Improve material flow planning',
            'Implement manufacturing cells'
        ];
    }
    
    generateBottleneckActions(bottleneck, lang) {
        const actions = lang === 'ar' ? [
            'تقليل وقت الدورة عن طريق تحسين أساليب العمل',
            'إضافة موارد (ماكينات، مشغلين)',
            'تحسين صيانة المعدات لزيادة وقت التشغيل',
            'موازنة العمل مع العمليات الأخرى'
        ] : [
            'Reduce cycle time through work method improvement',
            'Add resources (machines, operators)',
            'Improve equipment maintenance to increase uptime',
            'Balance work with other processes'
        ];
        
        return actions;
    }
    
    calculateROI(improvement) {
        // Simplified ROI calculation
        const implementationCosts = {
            high: 50000,
            medium: 25000,
            low: 10000
        };
        
        const annualSavings = {
            high: 100000,
            medium: 50000,
            low: 20000
        };
        
        const cost = implementationCosts[improvement.effort] || 25000;
        const savings = annualSavings[improvement.impact] || 50000;
        
        const roi = ((savings - cost) / cost) * 100;
        const paybackMonths = (cost / (savings / 12));
        
        return {
            implementationCost: cost,
            annualSavings: savings,
            roi: roi.toFixed(1) + '%',
            paybackPeriod: paybackMonths.toFixed(1) + ' months',
            netBenefit: savings - cost
        };
    }
    
    createImprovementPlan(opportunities) {
        const plan = {
            id: Date.now(),
            createdDate: new Date().toISOString(),
            version: '1.0',
            opportunities: opportunities.map(opp => ({
                ...opp,
                roi: this.calculateROI(opp),
                timeline: this.estimateTimeline(opp),
                resources: this.estimateResources(opp)
            })),
            totalInvestment: 0,
            totalAnnualSavings: 0,
            overallROI: 0
        };
        
        // Calculate totals
        plan.totalInvestment = plan.opportunities.reduce((sum, opp) => 
            sum + opp.roi.implementationCost, 0);
        
        plan.totalAnnualSavings = plan.opportunities.reduce((sum, opp) => 
            sum + opp.roi.annualSavings, 0);
        
        plan.overallROI = plan.totalInvestment > 0 ? 
            ((plan.totalAnnualSavings - plan.totalInvestment) / plan.totalInvestment) * 100 : 0;
        
        return plan;
    }
    
    estimateTimeline(opportunity) {
        const timelines = {
            high: '2-4 months',
            medium: '1-3 months',
            low: '2-4 weeks'
        };
        
        return timelines[opportunity.effort] || '1-2 months';
    }
    
    estimateResources(opportunity) {
        const resources = {
            high: ['Process Engineer', 'Maintenance Team', 'Quality Engineer', 'Operations Manager'],
            medium: ['Process Engineer', 'Operations Supervisor'],
            low: ['Team Leader', 'Operators']
        };
        
        return resources[opportunity.effort] || ['Process Engineer'];
    }
    
    generateImprovementReport() {
        const opportunities = this.analyzeImprovementOpportunities();
        const improvementPlan = this.createImprovementPlan(opportunities.slice(0, 5)); // Top 5 opportunities
        const lang = this.app.currentLanguage;
        
        const report = {
            title: lang === 'ar' ? 'تقرير خطة التحسين' : 'Improvement Plan Report',
            date: new Date().toLocaleDateString(),
            executiveSummary: this.generateExecutiveSummary(improvementPlan, lang),
            opportunities: improvementPlan.opportunities,
            financialAnalysis: {
                totalInvestment: improvementPlan.totalInvestment,
                totalAnnualSavings: improvementPlan.totalAnnualSavings,
                overallROI: improvementPlan.overallROI.toFixed(1) + '%',
                paybackPeriod: this.calculateOverallPayback(improvementPlan)
            },
            implementationRoadmap: this.createRoadmap(improvementPlan.opportunities, lang),
            nextSteps: this.generateNextSteps(lang)
        };
        
        return report;
    }
    
    generateExecutiveSummary(plan, lang) {
        return lang === 'ar' ?
            `تحتوي خطة التحسين على ${plan.opportunities.length} فرصة تحسين رئيسية. 
             إجمالي الاستثمار المطلوب: $${plan.totalInvestment.toLocaleString()}. 
             إجمالي التوفير السنوي المتوقع: $${plan.totalAnnualSavings.toLocaleString()}. 
             العائد على الاستثمار: ${plan.overallROI.toFixed(1)}% خلال سنة واحدة.` :
            
            `The improvement plan contains ${plan.opportunities.length} key improvement opportunities.
             Total required investment: $${plan.totalInvestment.toLocaleString()}.
             Total expected annual savings: $${plan.totalAnnualSavings.toLocaleString()}.
             ROI: ${plan.overallROI.toFixed(1)}% within one year.`;
    }
    
    calculateOverallPayback(plan) {
        if (plan.totalAnnualSavings <= 0) return 'N/A';
        const months = (plan.totalInvestment / (plan.totalAnnualSavings / 12));
        return months.toFixed(1) + ' months';
    }
    
    createRoadmap(opportunities, lang) {
        const roadmap = {
            phase1: {
                title: lang === 'ar' ? 'المرحلة 1: تحسينات سريعة (أسابيع 1-8)' : 'Phase 1: Quick Wins (Weeks 1-8)',
                opportunities: opportunities.filter(opp => opp.effort === 'low')
            },
            phase2: {
                title: lang === 'ar' ? 'المرحلة 2: تحسينات متوسطة (أشهر 2-4)' : 'Phase 2: Medium-term (Months 2-4)',
                opportunities: opportunities.filter(opp => opp.effort === 'medium')
            },
            phase3: {
                title: lang === 'ar' ? 'المرحلة 3: تحسينات استراتيجية (أشهر 4-12)' : 'Phase 3: Strategic (Months 4-12)',
                opportunities: opportunities.filter(opp => opp.effort === 'high')
            }
        };
        
        return roadmap;
    }
    
    generateNextSteps(lang) {
        return lang === 'ar' ? [
            'تشكيل فريق التحسين',
            'تحديد أولويات التحسين',
            'تطوير خطط التنفيذ التفصيلية',
            'تحديد مؤشرات الأداء الرئيسية (KPIs)',
            'بدء المرحلة الأولى من التنفيذ'
        ] : [
            'Form improvement team',
            'Prioritize improvement opportunities',
            'Develop detailed implementation plans',
            'Define Key Performance Indicators (KPIs)',
            'Begin Phase 1 implementation'
        ];
    }
}