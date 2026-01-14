// HTML Report Generator with Arabic Support
class HTMLReportGenerator {
    constructor(vsmApp) {
        this.app = vsmApp;
    }
    
    generateComprehensiveReport() {
        const lang = this.app.currentLanguage;
        const timestamp = new Date().toLocaleString();
        
        // Calculate metrics
        const leanMetrics = new LeanMetricsCalculator(this.app).calculateAllMetrics();
        const leadTimeCalc = new LeadTimeCalculator(this.app);
        const leadTimeData = leadTimeCalc.calculateTotalValueStreamLeadTime();
        const bottleneck = this.app.identifyBottleneck();
        const improvementAnalyzer = new ImprovementAnalyzer(this.app);
        const opportunities = improvementAnalyzer.analyzeImprovementOpportunities();
        
        const reportHTML = `
<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${lang === 'ar' ? 'تقرير تحليل تدفق القيمة' : 'Value Stream Analysis Report'}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        
        .report-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            padding: 30px;
            margin-bottom: 30px;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #2c3e50;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 28px;
        }
        
        .header .subtitle {
            color: #7f8c8d;
            font-size: 16px;
            margin-top: 10px;
        }
        
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .section-title {
            color: #3498db;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 20px;
            font-size: 20px;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .metric-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            border-left: 4px solid #3498db;
        }
        
        .metric-card.highlight {
            background: #e3f2fd;
            border-left-color: #2196f3;
        }
        
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin: 10px 0;
        }
        
        .metric-label {
            font-size: 14px;
            color: #666;
        }
        
        .metric-status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin-top: 8px;
        }
        
        .status-good {
            background: #d4edda;
            color: #155724;
        }
        
        .status-warning {
            background: #fff3cd;
            color: #856404;
        }
        
        .status-critical {
            background: #f8d7da;
            color: #721c24;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .table th {
            background: #3498db;
            color: white;
            padding: 12px;
            text-align: ${lang === 'ar' ? 'right' : 'left'};
        }
        
        .table td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        
        .table tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .table tr:hover {
            background: #e3f2fd;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .badge-high {
            background: #e74c3c;
            color: white;
        }
        
        .badge-medium {
            background: #f39c12;
            color: white;
        }
        
        .badge-low {
            background: #27ae60;
            color: white;
        }
        
        .timeline-visual {
            height: 60px;
            background: #f8f9fa;
            border-radius: 8px;
            margin: 20px 0;
            position: relative;
            overflow: hidden;
        }
        
        .timeline-segment {
            height: 100%;
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            transition: all 0.3s;
        }
        
        .recommendation-card {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            border-left: 4px solid #3498db;
        }
        
        .recommendation-card.high {
            border-left-color: #e74c3c;
        }
        
        .recommendation-card.medium {
            border-left-color: #f39c12;
        }
        
        .recommendation-card.low {
            border-left-color: #27ae60;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            text-align: center;
            color: #7f8c8d;
            font-size: 14px;
        }
        
        @media print {
            body {
                background: white;
            }
            
            .report-container {
                box-shadow: none;
                padding: 0;
            }
            
            .no-print {
                display: none;
            }
            
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="header">
            <h1>${lang === 'ar' ? 'تقرير تحليل تدفق القيمة' : 'Value Stream Analysis Report'}</h1>
            <div class="subtitle">
                ${lang === 'ar' ? 'تاريخ التقرير:' : 'Report Date:'} ${timestamp} | 
                ${lang === 'ar' ? 'عدد العمليات:' : 'Processes:'} ${this.app.processes.length} | 
                ${lang === 'ar' ? 'وقت التاكت:' : 'Takt Time:'} ${this.app.taktTime.toFixed(2)} ${lang === 'ar' ? 'دقيقة/وحدة' : 'min/unit'}
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">${lang === 'ar' ? 'الملخص التنفيذي' : 'Executive Summary'}</h2>
            <div class="metrics-grid">
                <div class="metric-card highlight">
                    <div class="metric-label">${lang === 'ar' ? 'إجمالي وقت الإنتاج' : 'Total Lead Time'}</div>
                    <div class="metric-value">${leadTimeData.totalLeadTime.toFixed(1)} ${lang === 'ar' ? 'دقيقة' : 'min'}</div>
                    <div class="metric-status ${this.getStatusClass(leadTimeData.totalLeadTime, 600)}">
                        ${this.getStatusText(leadTimeData.totalLeadTime, 600, lang)}
                    </div>
                </div>
                
                <div class="metric-card highlight">
                    <div class="metric-label">${lang === 'ar' ? 'كفاءة دورة العملية' : 'Process Cycle Efficiency'}</div>
                    <div class="metric-value">${leanMetrics.processCycleEfficiency.toFixed(1)}%</div>
                    <div class="metric-status ${this.getStatusClass(leanMetrics.processCycleEfficiency, 25)}">
                        ${this.getStatusText(leanMetrics.processCycleEfficiency, 25, lang)}
                    </div>
                </div>
                
                <div class="metric-card highlight">
                    <div class="metric-label">${lang === 'ar' ? 'نسبة القيمة المضافة' : 'Value Added Ratio'}</div>
                    <div class="metric-value">${leanMetrics.valueAddedRatio.toFixed(1)}%</div>
                    <div class="metric-status ${this.getStatusClass(leanMetrics.valueAddedRatio, 30)}">
                        ${this.getStatusText(leanMetrics.valueAddedRatio, 30, lang)}
                    </div>
                </div>
                
                <div class="metric-card highlight">
                    <div class="metric-label">${lang === 'ar' ? 'معدل الدوران' : 'Inventory Turns'}</div>
                    <div class="metric-value">${leanMetrics.inventoryTurns.toFixed(1)}</div>
                    <div class="metric-status ${this.getStatusClass(leanMetrics.inventoryTurns, 12, true)}">
                        ${this.getStatusText(leanMetrics.inventoryTurns, 12, lang, true)}
                    </div>
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h3 style="margin-top: 0;">${lang === 'ar' ? 'النقاط الرئيسية' : 'Key Insights'}</h3>
                <ul style="margin-bottom: 0;">
                    <li>${lang === 'ar' ? 'عملية الاختناق:' : 'Bottleneck Process:'} ${bottleneck && bottleneck.process ? bottleneck.process.name : lang === 'ar' ? 'لا يوجد' : 'None'}</li>
                    <li>${lang === 'ar' ? 'فرص التحسين:' : 'Improvement Opportunities:'} ${opportunities.length}</li>
                    <li>${lang === 'ar' ? 'إجمالي المخزون:' : 'Total Inventory:'} ${this.app.inventories.reduce((sum, inv) => sum + inv.quantity, 0)} ${lang === 'ar' ? 'وحدة' : 'units'}</li>
                    <li>${lang === 'ar' ? 'عدد المشغلين:' : 'Total Operators:'} ${this.app.processes.reduce((sum, proc) => sum + proc.operators, 0)}</li>
                </ul>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">${lang === 'ar' ? 'تفاصيل العمليات' : 'Process Details'}</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>${lang === 'ar' ? 'اسم العملية' : 'Process Name'}</th>
                        <th>${lang === 'ar' ? 'نوع العملية' : 'Type'}</th>
                        <th>${lang === 'ar' ? 'زمن الدورة' : 'Cycle Time'}</th>
                        <th>${lang === 'ar' ? 'المشغلون' : 'Operators'}</th>
                        <th>${lang === 'ar' ? 'وقت التشغيل' : 'Uptime'}</th>
                        <th>${lang === 'ar' ? 'المردود' : 'Yield'}</th>
                        <th>${lang === 'ar' ? 'قيمة مضافة' : 'Value Added'}</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.app.processes.map((process, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${process.name}</td>
                            <td>${this.translateProcessType(process.processType, lang)}</td>
                            <td>${process.cycleTime} ${lang === 'ar' ? 'دقيقة' : 'min'}</td>
                            <td>${process.operators}</td>
                            <td>${(process.uptime * 100).toFixed(0)}%</td>
                            <td>${(process.yield * 100).toFixed(0)}%</td>
                            <td>${process.valueAdded ? (lang === 'ar' ? 'نعم' : 'Yes') : (lang === 'ar' ? 'لا' : 'No')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        ${this.generateBottleneckSection(bottleneck, lang)}
        
        <div class="section">
            <h2 class="section-title">${lang === 'ar' ? 'فرص التحسين' : 'Improvement Opportunities'}</h2>
            ${opportunities.length > 0 ? opportunities.map(opp => `
                <div class="recommendation-card ${opp.priority}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3 style="margin: 0;">${opp.title}</h3>
                        <span class="badge badge-${opp.priority}">${this.translatePriority(opp.priority, lang)}</span>
                    </div>
                    <p>${opp.description}</p>
                    <div style="display: flex; gap: 20px; margin-top: 10px; font-size: 14px;">
                        <span><strong>${lang === 'ar' ? 'التأثير:' : 'Impact:'}</strong> ${this.translateImpact(opp.impact, lang)}</span>
                        <span><strong>${lang === 'ar' ? 'الجهد:' : 'Effort:'}</strong> ${this.translateEffort(opp.effort, lang)}</span>
                        <span><strong>${lang === 'ar' ? 'التوفير المتوقع:' : 'Estimated Savings:'}</strong> ${opp.estimatedSavings}</span>
                    </div>
                    ${opp.actions && opp.actions.length > 0 ? `
                        <div style="margin-top: 10px;">
                            <strong>${lang === 'ar' ? 'الإجراءات المقترحة:' : 'Recommended Actions:'}</strong>
                            <ul style="margin: 5px 0 0 20px;">
                                ${opp.actions.map(action => `<li>${action}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `).join('') : `
                <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                    <i style="font-size: 48px; margin-bottom: 20px;">📊</i>
                    <h3>${lang === 'ar' ? 'لا توجد فرص تحسين حالية' : 'No current improvement opportunities'}</h3>
                    <p>${lang === 'ar' ? 'جميع العمليات تعمل ضمن المستويات المستهدفة' : 'All processes are operating within target levels'}</p>
                </div>
            `}
        </div>
        
        <div class="section">
            <h2 class="section-title">${lang === 'ar' ? 'الخطة التنفيذية' : 'Implementation Plan'}</h2>
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px;">
                <h3 style="margin-top: 0;">${lang === 'ar' ? 'الخطوات التالية' : 'Next Steps'}</h3>
                <ol>
                    <li>${lang === 'ar' ? 'تحديد أولويات فرص التحسين بناءً على التأثير والجهد' : 'Prioritize improvement opportunities based on impact and effort'}</li>
                    <li>${lang === 'ar' ? 'تشكيل فريق التحسين وتحديد المسؤوليات' : 'Form improvement team and define responsibilities'}</li>
                    <li>${lang === 'ar' ? 'تطوير خطط تنفيذ مفصلة لكل فرصة' : 'Develop detailed implementation plans for each opportunity'}</li>
                    <li>${lang === 'ar' ? 'تحديد مؤشرات الأداء الرئيسية (KPIs) للقياس' : 'Define Key Performance Indicators (KPIs) for measurement'}</li>
                    <li>${lang === 'ar' ? 'بدء التنفيذ مع متابعة مستمرة' : 'Begin implementation with continuous monitoring'}</li>
                </ol>
            </div>
        </div>
        
        <div class="footer">
            <p>${lang === 'ar' ? 'تم إنشاء هذا التقرير بواسطة أداة خرائط تدفق القيمة الصناعية' : 'Generated by Industrial VSM Tool'}</p>
            <p>${lang === 'ar' ? 'للاستفسارات أو الدعم الفني، يرجى التواصل مع فريق الدعم' : 'For inquiries or technical support, please contact the support team'}</p>
            <p style="font-size: 12px; margin-top: 10px;">${lang === 'ar' ? 'ملاحظة: البيانات الواردة في هذا التقرير هي للتحليل المرجعي وقد تتغير مع الوقت' : 'Note: Data in this report is for reference analysis and may change over time'}</p>
        </div>
    </div>
    
    <div class="no-print" style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px;">
            ${lang === 'ar' ? 'طباعة التقرير' : 'Print Report'}
        </button>
    </div>
    
    <script>
        // Add timeline visualization
        document.addEventListener('DOMContentLoaded', function() {
            createTimelineVisualization();
        });
        
        function createTimelineVisualization() {
            const timelineData = ${JSON.stringify(this.createTimelineData())};
            const container = document.createElement('div');
            container.className = 'timeline-visual';
            
            timelineData.forEach(segment => {
                const segmentEl = document.createElement('div');
                segmentEl.className = 'timeline-segment';
                segmentEl.style.left = segment.left + '%';
                segmentEl.style.width = segment.width + '%';
                segmentEl.style.background = segment.color;
                segmentEl.title = segment.tooltip;
                segmentEl.textContent = segment.label;
                container.appendChild(segmentEl);
            });
            
            // Insert after the metrics section
            const metricsSection = document.querySelector('.metrics-grid');
            if (metricsSection) {
                metricsSection.parentNode.insertBefore(container, metricsSection.nextSibling);
            }
        }
    </script>
</body>
</html>`;

        return reportHTML;
    }
    
    getStatusClass(value, threshold, higherIsBetter = false) {
        if (higherIsBetter) {
            if (value >= threshold * 1.1) return 'status-good';
            if (value >= threshold) return 'status-good';
            if (value >= threshold * 0.8) return 'status-warning';
            return 'status-critical';
        } else {
            if (value <= threshold * 0.7) return 'status-good';
            if (value <= threshold) return 'status-good';
            if (value <= threshold * 1.3) return 'status-warning';
            return 'status-critical';
        }
    }
    
    getStatusText(value, threshold, lang, higherIsBetter = false) {
        if (higherIsBetter) {
            if (value >= threshold * 1.1) return lang === 'ar' ? 'ممتاز' : 'Excellent';
            if (value >= threshold) return lang === 'ar' ? 'جيد' : 'Good';
            if (value >= threshold * 0.8) return lang === 'ar' ? 'مقبول' : 'Fair';
            return lang === 'ar' ? 'يتطلب تحسين' : 'Needs Improvement';
        } else {
            if (value <= threshold * 0.7) return lang === 'ar' ? 'ممتاز' : 'Excellent';
            if (value <= threshold) return lang === 'ar' ? 'جيد' : 'Good';
            if (value <= threshold * 1.3) return lang === 'ar' ? 'مقبول' : 'Fair';
            return lang === 'ar' ? 'يتطلب تحسين' : 'Needs Improvement';
        }
    }
    
    translateProcessType(type, lang) {
        const translations = {
            'manufacturing': { en: 'Manufacturing', ar: 'تصنيع' },
            'assembly': { en: 'Assembly', ar: 'تجميع' },
            'inspection': { en: 'Inspection', ar: 'فحص' },
            'testing': { en: 'Testing', ar: 'اختبار' },
            'packaging': { en: 'Packaging', ar: 'تغليف' },
            'shipping': { en: 'Shipping', ar: 'شحن' }
        };
        
        return translations[type] ? translations[type][lang] : type;
    }
    
    translatePriority(priority, lang) {
        const translations = {
            'high': { en: 'High', ar: 'عالي' },
            'medium': { en: 'Medium', ar: 'متوسط' },
            'low': { en: 'Low', ar: 'منخفض' }
        };
        
        return translations[priority] ? translations[priority][lang] : priority;
    }
    
    translateImpact(impact, lang) {
        const translations = {
            'high': { en: 'High', ar: 'عالي' },
            'medium': { en: 'Medium', ar: 'متوسط' },
            'low': { en: 'Low', ar: 'منخفض' }
        };
        
        return translations[impact] ? translations[impact][lang] : impact;
    }
    
    translateEffort(effort, lang) {
        const translations = {
            'high': { en: 'High', ar: 'عالي' },
            'medium': { en: 'Medium', ar: 'متوسط' },
            'low': { en: 'Low', ar: 'منخفض' }
        };
        
        return translations[effort] ? translations[effort][lang] : effort;
    }
    
    generateBottleneckSection(bottleneck, lang) {
        if (!bottleneck || !bottleneck.process) {
            return '';
        }
        
        return `
        <div class="section">
            <h2 class="section-title">${lang === 'ar' ? 'تحليل الاختناقات' : 'Bottleneck Analysis'}</h2>
            <div style="background: #fff3cd; border: 2px solid #f39c12; border-radius: 8px; padding: 20px;">
                <h3 style="margin-top: 0; color: #d35400;">
                    ${lang === 'ar' ? 'عملية الاختناق الرئيسية' : 'Primary Bottleneck Process'}
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <strong>${lang === 'ar' ? 'اسم العملية:' : 'Process Name:'}</strong>
                        <div>${bottleneck.process.name}</div>
                    </div>
                    <div>
                        <strong>${lang === 'ar' ? 'معدل الاستخدام:' : 'Utilization Rate:'}</strong>
                        <div>${(bottleneck.utilization * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                        <strong>${lang === 'ar' ? 'زمن الدورة:' : 'Cycle Time:'}</strong>
                        <div>${bottleneck.process.cycleTime} ${lang === 'ar' ? 'دقيقة' : 'min'}</div>
                    </div>
                    <div>
                        <strong>${lang === 'ar' ? 'وقت التاكت:' : 'Takt Time:'}</strong>
                        <div>${this.app.taktTime.toFixed(2)} ${lang === 'ar' ? 'دقيقة' : 'min'}</div>
                    </div>
                </div>
                
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f39c12;">
                    <h4 style="margin-top: 0;">${lang === 'ar' ? 'التوصيات' : 'Recommendations'}</h4>
                    <ul>
                        <li>${lang === 'ar' ? 'تقليل وقت الدورة بنسبة 15-20%' : 'Reduce cycle time by 15-20%'}</li>
                        <li>${lang === 'ar' ? 'تحسين وقت التشغيل للمعدات' : 'Improve equipment uptime'}</li>
                        <li>${lang === 'ar' ? 'إضافة موارد إضافية إذا لزم الأمر' : 'Add additional resources if necessary'}</li>
                        <li>${lang === 'ar' ? 'تحسين أساليب العمل' : 'Improve work methods'}</li>
                    </ul>
                </div>
            </div>
        </div>`;
    }
    
    createTimelineData() {
        const timeline = [];
        let totalTime = 0;
        
        // Calculate process times
        this.app.processes.forEach((process, index) => {
            if (process.type === 'process') {
                const leadTime = this.app.calculateProcessLeadTime(process);
                totalTime += leadTime;
            }
        });
        
        // Add inventory times
        this.app.inventories.forEach(inventory => {
            totalTime += inventory.calculateWaitTime(this.app.taktTime);
        });
        
        // Create segments
        let cumulativeTime = 0;
        
        this.app.processes.forEach((process, index) => {
            if (process.type === 'process') {
                const leadTime = this.app.calculateProcessLeadTime(process);
                const width = (leadTime / totalTime) * 100;
                const left = (cumulativeTime / totalTime) * 100;
                
                timeline.push({
                    label: (index + 1).toString(),
                    width: width,
                    left: left,
                    color: process.valueAdded ? '#27ae60' : '#e74c3c',
                    tooltip: `${process.name}: ${leadTime.toFixed(1)} min`
                });
                
                cumulativeTime += leadTime;
            }
        });
        
        return timeline;
    }
    
    exportAsHTML() {
        const html = this.generateComprehensiveReport();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const fileName = `vsm-report-${new Date().getTime()}.html`;
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        
        URL.revokeObjectURL(url);
        
        return fileName;
    }
    
    printReport() {
        const html = this.generateComprehensiveReport();
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }
}