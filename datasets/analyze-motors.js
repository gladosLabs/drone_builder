const fs = require('fs');
const path = require('path');

class MotorDataAnalyzer {
    constructor(dataPath) {
        this.dataPath = dataPath;
        this.motors = [];
        this.loadData();
    }

    loadData() {
        try {
            // Try to load JSON data first
            const jsonPath = path.join(this.dataPath, 'getfpv-motors.json');
            if (fs.existsSync(jsonPath)) {
                this.motors = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                console.log(`📊 Loaded ${this.motors.length} motors from JSON`);
            } else {
                console.log('❌ No motor data found. Run the scraper first.');
            }
        } catch (error) {
            console.error('❌ Error loading data:', error.message);
        }
    }

    // Basic statistics
    getBasicStats() {
        if (this.motors.length === 0) return null;

        const prices = this.motors.map(m => parseFloat(m.price) || 0).filter(p => p > 0);
        const weights = this.motors.map(m => parseFloat(m.weight) || 0).filter(w => w > 0);
        const kvs = this.motors.map(m => parseFloat(m.kv) || 0).filter(k => k > 0);

        return {
            total_motors: this.motors.length,
            brands: [...new Set(this.motors.map(m => m.brand).filter(Boolean))],
            price_stats: {
                min: Math.min(...prices),
                max: Math.max(...prices),
                average: prices.reduce((sum, p) => sum + p, 0) / prices.length,
                median: this.getMedian(prices)
            },
            weight_stats: {
                min: Math.min(...weights),
                max: Math.max(...weights),
                average: weights.reduce((sum, w) => sum + w, 0) / weights.length,
                median: this.getMedian(weights)
            },
            kv_stats: {
                min: Math.min(...kvs),
                max: Math.max(...kvs),
                average: kvs.reduce((sum, k) => sum + k, 0) / kvs.length,
                median: this.getMedian(kvs)
            }
        };
    }

    // Find motors by criteria
    findMotors(criteria) {
        return this.motors.filter(motor => {
            return Object.keys(criteria).every(key => {
                const value = criteria[key];
                const motorValue = motor[key];
                
                if (typeof value === 'string') {
                    return motorValue && motorValue.toLowerCase().includes(value.toLowerCase());
                } else if (typeof value === 'number') {
                    const numValue = parseFloat(motorValue);
                    return !isNaN(numValue) && numValue === value;
                } else if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
                    const numValue = parseFloat(motorValue);
                    return !isNaN(numValue) && numValue >= value.min && numValue <= value.max;
                }
                return false;
            });
        });
    }

    // Find motors by KV range
    findMotorsByKV(minKV, maxKV) {
        return this.findMotors({ kv: { min: minKV, max: maxKV } });
    }

    // Find motors by weight range
    findMotorsByWeight(minWeight, maxWeight) {
        return this.findMotors({ weight: { min: minWeight, max: maxWeight } });
    }

    // Find motors by price range
    findMotorsByPrice(minPrice, maxPrice) {
        return this.findMotors({ price: { min: minPrice, max: maxPrice } });
    }

    // Find motors by brand
    findMotorsByBrand(brand) {
        return this.findMotors({ brand: brand });
    }

    // Get price distribution
    getPriceDistribution() {
        const prices = this.motors.map(m => parseFloat(m.price) || 0).filter(p => p > 0);
        const ranges = [
            { min: 0, max: 20, label: '$0-$20' },
            { min: 20, max: 50, label: '$20-$50' },
            { min: 50, max: 100, label: '$50-$100' },
            { min: 100, max: 200, label: '$100-$200' },
            { min: 200, max: 500, label: '$200-$500' },
            { min: 500, max: Infinity, label: '$500+' }
        ];

        return ranges.map(range => ({
            range: range.label,
            count: prices.filter(p => p >= range.min && p < range.max).length,
            percentage: (prices.filter(p => p >= range.min && p < range.max).length / prices.length * 100).toFixed(1)
        }));
    }

    // Get KV distribution
    getKVDistribution() {
        const kvs = this.motors.map(m => parseFloat(m.kv) || 0).filter(k => k > 0);
        const ranges = [
            { min: 0, max: 100, label: '0-100 KV' },
            { min: 100, max: 200, label: '100-200 KV' },
            { min: 200, max: 500, label: '200-500 KV' },
            { min: 500, max: 1000, label: '500-1000 KV' },
            { min: 1000, max: 2000, label: '1000-2000 KV' },
            { min: 2000, max: Infinity, label: '2000+ KV' }
        ];

        return ranges.map(range => ({
            range: range.label,
            count: kvs.filter(k => k >= range.min && k < range.max).length,
            percentage: (kvs.filter(k => k >= range.min && k < range.max).length / kvs.length * 100).toFixed(1)
        }));
    }

    // Get brand distribution
    getBrandDistribution() {
        const brands = this.motors.map(m => m.brand).filter(Boolean);
        const brandCount = {};
        
        brands.forEach(brand => {
            brandCount[brand] = (brandCount[brand] || 0) + 1;
        });

        return Object.entries(brandCount)
            .map(([brand, count]) => ({
                brand,
                count,
                percentage: (count / brands.length * 100).toFixed(1)
            }))
            .sort((a, b) => b.count - a.count);
    }

    // Find best value motors (low price, good specs)
    findBestValueMotors(limit = 10) {
        const motorsWithPrice = this.motors.filter(m => parseFloat(m.price) > 0);
        
        return motorsWithPrice
            .map(motor => {
                const price = parseFloat(motor.price);
                const kv = parseFloat(motor.kv) || 0;
                const weight = parseFloat(motor.weight) || 0;
                
                // Simple value score (higher KV, lower weight, lower price = better value)
                const valueScore = kv / (weight * price);
                
                return { ...motor, valueScore };
            })
            .sort((a, b) => b.valueScore - a.valueScore)
            .slice(0, limit);
    }

    // Generate comprehensive report
    generateReport() {
        const stats = this.getBasicStats();
        if (!stats) return null;

        const report = {
            summary: stats,
            price_distribution: this.getPriceDistribution(),
            kv_distribution: this.getKVDistribution(),
            brand_distribution: this.getBrandDistribution(),
            best_value_motors: this.findBestValueMotors(5),
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    // Generate recommendations
    generateRecommendations() {
        const recommendations = [];

        // Find motors for different use cases
        const racingMotors = this.findMotorsByKV(2000, 3000).slice(0, 5);
        const freestyleMotors = this.findMotorsByKV(1500, 2500).slice(0, 5);
        const longRangeMotors = this.findMotorsByKV(100, 500).slice(0, 5);
        const budgetMotors = this.findMotorsByPrice(0, 30).slice(0, 5);

        if (racingMotors.length > 0) {
            recommendations.push({
                category: 'Racing Motors (2000-3000 KV)',
                motors: racingMotors
            });
        }

        if (freestyleMotors.length > 0) {
            recommendations.push({
                category: 'Freestyle Motors (1500-2500 KV)',
                motors: freestyleMotors
            });
        }

        if (longRangeMotors.length > 0) {
            recommendations.push({
                category: 'Long Range Motors (100-500 KV)',
                motors: longRangeMotors
            });
        }

        if (budgetMotors.length > 0) {
            recommendations.push({
                category: 'Budget Motors (<$30)',
                motors: budgetMotors
            });
        }

        return recommendations;
    }

    // Helper function to calculate median
    getMedian(arr) {
        const sorted = arr.sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    }

    // Save analysis report
    saveReport(report, filename = 'motor-analysis-report.json') {
        const reportPath = path.join(this.dataPath, filename);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📊 Analysis report saved to ${filename}`);
    }
}

// Example usage and CLI interface
function main() {
    const analyzer = new MotorDataAnalyzer(__dirname);
    
    console.log('🔍 Motor Data Analysis');
    console.log('=====================\n');

    const report = analyzer.generateReport();
    
    if (report) {
        console.log('📊 Summary Statistics:');
        console.log(`- Total Motors: ${report.summary.total_motors}`);
        console.log(`- Brands: ${report.summary.brands.length}`);
        console.log(`- Price Range: $${report.summary.price_stats.min.toFixed(2)} - $${report.summary.price_stats.max.toFixed(2)}`);
        console.log(`- Average Price: $${report.summary.price_stats.average.toFixed(2)}`);
        console.log(`- KV Range: ${report.summary.kv_stats.min} - ${report.summary.kv_stats.max}`);
        console.log(`- Average KV: ${report.summary.kv_stats.average.toFixed(0)}`);

        console.log('\n🏆 Top Brands:');
        report.brand_distribution.slice(0, 5).forEach(brand => {
            console.log(`- ${brand.brand}: ${brand.count} motors (${brand.percentage}%)`);
        });

        console.log('\n💰 Price Distribution:');
        report.price_distribution.forEach(range => {
            console.log(`- ${range.range}: ${range.count} motors (${range.percentage}%)`);
        });

        console.log('\n⚡ KV Distribution:');
        report.kv_distribution.forEach(range => {
            console.log(`- ${range.range}: ${range.count} motors (${range.percentage}%)`);
        });

        console.log('\n💎 Best Value Motors:');
        report.best_value_motors.forEach((motor, index) => {
            console.log(`${index + 1}. ${motor.name} - $${motor.price} (KV: ${motor.kv})`);
        });

        // Save the report
        analyzer.saveReport(report);
        
    } else {
        console.log('❌ No data available for analysis. Run the scraper first.');
    }
}

// Export for use as module
module.exports = { MotorDataAnalyzer };

// Run if called directly
if (require.main === module) {
    main();
} 