// Timeline Visualization Module
class TimelineView {
    constructor(vsmApp) {
        this.app = vsmApp;
        this.chart = null;
        this.init();
    }
    
    init() {
        this.createChart();
        this.updateTimeline();
    }
    
    createChart() {
        const canvas = document.getElementById('timeChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }
        
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: this.app.currentLanguage === 'ar' ? 'وقت القيمة المضافة' : 'Value Added Time',
                        data: [],
                        backgroundColor: '#27ae60',
                        borderColor: '#27ae60',
                        borderWidth: 1
                    },
                    {
                        label: this.app.currentLanguage === 'ar' ? 'وقت المعالجة' : 'Processing Time',
                        data: [],
                        backgroundColor: '#3498db',
                        borderColor: '#3498db',
                        borderWidth: 1
                    },
                    {
                        label: this.app.currentLanguage === 'ar' ? 'وقت الانتظار' : 'Waiting Time',
                        data: [],
                        backgroundColor: '#e74c3c',
                        borderColor: '#e74c3c',
                        borderWidth: 1
                    },
                    {
                        label: this.app.currentLanguage === 'ar' ? 'وقت الإعداد' : 'Setup Time',
                        data: [],
                        backgroundColor: '#f39c12',
                        borderColor: '#f39c12',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: this.app.currentLanguage === 'ar' ? 'العمليات' : 'Processes'
                        }
                    },
                    y: {
                        stacked: true,
                        title: {
                            display: true,
                            text: this.app.currentLanguage === 'ar' ? 'الوقت (دقيقة)' : 'Time (minutes)'
                        },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value.toFixed(2)} ${this.app.currentLanguage === 'ar' ? 'دقيقة' : 'min'}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    updateTimeline() {
        if (!this.chart || this.app.processes.length === 0) return;
        
        const labels = [];
        const vaData = [];
        const processingData = [];
        const waitingData = [];
        const setupData = [];
        
        this.app.processes.forEach((process, index) => {
            if (process.type === 'process') {
                labels.push(`${index + 1}. ${process.name}`);
                
                // Value Added Time
                const vaTime = process.valueAdded ? process.cycleTime : 0;
                vaData.push(vaTime);
                
                // Processing Time
                processingData.push(process.cycleTime);
                
                // Waiting Time
                const waitTime = process.inventoryBefore * this.app.taktTime;
                waitingData.push(waitTime);
                
                // Setup Time per unit
                const setupPerUnit = process.setupTime / (process.batchSize || 1);
                setupData.push(setupPerUnit);
            }
        });
        
        // Update chart data
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = vaData;
        this.chart.data.datasets[1].data = processingData;
        this.chart.data.datasets[2].data = waitingData;
        this.chart.data.datasets[3].data = setupData;
        
        // Update labels for language
        this.updateChartLabels();
        
        this.chart.update();
    }
    
    updateChartLabels() {
        const lang = this.app.currentLanguage;
        
        if (this.chart && this.chart.data.datasets) {
            this.chart.data.datasets[0].label = lang === 'ar' ? 'وقت القيمة المضافة' : 'Value Added Time';
            this.chart.data.datasets[1].label = lang === 'ar' ? 'وقت المعالجة' : 'Processing Time';
            this.chart.data.datasets[2].label = lang === 'ar' ? 'وقت الانتظار' : 'Waiting Time';
            this.chart.data.datasets[3].label = lang === 'ar' ? 'وقت الإعداد' : 'Setup Time';
            
            this.chart.options.scales.x.title.text = lang === 'ar' ? 'العمليات' : 'Processes';
            this.chart.options.scales.y.title.text = lang === 'ar' ? 'الوقت (دقيقة)' : 'Time (minutes)';
        }
    }
    
    createLeadTimeTimeline() {
        if (!this.app.processes.length) return null;
        
        const timeline = {
            totalTime: 0,
            valueAddedTime: 0,
            nonValueAddedTime: 0,
            segments: []
        };
        
        let cumulativeTime = 0;
        
        this.app.processes.forEach((process, index) => {
            if (process.type === 'process') {
                // Calculate process lead time
                const leadTime = this.app.calculateProcessLeadTime(process);
                
                // Create segment
                const segment = {
                    process: process.name,
                    sequence: index + 1,
                    startTime: cumulativeTime,
                    endTime: cumulativeTime + leadTime,
                    duration: leadTime,
                    valueAdded: process.valueAdded,
                    breakdown: {
                        processing: process.cycleTime,
                        waiting: process.inventoryBefore * this.app.taktTime,
                        setup: process.setupTime / (process.batchSize || 1),
                        move: 5 // Assumed
                    }
                };
                
                timeline.segments.push(segment);
                cumulativeTime += leadTime;
                
                // Add to totals
                timeline.totalTime += leadTime;
                if (process.valueAdded) {
                    timeline.valueAddedTime += process.cycleTime;
                } else {
                    timeline.nonValueAddedTime += process.cycleTime;
                }
            }
        });
        
        // Add inventory segments
        this.app.inventories.forEach((inventory, index) => {
            const waitTime = inventory.calculateWaitTime(this.app.taktTime);
            
            const segment = {
                inventory: inventory.name,
                sequence: `I${index + 1}`,
                startTime: cumulativeTime,
                endTime: cumulativeTime + waitTime,
                duration: waitTime,
                valueAdded: false,
                type: 'inventory'
            };
            
            timeline.segments.push(segment);
            cumulativeTime += waitTime;
            timeline.totalTime += waitTime;
            timeline.nonValueAddedTime += waitTime;
        });
        
        timeline.efficiency = timeline.totalTime > 0 ? 
            (timeline.valueAddedTime / timeline.totalTime) * 100 : 0;
        
        return timeline;
    }
    
    renderTimelineVisualization() {
        const timeline = this.createLeadTimeTimeline();
        if (!timeline) return;
        
        const container = document.createElement('div');
        container.className = 'timeline-visual-container';
        container.style.cssText = `
            margin-top: 20px;
            padding: 20px;
            background: white;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
        `;
        
        // Create timeline header
        const header = document.createElement('div');
        header.className = 'timeline-header';
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--border-color);
        `;
        
        const title = document.createElement('h3');
        title.textContent = this.app.currentLanguage === 'ar' ? 'الخط الزمني للإنتاج' : 'Production Timeline';
        title.style.margin = '0';
        
        const summary = document.createElement('div');
        summary.className = 'timeline-summary';
        summary.innerHTML = `
            <div style="display: flex; gap: 20px;">
                <div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">
                        ${this.app.currentLanguage === 'ar' ? 'إجمالي الوقت' : 'Total Time'}
                    </div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">
                        ${timeline.totalTime.toFixed(1)} ${this.app.currentLanguage === 'ar' ? 'دقيقة' : 'min'}
                    </div>
                </div>
                <div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">
                        ${this.app.currentLanguage === 'ar' ? 'الكفاءة' : 'Efficiency'}
                    </div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--accent-color);">
                        ${timeline.efficiency.toFixed(1)}%
                    </div>
                </div>
            </div>
        `;
        
        header.appendChild(title);
        header.appendChild(summary);
        container.appendChild(header);
        
        // Create timeline visualization
        const visualization = document.createElement('div');
        visualization.className = 'timeline-bars';
        visualization.style.cssText = `
            position: relative;
            height: 100px;
            margin-top: 20px;
        `;
        
        timeline.segments.forEach(segment => {
            const widthPercent = (segment.duration / timeline.totalTime) * 100;
            const leftPercent = (segment.startTime / timeline.totalTime) * 100;
            
            const bar = document.createElement('div');
            bar.className = 'timeline-segment';
            bar.style.cssText = `
                position: absolute;
                left: ${leftPercent}%;
                width: ${widthPercent}%;
                height: 40px;
                background: ${segment.valueAdded ? '#27ae60' : '#e74c3c'};
                border-radius: 4px;
                transition: all 0.3s ease;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 0.8rem;
                overflow: hidden;
            `;
            
            bar.title = `${segment.process || segment.inventory}: ${segment.duration.toFixed(1)} min`;
            bar.textContent = segment.sequence;
            
            bar.addEventListener('mouseenter', () => {
                bar.style.transform = 'scaleY(1.2)';
                bar.style.zIndex = '10';
                this.showSegmentTooltip(bar, segment);
            });
            
            bar.addEventListener('mouseleave', () => {
                bar.style.transform = 'scaleY(1)';
                bar.style.zIndex = '1';
                this.hideSegmentTooltip();
            });
            
            visualization.appendChild(bar);
        });
        
        // Add time scale
        const scale = document.createElement('div');
        scale.className = 'timeline-scale';
        scale.style.cssText = `
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid var(--border-color);
            font-size: 0.8rem;
            color: var(--text-secondary);
        `;
        
        // Add scale markers every 20%
        for (let i = 0; i <= 5; i++) {
            const marker = document.createElement('div');
            const time = (timeline.totalTime * i / 5).toFixed(0);
            marker.textContent = `${time} ${this.app.currentLanguage === 'ar' ? 'دقيقة' : 'min'}`;
            scale.appendChild(marker);
        }
        
        container.appendChild(visualization);
        container.appendChild(scale);
        
        return container;
    }
    
    showSegmentTooltip(element, segment) {
        const tooltip = document.createElement('div');
        tooltip.className = 'segment-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 10px;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            min-width: 200px;
            font-size: 0.9rem;
        `;
        
        const lang = this.app.currentLanguage;
        tooltip.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">
                ${segment.process || segment.inventory}
            </div>
            <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                <span>${lang === 'ar' ? 'المدة' : 'Duration'}:</span>
                <span>${segment.duration.toFixed(1)} ${lang === 'ar' ? 'دقيقة' : 'min'}</span>
            </div>
            ${segment.valueAdded !== undefined ? `
                <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                    <span>${lang === 'ar' ? 'قيمة مضافة' : 'Value Added'}:</span>
                    <span>${segment.valueAdded ? (lang === 'ar' ? 'نعم' : 'Yes') : (lang === 'ar' ? 'لا' : 'No')}</span>
                </div>
            ` : ''}
            ${segment.breakdown ? `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color);">
                    <div style="font-weight: 500; margin-bottom: 3px;">${lang === 'ar' ? 'التفصيل' : 'Breakdown'}:</div>
                    ${Object.entries(segment.breakdown).map(([key, value]) => `
                        <div style="display: flex; justify-content: space-between; margin: 2px 0;">
                            <span>${this.translateBreakdownKey(key, lang)}:</span>
                            <span>${value.toFixed(1)} ${lang === 'ar' ? 'دقيقة' : 'min'}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
        
        // Position tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
        tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
        
        document.body.appendChild(tooltip);
        element.tooltip = tooltip;
    }
    
    translateBreakdownKey(key, lang) {
        const translations = {
            'processing': { en: 'Processing', ar: 'معالجة' },
            'waiting': { en: 'Waiting', ar: 'انتظار' },
            'setup': { en: 'Setup', ar: 'إعداد' },
            'move': { en: 'Move', ar: 'نقل' }
        };
        
        return translations[key] ? translations[key][lang] : key;
    }
    
    hideSegmentTooltip() {
        const tooltips = document.querySelectorAll('.segment-tooltip');
        tooltips.forEach(tooltip => tooltip.remove());
    }
    
    exportTimelineData() {
        const timeline = this.createLeadTimeTimeline();
        if (!timeline) return null;
        
        const data = {
            metadata: {
                generated: new Date().toISOString(),
                language: this.app.currentLanguage,
                totalProcesses: this.app.processes.length,
                totalInventory: this.app.inventories.length
            },
            summary: {
                totalTime: timeline.totalTime,
                valueAddedTime: timeline.valueAddedTime,
                nonValueAddedTime: timeline.nonValueAddedTime,
                efficiency: timeline.efficiency
            },
            detailedTimeline: timeline.segments.map(segment => ({
                ...segment,
                type: segment.process ? 'process' : 'inventory'
            }))
        };
        
        return data;
    }
}