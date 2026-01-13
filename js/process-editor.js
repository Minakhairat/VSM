// Process Editor Module with Arabic Support
class ProcessEditor {
    constructor(vsmApp) {
        this.app = vsmApp;
        this.currentProcessId = null;
        this.modal = document.getElementById('processEditModal');
        this.init();
    }
    
    init() {
        this.setupModal();
        this.setupForm();
    }
    
    setupModal() {
        if (!this.modal) return;
        
        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.closeModal();
            }
        });
    }
    
    setupForm() {
        const form = document.getElementById('editProcessForm');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProcess();
        });
    }
    
    openModal(processId) {
        const process = this.app.processes.find(p => p.id === processId);
        if (!process) return;
        
        this.currentProcessId = processId;
        this.populateForm(process);
        this.showModal();
    }
    
    populateForm(process) {
        document.getElementById('editProcessName').value = process.name;
        document.getElementById('editCycleTime').value = process.cycleTime;
        document.getElementById('editSetupTime').value = process.setupTime || 0;
        document.getElementById('editOperators').value = process.operators || 1;
        document.getElementById('editMachines').value = process.machines || 1;
        document.getElementById('editUptime').value = (process.uptime * 100) || 95;
        document.getElementById('editYield').value = (process.yield * 100) || 98;
        document.getElementById('editInventoryBefore').value = process.inventoryBefore || 0;
        document.getElementById('editingProcessId').value = process.id;
        
        // Set process type toggle
        this.setToggleValue('editProcessType', process.processType || 'manufacturing');
        
        // Set value added toggle
        this.setToggleValue('editValueAdded', process.valueAdded ? 'true' : 'false');
        
        // Set flow type toggle
        this.setToggleValue('editFlowType', process.flowType || 'push');
    }
    
    setToggleValue(groupName, value) {
        const buttons = document.querySelectorAll(`[data-group="${groupName}"]`);
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.value === value) {
                btn.classList.add('active');
            }
        });
    }
    
    saveProcess() {
        const processId = document.getElementById('editingProcessId').value;
        const process = this.app.processes.find(p => p.id === processId);
        
        if (!process) return;
        
        // Update process properties
        process.name = document.getElementById('editProcessName').value;
        process.cycleTime = parseFloat(document.getElementById('editCycleTime').value);
        process.setupTime = parseFloat(document.getElementById('editSetupTime').value) || 0;
        process.operators = parseInt(document.getElementById('editOperators').value);
        process.machines = parseInt(document.getElementById('editMachines').value);
        process.uptime = parseFloat(document.getElementById('editUptime').value) / 100;
        process.yield = parseFloat(document.getElementById('editYield').value) / 100;
        process.inventoryBefore = parseInt(document.getElementById('editInventoryBefore').value) || 0;
        process.processType = this.getToggleValue('editProcessType');
        process.valueAdded = this.getToggleValue('editValueAdded') === 'true';
        process.flowType = this.getToggleValue('editFlowType');
        
        this.closeModal();
        this.app.renderProcesses();
        this.app.updateDashboard();
        
        // Show success message
        this.showSuccessMessage();
    }
    
    getToggleValue(groupName) {
        const activeBtn = document.querySelector(`[data-group="${groupName}"].active`);
        return activeBtn ? activeBtn.dataset.value : '';
    }
    
    showSuccessMessage() {
        const lang = this.app.currentLanguage;
        const message = lang === 'ar' ? 
            'تم تحديث العملية بنجاح' : 
            'Process updated successfully';
        
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent-color);
            color: white;
            padding: 12px 24px;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    showModal() {
        if (!this.modal) return;
        
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Update modal content based on language
        this.updateModalContent();
    }
    
    updateModalContent() {
        const lang = this.app.currentLanguage;
        
        // Update modal title
        const title = this.modal.querySelector('h3');
        if (title) {
            title.textContent = lang === 'ar' ? 'تعديل العملية' : 'Edit Process';
        }
        
        // Update labels
        const labels = this.modal.querySelectorAll('label');
        labels.forEach(label => {
            const forAttr = label.getAttribute('for');
            if (forAttr) {
                const translations = {
                    'editProcessName': { en: 'Process Name', ar: 'اسم العملية' },
                    'editCycleTime': { en: 'Cycle Time (min)', ar: 'زمن الدورة (دقيقة)' },
                    'editSetupTime': { en: 'Setup Time (min)', ar: 'وقت الإعداد (دقيقة)' },
                    'editOperators': { en: 'Operators', ar: 'المشغلين' },
                    'editMachines': { en: 'Machines', ar: 'الماكينات' },
                    'editUptime': { en: 'Uptime (%)', ar: 'وقت التشغيل (%)' },
                    'editYield': { en: 'Yield (%)', ar: 'المردود (%)' },
                    'editInventoryBefore': { en: 'Inventory Before (units)', ar: 'المخزون قبل (وحدة)' }
                };
                
                if (translations[forAttr]) {
                    label.textContent = translations[forAttr][lang];
                }
            }
        });
        
        // Update toggle buttons
        const toggleButtons = this.modal.querySelectorAll('.toggle-btn');
        toggleButtons.forEach(btn => {
            const value = btn.dataset.value;
            if (value) {
                const translations = {
                    'manufacturing': { en: 'Manufacturing', ar: 'تصنيع' },
                    'assembly': { en: 'Assembly', ar: 'تجميع' },
                    'inspection': { en: 'Inspection', ar: 'فحص' },
                    'true': { en: 'Yes', ar: 'نعم' },
                    'false': { en: 'No', ar: 'لا' },
                    'push': { en: 'Push', ar: 'دفع' },
                    'pull': { en: 'Pull', ar: 'سحب' }
                };
                
                if (translations[value]) {
                    btn.textContent = translations[value][lang];
                }
            }
        });
        
        // Update toggle group labels
        const toggleGroups = this.modal.querySelectorAll('.toggle-group');
        toggleGroups.forEach(group => {
            const label = group.previousElementSibling;
            if (label && label.tagName === 'LABEL') {
                const text = label.textContent;
                const translations = {
                    'Process Type': { en: 'Process Type', ar: 'نوع العملية' },
                    'Value Added?': { en: 'Value Added?', ar: 'قيمة مضافة؟' },
                    'Flow Type': { en: 'Flow Type', ar: 'نوع التدفق' }
                };
                
                if (translations[text]) {
                    label.textContent = translations[text][lang];
                }
            }
        });
        
        // Update buttons
        const buttons = this.modal.querySelectorAll('.btn');
        buttons.forEach(btn => {
            if (btn.type === 'submit') {
                btn.textContent = lang === 'ar' ? 'حفظ' : 'Save';
            } else if (btn.id === 'cancelEditBtn') {
                btn.textContent = lang === 'ar' ? 'إلغاء' : 'Cancel';
            }
        });
    }
    
    closeModal() {
        if (!this.modal) return;
        
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.currentProcessId = null;
    }
    
    deleteProcess(processId) {
        const lang = this.app.currentLanguage;
        const message = lang === 'ar' ?
            'هل أنت متأكد من حذف هذه العملية؟' :
            'Are you sure you want to delete this process?';
        
        if (confirm(message)) {
            this.app.processes = this.app.processes.filter(p => p.id !== processId);
            this.app.renderProcesses();
            this.app.updateDashboard();
        }
    }
    
    duplicateProcess(processId) {
        const original = this.app.processes.find(p => p.id === processId);
        if (!original) return;
        
        const duplicate = new VSMProcess({
            ...original,
            id: Date.now() + Math.random(),
            name: `${original.name} (Copy)`
        });
        
        this.app.processes.push(duplicate);
        this.app.renderProcesses();
        this.app.updateDashboard();
    }
    
    createQuickProcess() {
        const lang = this.app.currentLanguage;
        const name = prompt(
            lang === 'ar' ? 'أدخل اسم العملية السريعة:' : 'Enter quick process name:',
            lang === 'ar' ? 'عملية سريعة' : 'Quick Process'
        );
        
        if (!name) return;
        
        const cycleTime = parseFloat(prompt(
            lang === 'ar' ? 'أدخل زمن الدورة (دقيقة):' : 'Enter cycle time (minutes):',
            '5'
        ));
        
        if (isNaN(cycleTime)) return;
        
        const process = new VSMProcess({
            name: name,
            cycleTime: cycleTime,
            operators: 1,
            machines: 1,
            uptime: 0.95,
            yield: 0.98,
            processType: 'manufacturing',
            valueAdded: true,
            flowType: 'push'
        });
        
        this.app.processes.push(process);
        this.app.renderProcesses();
        this.app.updateDashboard();
    }
}