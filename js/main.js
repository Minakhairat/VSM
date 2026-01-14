// js/main.js - Main application file for VSM Tool

class VSMApplication {
    constructor() {
        this.processes = [];
        this.currentEditId = null;
        this.initializeApp();
    }

    initializeApp() {
        console.log('🚀 Initializing VSM Application...');
        
        // Load saved data
        this.loadSavedData();
        
        // Initialize event listeners
        this.setupEventListeners();
        
        // Update display
        this.updateDisplay();
        
        console.log('✅ VSM Application initialized successfully!');
        this.showToast('VSM Tool is ready!', 'success');
    }

    setupEventListeners() {
        // Process form submission
        const processForm = document.getElementById('processForm');
        if (processForm) {
            processForm.addEventListener('submit', (e) => this.handleAddProcess(e));
        }

        // Calculate takt time
        const calculateBtn = document.getElementById('calculateTaktBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculateTaktTime());
        }

        // Auto-calculate when inputs change
        const demandInput = document.getElementById('dailyDemand');
        const timeInput = document.getElementById('availableTime');
        if (demandInput && timeInput) {
            demandInput.addEventListener('change', () => this.calculateTaktTime());
            timeInput.addEventListener('change', () => this.calculateTaktTime());
        }

        // Clear map
        const clearBtn = document.getElementById('clearMapBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearMap());
        }

        // Save map
        const saveBtn = document.getElementById('saveMapBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveMap());
        }

        // Analyze
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.runAnalysis());
        }

        // Modal events
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => this.closeModal());
        }

        // Close modal when clicking outside
        const modal = document.getElementById('processEditModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    handleAddProcess(e) {
        e.preventDefault();
        
        const processData = {
            id: Date.now(),
            name: document.getElementById('processName').value.trim(),
            cycleTime: parseFloat(document.getElementById('cycleTime').value),
            setupTime: parseFloat(document.getElementById('setupTime').value) || 0,
            operators: parseInt(document.getElementById('operators').value),
            machines: parseInt(document.getElementById('machines').value),
            valueAdded: document.getElementById('valueAdded').value === 'true',
            inventoryBefore: parseInt(document.getElementById('inventoryBefore').value) || 0
        };

        // Validation
        if (!processData.name || processData.cycleTime <= 0) {
            this.showToast('Please enter valid process data', 'error');
            return;
        }

        this.processes.push(processData);
        this.updateDisplay();
        
        // Reset form
        e.target.reset();
        document.getElementById('valueAdded').value = 'true';
        document.getElementById('operators').value = 1;
        document.getElementById('machines').value = 1;
        
        this.showToast(`Process "${processData.name}" added successfully!`, 'success');
        this.saveMap(); // Auto-save
    }

    calculateTaktTime() {
        const demand = parseFloat(document.getElementById('dailyDemand').value);
        const time = parseFloat(document.getElementById('availableTime').value);
        
        if (demand > 0 && time > 0) {
            const taktTime = time / demand;
            document.getElementById('taktTimeValue').textContent = taktTime.toFixed(2) + ' min/unit';
            this.showToast(`Takt time updated: ${taktTime.toFixed(2)} min/unit`, 'info');
        }
    }

    updateDisplay() {
        this.renderProcesses();
        this.updateMetrics();
        this.updateTimeAnalysis();
        this.updateImprovements();
    }

    renderProcesses() {
        const container = document.getElementById('materialFlowRow');
        const emptyState = document.getElementById('emptyStateMessage');
        
        if (!container) return;

        // Clear existing processes
        container.querySelectorAll('.process-box, .inventory-box, .connector-horizontal').forEach(el => el.remove());
        
        // Hide empty state if we have processes
        if (this.processes.length > 0 && emptyState) {
            emptyState.style.display = 'none';
        } else if (emptyState) {
            emptyState.style.display = 'block';
            return;
        }

        // Render each process
        this.processes.forEach((process, index) => {
            // Add inventory before process
            if (process.inventoryBefore > 0) {
                const inventoryBox = document.createElement('div');
                inventoryBox.className = 'inventory-box';
                inventoryBox.innerHTML = `
                    <div class="inventory-title">Inventory</div>
                    <div class="inventory-quantity">${process.inventoryBefore}</div>
                    <div class="inventory-position">Before Process ${index + 1}</div>
                `;
                container.appendChild(inventoryBox);
                
                // Add connector
                const connector = document.createElement('div');
                connector.className = 'connector-horizontal';
                container.appendChild(connector);
            }

            // Create process box
            const processBox = document.createElement('div');
            processBox.className = `process-box ${process.valueAdded ? 'value-added' : 'non-value-added'}`;
            processBox.dataset.id = process.id;
            
            const isBottleneck = this.isBottleneck(process);
            
            processBox.innerHTML = `
                <div class="process-name">${process.name}</div>
                <div class="process-data">
                    <div><strong>Cycle Time:</strong> ${process.cycleTime} min</div>
                    ${process.setupTime > 0 ? `<div><strong>Setup:</strong> ${process.setupTime} min</div>` : ''}
                    <div><strong>Operators:</strong> ${process.operators}</div>
                    <div><strong>Machines:</strong> ${process.machines}</div>
                    ${isBottleneck ? '<div class="bottleneck-indicator">⚠️ Bottleneck</div>' : ''}
                </div>
            `;
            
            // Add click event for editing
            processBox.addEventListener('click', () => this.openEditModal(process.id));
            container.appendChild(processBox);

            // Add connector after process (except last one)
            if (index < this.processes.length - 1) {
                const connector = document.createElement('div');
                connector.className = 'connector-horizontal';
                container.appendChild(connector);
            }
        });
    }

    isBottleneck(process) {
        if (this.processes.length === 0) return false;
        const maxCycleTime = Math.max(...this.processes.map(p => p.cycleTime));
        return process.cycleTime === maxCycleTime;
    }

    updateMetrics() {
        if (this.processes.length === 0) {
            document.getElementById('pceValue').textContent = '0%';
            document.getElementById('totalLeadTime').textContent = '0 min';
            document.getElementById('throughputRate').textContent = '0 unit/hr';
            document.getElementById('vaRatio').textContent = '0%';
            return;
        }

        // Calculate metrics
        const totalLeadTime = this.processes.reduce((sum, p) => sum + p.cycleTime + p.setupTime, 0);
        const valueAddedTime = this.processes
            .filter(p => p.valueAdded)
            .reduce((sum, p) => sum + p.cycleTime, 0);
        
        const pce = totalLeadTime > 0 ? (valueAddedTime / totalLeadTime) * 100 : 0;
        const bottleneck = this.processes.reduce((max, p) => p.cycleTime > max.cycleTime ? p : max, this.processes[0]);
        const throughput = bottleneck.cycleTime > 0 ? 60 / bottleneck.cycleTime : 0;
        const vaRatio = (this.processes.filter(p => p.valueAdded).length / this.processes.length) * 100;

        // Update UI
        document.getElementById('totalLeadTime').textContent = `${totalLeadTime.toFixed(1)} min`;
        document.getElementById('pceValue').textContent = `${pce.toFixed(1)}%`;
        document.getElementById('throughputRate').textContent = `${throughput.toFixed(1)} unit/hr`;
        document.getElementById('vaRatio').textContent = `${vaRatio.toFixed(1)}%`;
    }

    updateTimeAnalysis() {
        if (this.processes.length === 0) {
            document.getElementById('timeLabelsContainer').innerHTML = '<div>No processes added yet</div>';
            return;
        }

        const totalTime = this.processes.reduce((sum, p) => sum + p.cycleTime + p.setupTime, 0);
        const valueAddedTime = this.processes
            .filter(p => p.valueAdded)
            .reduce((sum, p) => sum + p.cycleTime, 0);
        const setupTime = this.processes.reduce((sum, p) => sum + p.setupTime, 0);
        const waitingTime = totalTime - valueAddedTime - setupTime;

        // Update bar widths
        const valueAddedBar = document.getElementById('valueAddedTime');
        const waitingBar = document.getElementById('waitingTime');
        const setupBar = document.getElementById('setupTimeBar');

        if (valueAddedBar) valueAddedBar.style.width = `${(valueAddedTime / totalTime) * 100}%`;
        if (waitingBar) waitingBar.style.width = `${(waitingTime / totalTime) * 100}%`;
        if (setupBar) setupBar.style.width = `${(setupTime / totalTime) * 100}%`;

        // Update labels
        document.getElementById('timeLabelsContainer').innerHTML = `
            <div><strong>Value Added:</strong> ${valueAddedTime.toFixed(1)} min (${((valueAddedTime / totalTime) * 100).toFixed(1)}%)</div>
            <div><strong>Waiting:</strong> ${waitingTime.toFixed(1)} min (${((waitingTime / totalTime) * 100).toFixed(1)}%)</div>
            <div><strong>Setup:</strong> ${setupTime.toFixed(1)} min (${((setupTime / totalTime) * 100).toFixed(1)}%)</div>
            <div><strong>Total Lead Time:</strong> ${totalTime.toFixed(1)} min</div>
        `;
    }

    updateImprovements() {
        const container = document.getElementById('improvementList');
        if (!container) return;

        if (this.processes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-lightbulb"></i>
                    <p>Add processes to see improvement suggestions</p>
                </div>
            `;
            return;
        }

        const suggestions = [];
        const bottleneck = this.processes.reduce((max, p) => p.cycleTime > max.cycleTime ? p : max, this.processes[0]);
        const nonValueAdded = this.processes.filter(p => !p.valueAdded);
        const highSetup = this.processes.filter(p => p.setupTime > p.cycleTime * 0.5);

        if (bottleneck) {
            suggestions.push({
                type: 'high',
                title: 'Bottleneck Process',
                description: `"${bottleneck.name}" has the longest cycle time (${bottleneck.cycleTime} min)`,
                suggestion: 'Consider adding resources or improving methods'
            });
        }

        if (nonValueAdded.length > 0) {
            suggestions.push({
                type: 'medium',
                title: 'Non-Value Added Processes',
                description: `${nonValueAdded.length} process${nonValueAdded.length > 1 ? 'es' : ''} identified`,
                suggestion: 'Evaluate if these can be eliminated or combined'
            });
        }

        if (highSetup.length > 0) {
            suggestions.push({
                type: 'medium',
                title: 'High Setup Time',
                description: `${highSetup.length} process${highSetup.length > 1 ? 'es' : ''} with setup > 50% of cycle time`,
                suggestion: 'Implement SMED techniques'
            });
        }

        if (suggestions.length > 0) {
            container.innerHTML = suggestions.map(s => `
                <div class="improvement-item ${s.type}">
                    <h4>${s.title}</h4>
                    <p>${s.description}</p>
                    <div class="suggestion">
                        <strong>Suggestion:</strong> ${s.suggestion}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="improvement-item">
                    <h4>Good Job!</h4>
                    <p>No major improvement opportunities identified. Your value stream looks efficient!</p>
                </div>
            `;
        }
    }

    openEditModal(processId) {
        const process = this.processes.find(p => p.id === processId);
        if (!process) return;

        this.currentEditId = processId;
        
        document.getElementById('editProcessName').value = process.name;
        document.getElementById('editCycleTime').value = process.cycleTime;
        document.getElementById('editSetupTime').value = process.setupTime;
        
        // Setup form submission
        const editForm = document.getElementById('editProcessForm');
        editForm.onsubmit = (e) => {
            e.preventDefault();
            this.saveProcessEdit();
        };
        
        // Setup delete button
        const deleteBtn = document.getElementById('deleteProcessBtn');
        deleteBtn.onclick = () => this.deleteProcess(processId);
        
        // Show modal
        document.getElementById('processEditModal').style.display = 'flex';
    }

    saveProcessEdit() {
        const index = this.processes.findIndex(p => p.id === this.currentEditId);
        if (index === -1) return;

        this.processes[index].name = document.getElementById('editProcessName').value;
        this.processes[index].cycleTime = parseFloat(document.getElementById('editCycleTime').value);
        this.processes[index].setupTime = parseFloat(document.getElementById('editSetupTime').value) || 0;
        
        this.updateDisplay();
        this.closeModal();
        this.showToast('Process updated successfully!', 'success');
        this.saveMap();
    }

    deleteProcess(processId) {
        if (confirm('Are you sure you want to delete this process?')) {
            const index = this.processes.findIndex(p => p.id === processId);
            if (index !== -1) {
                const processName = this.processes[index].name;
                this.processes.splice(index, 1);
                this.updateDisplay();
                this.closeModal();
                this.showToast(`Process "${processName}" deleted`, 'info');
                this.saveMap();
            }
        }
    }

    closeModal() {
        document.getElementById('processEditModal').style.display = 'none';
        this.currentEditId = null;
        document.getElementById('editProcessForm').reset();
    }

    clearMap() {
        if (this.processes.length === 0) {
            this.showToast('The map is already empty', 'info');
            return;
        }

        if (confirm('Are you sure you want to clear the entire map? This cannot be undone.')) {
            this.processes = [];
            this.updateDisplay();
            localStorage.removeItem('vsmMap');
            this.showToast('Map cleared successfully', 'info');
        }
    }

    saveMap() {
        const mapData = {
            processes: this.processes,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('vsmMap', JSON.stringify(mapData));
        this.showToast('Map saved successfully', 'success');
    }

    loadSavedData() {
        try {
            const savedData = localStorage.getItem('vsmMap');
            if (savedData) {
                const mapData = JSON.parse(savedData);
                this.processes = mapData.processes || [];
                if (this.processes.length > 0) {
                    this.showToast('Previous map loaded', 'info');
                }
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }

    runAnalysis() {
        if (this.processes.length === 0) {
            this.showToast('Please add processes first', 'error');
            return;
        }

        this.updateDisplay();
        this.showToast('Analysis completed! Check improvement opportunities.', 'success');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        const container = document.getElementById('toastContainer') || document.body;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.vsmApp = new VSMApplication();
});
