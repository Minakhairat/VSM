// js/main.js - Main application file

// Application state
const VSMApp = {
    // State management
    processes: [],
    currentState: 'current',
    language: 'en',
    theme: 'light',
    
    // DOM Elements
    elements: {},
    
    // Initialize the application
    init: function() {
        console.log('VSM App Initializing...');
        
        // Cache DOM elements
        this.cacheElements();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Load saved data if exists
        this.loadSavedData();
        
        // Update initial display
        this.updateMetrics();
        
        console.log('VSM App Initialized');
        this.showToast('VSM Tool is ready!', 'success');
    },
    
    // Cache frequently used DOM elements
    cacheElements: function() {
        this.elements = {
            // Form elements
            processForm: document.getElementById('processForm'),
            processName: document.getElementById('processName'),
            cycleTime: document.getElementById('cycleTime'),
            setupTime: document.getElementById('setupTime'),
            operators: document.getElementById('operators'),
            machines: document.getElementById('machines'),
            valueAdded: document.getElementById('valueAdded'),
            inventoryBefore: document.getElementById('inventoryBefore'),
            
            // Display elements
            materialFlowRow: document.getElementById('materialFlowRow'),
            emptyStateMessage: document.getElementById('emptyStateMessage'),
            taktTimeValue: document.getElementById('taktTimeValue'),
            
            // Metric elements
            pceValue: document.getElementById('pceValue'),
            totalLeadTime: document.getElementById('totalLeadTime'),
            throughputRate: document.getElementById('throughputRate'),
            vaRatio: document.getElementById('vaRatio'),
            
            // Button elements
            calculateTaktBtn: document.getElementById('calculateTaktBtn'),
            addProcessBtn: document.getElementById('addProcessBtn'),
            clearMapBtn: document.getElementById('clearMapBtn'),
            saveMapBtn: document.getElementById('saveMapBtn'),
            exportPdfBtn: document.getElementById('exportPdfBtn'),
            analyzeBtn: document.getElementById('analyzeBtn'),
            languageToggle: document.getElementById('languageToggle'),
            themeToggle: document.getElementById('themeToggle'),
            
            // Modal elements
            processEditModal: document.getElementById('processEditModal'),
            modalOverlay: document.getElementById('modalOverlay'),
            editProcessForm: document.getElementById('editProcessForm'),
            cancelEditBtn: document.getElementById('cancelEditBtn'),
            deleteProcessBtn: document.getElementById('deleteProcessBtn'),
            
            // Input elements for takt time
            dailyDemand: document.getElementById('dailyDemand'),
            availableTime: document.getElementById('availableTime')
        };
    },
    
    // Initialize all event listeners
    initEventListeners: function() {
        // Process form submission
        if (this.elements.processForm) {
            this.elements.processForm.addEventListener('submit', (e) => this.addProcess(e));
        }
        
        // Calculate takt time button
        if (this.elements.calculateTaktBtn) {
            this.elements.calculateTaktBtn.addEventListener('click', () => this.calculateTaktTime());
        }
        
        // Clear map button
        if (this.elements.clearMapBtn) {
            this.elements.clearMapBtn.addEventListener('click', () => this.clearMap());
        }
        
        // Save map button
        if (this.elements.saveMapBtn) {
            this.elements.saveMapBtn.addEventListener('click', () => this.saveMap());
        }
        
        // Export PDF button
        if (this.elements.exportPdfBtn) {
            this.elements.exportPdfBtn.addEventListener('click', () => this.exportToPDF());
        }
        
        // Analyze button
        if (this.elements.analyzeBtn) {
            this.elements.analyzeBtn.addEventListener('click', () => this.runAnalysis());
        }
        
        // Language toggle
        if (this.elements.languageToggle) {
            this.elements.languageToggle.addEventListener('click', () => this.toggleLanguage());
        }
        
        // Theme toggle
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Modal event listeners
        if (this.elements.modalOverlay) {
            this.elements.modalOverlay.addEventListener('click', (e) => {
                if (e.target === this.elements.modalOverlay) {
                    this.closeModal();
                }
            });
        }
        
        if (this.elements.cancelEditBtn) {
            this.elements.cancelEditBtn.addEventListener('click', () => this.closeModal());
        }
        
        // Auto-calculate takt time when inputs change
        if (this.elements.dailyDemand && this.elements.availableTime) {
            this.elements.dailyDemand.addEventListener('change', () => this.calculateTaktTime());
            this.elements.availableTime.addEventListener('change', () => this.calculateTaktTime());
        }
    },
    
    // Add a new process to the value stream
    addProcess: function(e) {
        e.preventDefault();
        
        // Get form values
        const processData = {
            id: Date.now(), // Unique ID
            name: this.elements.processName.value.trim(),
            cycleTime: parseFloat(this.elements.cycleTime.value),
            setupTime: parseFloat(this.elements.setupTime.value) || 0,
            operators: parseInt(this.elements.operators.value),
            machines: parseInt(this.elements.machines.value),
            valueAdded: this.elements.valueAdded.value === 'true',
            inventoryBefore: parseInt(this.elements.inventoryBefore.value) || 0,
            position: this.processes.length + 1
        };
        
        // Validate input
        if (!processData.name || processData.cycleTime <= 0) {
            this.showToast('Please enter valid process data', 'error');
            return;
        }
        
        // Add to processes array
        this.processes.push(processData);
        
        // Update the display
        this.renderProcesses();
        
        // Update metrics
        this.updateMetrics();
        
        // Reset form
        this.elements.processForm.reset();
        this.elements.valueAdded.value = 'true';
        this.elements.operators.value = 1;
        this.elements.machines.value = 1;
        
        // Show success message
        this.showToast(`Process "${processData.name}" added successfully!`, 'success');
        
        // Hide empty state message
        if (this.elements.emptyStateMessage) {
            this.elements.emptyStateMessage.style.display = 'none';
        }
    },
    
    // Render all processes in the material flow section
    renderProcesses: function() {
        // Clear current processes (except empty state message)
        const container = this.elements.materialFlowRow;
        const emptyState = this.elements.emptyStateMessage;
        
        // Remove all process boxes but keep empty state message
        const processBoxes = container.querySelectorAll('.process-box, .inventory-box, .connector-horizontal');
        processBoxes.forEach(box => box.remove());
        
        // Hide empty state if we have processes
        if (this.processes.length > 0 && emptyState) {
            emptyState.style.display = 'none';
        }
        
        // Render each process
        this.processes.forEach((process, index) => {
            // Add inventory before process (if any)
            if (process.inventoryBefore > 0) {
                const inventoryBox = this.createInventoryBox(process.inventoryBefore, index);
                container.appendChild(inventoryBox);
                
                // Add connector after inventory
                if (index < this.processes.length) {
                    const connector = this.createConnector();
                    container.appendChild(connector);
                }
            }
            
            // Create and add process box
            const processBox = this.createProcessBox(process);
            container.appendChild(processBox);
            
            // Add click event to edit process
            processBox.addEventListener('click', () => this.openEditModal(process));
            
            // Add connector after process (except for the last one)
            if (index < this.processes.length - 1) {
                const connector = this.createConnector();
                container.appendChild(connector);
            }
        });
        
        // Show empty state if no processes
        if (this.processes.length === 0 && emptyState) {
            emptyState.style.display = 'block';
        }
    },
    
    // Create a process box element
    createProcessBox: function(process) {
        const box = document.createElement('div');
        box.className = `process-box ${process.valueAdded ? 'value-added' : 'non-value-added'}`;
        box.dataset.id = process.id;
        
        const isBottleneck = this.checkIfBottleneck(process);
        
        box.innerHTML = `
            <div class="process-name">${process.name}</div>
            <div class="process-data">
                <div><strong>Cycle Time:</strong> ${process.cycleTime} min</div>
                ${process.setupTime > 0 ? `<div><strong>Setup:</strong> ${process.setupTime} min</div>` : ''}
                <div><strong>Operators:</strong> ${process.operators}</div>
                <div><strong>Machines:</strong> ${process.machines}</div>
                ${isBottleneck ? '<div class="bottleneck-indicator">⚠️ Bottleneck</div>' : ''}
            </div>
        `;
        
        return box;
    },
    
    // Create an inventory box element
    createInventoryBox: function(quantity, position) {
        const box = document.createElement('div');
        box.className = 'inventory-box';
        box.innerHTML = `
            <div class="inventory-title">Inventory</div>
            <div class="inventory-quantity">${quantity} units</div>
            <div class="inventory-position">Before Process ${position + 1}</div>
        `;
        return box;
    },
    
    // Create a connector element
    createConnector: function() {
        const connector = document.createElement('div');
        connector.className = 'connector-horizontal';
        return connector;
    },
    
    // Check if a process is a bottleneck
    checkIfBottleneck: function(process) {
        if (this.processes.length === 0) return false;
        
        // Find the maximum cycle time
        const maxCycleTime = Math.max(...this.processes.map(p => p.cycleTime));
        
        // Check if this process has the maximum cycle time
        return process.cycleTime === maxCycleTime && maxCycleTime > 0;
    },
    
    // Calculate takt time
    calculateTaktTime: function() {
        const demand = parseFloat(this.elements.dailyDemand.value);
        const time = parseFloat(this.elements.availableTime.value);
        
        if (demand > 0 && time > 0) {
            const taktTime = time / demand;
            this.elements.taktTimeValue.textContent = taktTime.toFixed(2) + ' min/unit';
            
            // Update metrics based on new takt time
            this.updateMetrics();
            
            this.showToast(`Takt time updated: ${taktTime.toFixed(2)} min/unit`, 'info');
        } else {
            this.showToast('Please enter valid demand and time values', 'error');
        }
    },
    
    // Update all lean metrics
    updateMetrics: function() {
        if (this.processes.length === 0) {
            this.resetMetrics();
            return;
        }
        
        // Calculate total lead time
        const totalLeadTime = this.calculateTotalLeadTime();
        this.elements.totalLeadTime.textContent = `${totalLeadTime.toFixed(1)} min`;
        
        // Calculate process cycle efficiency
        const pce = this.calculateProcessCycleEfficiency(totalLeadTime);
        this.elements.pceValue.textContent = `${pce.toFixed(1)}%`;
        
        // Calculate throughput rate
        const throughput = this.calculateThroughputRate();
        this.elements.throughputRate.textContent = `${throughput.toFixed(1)} unit/hr`;
        
        // Calculate value added ratio
        const vaRatio = this.calculateValueAddedRatio();
        this.elements.vaRatio.textContent = `${vaRatio.toFixed(1)}%`;
        
        // Update time analysis bar
        this.updateTimeAnalysisBar();
        
        // Update improvement opportunities
        this.updateImprovementOpportunities();
    },
    
    // Reset metrics to zero
    resetMetrics: function() {
        this.elements.pceValue.textContent = '0%';
        this.elements.totalLeadTime.textContent = '0 min';
        this.elements.throughputRate.textContent = '0 unit/hr';
        this.elements.vaRatio.textContent = '0%';
    },
    
    // Calculate total lead time
    calculateTotalLeadTime: function() {
        return this.processes.reduce((total, process) => {
            return total + process.cycleTime + process.setupTime;
        }, 0);
    },
    
    // Calculate process cycle efficiency
    calculateProcessCycleEfficiency: function(totalLeadTime) {
        if (totalLeadTime === 0) return 0;
        
        const valueAddedTime = this.processes
            .filter(p => p.valueAdded)
            .reduce((total, process) => total + process.cycleTime, 0);
            
        return (valueAddedTime / totalLeadTime) * 100;
    },
    
    // Calculate throughput rate
    calculateThroughputRate: function() {
        if (this.processes.length === 0) return 0;
        
        // Find bottleneck (process with longest cycle time)
        const bottleneck = this.processes.reduce((max, process) => {
            return process.cycleTime > max.cycleTime ? process : max;
        }, this.processes[0]);
        
        // Throughput = 60 minutes / bottleneck cycle time
        return 60 / bottleneck.cycleTime;
    },
    
    // Calculate value added ratio
    calculateValueAddedRatio: function() {
        if (this.processes.length === 0) return 0;
        
        const valueAddedCount = this.processes.filter(p => p.valueAdded).length;
        return (valueAddedCount / this.processes.length) * 100;
    },
    
    // Update the time analysis visualization
    updateTimeAnalysisBar: function() {
        const totalTime = this.calculateTotalLeadTime();
        if (totalTime === 0) return;
        
        const valueAddedTime = this.processes
            .filter(p => p.valueAdded)
            .reduce((total, process) => total + process.cycleTime, 0);
            
        const setupTime = this.processes.reduce((total, process) => total + process.setupTime, 0);
        const waitingTime = totalTime - valueAddedTime - setupTime;
        
        // Update bar widths
        const valueAddedBar = document.getElementById('valueAddedTime');
        const processingBar = document.getElementById('processingTime');
        const waitingBar = document.getElementById('waitingTime');
        const setupBar = document.getElementById('setupTimeBar');
        
        if (valueAddedBar) valueAddedBar.style.width = `${(valueAddedTime / totalTime) * 100}%`;
        if (processingBar) processingBar.style.width = `${(valueAddedTime / totalTime) * 100}%`;
        if (waitingBar) waitingBar.style.width = `${(waitingTime / totalTime) * 100}%`;
        if (setupBar) setupBar.style.width = `${(setupTime / totalTime) * 100}%`;
        
        // Update time labels
        const labelsContainer = document.getElementById('timeLabelsContainer');
        if (labelsContainer) {
            labelsContainer.innerHTML = `
                <div>Value Added: ${valueAddedTime.toFixed(1)} min (${((valueAddedTime / totalTime) * 100).toFixed(1)}%)</div>
                <div>Waiting: ${waitingTime.toFixed(1)} min (${((waitingTime / totalTime) * 100).toFixed(1)}%)</div>
                <div>Setup: ${setupTime.toFixed(1)} min (${((setupTime / totalTime) * 100).toFixed(1)}%)</div>
                <div><strong>Total: ${totalTime.toFixed(1)} min</strong></div>
            `;
        }
    },
    
    // Update improvement opportunities
    updateImprovementOpportunities: function() {
        const improvementList = document.getElementById('improvementList');
        if (!improvementList) return;
        
        if (this.processes.length === 0) {
            improvementList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-lightbulb fa-3x" style="color: #f39c12; margin-bottom: 15px;"></i>
                    <p>Add processes to see improvement suggestions</p>
                </div>
            `;
            return;
        }
        
        // Find bottleneck
        const bottleneck = this.processes.reduce((max, process) => {
            return process.cycleTime > max.cycleTime ? process : max;
        }, this.processes[0]);
        
        // Find non-value added processes
        const nonValueAdded = this.processes.filter(p => !p.valueAdded);
        
        // Generate improvement suggestions
        let suggestions = [];
        
        if (bottleneck) {
            suggestions.push({
                title: 'Bottleneck Process',
                description: `"${bottleneck.name}" has the longest cycle time (${bottleneck.cycleTime} min)`,
                suggestion: 'Consider adding resources, improving methods, or balancing the workload',
                priority: 'high'
            });
        }
        
        if (nonValueAdded.length > 0) {
            suggestions.push({
                title: 'Non-Value Added Processes',
                description: `${nonValueAdded.length} process${nonValueAdded.length > 1 ? 'es' : ''} identified as non-value adding`,
                suggestion: 'Evaluate if these processes can be eliminated or combined with value-added steps',
                priority: 'medium'
            });
        }
        
        // Check for high setup times
        const highSetupProcesses = this.processes.filter(p => p.setupTime > p.cycleTime * 0.5);
        if (highSetupProcesses.length > 0) {
            suggestions.push({
                title: 'High Setup Time',
                description: `${highSetupProcesses.length} process${highSetupProcesses.length > 1 ? 'es' : ''} have setup time > 50% of cycle time`,
                suggestion: 'Implement SMED (Single Minute Exchange of Die) techniques',
                priority: 'medium'
            });
        }
        
        // Render suggestions
        if (suggestions.length > 0) {
            improvementList.innerHTML = suggestions.map(suggestion => `
                <div class="improvement-item ${suggestion.priority}">
                    <h4>${suggestion.title}</h4>
                    <p>${suggestion.description}</p>
                    <div class="suggestion">
                        <strong>Suggestion:</strong> ${suggestion.suggestion}
                    </div>
                </div>
            `).join('');
        } else {
            improvementList.innerHTML = `
                <div class="improvement-item">
                    <h4>Good Job!</h4>
                    <p>No major improvement opportunities identified. Your value stream looks efficient!</p>
                </div>
            `;
        }
    },
    
    // Open modal to edit a process
    openEditModal: function(process) {
        // Populate modal fields
        document.getElementById('editProcessName').value = process.name;
        document.getElementById('editCycleTime').value = process.cycleTime;
        document.getElementById('editSetupTime').value = process.setupTime;
        
        // Store the process ID being edited
        this.elements.processEditModal.dataset.editingId = process.id;
        
        // Show modal
        this.elements.processEditModal.style.display = 'block';
        
        // Set up delete button
        this.elements.deleteProcessBtn.onclick = () => this.deleteProcess(process.id);
        
        // Set up form submission
        this.elements.editProcessForm.onsubmit = (e) => {
            e.preventDefault();
            this.saveProcessEdit(process.id);
        };
    },
    
    // Save process edits
    saveProcessEdit: function(processId) {
        const index = this.processes.findIndex(p => p.id == processId);
        if (index !== -1) {
            // Update process data
            this.processes[index].name = document.getElementById('editProcessName').value;
            this.processes[index].cycleTime = parseFloat(document.getElementById('editCycleTime').value);
            this.processes[index].setupTime = parseFloat(document.getElementById('editSetupTime').value) || 0;
            
            // Re-render and update
            this.renderProcesses();
            this.updateMetrics();
            this.closeModal();
            
            this.showToast('Process updated successfully!', 'success');
        }
    },
    
    // Delete a process
    deleteProcess: function(processId) {
        if (confirm('Are you sure you want to delete this process?')) {
            const index = this.processes.findIndex(p => p.id == processId);
            if (index !== -1) {
                const processName = this.processes[index].name;
                this.processes.splice(index, 1);
                
                // Re-render and update
                this.renderProcesses();
                this.updateMetrics();
                this.closeModal();
                
                this.showToast(`Process "${processName}" deleted`, 'info');
            }
        }
    },
    
    // Close the edit modal
    closeModal: function() {
        this.elements.processEditModal.style.display = 'none';
        this.elements.editProcessForm.reset();
    },
    
    // Clear the entire map
    clearMap: function() {
        if (this.processes.length > 0) {
            if (confirm('Are you sure you want to clear the entire map? This cannot be undone.')) {
                this.processes = [];
                this.renderProcesses();
                this.updateMetrics();
                this.showToast('Map cleared successfully', 'info');
            }
        } else {
            this.showToast('The map is already empty', 'info');
        }
    },
    
    // Save the current map
    saveMap: function() {
        const mapData = {
            processes: this.processes,
            taktTime: this.elements.taktTimeValue.textContent,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('vsmMap', JSON.stringify(mapData));
        this.showToast('Map saved to local storage', 'success');
    },
    
    // Load saved map data
    loadSavedData: function() {
        const savedData = localStorage.getItem('vsmMap');
        if (savedData) {
            try {
                const mapData = JSON.parse(savedData);
                this.processes = mapData.processes || [];
                
                if (this.processes.length > 0) {
                    this.renderProcesses();
                    this.updateMetrics();
                    this.showToast('Previous map loaded', 'info');
                }
            } catch (error) {
                console.error('Error loading saved data:', error);
            }
        }
    },
    
    // Export to PDF (placeholder - would need jsPDF implementation)
    exportToPDF: function() {
        this.showToast('PDF export feature coming soon!', 'info');
        // Implementation would go here using jsPDF library
    },
    
    // Run analysis
    runAnalysis: function() {
        if (this.processes.length === 0) {
            this.showToast('Please add processes first', 'error');
            return;
        }
        
        // Update metrics (they already include analysis)
        this.updateMetrics();
        
        // Show detailed analysis in modal or new section
        this.showToast('Analysis completed! Check improvement opportunities.', 'success');
    },
    
    // Toggle language
    toggleLanguage: function() {
        this.language = this.language === 'en' ? 'ar' : 'en';
        const langText = document.querySelector('.lang-text');
        if (langText) {
            langText.textContent = this.language.toUpperCase();
        }
        
        // Update all elements with data attributes
        document.querySelectorAll('[data-en], [data-ar]').forEach(element => {
            if (this.language === 'en') {
                if (element.dataset.en) element.textContent = element.dataset.en;
            } else {
                if (element.dataset.ar) element.textContent = element.dataset.ar;
            }
        });
        
        // Update placeholders
        document.querySelectorAll('input[data-placeholder-en]').forEach(input => {
            if (this.language === 'en') {
                input.placeholder = input.dataset.placeholderEn;
            } else {
                input.placeholder = input.dataset.placeholderAr;
            }
        });
        
        this.showToast(`Language changed to ${this.language.toUpperCase()}`, 'info');
    },
    
    // Toggle theme
    toggleTheme: function() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.body.classList.toggle('dark-theme', this.theme === 'dark');
        
        const themeIcon = this.elements.themeToggle.querySelector('i');
        if (themeIcon) {
            themeIcon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        this.showToast(`Theme changed to ${this.theme} mode`, 'info');
    },
    
    // Show toast notification
    showToast: function(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(toast => toast.remove());
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        
        // Style based on type
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            info: '#3498db',
            warning: '#f39c12'
        };
        
        toast.style.background = colors[type] || colors.info;
        
        // Add to container
        const container = document.getElementById('toastContainer') || document.body;
        container.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    VSMApp.init();
});

// Make app available globally for debugging
window.VSMApp = VSMApp;
