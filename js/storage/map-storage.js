// Map Storage and Management Module
class MapStorage {
    constructor(vsmApp) {
        this.app = vsmApp;
        this.storageKey = 'vsm-maps';
        this.currentMapId = null;
    }
    
    // Save current map
    saveMap(mapName = null, description = '') {
        const valueStream = new ValueStream({
            name: mapName || `VSM Map ${new Date().toLocaleDateString()}`,
            description: description,
            processes: this.app.processes,
            inventories: this.app.inventories,
            metrics: {
                taktTime: this.app.taktTime,
                leadTime: this.app.calculateTotalLeadTime(),
                cycleEfficiency: this.app.calculateProcessCycleEfficiency(),
                valueAddedRatio: this.calculateValueAddedRatio(),
                inventoryTurns: this.calculateInventoryTurns()
            }
        });
        
        const maps = this.getAllMaps();
        const mapId = this.currentMapId || Date.now().toString();
        
        valueStream.id = mapId;
        valueStream.modifiedDate = new Date().toISOString();
        
        // Update or add map
        const existingIndex = maps.findIndex(m => m.id === mapId);
        if (existingIndex !== -1) {
            maps[existingIndex] = valueStream.toJSON();
        } else {
            maps.push(valueStream.toJSON());
        }
        
        // Save to localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(maps));
        
        this.currentMapId = mapId;
        
        return {
            success: true,
            mapId: mapId,
            mapName: valueStream.name,
            message: this.app.currentLanguage === 'ar' ? 
                'تم حفظ الخريطة بنجاح' : 
                'Map saved successfully'
        };
    }
    
    // Load a map
    loadMap(mapId) {
        const maps = this.getAllMaps();
        const mapData = maps.find(m => m.id === mapId);
        
        if (!mapData) {
            return {
                success: false,
                message: this.app.currentLanguage === 'ar' ?
                    'لم يتم العثور على الخريطة' :
                    'Map not found'
            };
        }
        
        try {
            const valueStream = ValueStream.fromJSON(mapData);
            
            // Update app state
            this.app.processes = valueStream.processes;
            this.app.inventories = valueStream.inventories;
            this.currentMapId = mapId;
            
            // Update UI
            this.app.renderProcesses();
            this.app.updateDashboard();
            
            return {
                success: true,
                mapName: valueStream.name,
                message: this.app.currentLanguage === 'ar' ?
                    `تم تحميل خريطة "${valueStream.name}"` :
                    `Loaded map "${valueStream.name}"`
            };
        } catch (error) {
            console.error('Error loading map:', error);
            return {
                success: false,
                message: this.app.currentLanguage === 'ar' ?
                    'خطأ في تحميل الخريطة' :
                    'Error loading map'
            };
        }
    }
    
    // Delete a map
    deleteMap(mapId) {
        const lang = this.app.currentLanguage;
        const confirmMessage = lang === 'ar' ?
            'هل أنت متأكد من حذف هذه الخريطة؟' :
            'Are you sure you want to delete this map?';
        
        if (!confirm(confirmMessage)) return;
        
        const maps = this.getAllMaps();
        const filteredMaps = maps.filter(m => m.id !== mapId);
        
        localStorage.setItem(this.storageKey, JSON.stringify(filteredMaps));
        
        if (this.currentMapId === mapId) {
            this.currentMapId = null;
        }
        
        return {
            success: true,
            message: lang === 'ar' ? 'تم حذف الخريطة' : 'Map deleted'
        };
    }
    
    // Get all saved maps
    getAllMaps() {
        const mapsJson = localStorage.getItem(this.storageKey);
        if (!mapsJson) return [];
        
        try {
            return JSON.parse(mapsJson);
        } catch (error) {
            console.error('Error parsing maps:', error);
            return [];
        }
    }
    
    // Get map by ID
    getMapById(mapId) {
        const maps = this.getAllMaps();
        return maps.find(m => m.id === mapId);
    }
    
    // Export map as JSON file
    exportMap(mapId) {
        const map = this.getMapById(mapId);
        if (!map) return;
        
        const dataStr = JSON.stringify(map, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileName = `vsm-map-${map.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().getTime()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
        
        return {
            success: true,
            fileName: exportFileName,
            message: this.app.currentLanguage === 'ar' ?
                'تم تصدير الخريطة' :
                'Map exported'
        };
    }
    
    // Import map from JSON file
    importMap(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const mapData = JSON.parse(event.target.result);
                    
                    // Validate map structure
                    if (!this.validateMapStructure(mapData)) {
                        reject({
                            success: false,
                            message: this.app.currentLanguage === 'ar' ?
                                'ملف الخريطة غير صالح' :
                                'Invalid map file format'
                        });
                        return;
                    }
                    
                    // Convert to ValueStream object
                    const valueStream = ValueStream.fromJSON(mapData);
                    
                    // Save to storage
                    const maps = this.getAllMaps();
                    maps.push(valueStream.toJSON());
                    localStorage.setItem(this.storageKey, JSON.stringify(maps));
                    
                    resolve({
                        success: true,
                        mapId: valueStream.id,
                        mapName: valueStream.name,
                        message: this.app.currentLanguage === 'ar' ?
                            `تم استيراد خريطة "${valueStream.name}"` :
                            `Imported map "${valueStream.name}"`
                    });
                    
                } catch (error) {
                    console.error('Error importing map:', error);
                    reject({
                        success: false,
                        message: this.app.currentLanguage === 'ar' ?
                            'خطأ في استيراد الخريطة' :
                            'Error importing map'
                    });
                }
            };
            
            reader.onerror = () => {
                reject({
                    success: false,
                    message: this.app.currentLanguage === 'ar' ?
                        'خطأ في قراءة الملف' :
                        'Error reading file'
                });
            };
            
            reader.readAsText(file);
        });
    }
    
    // Validate map structure
    validateMapStructure(mapData) {
        if (!mapData || typeof mapData !== 'object') return false;
        
        const requiredFields = ['id', 'name', 'processes'];
        for (const field of requiredFields) {
            if (!(field in mapData)) return false;
        }
        
        if (!Array.isArray(mapData.processes)) return false;
        
        return true;
    }
    
    // Calculate value added ratio
    calculateValueAddedRatio() {
        const totalVA = this.app.processes.reduce((sum, p) => {
            return p.type === 'process' && p.valueAdded ? sum + p.cycleTime : sum;
        }, 0);
        
        const totalLeadTime = this.app.calculateTotalLeadTime();
        
        if (totalLeadTime > 0) {
            return (totalVA / totalLeadTime) * 100;
        }
        
        return 0;
    }
    
    // Calculate inventory turns
    calculateInventoryTurns() {
        const totalInventory = this.app.inventories.reduce((sum, inv) => sum + inv.quantity, 0) +
                             this.app.processes.reduce((sum, proc) => sum + proc.inventoryBefore, 0);
        
        if (totalInventory > 0) {
            const dailyUsage = this.app.dailyDemand;
            return (dailyUsage * 365) / totalInventory;
        }
        
        return 0;
    }
    
    // Create map backup
    createBackup() {
        const allMaps = this.getAllMaps();
        const backupData = {
            version: '1.0',
            created: new Date().toISOString(),
            mapCount: allMaps.length,
            maps: allMaps
        };
        
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const backupFileName = `vsm-backup-${new Date().getTime()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', backupFileName);
        linkElement.click();
        
        return {
            success: true,
            fileName: backupFileName,
            message: this.app.currentLanguage === 'ar' ?
                `تم إنشاء نسخة احتياطية لـ ${allMaps.length} خريطة` :
                `Created backup of ${allMaps.length} maps`
        };
    }
    
    // Restore from backup
    restoreBackup(file) {
        const lang = this.app.currentLanguage;
        const confirmMessage = lang === 'ar' ?
            'سيتم استبدال جميع الخرائط الحالية. هل تريد المتابعة؟' :
            'This will replace all current maps. Do you want to continue?';
        
        if (!confirm(confirmMessage)) {
            return Promise.resolve({
                success: false,
                message: lang === 'ar' ? 'تم إلغاء الاستعادة' : 'Restore cancelled'
            });
        }
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const backupData = JSON.parse(event.target.result);
                    
                    // Validate backup structure
                    if (!backupData.maps || !Array.isArray(backupData.maps)) {
                        reject({
                            success: false,
                            message: lang === 'ar' ?
                                'ملف النسخة الاحتياطية غير صالح' :
                                'Invalid backup file format'
                        });
                        return;
                    }
                    
                    // Save to localStorage
                    localStorage.setItem(this.storageKey, JSON.stringify(backupData.maps));
                    
                    resolve({
                        success: true,
                        restoredCount: backupData.maps.length,
                        message: lang === 'ar' ?
                            `تم استعادة ${backupData.maps.length} خريطة` :
                            `Restored ${backupData.maps.length} maps`
                    });
                    
                } catch (error) {
                    console.error('Error restoring backup:', error);
                    reject({
                        success: false,
                        message: lang === 'ar' ?
                            'خطأ في استعادة النسخة الاحتياطية' :
                            'Error restoring backup'
                    });
                }
            };
            
            reader.onerror = () => {
                reject({
                    success: false,
                    message: lang === 'ar' ?
                        'خطأ في قراءة الملف' :
                        'Error reading file'
                });
            };
            
            reader.readAsText(file);
        });
    }
    
    // Get map statistics
    getMapStatistics() {
        const maps = this.getAllMaps();
        
        return {
            totalMaps: maps.length,
            activeMaps: maps.filter(m => m.status === 'active').length,
            totalProcesses: maps.reduce((sum, m) => sum + (m.processes?.length || 0), 0),
            avgProcessesPerMap: maps.length > 0 ? 
                Math.round(maps.reduce((sum, m) => sum + (m.processes?.length || 0), 0) / maps.length) : 0,
            lastModified: maps.length > 0 ? 
                new Date(Math.max(...maps.map(m => new Date(m.modifiedDate || m.createdDate).getTime()))) : null
        };
    }
    
    // Search maps
    searchMaps(query) {
        const maps = this.getAllMaps();
        const searchTerm = query.toLowerCase();
        
        return maps.filter(map => {
            return (
                (map.name && map.name.toLowerCase().includes(searchTerm)) ||
                (map.description && map.description.toLowerCase().includes(searchTerm)) ||
                (map.tags && map.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
                (map.processes && map.processes.some(p => 
                    p.name && p.name.toLowerCase().includes(searchTerm)
                ))
            );
        });
    }
    
    // Duplicate map
    duplicateMap(mapId, newName = null) {
        const map = this.getMapById(mapId);
        if (!map) return null;
        
        const duplicate = JSON.parse(JSON.stringify(map));
        duplicate.id = Date.now().toString();
        duplicate.name = newName || `${map.name} (Copy)`;
        duplicate.createdDate = new Date().toISOString();
        duplicate.modifiedDate = new Date().toISOString();
        
        const maps = this.getAllMaps();
        maps.push(duplicate);
        localStorage.setItem(this.storageKey, JSON.stringify(maps));
        
        return {
            success: true,
            newMapId: duplicate.id,
            message: this.app.currentLanguage === 'ar' ?
                `تم نسخ الخريطة إلى "${duplicate.name}"` :
                `Copied map to "${duplicate.name}"`
        };
    }
}
