// Main Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize main application
    window.vsmApp = new VSMApplication();
    
    // Initialize language toggle
    initLanguageToggle();
    
    // Initialize theme toggle
    initThemeToggle();
    
    // Initialize other components
    initComponents();
});

function initLanguageToggle() {
    const toggleBtn = document.getElementById('languageToggle');
    if (!toggleBtn) return;
    
    const langText = toggleBtn.querySelector('.lang-text');
    
    toggleBtn.addEventListener('click', () => {
        const currentLang = document.documentElement.lang;
        const newLang = currentLang === 'en' ? 'ar' : 'en';
        
        // Update language
        document.documentElement.lang = newLang;
        document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
        
        // Save preference
        localStorage.setItem('vsm-language', newLang);
        
        // Update button text
        langText.textContent = newLang === 'en' ? 'AR' : 'EN';
        
        // Update all translatable elements
        updateAllTranslations(newLang);
        
        // Update application language
        if (window.vsmApp) {
            window.vsmApp.currentLanguage = newLang;
            window.vsmApp.updateUI();
            window.vsmApp.updateDashboard();
        }
    });
}

function initThemeToggle() {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;
    
    const icon = toggleBtn.querySelector('i');
    
    toggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Update theme
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Save preference
        localStorage.setItem('vsm-theme', newTheme);
        
        // Update icon
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    });
}

function initComponents() {
    // Initialize Takt Time Calculator
    initTaktCalculator();
    
    // Initialize Process Editor
    initProcessEditor();
    
    // Initialize Report Generator
    initReportGenerator();
    
    // Initialize Map Storage
    initMapStorage();
    
    // Run data migration
    runDataMigration();
}

function initTaktCalculator() {
    const calculateBtn = document.getElementById('calculateTaktBtn');
    const dailyDemand = document.getElementById('dailyDemand');
    const availableTime = document.getElementById('availableTime');
    
    if (calculateBtn) {
        calculateBtn.addEventListener('click', () => {
            if (window.vsmApp) {
                window.vsmApp.calculateTaktTime();
                window.vsmApp.updateDashboard();
            }
        });
    }
    
    if (dailyDemand && availableTime) {
        dailyDemand.addEventListener('change', updateTaktTime);
        availableTime.addEventListener('change', updateTaktTime);
    }
}

function updateTaktTime() {
    if (window.vsmApp) {
        window.vsmApp.calculateTaktTime();
        window.vsmApp.updateDashboard();
    }
}

function initProcessEditor() {
    // Process form submission
    const processForm = document.getElementById('processForm');
    if (processForm) {
        processForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (window.vsmApp) {
                window.vsmApp.addProcess();
            }
        });
    }
    
    // Toggle buttons
    document.querySelectorAll('.toggle-group').forEach(group => {
        group.addEventListener('click', (e) => {
            if (e.target.classList.contains('toggle-btn')) {
                // Remove active class from all buttons in group
                group.querySelectorAll('.toggle-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Update hidden input value
                const inputId = group.nextElementSibling?.id;
                if (inputId) {
                    const input = document.getElementById(inputId);
                    if (input) {
                        input.value = e.target.dataset.value;
                    }
                }
            }
        });
    });
}

function initReportGenerator() {
    // Generate Report button
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', async () => {
            if (window.vsmApp && window.vsmApp.processes.length > 0) {
                const generator = new PDFReportGenerator(window.vsmApp);
                await generator.generateFullReport();
            } else {
                alert(window.vsmApp.currentLanguage === 'ar' ?
                    'يرجى إضافة عمليات أولاً لإنشاء التقرير' :
                    'Please add processes first to generate report');
            }
        });
    }
    
    // HTML Report button
    const htmlReportBtn = document.getElementById('exportDataBtn');
    if (htmlReportBtn) {
        htmlReportBtn.addEventListener('click', () => {
            if (window.vsmApp && window.vsmApp.processes.length > 0) {
                const generator = new HTMLReportGenerator(window.vsmApp);
                const fileName = generator.exportAsHTML();
                
                // Show success message
                showNotification(
                    window.vsmApp.currentLanguage === 'ar' ?
                        `تم تصدير التقرير كـ ${fileName}` :
                        `Report exported as ${fileName}`,
                    'success'
                );
            } else {
                showNotification(
                    window.vsmApp.currentLanguage === 'ar' ?
                        'يرجى إضافة عمليات أولاً' :
                        'Please add processes first',
                    'error'
                );
            }
        });
    }
    
    // Future State button
    const futureStateBtn = document.getElementById('futureStateBtn');
    if (futureStateBtn) {
        futureStateBtn.addEventListener('click', () => {
            if (window.vsmApp && window.vsmApp.processes.length > 0) {
                const designer = new FutureStateDesigner(window.vsmApp);
                const report = designer.generateFutureStateReport();
                
                // Show future state report in modal
                showFutureStateReport(report);
            } else {
                showNotification(
                    window.vsmApp.currentLanguage === 'ar' ?
                        'يرجى إضافة عمليات أولاً لتصميم الحالة المستقبلية' :
                        'Please add processes first to design future state',
                    'error'
                );
            }
        });
    }
}

function initMapStorage() {
    // Save Map button
    const saveMapBtn = document.getElementById('saveMapBtn');
    if (saveMapBtn) {
        saveMapBtn.addEventListener('click', () => {
            if (window.vsmApp) {
                const mapName = prompt(
                    window.vsmApp.currentLanguage === 'ar' ?
                        'أدخل اسم الخريطة:' :
                        'Enter map name:',
                    `VSM Map ${new Date().toLocaleDateString()}`
                );
                
                if (mapName) {
                    const storage = new MapStorage(window.vsmApp);
                    const result = storage.saveMap(mapName);
                    
                    showNotification(result.message, 'success');
                }
            }
        });
    }
    
    // Clear All button
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (window.vsmApp) {
                const lang = window.vsmApp.currentLanguage;
                const message = lang === 'ar' ?
                    'هل أنت متأكد من مسح جميع البيانات؟' :
                    'Are you sure you want to clear all data?';
                
                if (confirm(message)) {
                    window.vsmApp.clearAll();
                    showNotification(
                        lang === 'ar' ? 'تم مسح جميع البيانات' : 'All data cleared',
                        'success'
                    );
                }
            }
        });
    }
}

function runDataMigration() {
    const migration = new DataMigration();
    const result = migration.migrateIfNeeded();
    
    if (result.migrated) {
        console.log('Data migration completed:', result);
    }
}

function updateAllTranslations(lang) {
    // Update all elements with data-en and data-ar attributes
    document.querySelectorAll('[data-en], [data-ar]').forEach(element => {
        if (lang === 'en' && element.dataset.en) {
            element.textContent = element.dataset.en;
        } else if (lang === 'ar' && element.dataset.ar) {
            element.textContent = element.dataset.ar;
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-placeholder-en], [data-placeholder-ar]').forEach(element => {
        if (lang === 'en' && element.dataset.placeholderEn) {
            element.placeholder = element.dataset.placeholderEn;
        } else if (lang === 'ar' && element.dataset.placeholderAr) {
            element.placeholder = element.dataset.placeholderAr;
        }
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, 3000);
}

function showFutureStateReport(report) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
    `;
    
    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 30px;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    `;
    
    // Create report content
    const lang = window.vsmApp.currentLanguage;
    
    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0;">${lang === 'ar' ? 'تقرير الحالة المستقبلية' : 'Future State Report'}</h2>
            <button class="close-modal" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h3>${lang === 'ar' ? 'الملخص التنفيذي' : 'Executive Summary'}</h3>
            <p style="background: #f8f9fa; padding: 15px; border-radius: 4px;">${report.executiveSummary}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px;">
            <div>
                <h4>${lang === 'ar' ? 'الحالة الحالية' : 'Current State'}</h4>
                <ul>
                    <li>${lang === 'ar' ? 'وقت الإنتاج:' : 'Lead Time:'} ${report.currentStateSnapshot.leadTime.totalLeadTime.toFixed(1)} ${lang === 'ar' ? 'دقيقة' : 'min'}</li>
                    <li>${lang === 'ar' ? 'الكفاءة:' : 'Efficiency:'} ${report.currentStateSnapshot.leanMetrics.processCycleEfficiency.toFixed(1)}%</li>
                    <li>${lang === 'ar' ? 'المخزون:' : 'Inventory:'} ${report.currentStateSnapshot.leanMetrics.daysOfInventory.toFixed(1)} ${lang === 'ar' ? 'يوم' : 'days'}</li>
                </ul>
            </div>
            <div>
                <h4>${lang === 'ar' ? 'الحالة المستقبلية' : 'Future State'}</h4>
                <ul>
                    <li>${lang === 'ar' ? 'وقت الإنتاج:' : 'Lead Time:'} ${report.futureStateDesign.leadTime.totalLeadTime.toFixed(1)} ${lang === 'ar' ? 'دقيقة' : 'min'}</li>
                    <li>${lang === 'ar' ? 'الكفاءة:' : 'Efficiency:'} ${report.futureStateDesign.leanMetrics.processCycleEfficiency.toFixed(1)}%</li>
                    <li>${lang === 'ar' ? 'المخزون:' : 'Inventory:'} ${report.futureStateDesign.leanMetrics.daysOfInventory.toFixed(1)} ${lang === 'ar' ? 'يوم' : 'days'}</li>
                </ul>
            </div>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h3>${lang === 'ar' ? 'تحليل الفجوة' : 'Gap Analysis'}</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="padding: 10px; background: #3498db; color: white; text-align: left;">${lang === 'ar' ? 'المؤشر' : 'Metric'}</th>
                        <th style="padding: 10px; background: #3498db; color: white; text-align: left;">${lang === 'ar' ? 'التغيير' : 'Change'}</th>
                        <th style="padding: 10px; background: #3498db; color: white; text-align: left;">${lang === 'ar' ? 'التأثير' : 'Impact'}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${lang === 'ar' ? 'وقت الإنتاج' : 'Lead Time'}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${report.gapAnalysis.leadTime.reduction}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${report.gapAnalysis.leadTime.improvement}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${lang === 'ar' ? 'الكفاءة' : 'Efficiency'}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${report.gapAnalysis.efficiency.improvement}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${report.gapAnalysis.efficiency.impact}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${lang === 'ar' ? 'المخزون' : 'Inventory'}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${report.gapAnalysis.inventory.reduction}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${report.gapAnalysis.inventory.benefit}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div>
            <h3>${lang === 'ar' ? 'خارطة الطريق التنفيذية' : 'Implementation Roadmap'}</h3>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 4px;">
                ${Object.values(report.implementationRoadmap).map(phase => `
                    <div style="margin-bottom: 15px;">
                        <h4 style="margin: 0 0 10px 0;">${phase.duration} - ${phase.focus}</h4>
                        <ul style="margin: 0;">
                            ${phase.initiatives.map(initiative => `
                                <li>${initiative}</li>
                            `).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Close modal on button click
    content.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });
    
    // Close modal on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.contains(modal)) {
            modal.remove();
        }
    });
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .notification {
        animation: fadeIn 0.3s ease;
    }
    
    .modal-content {
        animation: fadeIn 0.3s ease;
    }
`;
document.head.appendChild(style);