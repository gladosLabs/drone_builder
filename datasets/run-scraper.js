#!/usr/bin/env node

const { GetFPVMotorScraper } = require('./getfpv-motor-scraper');
const { MotorDataAnalyzer } = require('./analyze-motors');
const config = require('./config');

async function runFullScrape() {
    console.log('🚀 Starting Full GetFPV Motor Scrape...\n');
    
    const scraper = new GetFPVMotorScraper();
    
    try {
        await scraper.initialize();
        
        // Scrape all motors
        await scraper.scrapeMotorListings();
        
        // Save data
        await scraper.saveToCSV();
        
        // Generate report
        const report = await scraper.generateReport();
        console.log('\n📈 Scraping Complete!');
        console.log(`Total motors scraped: ${report.total_motors}`);
        
        // Run analysis
        console.log('\n🔍 Running data analysis...');
        const analyzer = new MotorDataAnalyzer(__dirname);
        const analysisReport = analyzer.generateReport();
        
        if (analysisReport) {
            analyzer.saveReport(analysisReport);
            console.log('✅ Analysis complete!');
        }
        
    } catch (error) {
        console.error('❌ Scraping failed:', error.message);
    } finally {
        await scraper.close();
    }
}

async function runCategoryScrape(category) {
    console.log(`🚀 Starting Category Scrape: ${category}...\n`);
    
    const scraper = new GetFPVMotorScraper();
    
    try {
        await scraper.initialize();
        
        const categoryUrl = config.urls.categories[category];
        if (!categoryUrl) {
            console.error(`❌ Category "${category}" not found in config`);
            return;
        }
        
        await scraper.scrapeByCategory(categoryUrl);
        
        // Save data
        await scraper.saveToCSV();
        
        // Generate report
        const report = await scraper.generateReport();
        console.log('\n📈 Category Scraping Complete!');
        console.log(`Total motors scraped: ${report.total_motors}`);
        
    } catch (error) {
        console.error('❌ Category scraping failed:', error.message);
    } finally {
        await scraper.close();
    }
}

async function runTest() {
    console.log('🧪 Running Test Scrape...\n');
    
    const { testScraper } = require('./test-scraper');
    await testScraper();
}

async function runAnalysis() {
    console.log('🔍 Running Data Analysis...\n');
    
    const analyzer = new MotorDataAnalyzer(__dirname);
    const report = analyzer.generateReport();
    
    if (report) {
        analyzer.saveReport(report);
        console.log('✅ Analysis complete!');
    } else {
        console.log('❌ No data available for analysis. Run the scraper first.');
    }
}

// CLI interface
function showHelp() {
    console.log(`
🔧 GetFPV Motor Scraper - Usage

Commands:
  full                    Run full scrape of all motors
  category <name>         Scrape specific category (e.g., brushless, 2204-2206)
  test                    Run test scrape (small sample)
  analyze                 Analyze existing data
  help                    Show this help

Available Categories:
  ${Object.keys(config.urls.categories).join(', ')}

Examples:
  node run-scraper.js full
  node run-scraper.js category brushless
  node run-scraper.js category 2204-2206
  node run-scraper.js test
  node run-scraper.js analyze
`);
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'full':
            await runFullScrape();
            break;
        case 'category':
            const category = args[1];
            if (!category) {
                console.error('❌ Please specify a category name');
                showHelp();
                return;
            }
            await runCategoryScrape(category);
            break;
        case 'test':
            await runTest();
            break;
        case 'analyze':
            await runAnalysis();
            break;
        case 'help':
        case '--help':
        case '-h':
            showHelp();
            break;
        default:
            console.error('❌ Unknown command:', command);
            showHelp();
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    runFullScrape,
    runCategoryScrape,
    runTest,
    runAnalysis
}; 