// VSM Canvas Renderer - Horizontal Flow
class VSMCanvasRenderer {
    constructor(vsmApp) {
        this.app = vsmApp;
        this.canvas = document.getElementById('vsmCanvas');
    }
    
    renderHorizontalFlow() {
        if (!this.canvas) return;
        
        // Clear canvas
        this.canvas.innerHTML = '';
        
        // Create container for horizontal flow
        const flowContainer = document.createElement('div');
        flowContainer.className = 'horizontal-flow-container';
        flowContainer.style.display = 'flex';
        flowContainer.style.alignItems = 'center';
        flowContainer.style.overflowX = 'auto';
        flowContainer.style.padding = '20px';
        flowContainer.style.minHeight = '400px';
        
        // Combine processes and inventories
        const allItems = this.combineItems();
        
        if (allItems.length === 0) {
            this.showEmptyState();
            return;
        }
        
        // Render each item
        allItems.forEach((item, index) => {
            // Add item
            const itemElement = this.createElement(item);
            flowContainer.appendChild(itemElement);
            
            // Add connector if not last item
            if (index < allItems.length - 1) {
                const connector = this.createConnector();
                flowContainer.appendChild(connector);
            }
        });
        
        // Add timeline below
        const timeline = this.createTimeline(allItems);
        flowContainer.appendChild(timeline);
        
        this.canvas.appendChild(flowContainer);
    }
    
    combineItems() {
        const combined = [];
        
        // Sort by position in value stream
        const items = [...this.app.inventories, ...this.app.processes];
        items.sort((a, b) => {
            // Simple sorting - can be enhanced with actual positioning logic
            return (a.position || 0) - (b.position || 0);
        });
        
        return items;
    }
    
    createElement(item) {
        if (item.type === 'process') {
            return this.createProcessElement(item);
        } else if (item.type === 'inventory') {
            return this.createInventoryElement(item);
        }
        
        return document.createElement('div');
    }
    
    createProcessElement(process) {
        const element = document.createElement('div');
        element.className = `process-box ${process.valueAdded ? 'value-added' : 'non-value-added'}`;
        element.dataset.id = process.id;
        element.dataset.type = 'process';
        
        const leadTime = this.app.calculateProcessLeadTime(process);
        const utilization = (process.cycleTime / this.app.taktTime * 100).toFixed(0);
        
        element.innerHTML = `
            <div class="process-header">
                <h4>${process.name}</h4>
                <span class="process-type-badge">${process.processType}</span>
            </div>
            
            <div class="process-icon">
                ${this.getProcessIcon(process.processType)}
            </div>
            
            <div class="process-metrics">
                <div class="metric">
                    <span>C/T</span>
                    <strong>${process.cycleTime} min</strong>
                </div>
                <div class="metric">
                    <span>Op</span>
                    <strong>${process.operators}</strong>
                </div>
                <div class="metric">
                    <span>Mach</span>
                    <strong>${process.machines}</strong>
                </div>
                <div class="metric">
                    <span>Util</span>
                    <strong>${utilization}%</strong>
                </div>
            </div>
            
            <div class="process-flow-indicator">
                <span class="flow-type ${process.flowType}">
                    ${process.flowType === 'pull' ? '🔄' : '➡️'}
                </span>
            </div>
            
            <div class="data-box">
                <div>
                    <span>C/T:</span>
                    <span>${process.cycleTime} min</span>
                </div>
                <div>
                    <span>Setup:</span>
                    <span>${process.setupTime} min</span>
                </div>
                <div>
                    <span>Uptime:</span>
                    <span>${(process.uptime * 100).toFixed(0)}%</span>
                </div>
                <div>
                    <span>Yield:</span>
                    <span>${(process.yield * 100).toFixed(0)}%</span>
                </div>
                <div>
                    <span>L/T:</span>
                    <span>${leadTime.toFixed(1)} min</span>
                </div>
            </div>
            
            <div class="process-actions">
                <button class="btn-icon edit-process" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete-process" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return element;
    }
    
    createInventoryElement(inventory) {
        const element = document.createElement('div');
        element.className = 'inventory-box';
        element.dataset.id = inventory.id;
        element.dataset.type = 'inventory';
        
        const waitTime = inventory.calculateWaitTime(this.app.taktTime);
        
        element.innerHTML = `
            <div class="inventory-header">
                <h4>${inventory.name}</h4>
                <span class="inventory-type">${inventory.inventoryType}</span>
            </div>
            
            <div class="inventory-icon">
                <i class="fas fa-boxes"></i>
            </div>
            
            <div class="inventory-metrics">
                <div class="metric">
                    <span>Qty</span>
                    <strong>${inventory.quantity}</strong>
                </div>
                <div class="metric">
                    <span>Wait</span>
                    <strong>${waitTime.toFixed(1)} min</strong>
                </div>
            </div>
            
            <div class="inventory-level">
                <div class="level-bar">
                    <div class="level-fill" style="width: ${Math.min(100, (inventory.quantity / inventory.maxLevel) * 100)}%"></div>
                </div>
                <span class="level-text">${inventory.quantity}/${inventory.maxLevel}</span>
            </div>
            
            <div class="process-actions">
                <button class="btn-icon delete-inventory" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return element;
    }
    
    createConnector() {
        const connector = document.createElement('div');
        connector.className = 'connector-horizontal';
        
        // Add arrow
        const arrow = document.createElement('div');
        arrow.className = 'connector-arrow';
        arrow.innerHTML = '→';
        
        connector.appendChild(arrow);
        return connector;
    }
    
    createTimeline(items) {
        const timeline = document.createElement('div');
        timeline.className = 'timeline-visual';
        
        // Calculate total time
        const totalTime = items.reduce((sum, item) => {
            if (item.type === 'process') {
                return sum + this.app.calculateProcessLeadTime(item);
            } else if (item.type === 'inventory') {
                return sum + item.calculateWaitTime(this.app.taktTime);
            }
            return sum;
        }, 0);
        
        // Create timeline bars
        const timelineBars = document.createElement('div');
        timelineBars.className = 'timeline-bars';
        timelineBars.style.display = 'flex';
        timelineBars.style.height = '40px';
        timelineBars.style.marginTop = '60px';
        
        items.forEach((item, index) => {
            let time = 0;
            let color = '#3498db';
            let title = '';
            
            if (item.type === 'process') {
                time = this.app.calculateProcessLeadTime(item);
                color = item.valueAdded ? '#27ae60' : '#e74c3c';
                title = `${item.name}: ${time.toFixed(1)} min`;
            } else if (item.type === 'inventory') {
                time = item.calculateWaitTime(this.app.taktTime);
                color = '#f39c12';
                title = `${item.name}: ${time.toFixed(1)} min wait`;
            }
            
            const widthPercent = (time / totalTime) * 100;
            
            const bar = document.createElement('div');
            bar.className = 'timeline-bar';
            bar.style.width = `${widthPercent}%`;
            bar.style.backgroundColor = color;
            bar.style.height = '100%';
            bar.style.position = 'relative';
            bar.title = title;
            
            // Add label
            const label = document.createElement('span');
            label.className = 'timeline-label';
            label.textContent = `${index + 1}`;
            label.style.position = 'absolute';
            label.style.top = '-25px';
            label.style.left = '50%';
            label.style.transform = 'translateX(-50%)';
            label.style.fontSize = '0.8rem';
            label.style.color = '#333';
            
            bar.appendChild(label);
            timelineBars.appendChild(bar);
        });
        
        timeline.appendChild(timelineBars);
        return timeline;
    }
    
    getProcessIcon(processType) {
        const icons = {
            'manufacturing': '<i class="fas fa-cogs"></i>',
            'assembly': '<i class="fas fa-tools"></i>',
            'inspection': '<i class="fas fa-search"></i>',
            'testing': '<i class="fas fa-vial"></i>',
            'packaging': '<i class="fas fa-box-open"></i>',
            'shipping': '<i class="fas fa-shipping-fast"></i>'
        };
        
        return icons[processType] || '<i class="fas fa-cog"></i>';
    }
    
    showEmptyState() {
        this.canvas.innerHTML = `
            <div class="canvas-empty-state">
                <i class="fas fa-project-diagram"></i>
                <h3 data-en="Start Building Your Value Stream" data-ar="ابدأ ببناء خريطة تدفق القيمة">
                    Start Building Your Value Stream
                </h3>
                <p data-en="Add your first process to begin mapping" data-ar="أضف أول عملية لبدء رسم الخريطة">
                    Add your first process to begin mapping
                </p>
            </div>
        `;
    }
}