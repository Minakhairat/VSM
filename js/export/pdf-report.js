// Enhanced PDF Report Generator
class PDFReportGenerator {
    constructor(vsmApp) {
        this.app = vsmApp;
    }
    
    async generateFullReport() {
        if (typeof window.jspdf === 'undefined') {
            alert('PDF library not available. Please use print function instead.');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        try {
            // Set document properties
            doc.setProperties({
                title: 'Industrial VSM Analysis Report',
                subject: 'Value Stream Mapping Analysis',
                author: 'Industrial VSM Tool',
                keywords: 'vsm, lean, manufacturing, efficiency, analysis'
            });
            
            let yPosition = 20;
            
            // Title Page
            doc.setFontSize(24);
            doc.setTextColor(40);
            doc.text('INDUSTRIAL VSM ANALYSIS REPORT', 105, yPosition, { align: 'center' });
            yPosition += 10;
            
            doc.setFontSize(12);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, yPosition, { align: 'center' });
            yPosition += 20;
            
            // Company Information (placeholder)
            doc.setFontSize(11);
            doc.text('Company: ________________________', 20, yPosition);
            doc.text('Department: _____________________', 110, yPosition);
            yPosition += 10;
            
            doc.text('Analyst: ________________________', 20, yPosition);
            doc.text('Date Range: _____________________', 110, yPosition);
            yPosition += 20;
            
            // Executive Summary
            doc.setFontSize(16);
            doc.setTextColor(0, 102, 204);
            doc.text('1. EXECUTIVE SUMMARY', 20, yPosition);
            yPosition += 10;
            
            doc.setDrawColor(200);
            doc.line(20, yPosition, 190, yPosition);
            yPosition += 10;
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            
            const metrics = new LeanMetricsCalculator(this.app).calculateAllMetrics();
            const leadTimeCalc = new LeadTimeCalculator(this.app);
            const leadTimeData = leadTimeCalc.calculateTotalValueStreamLeadTime();
            
            // Key Metrics Table
            const summaryData = [
                ['Metric', 'Value', 'Target', 'Status'],
                ['Takt Time', `${this.app.taktTime.toFixed(2)} min/unit`, 'Customer Demand', ''],
                ['Total Lead Time', `${leadTimeData.totalLeadTime.toFixed(1)} min`, 'Minimize', ''],
                ['Process Cycle Efficiency', `${metrics.processCycleEfficiency.toFixed(1)}%`, '> 25%', 
                 this.evaluateStatus(metrics.processCycleEfficiency, 25)],
                ['Value Added Ratio', `${metrics.valueAddedRatio.toFixed(1)}%`, '> 30%', 
                 this.evaluateStatus(metrics.valueAddedRatio, 30)],
                ['OEE', `${metrics.overallEquipmentEffectiveness.toFixed(1)}%`, '> 85%', 
                 this.evaluateStatus(metrics.overallEquipmentEffectiveness, 85)],
                ['Inventory Turns', `${metrics.inventoryTurns.toFixed(1)}`, '> 12', 
                 this.evaluateStatus(metrics.inventoryTurns, 12)],
                ['Days of Inventory', `${metrics.daysOfInventory.toFixed(1)} days`, '< 15', 
                 this.evaluateStatus(15, metrics.daysOfInventory)] // Reverse comparison
            ];
            
            doc.autoTable({
                startY: yPosition,
                head: [summaryData[0]],
                body: summaryData.slice(1),
                theme: 'grid',
                headStyles: { fillColor: [0, 102, 204] },
                columnStyles: {
                    0: { cellWidth: 60 },
                    1: { cellWidth: 40 },
                    2: { cellWidth: 40 },
                    3: { cellWidth: 30 }
                }
            });
            
            yPosition = doc.lastAutoTable.finalY + 10;
            
            // Check for new page
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            
            // Process Details
            doc.setFontSize(16);
            doc.setTextColor(0, 102, 204);
            doc.text('2. PROCESS DETAILS', 20, yPosition);
            yPosition += 10;
            
            doc.setDrawColor(200);
            doc.line(20, yPosition, 190, yPosition);
            yPosition += 10;
            
            // Process Table
            const processData = this.app.processes.map((process, index) => {
                const leadTime = leadTimeCalc.calculateProcessLeadTime(process);
                const utilization = (process.cycleTime / this.app.taktTime * 100).toFixed(1);
                
                return [
                    index + 1,
                    process.name,
                    process.processType,
                    `${process.cycleTime} min`,
                    `${process.setupTime} min`,
                    process.operators,
                    `${(process.uptime * 100).toFixed(0)}%`,
                    `${utilization}%`,
                    process.valueAdded ? 'Yes' : 'No',
                    `${leadTime.totalLeadTime.toFixed(1)} min`
                ];
            });
            
            doc.autoTable({
                startY: yPosition,
                head: [['#', 'Process', 'Type', 'C/T', 'Setup', 'Ops', 'Uptime', 'Util%', 'VA', 'Lead Time']],
                body: processData,
                theme: 'grid',
                headStyles: { fillColor: [0, 102, 204] },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 35 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 20 },
                    4: { cellWidth: 20 },
                    5: { cellWidth: 15 },
                    6: { cellWidth: 20 },
                    7: { cellWidth: 20 },
                    8: { cellWidth: 15 },
                    9: { cellWidth: 25 }
                }
            });
            
            yPosition = doc.lastAutoTable.finalY + 10;
            
            // Check for new page
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            
            // Inventory Analysis
            doc.setFontSize(16);
            doc.setTextColor(0, 102, 204);
            doc.text('3. INVENTORY ANALYSIS', 20, yPosition);
            yPosition += 10;
            
            doc.setDrawColor(200);
            doc.line(20, yPosition, 190, yPosition);
            yPosition += 10;
            
            const inventoryData = this.app.inventories.map((inv, index) => {
                const waitTime = inv.calculateWaitTime(this.app.taktTime);
                const cost = inv.calculateInventoryCost();
                const daysOfSupply = inv.calculateDaysOfSupply(this.app.dailyDemand);
                
                return [
                    index + 1,
                    inv.name,
                    inv.inventoryType,
                    inv.quantity,
                    `${waitTime.toFixed(1)} min`,
                    `${daysOfSupply.toFixed(1)} days`,
                    cost > 0 ? `$${cost.toFixed(2)}` : 'N/A'
                ];
            });
            
            if (inventoryData.length > 0) {
                doc.autoTable({
                    startY: yPosition,
                    head: [['#', 'Inventory', 'Type', 'Qty', 'Wait Time', 'Days Supply', 'Cost']],
                    body: inventoryData,
                    theme: 'grid',
                    headStyles: { fillColor: [0, 102, 204] }
                });
                
                yPosition = doc.lastAutoTable.finalY + 10;
            } else {
                doc.setFontSize(11);
                doc.text('No inventory data available', 20, yPosition);
                yPosition += 10;
            }
            
            // Check for new page
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            
            // Improvement Opportunities
            doc.setFontSize(16);
            doc.setTextColor(0, 102, 204);
            doc.text('4. IMPROVEMENT OPPORTUNITIES', 20, yPosition);
            yPosition += 10;
            
            doc.setDrawColor(200);
            doc.line(20, yPosition, 190, yPosition);
            yPosition += 10;
            
            const suggestions = this.app.generateImprovementSuggestions();
            
            if (suggestions.length > 0) {
                doc.setFontSize(11);
                
                suggestions.forEach((suggestion, index) => {
                    if (yPosition > 250) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    
                    // Priority indicator
                    const priorityColor = suggestion.type === 'high' ? [255, 0, 0] : 
                                         suggestion.type === 'medium' ? [255, 165, 0] : [0, 128, 0];
                    
                    doc.setFillColor(...priorityColor);
                    doc.rect(20, yPosition - 5, 5, 5, 'F');
                    
                    doc.text(`${index + 1}. ${suggestion.message}`, 30, yPosition);
                    yPosition += 8;
                });
            }
            
            // Check for new page
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
            
            // Action Plan
            doc.setFontSize(16);
            doc.setTextColor(0, 102, 204);
            doc.text('5. RECOMMENDED ACTION PLAN', 20, yPosition);
            yPosition += 10;
            
            doc.setDrawColor(200);
            doc.line(20, yPosition, 190, yPosition);
            yPosition += 15;
            
            // Action plan table
            const actionPlan = this.generateActionPlan();
            
            doc.autoTable({
                startY: yPosition,
                head: [['Priority', 'Action', 'Responsible', 'Timeline', 'Expected Impact']],
                body: actionPlan,
                theme: 'grid',
                headStyles: { fillColor: [0, 102, 204] }
            });
            
            // Save the PDF
            const fileName = `vsm-report-${new Date().getTime()}.pdf`;
            doc.save(fileName);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF report. Please try again.');
        }
    }
    
    evaluateStatus(value, target) {
        if (value >= target * 1.1) return 'Excellent';
        if (value >= target) return 'Good';
        if (value >= target * 0.8) return 'Fair';
        return 'Poor';
    }
    
    generateActionPlan() {
        const bottleneck = this.app.identifyBottleneck();
        const flowAnalysis = this.app.analyzeFlowType();
        const metrics = new LeanMetricsCalculator(this.app).calculateAllMetrics();
        
        const actions = [];
        
        // Bottleneck improvement
        if (bottleneck.process && bottleneck.utilization > 1) {
            actions.push([
                'High',
                `Reduce cycle time of ${bottleneck.process.name}`,
                'Process Engineer',
                '2-4 weeks',
                'Increase throughput by 15-25%'
            ]);
        }
        
        // Inventory reduction
        if (metrics.daysOfInventory > 30) {
            actions.push([
                'High',
                'Implement inventory reduction program',
                'Supply Chain Manager',
                '1-3 months',
                'Reduce inventory costs by 20-30%'
            ]);
        }
        
        // Process efficiency
        if (metrics.processCycleEfficiency < 10) {
            actions.push([
                'Medium',
                'Implement value stream analysis and waste elimination',
                'Lean Team',
                '3-6 months',
                'Improve efficiency by 10-15%'
            ]);
        }
        
        // Quality improvement
        if (metrics.firstTimeThrough < 90) {
            actions.push([
                'Medium',
                'Implement quality improvement initiatives',
                'Quality Manager',
                '2-4 months',
                'Reduce defects by 30-50%'
            ]);
        }
        
        // System transformation
        if (flowAnalysis.type === 'PUSH') {
            actions.push([
                'Low',
                'Transition from Push to Pull system',
                'Production Manager',
                '6-12 months',
                'Reduce lead time by 30-40%'
            ]);
        }
        
        return actions;
    }
    
    async generateVSMChart() {
        // Create a visual VSM chart using html2canvas
        const canvasElement = document.getElementById('vsmCanvas');
        
        if (!canvasElement) return null;
        
        try {
            const canvas = await html2canvas(canvasElement, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false
            });
            
            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Error generating VSM chart:', error);
            return null;
        }
    }
}
