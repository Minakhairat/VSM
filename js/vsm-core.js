// VSM Core Application
class VSMApplication {
    constructor() {
        this.currentLanguage = 'en';
        this.currentTheme = 'light';
        this.processes = [];
        this.inventories = [];
        this.currentMapId = null;
        
        // Lean Metrics
        this.dailyDemand = 100;
        this.availableTime = 480; // minutes
        this.taktTime = 4.8; // minutes per unit
        
        // Initialize components
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.calculateTaktTime();
        this.setupEventListeners();
        this.updateUI();
        this.loadSavedMaps();
    }
    
    loadSettings() {
        this.currentLanguage = localStorage.getItem('vsm-language') || 'en';
        this.currentTheme = localStorage.getItem('vsm-theme') || 'light';
        
        document.documentElement.setAttribute('lang', this.currentLanguage);
        document.documentElement.setAttribute('data-theme', this.currentTheme);
    }
    
    calculateTaktTime() {
        const demandInput = document.getElementById('dailyDemand');
        const timeInput = document.getElementById('availableTime');
        
        if (demandInput && timeInput) {
            this.dailyDemand = parseInt(demandInput.value) || 100;
            this.availableTime = parseInt(timeInput.value) || 480;
            
            if (this.dailyDemand > 0) {
                this.taktTime = this.availableTime / this.dailyDemand;
                this.updateTaktDisplay();
            }
        }
    }
    
    updateTaktDisplay() {
        const taktDisplay = document.getElementById('taktTimeValue');
        if (taktDisplay) {
            taktDisplay.textContent = `${this.taktTime.toFixed(2)} min/unit`;
        }
    }
    
    calculateProcessLeadTime(process) {
        // Real Lead Time = Processing Time + Waiting Time
        const processingTime = process.cycleTime;
        const waitingTime = process.inventoryBefore * this.taktTime;
        
        return processingTime + waitingTime;
    }
    
    calculateTotalLeadTime() {
        let total = 0;
        
        this.processes.forEach(process => {
            if (process.type === 'process') {
                total += this.calculateProcessLeadTime(process);
            }
        });
        
        this.inventories.forEach(inventory => {
            total += inventory.quantity * this.taktTime;
        });
        
        return total;
    }
    
    calculateProcessCycleEfficiency() {
        const totalProcessingTime = this.processes.reduce((sum, p) => {
            return p.type === 'process' && p.valueAdded ? sum + p.cycleTime : sum;
        }, 0);
        
        const totalLeadTime = this.calculateTotalLeadTime();
        
        if (totalLeadTime > 0) {
            return (totalProcessingTime / totalLeadTime) * 100;
        }
        
        return 0;
    }
    
    calculateThroughput() {
        const bottleneck = this.identifyBottleneck();
        if (bottleneck && bottleneck.process) {
            // Throughput is limited by bottleneck
            return (60 / bottleneck.process.cycleTime) * bottleneck.process.machines;
        }
        
        return 0;
    }
    
    identifyBottleneck() {
        let bottleneck = null;
        let highestUtilization = 0;
        
        this.processes.forEach(process => {
            if (process.type === 'process') {
                const utilization = process.cycleTime / this.taktTime;
                if (utilization > highestUtilization) {
                    highestUtilization = utilization;
                    bottleneck = process;
                }
            }
        });
        
        return {
            process: bottleneck,
            utilization: highestUtilization
        };
    }
    
    analyzeFlowType() {
        const totalInventory = this.processes.reduce((sum, p) => sum + p.inventoryBefore, 0) +
                               this.inventories.reduce((sum, i) => sum + i.quantity, 0);
        
        const bufferSize = this.dailyDemand * 1.5; // 1.5 days of demand
        
        if (totalInventory > bufferSize) {
            return {
                type: 'PUSH',
                description: this.currentLanguage === 'ar' ? 
                    'نظام دفع - مخزون مرتفع يشير إلى إنتاج بناء على التنبؤ' :
                    'Push System - High inventory indicates forecast-based production'
            };
        } else {
            return {
                type: 'PULL',
                description: this.currentLanguage === 'ar' ? 
                    'نظام سحب - مخزون منخفض يشير إلى إنتاج بناء على الطلب' :
                    'Pull System - Low inventory indicates demand-based production'
            };
        }
    }
    
    generateImprovementSuggestions() {
        const suggestions = [];
        const bottleneck = this.identifyBottleneck();
        const flowAnalysis = this.analyzeFlowType();
        const pce = this.calculateProcessCycleEfficiency();
        
        // Bottleneck suggestions
        if (bottleneck.process && bottleneck.utilization > 1) {
            suggestions.push({
                type: 'high',
                message: this.currentLanguage === 'ar' ? 
                    `عملية ${bottleneck.process.name} هي اختناق (استخدام ${(bottleneck.utilization * 100).toFixed(0)}%). اقتراحات: 1) تقليل وقت الدورة 2) إضافة ماكينة 3) تحسين التوازن` :
                    `Process ${bottleneck.process.name} is bottleneck (${(bottleneck.utilization * 100).toFixed(0)}% utilization). Suggestions: 1) Reduce cycle time 2) Add machine 3) Improve balancing`
            });
        }
        
        // Flow type suggestions
        if (flowAnalysis.type === 'PUSH') {
            suggestions.push({
                type: 'medium',
                message: this.currentLanguage === 'ar' ? 
                    'نظام دفع يسبب مخزون مرتفع. فكر في التحول إلى نظام سحب باستخدام Kanban' :
                    'Push system causing high inventory. Consider shifting to Pull system using Kanban'
            });
        }
        
        // PCE suggestions
        if (pce < 10) {
            suggestions.push({
                type: 'high',
                message: this.currentLanguage === 'ar' ? 
                    `كفاءة منخفضة جداً (${pce.toFixed(1)}%). ركز على تقليل وقت الانتظار والمخزون` :
                    `Very low efficiency (${pce.toFixed(1)}%). Focus on reducing wait time and inventory`
            });
        } else if (pce < 30) {
            suggestions.push({
                type: 'medium',
                message: this.currentLanguage === 'ar' ? 
                    `كفاءة متوسطة (${pce.toFixed(1)}%). فرص للتحسين عن طريق تبسيط العمليات` :
                    `Medium efficiency (${pce.toFixed(1)}%). Opportunities for improvement through process simplification`
            });
        }
        
        // Inventory suggestions
        const totalInventory = this.processes.reduce((sum, p) => sum + p.inventoryBefore, 0);
        if (totalInventory > this.dailyDemand * 3) {
            suggestions.push({
                type: 'high',
                message: this.currentLanguage === 'ar' ? 
                    `مخزون مرتفع (${totalInventory} وحدة). هدف لتقليل المخزون إلى ${this.dailyDemand * 1.5} وحدة` :
                    `High inventory (${totalInventory} units). Aim to reduce to ${this.dailyDemand * 1.5} units`
            });
        }
        
        return suggestions;
    }
    
    updateDashboard() {
        const pce = this.calculateProcessCycleEfficiency();
        const totalLeadTime = this.calculateTotalLeadTime();
        const throughput = this.calculateThroughput();
        const totalVA = this.processes.reduce((sum, p) => {
            return p.type === 'process' && p.valueAdded ? sum + p.cycleTime : sum;
        }, 0);
        const vaRatio = totalLeadTime > 0 ? (totalVA / totalLeadTime) * 100 : 0;
        
        // Update UI elements
        const pceElement = document.getElementById('pceValue');
        const leadTimeElement = document.getElementById('totalLeadTime');
        const throughputElement = document.getElementById('throughputRate');
        const vaRatioElement = document.getElementById('vaRatio');
        
        if (pceElement) pceElement.textContent = `${pce.toFixed(1)}%`;
        if (leadTimeElement) leadTimeElement.textContent = `${totalLeadTime.toFixed(1)} min`;
        if (throughputElement) throughputElement.textContent = `${throughput.toFixed(1)} unit/hr`;
        if (vaRatioElement) vaRatioElement.textContent = `${vaRatio.toFixed(1)}%`;
        
        // Update bottleneck display
        this.updateBottleneckDisplay();
        
        // Update suggestions
        this.updateSuggestions();
    }
    
    updateBottleneckDisplay() {
        const bottleneck = this.identifyBottleneck();
        const bottleneckSection = document.getElementById('bottleneckSection');
        const bottleneckDetails = document.getElementById('bottleneckDetails');
        
        if (bottleneck.process && bottleneck.utilization > 1) {
            bottleneckSection.style.display = 'block';
            
            if (bottleneckDetails) {
                bottleneckDetails.innerHTML = this.currentLanguage === 'ar' ? 
                    `<strong>${bottleneck.process.name}</strong>: ${bottleneck.process.cycleTime} دقيقة/وحدة<br>
                     معدل الاستخدام: ${(bottleneck.utilization * 100).toFixed(0)}%<br>
                     <small>هذه العملية تحدد معدل الإنتاج الكلي</small>` :
                    `<strong>${bottleneck.process.name}</strong>: ${bottleneck.process.cycleTime} min/unit<br>
                     Utilization: ${(bottleneck.utilization * 100).toFixed(0)}%<br>
                     <small>This process determines the overall production rate</small>`;
            }
        } else {
            bottleneckSection.style.display = 'none';
        }
    }
    
    updateSuggestions() {
        const suggestions = this.generateImprovementSuggestions();
        const container = document.getElementById('suggestionsList');
        
        if (!container) return;
        
        if (suggestions.length === 0) {
            container.innerHTML = `
                <p class="empty-suggestions" data-en="Add processes to see improvement suggestions" 
                   data-ar="أضف عمليات لرؤية اقتراحات التحسين">
                    Add processes to see improvement suggestions
                </p>
            `;
            this.updateUI();
            return;
        }
        
        let html = '';
        suggestions.forEach((suggestion, index) => {
            html += `
                <div class="suggestion-item ${suggestion.type}">
                    <p><strong>${index + 1}.</strong> ${suggestion.message}</p>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    setupEventListeners() {
        // Takt time calculation
        const calculateBtn = document.getElementById('calculateTaktBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => {
                this.calculateTaktTime();
                this.updateDashboard();
            });
        }
        
        // Process form submission
        const processForm = document.getElementById('processForm');
        if (processForm) {
            processForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addProcess();
            });
        }
        
        // Add inventory button
        const addInventoryBtn = document.getElementById('addInventoryBtn');
        if (addInventoryBtn) {
            addInventoryBtn.addEventListener('click', () => {
                this.addInventory();
            });
        }
        
        // Analyze flow button
        const analyzeBtn = document.getElementById('analyzeFlowBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                this.analyzeFlow();
            });
        }
        
        // Clear all button
        const clearBtn = document.getElementById('clearAllBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm(this.currentLanguage === 'ar' ? 
                    'هل أنت متأكد من مسح جميع البيانات؟' : 
                    'Are you sure you want to clear all data?')) {
                    this.clearAll();
                }
            });
        }
        
        // Toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const parent = e.target.closest('.toggle-group');
                parent.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const inputId = parent.nextElementSibling?.id;
                if (inputId) {
                    document.getElementById(inputId).value = e.target.dataset.value;
                }
            });
        });
    }
    
    addProcess() {
        const processData = this.getProcessFormData();
        
        if (this.validateProcessData(processData)) {
            const process = new VSMProcess(processData);
            this.processes.push(process);
            
            // Add inventory before if specified
            if (processData.inventoryBefore > 0) {
                const inventory = new Inventory({
                    name: `Inventory before ${processData.name}`,
                    quantity: processData.inventoryBefore,
                    type: 'buffer',
                    location: 'before_process'
                });
                this.inventories.push(inventory);
            }
            
            this.renderProcesses();
            this.updateDashboard();
            this.resetProcessForm();
        }
    }
    
    addInventory() {
        const name = prompt(this.currentLanguage === 'ar' ? 
            'أدخل اسم المخزون:' : 
            'Enter inventory name:', 'Buffer Inventory');
        
        if (!name) return;
        
        const quantity = parseInt(prompt(this.currentLanguage === 'ar' ? 
            'أدخل كمية المخزون:' : 
            'Enter inventory quantity:', '10'));
        
        if (isNaN(quantity)) return;
        
        const inventory = new Inventory({
            name: name,
            quantity: quantity,
            type: 'buffer',
            location: 'between_processes'
        });
        
        this.inventories.push(inventory);
        this.renderProcesses();
        this.updateDashboard();
    }
    
    getProcessFormData() {
        return {
            name: document.getElementById('processName').value,
            cycleTime: parseFloat(document.getElementById('cycleTime').value),
            setupTime: parseFloat(document.getElementById('setupTime').value) || 0,
            operators: parseInt(document.getElementById('operators').value),
            machines: parseInt(document.getElementById('machines').value) || 1,
            uptime: parseFloat(document.getElementById('uptime').value) / 100,
            yield: parseFloat(document.getElementById('yield').value) / 100,
            processType: document.getElementById('processType').value,
            valueAdded: document.getElementById('valueAdded').value === 'true',
            flowType: document.getElementById('flowType').value,
            inventoryBefore: parseInt(document.getElementById('inventoryBefore').value) || 0
        };
    }
    
    validateProcessData(data) {
        if (!data.name.trim()) {
            alert(this.currentLanguage === 'ar' ? 'اسم العملية مطلوب' : 'Process name is required');
            return false;
        }
        
        if (isNaN(data.cycleTime) || data.cycleTime <= 0) {
            alert(this.currentLanguage === 'ar' ? 'زمن الدورة يجب أن يكون رقم موجب' : 'Cycle time must be a positive number');
            return false;
        }
        
        if (isNaN(data.operators) || data.operators <= 0) {
            alert(this.currentLanguage === 'ar' ? 'عدد المشغلين يجب أن يكون رقم موجب' : 'Number of operators must be positive');
            return false;
        }
        
        return true;
    }
    
    resetProcessForm() {
        document.getElementById('processForm').reset();
        document.getElementById('valueAdded').value = 'true';
        document.getElementById('flowType').value = 'push';
        document.getElementById('processType').value = 'manufacturing';
        
        // Reset toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.value === 'true' || btn.dataset.value === 'manufacturing' || btn.dataset.value === 'push') {
                btn.classList.add('active');
            }
        });
    }
    
    renderProcesses() {
        const canvas = document.getElementById('vsmCanvas');
        if (!canvas) return;
        
        if (this.processes.length === 0 && this.inventories.length === 0) {
            canvas.innerHTML = `
                <div class="canvas-empty-state">
                    <i class="fas fa-project-diagram"></i>
                    <h3 data-en="Start Building Your Value Stream" data-ar="ابدأ ببناء خريطة تدفق القيمة">Start Building Your Value Stream</h3>
                    <p data-en="Add your first process to begin mapping" data-ar="أضف أول عملية لبدء رسم الخريطة">Add your first process to begin mapping</p>
                </div>
            `;
            this.updateUI();
            return;
        }
        
        let html = '';
        let itemCount = 0;
        
        // Render all items in horizontal flow
        [...this.inventories, ...this.processes].forEach((item, index) => {
            if (item.type === 'inventory') {
                html += this.createInventoryHTML(item, index);
            } else if (item.type === 'process') {
                html += this.createProcessHTML(item, index);
            }
            
            itemCount++;
            
            // Add connector if not last item
            if (itemCount < this.processes.length + this.inventories.length) {
                html += '<div class="connector-horizontal"></div>';
            }
        });
        
        canvas.innerHTML = html;
        
        // Add event listeners
        this.addProcessEventListeners();
    }
    
    createProcessHTML(process, index) {
        const vaClass = process.valueAdded ? 'value-added' : 'non-value-added';
        const vaText = this.currentLanguage === 'ar' ? 
            (process.valueAdded ? 'قيمة مضافة' : 'غير قيمة مضافة') :
            (process.valueAdded ? 'Value Added' : 'Non-Value Added');
        
        const leadTime = this.calculateProcessLeadTime(process);
        const utilization = (process.cycleTime / this.taktTime * 100).toFixed(0);
        
        return `
            <div class="process-box ${vaClass}" data-id="${process.id}" data-index="${index}">
                <div class="process-header">
                    <h4>${process.name}</h4>
                    <span class="process-type">${process.processType}</span>
                </div>
                
                <div class="process-details">
                    <div>C/T: ${process.cycleTime} min</div>
                    <div>Op: ${process.operators}</div>
                    <div>Mach: ${process.machines}</div>
                </div>
                
                <div class="process-metrics">
                    <div class="metric">
                        <span data-en="Utilization" data-ar="الاستخدام">Utilization</span>
                        <strong>${utilization}%</strong>
                    </div>
                </div>
                
                <div class="data-box">
                    <div>
                        <span data-en="Cycle Time" data-ar="زمن الدورة">Cycle Time:</span>
                        <span>${process.cycleTime} min</span>
                    </div>
                    <div>
                        <span data-en="Setup Time" data-ar="وقت الإعداد">Setup Time:</span>
                        <span>${process.setupTime} min</span>
                    </div>
                    <div>
                        <span data-en="Uptime" data-ar="وقت التشغيل">Uptime:</span>
                        <span>${(process.uptime * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                        <span data-en="Yield" data-ar="المردود">Yield:</span>
                        <span>${(process.yield * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                        <span data-en="Lead Time" data-ar="وقت الإنتاج">Lead Time:</span>
                        <span>${leadTime.toFixed(1)} min</span>
                    </div>
                </div>
                
                <div class="process-actions">
                    <button class="btn-icon edit-process-btn" title="${this.currentLanguage === 'ar' ? 'تعديل' : 'Edit'}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-process-btn" title="${this.currentLanguage === 'ar' ? 'حذف' : 'Delete'}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    createInventoryHTML(inventory, index) {
        return `
            <div class="inventory-box" data-id="${inventory.id}" data-index="${index}">
                <h4>${inventory.name}</h4>
                <div class="inventory-details">
                    <div class="inventory-quantity">
                        <i class="fas fa-boxes"></i>
                        <span>${inventory.quantity} units</span>
                    </div>
                    <div class="inventory-wait-time">
                        <span data-en="Wait Time" data-ar="وقت الانتظار">Wait Time:</span>
                        <strong>${(inventory.quantity * this.taktTime).toFixed(1)} min</strong>
                    </div>
                </div>
                
                <div class="process-actions">
                    <button class="btn-icon delete-inventory-btn" title="${this.currentLanguage === 'ar' ? 'حذف' : 'Delete'}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    addProcessEventListeners() {
        // Edit process buttons
        document.querySelectorAll('.edit-process-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const processElement = e.target.closest('.process-box');
                const processId = processElement?.dataset.id;
                if (processId) {
                    this.editProcess(processId);
                }
            });
        });
        
        // Delete process buttons
        document.querySelectorAll('.delete-process-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const processElement = e.target.closest('.process-box');
                const processId = processElement?.dataset.id;
                if (processId) {
                    this.deleteProcess(processId);
                }
            });
        });
        
        // Delete inventory buttons
        document.querySelectorAll('.delete-inventory-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const inventoryElement = e.target.closest('.inventory-box');
                const inventoryId = inventoryElement?.dataset.id;
                if (inventoryId) {
                    this.deleteInventory(inventoryId);
                }
            });
        });
    }
    
    editProcess(processId) {
        const process = this.processes.find(p => p.id === processId);
        if (!process) return;
        
        // Show edit modal
        const modal = document.getElementById('processEditModal');
        const form = document.getElementById('editProcessForm');
        
        // Populate form
        document.getElementById('editProcessName').value = process.name;
        document.getElementById('editCycleTime').value = process.cycleTime;
        document.getElementById('editSetupTime').value = process.setupTime;
        document.getElementById('editingProcessId').value = processId;
        
        // Show modal
        modal.style.display = 'block';
        
        // Handle form submission
        form.onsubmit = (e) => {
            e.preventDefault();
            
            // Update process
            process.name = document.getElementById('editProcessName').value;
            process.cycleTime = parseFloat(document.getElementById('editCycleTime').value);
            process.setupTime = parseFloat(document.getElementById('editSetupTime').value) || 0;
            
            // Hide modal
            modal.style.display = 'none';
            
            // Update UI
            this.renderProcesses();
            this.updateDashboard();
        };
    }
    
    deleteProcess(processId) {
        if (confirm(this.currentLanguage === 'ar' ? 
            'هل أنت متأكد من حذف هذه العملية؟' : 
            'Are you sure you want to delete this process?')) {
            this.processes = this.processes.filter(p => p.id !== processId);
            this.renderProcesses();
            this.updateDashboard();
        }
    }
    
    deleteInventory(inventoryId) {
        if (confirm(this.currentLanguage === 'ar' ? 
            'هل أنت متأكد من حذف هذا المخزون؟' : 
            'Are you sure you want to delete this inventory?')) {
            this.inventories = this.inventories.filter(i => i.id !== inventoryId);
            this.renderProcesses();
            this.updateDashboard();
        }
    }
    
    analyzeFlow() {
        const flowAnalysis = this.analyzeFlowType();
        const bottleneck = this.identifyBottleneck();
        const pce = this.calculateProcessCycleEfficiency();
        
        let analysisReport = this.currentLanguage === 'ar' ? 
            `## تقرير تحليل التدفق
            
            **نوع النظام:** ${flowAnalysis.type}
            ${flowAnalysis.description}
            
            **عملية الاختناق:** ${bottleneck.process ? bottleneck.process.name : 'لا يوجد'}
            **معدل الاستخدام:** ${bottleneck.utilization ? (bottleneck.utilization * 100).toFixed(0) + '%' : 'N/A'}
            
            **كفاءة دورة العملية:** ${pce.toFixed(1)}%
            **إجمالي وقت الإنتاج:** ${this.calculateTotalLeadTime().toFixed(1)} دقيقة
            
            **التوصيات:**
            1. ${flowAnalysis.type === 'PUSH' ? 'التحول لنظام السحب' : 'الحفاظ على نظام السحب'}
            2. ${bottleneck.process ? `تحسين عملية ${bottleneck.process.name}` : 'تحسين التوازن بين العمليات'}
            3. تقليل المخزون لتحسين الكفاءة` :
            
            `## Flow Analysis Report
            
            **System Type:** ${flowAnalysis.type}
            ${flowAnalysis.description}
            
            **Bottleneck Process:** ${bottleneck.process ? bottleneck.process.name : 'None'}
            **Utilization Rate:** ${bottleneck.utilization ? (bottleneck.utilization * 100).toFixed(0) + '%' : 'N/A'}
            
            **Process Cycle Efficiency:** ${pce.toFixed(1)}%
            **Total Lead Time:** ${this.calculateTotalLeadTime().toFixed(1)} minutes
            
            **Recommendations:**
            1. ${flowAnalysis.type === 'PUSH' ? 'Shift to Pull system' : 'Maintain Pull system'}
            2. ${bottleneck.process ? `Improve ${bottleneck.process.name} process` : 'Improve process balancing'}
            3. Reduce inventory to improve efficiency`;
        
        alert(analysisReport);
    }
    
    clearAll() {
        this.processes = [];
        this.inventories = [];
        this.renderProcesses();
        this.updateDashboard();
    }
    
    updateUI() {
        // Update all elements with data-en and data-ar attributes
        document.querySelectorAll('[data-en], [data-ar]').forEach(element => {
            if (this.currentLanguage === 'en') {
                if (element.dataset.en) {
                    element.textContent = element.dataset.en;
                }
            } else {
                if (element.dataset.ar) {
                    element.textContent = element.dataset.ar;
                }
            }
        });
    }
    
    saveMap() {
        // Implementation for saving map
    }
    
    loadSavedMaps() {
        // Implementation for loading saved maps
    }
}