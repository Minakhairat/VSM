// Data Migration and Version Management
class DataMigration {
    constructor() {
        this.currentVersion = '1.2';
        this.migrations = {
            '1.0': this.migrateFromV1_0.bind(this),
            '1.1': this.migrateFromV1_1.bind(this)
        };
    }
    
    // Check and migrate data
    migrateIfNeeded() {
        const storedVersion = localStorage.getItem('vsm-version') || '1.0';
        
        if (this.compareVersions(storedVersion, this.currentVersion) < 0) {
            console.log(`Migrating from version ${storedVersion} to ${this.currentVersion}`);
            return this.performMigration(storedVersion);
        }
        
        return {
            migrated: false,
            fromVersion: storedVersion,
            toVersion: this.currentVersion,
            message: 'Data is up to date'
        };
    }
    
    // Perform migration
    performMigration(fromVersion) {
        const versionsToMigrate = this.getVersionsToMigrate(fromVersion);
        let migrationLog = [];
        
        versionsToMigrate.forEach(version => {
            if (this.migrations[version]) {
                try {
                    const result = this.migrations[version]();
                    migrationLog.push({
                        from: version,
                        success: true,
                        details: result
                    });
                } catch (error) {
                    migrationLog.push({
                        from: version,
                        success: false,
                        error: error.message
                    });
                }
            }
        });
        
        // Update version in storage
        localStorage.setItem('vsm-version', this.currentVersion);
        
        return {
            migrated: true,
            fromVersion: fromVersion,
            toVersion: this.currentVersion,
            migrationLog: migrationLog,
            message: `Successfully migrated from ${fromVersion} to ${this.currentVersion}`
        };
    }
    
    // Get list of versions to migrate through
    getVersionsToMigrate(fromVersion) {
        const allVersions = ['1.0', '1.1', '1.2'];
        const fromIndex = allVersions.indexOf(fromVersion);
        
        if (fromIndex === -1) {
            // If starting version not found, migrate from the beginning
            return allVersions;
        }
        
        return allVersions.slice(fromIndex + 1);
    }
    
    // Compare version numbers
    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const part1 = parts1[i] || 0;
            const part2 = parts2[i] || 0;
            
            if (part1 !== part2) {
                return part1 - part2;
            }
        }
        
        return 0;
    }
    
    // Migration from version 1.0 to 1.1
    migrateFromV1_0() {
        console.log('Running migration from 1.0 to 1.1');
        
        // Migrate maps
        const mapsJson = localStorage.getItem('vsm-maps');
        if (!mapsJson) return { mapsMigrated: 0 };
        
        const maps = JSON.parse(mapsJson);
        let migratedCount = 0;
        
        maps.forEach(map => {
            // Add new fields introduced in 1.1
            if (!map.version) {
                map.version = '1.1';
                map.analysis = map.analysis || {
                    bottlenecks: [],
                    improvementOpportunities: [],
                    futureState: null
                };
                map.timeline = map.timeline || {
                    phases: [],
                    milestones: [],
                    lastAnalysisDate: null
                };
                
                migratedCount++;
            }
            
            // Migrate processes
            if (map.processes && Array.isArray(map.processes)) {
                map.processes.forEach(process => {
                    if (process.type === 'process') {
                        // Add batchSize if missing
                        if (!process.batchSize) {
                            process.batchSize = 1;
                        }
                        
                        // Add changeoverTime if missing
                        if (!process.changeoverTime) {
                            process.changeoverTime = 0;
                        }
                        
                        // Add kanbanSize for pull systems
                        if (process.flowType === 'pull' && !process.kanbanSize) {
                            process.kanbanSize = Math.max(1, Math.floor(process.inventoryBefore * 0.5));
                        }
                    }
                });
            }
        });
        
        // Save migrated maps
        localStorage.setItem('vsm-maps', JSON.stringify(maps));
        
        return {
            mapsMigrated: migratedCount,
            changes: [
                'Added version tracking',
                'Added analysis section',
                'Added timeline tracking',
                'Enhanced process data structure'
            ]
        };
    }
    
    // Migration from version 1.1 to 1.2
    migrateFromV1_1() {
        console.log('Running migration from 1.1 to 1.2');
        
        // Migrate maps
        const mapsJson = localStorage.getItem('vsm-maps');
        if (!mapsJson) return { mapsMigrated: 0 };
        
        const maps = JSON.parse(mapsJson);
        let migratedCount = 0;
        
        maps.forEach(map => {
            if (map.version === '1.1') {
                // Update version
                map.version = '1.2';
                
                // Add multi-language support fields
                if (!map.nameTranslations) {
                    map.nameTranslations = {
                        en: map.name,
                        ar: map.name
                    };
                }
                
                if (!map.descriptionTranslations) {
                    map.descriptionTranslations = {
                        en: map.description || '',
                        ar: map.description || ''
                    };
                }
                
                // Add team management
                if (!map.team) {
                    map.team = [];
                }
                
                // Add status tracking
                if (!map.status) {
                    map.status = 'active';
                }
                
                // Add industry classification
                if (!map.industry) {
                    map.industry = 'general';
                }
                
                // Enhanced metrics
                if (!map.metrics) {
                    map.metrics = {
                        taktTime: 0,
                        leadTime: 0,
                        cycleEfficiency: 0,
                        valueAddedRatio: 0,
                        inventoryTurns: 0
                    };
                }
                
                migratedCount++;
            }
        });
        
        // Save migrated maps
        localStorage.setItem('vsm-maps', JSON.stringify(maps));
        
        // Migrate user preferences
        this.migrateUserPreferences();
        
        return {
            mapsMigrated: migratedCount,
            changes: [
                'Added multi-language support',
                'Added team management',
                'Enhanced metrics tracking',
                'Added industry classification'
            ]
        };
    }
    
    // Migrate user preferences
    migrateUserPreferences() {
        // Migrate language preference
        const oldLang = localStorage.getItem('language');
        if (oldLang && !localStorage.getItem('vsm-language')) {
            localStorage.setItem('vsm-language', oldLang === 'arabic' ? 'ar' : 'en');
        }
        
        // Migrate theme preference
        const oldTheme = localStorage.getItem('theme');
        if (oldTheme && !localStorage.getItem('vsm-theme')) {
            localStorage.setItem('vsm-theme', oldTheme);
        }
        
        // Migrate display preferences
        const oldPrefs = localStorage.getItem('display-preferences');
        if (oldPrefs) {
            try {
                const prefs = JSON.parse(oldPrefs);
                if (prefs.showMetrics !== undefined) {
                    localStorage.setItem('vsm-show-metrics', prefs.showMetrics);
                }
                if (prefs.autoCalculate !== undefined) {
                    localStorage.setItem('vsm-auto-calculate', prefs.autoCalculate);
                }
            } catch (error) {
                console.error('Error migrating preferences:', error);
            }
        }
    }
    
    // Export migration report
    exportMigrationReport(migrationResult) {
        const report = {
            title: 'VSM Data Migration Report',
            timestamp: new Date().toISOString(),
            result: migrationResult,
            systemInfo: {
                userAgent: navigator.userAgent,
                localStorageSize: this.calculateLocalStorageSize(),
                mapsCount: this.getMapsCount()
            }
        };
        
        const dataStr = JSON.stringify(report, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const fileName = `vsm-migration-report-${new Date().getTime()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', fileName);
        linkElement.click();
        
        return fileName;
    }
    
    // Calculate localStorage size
    calculateLocalStorageSize() {
        let total = 0;
        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length * 2; // UTF-16
            }
        }
        return total;
    }
    
    // Get maps count
    getMapsCount() {
        try {
            const maps = JSON.parse(localStorage.getItem('vsm-maps') || '[]');
            return maps.length;
        } catch (error) {
            return 0;
        }
    }
    
    // Validate data integrity
    validateDataIntegrity() {
        const issues = [];
        
        // Check maps
        try {
            const maps = JSON.parse(localStorage.getItem('vsm-maps') || '[]');
            
            maps.forEach((map, index) => {
                // Check required fields
                if (!map.id) issues.push(`Map ${index}: Missing ID`);
                if (!map.name) issues.push(`Map ${index}: Missing name`);
                
                // Check processes
                if (!Array.isArray(map.processes)) {
                    issues.push(`Map ${map.name}: Processes should be an array`);
                } else {
                    map.processes.forEach((process, pIndex) => {
                        if (!process.type) issues.push(`Map ${map.name}, Process ${pIndex}: Missing type`);
                        if (process.type === 'process' && !process.name) {
                            issues.push(`Map ${map.name}, Process ${pIndex}: Missing name`);
                        }
                    });
                }
            });
            
        } catch (error) {
            issues.push(`Error parsing maps: ${error.message}`);
        }
        
        // Check version
        if (!localStorage.getItem('vsm-version')) {
            issues.push('Missing version information');
        }
        
        return {
            valid: issues.length === 0,
            issues: issues,
            timestamp: new Date().toISOString()
        };
    }
    
    // Repair corrupted data
    repairData() {
        const repairs = [];
        
        // Try to repair maps
        try {
            const mapsJson = localStorage.getItem('vsm-maps');
            if (mapsJson) {
                let maps;
                try {
                    maps = JSON.parse(mapsJson);
                } catch (error) {
                    // Try to fix JSON
                    const fixedJson = this.fixJson(mapsJson);
                    maps = JSON.parse(fixedJson);
                    repairs.push('Fixed malformed JSON in maps data');
                }
                
                // Repair individual maps
                maps.forEach((map, index) => {
                    if (!map.id) {
                        map.id = `repaired-${Date.now()}-${index}`;
                        repairs.push(`Map ${index}: Added missing ID`);
                    }
                    
                    if (!map.name) {
                        map.name = `Repaired Map ${index + 1}`;
                        repairs.push(`Map ${index}: Added missing name`);
                    }
                    
                    if (!Array.isArray(map.processes)) {
                        map.processes = [];
                        repairs.push(`Map ${map.name}: Fixed processes array`);
                    }
                });
                
                // Save repaired maps
                localStorage.setItem('vsm-maps', JSON.stringify(maps));
            }
        } catch (error) {
            repairs.push(`Error during repair: ${error.message}`);
        }
        
        // Ensure version is set
        if (!localStorage.getItem('vsm-version')) {
            localStorage.setItem('vsm-version', this.currentVersion);
            repairs.push('Added missing version');
        }
        
        return {
            repaired: repairs.length > 0,
            repairs: repairs,
            timestamp: new Date().toISOString()
        };
    }
    
    // Attempt to fix malformed JSON
    fixJson(jsonString) {
        // Simple JSON repair - in production you'd want a more robust solution
        try {
            // Try to parse as-is first
            JSON.parse(jsonString);
            return jsonString;
        } catch (error) {
            // Simple fixes
            let fixed = jsonString
                .replace(/,\s*}/g, '}')
                .replace(/,\s*]/g, ']')
                .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
                .replace(/:\s*'([^']*)'/g, ': "$1"');
            
            return fixed;
        }
    }
}