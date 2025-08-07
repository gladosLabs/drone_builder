const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

class GetFPVMotorScraper {
    constructor() {
        this.browser = null;
        this.page = null;
        this.motors = [];
        this.csvWriter = createCsvWriter({
            path: path.join(__dirname, 'getfpv-motors.csv'),
            header: [
                { id: 'name', title: 'Name' },
                { id: 'brand', title: 'Brand' },
                { id: 'motor_size', title: 'Motor Size' },
                { id: 'kv', title: 'KV Rating' },
                { id: 'weight', title: 'Weight (g)' },
                { id: 'shaft_diameter', title: 'Shaft Diameter (mm)' },
                { id: 'mounting_holes', title: 'Mounting Holes (mm)' },
                { id: 'max_current', title: 'Max Current (A)' },
                { id: 'max_power', title: 'Max Power (W)' },
                { id: 'thrust', title: 'Thrust (g)' },
                { id: 'price', title: 'Price ($)' },
                { id: 'availability', title: 'Availability' },
                { id: 'url', title: 'Product URL' },
                { id: 'image_url', title: 'Image URL' },
                { id: 'description', title: 'Description' },
                { id: 'specifications', title: 'Specifications' }
            ]
        });
    }

    async initialize() {
        console.log('🚀 Initializing GetFPV Motor Scraper...');
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for production
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        // Set user agent to avoid detection
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Enable request interception for better performance
        await this.page.setRequestInterception(true);
        this.page.on('request', (req) => {
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });
    }

    async scrapeMotorPage(url) {
        try {
            console.log(`📄 Scraping motor page: ${url}`);
            await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            
            // Wait for product information to load (try multiple selectors)
            const selectors = ['.product-info', '.product-details', '.product', 'h1', '.product-name'];
            let found = false;
            for (const selector of selectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 5000 });
                    found = true;
                    break;
                } catch (e) {
                    continue;
                }
            }
            
            const motorData = await this.page.evaluate(() => {
                const motor = {};
                
                // Product name - try multiple selectors
                const nameSelectors = [
                    '.product-name h1',
                    'h1.product-name',
                    'h1',
                    '.product-title',
                    '.product-name',
                    '[data-testid="product-title"]'
                ];
                
                for (const selector of nameSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent.trim()) {
                        motor.name = element.textContent.trim();
                        break;
                    }
                }
                
                // Brand - try multiple sources
                const brandSelectors = [
                    '.breadcrumb',
                    '.brand',
                    '.manufacturer',
                    '[data-testid="brand"]'
                ];
                
                for (const selector of brandSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent.trim()) {
                        motor.brand = element.textContent.split('>')[0].trim();
                        break;
                    }
                }
                
                // Price - try multiple selectors
                const priceSelectors = [
                    '.price-box .price',
                    '.price',
                    '.product-price',
                    '[data-testid="price"]',
                    '.current-price'
                ];
                
                for (const selector of priceSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent.trim()) {
                        motor.price = element.textContent.replace(/[^\d.]/g, '');
                        break;
                    }
                }
                
                // Availability
                const availabilitySelectors = [
                    '.availability',
                    '.stock-status',
                    '.in-stock',
                    '[data-testid="availability"]'
                ];
                
                for (const selector of availabilitySelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent.trim()) {
                        motor.availability = element.textContent.trim();
                        break;
                    }
                }
                
                // Image URL
                const imageSelectors = [
                    '.product-image img',
                    '.product img',
                    'img[alt*="motor"]',
                    'img[src*="motor"]',
                    '.main-image img'
                ];
                
                for (const selector of imageSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.src) {
                        motor.image_url = element.src;
                        break;
                    }
                }
                
                // Description
                const descSelectors = [
                    '.product-description',
                    '.description',
                    '.product-details',
                    '[data-testid="description"]'
                ];
                
                for (const selector of descSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent.trim()) {
                        motor.description = element.textContent.trim();
                        break;
                    }
                }
                
                // Specifications table - try multiple selectors
                const specsSelectors = [
                    '.product-specifications table',
                    '.specifications table',
                    '.specs table',
                    'table',
                    '.product-details table'
                ];
                
                motor.specifications = {};
                for (const selector of specsSelectors) {
                    const table = document.querySelector(selector);
                    if (table) {
                        const rows = table.querySelectorAll('tr');
                        rows.forEach(row => {
                            const cells = row.querySelectorAll('td, th');
                            if (cells.length >= 2) {
                                const key = cells[0].textContent.trim();
                                const value = cells[1].textContent.trim();
                                if (key && value) {
                                    motor.specifications[key] = value;
                                }
                            }
                        });
                        if (Object.keys(motor.specifications).length > 0) {
                            break;
                        }
                    }
                }
                
                // Extract common motor specs
                motor.kv = motor.specifications['KV Rating'] || motor.specifications['KV'] || '';
                motor.weight = motor.specifications['Weight'] || motor.specifications['Motor Weight'] || '';
                motor.shaft_diameter = motor.specifications['Shaft Diameter'] || motor.specifications['Shaft'] || '';
                motor.mounting_holes = motor.specifications['Mounting Holes'] || motor.specifications['Mount Pattern'] || '';
                motor.max_current = motor.specifications['Max Current'] || motor.specifications['Current'] || '';
                motor.max_power = motor.specifications['Max Power'] || motor.specifications['Power'] || '';
                motor.thrust = motor.specifications['Thrust'] || motor.specifications['Max Thrust'] || '';
                
                // Extract KV from title if not found in specs
                if (!motor.kv && motor.name) {
                    const kvMatch = motor.name.match(/(\d+)KV/i);
                    if (kvMatch) {
                        motor.kv = kvMatch[1];
                    }
                }
                
                // Extract motor size from title (e.g., 2407, 2207, etc.)
                if (motor.name) {
                    const sizeMatch = motor.name.match(/(\d{4})/);
                    if (sizeMatch) {
                        motor.motor_size = sizeMatch[1];
                    }
                }
                
                // Extract brand from title if not found
                if (!motor.brand && motor.name) {
                    const brandMatch = motor.name.match(/^([A-Za-z]+)/);
                    if (brandMatch) {
                        motor.brand = brandMatch[1];
                    }
                }
                
                motor.url = window.location.href;
                motor.specifications = JSON.stringify(motor.specifications);
                
                return motor;
            });
            
            if (motorData.name) {
                this.motors.push(motorData);
                console.log(`✅ Scraped: ${motorData.name}`);
            }
            
        } catch (error) {
            console.error(`❌ Error scraping ${url}:`, error.message);
        }
    }

    async scrapeMotorListings() {
        try {
            console.log('🔍 Starting to scrape motor listings...');
            
            // GetFPV motors category URL
            const baseUrl = 'https://www.getfpv.com/motors.html';
            await this.page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            
            // Get all motor product links
            const motorUrls = await this.page.evaluate(() => {
                // Try multiple selectors for different page layouts
                const selectors = [
                    // GetFPV specific selectors based on debug findings
                    '.item.product.product-item a',
                    '.product-item a',
                    '.product a',
                    'a[href*="getfpv.com"][href*="motor"]',
                    // Fallback selectors
                    '.product-item a.product-item-link',
                    '.product-item a[href*="/motor"]',
                    '.product-item a[href*="motor"]',
                    '.product a',
                    '.product-item a',
                    'a[href*="/motor"]',
                    'a[href*="motor"]',
                    '.product-grid a',
                    '.product-list a',
                    '.products a',
                    'a[href*="getfpv.com"][href*="/"]',
                    'a[href*="product"]'
                ];
                
                let links = [];
                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        links = Array.from(elements);
                        console.log(`Found ${links.length} links with selector: ${selector}`);
                        break;
                    }
                }
                
                // If no specific motor links found, get all product links
                if (links.length === 0) {
                    links = Array.from(document.querySelectorAll('a[href*="/"]'));
                    console.log(`Found ${links.length} total links`);
                }
                
                // Filter for motor-related products
                return links.map(link => link.href).filter(href => 
                    (href.includes('getfpv.com') && 
                     (href.includes('motor') || href.includes('Motor'))) &&
                    !href.includes('customer') &&
                    !href.includes('account') &&
                    !href.includes('cart') &&
                    !href.includes('checkout') &&
                    !href.includes('wishlist') &&
                    !href.includes('contact') &&
                    !href.includes('brands') &&
                    !href.includes('category') &&
                    !href.includes('motors.html') &&
                    !href.includes('mailto:') &&
                    href.includes('.html')
                );
            });
            
            console.log(`📊 Found ${motorUrls.length} motor products to scrape`);
            
            // Scrape each motor page
            for (let i = 0; i < motorUrls.length; i++) {
                const url = motorUrls[i];
                await this.scrapeMotorPage(url);
                
                // Add delay to be respectful to the server
                await this.delay(2000 + Math.random() * 3000);
                
                // Progress indicator
                if ((i + 1) % 10 === 0) {
                    console.log(`📈 Progress: ${i + 1}/${motorUrls.length} motors scraped`);
                }
            }
            
        } catch (error) {
            console.error('❌ Error scraping motor listings:', error.message);
        }
    }

    async scrapeByCategory(categoryUrl) {
        try {
            console.log(`🏷️ Scraping motors from category: ${categoryUrl}`);
            await this.page.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            
            // Handle pagination
            let hasNextPage = true;
            let pageNum = 1;
            
            while (hasNextPage) {
                console.log(`📄 Scraping page ${pageNum}...`);
                
                // Get motor URLs from current page
                const motorUrls = await this.page.evaluate(() => {
                    // Try multiple selectors for different page layouts
                    const selectors = [
                        // GetFPV specific selectors based on debug findings
                        '.item.product.product-item a',
                        '.product-item a',
                        '.product a',
                        'a[href*="getfpv.com"][href*="motor"]',
                        // Fallback selectors
                        '.product-item a.product-item-link',
                        '.product-item a[href*="/motor"]',
                        '.product-item a[href*="motor"]',
                        '.product a',
                        '.product-item a',
                        'a[href*="/motor"]',
                        'a[href*="motor"]'
                    ];
                    
                    let links = [];
                    for (const selector of selectors) {
                        const elements = document.querySelectorAll(selector);
                        if (elements.length > 0) {
                            links = Array.from(elements);
                            console.log(`Found ${links.length} links with selector: ${selector}`);
                            break;
                        }
                    }
                    
                    // If no specific motor links found, get all product links
                    if (links.length === 0) {
                        links = Array.from(document.querySelectorAll('a[href*="/"]'));
                        console.log(`Found ${links.length} total links`);
                    }
                    
                    // Filter for motor-related products
                    return links.map(link => link.href).filter(href => 
                        (href.includes('getfpv.com') && 
                         (href.includes('motor') || href.includes('Motor'))) &&
                        !href.includes('customer') &&
                        !href.includes('account') &&
                        !href.includes('cart') &&
                        !href.includes('checkout') &&
                        !href.includes('wishlist') &&
                        !href.includes('contact') &&
                        !href.includes('brands') &&
                        !href.includes('category') &&
                        !href.includes('motors.html') &&
                        !href.includes('mailto:') &&
                        href.includes('.html')
                    );
                });
                
                // Scrape each motor on this page
                for (const url of motorUrls) {
                    await this.scrapeMotorPage(url);
                    await this.delay(1500 + Math.random() * 2000);
                }
                
                // Check for next page
                const nextPageButton = await this.page.$('.pages .next');
                if (nextPageButton) {
                    await nextPageButton.click();
                    await this.page.waitForTimeout(3000);
                    pageNum++;
                } else {
                    hasNextPage = false;
                }
            }
            
        } catch (error) {
            console.error('❌ Error scraping category:', error.message);
        }
    }

    async saveToCSV() {
        try {
            console.log(`💾 Saving ${this.motors.length} motors to CSV...`);
            await this.csvWriter.writeRecords(this.motors);
            console.log('✅ Data saved to getfpv-motors.csv');
            
            // Also save as JSON for backup
            const jsonPath = path.join(__dirname, 'getfpv-motors.json');
            fs.writeFileSync(jsonPath, JSON.stringify(this.motors, null, 2));
            console.log('✅ Data also saved to getfpv-motors.json');
            
        } catch (error) {
            console.error('❌ Error saving data:', error.message);
        }
    }

    async generateReport() {
        const report = {
            total_motors: this.motors.length,
            brands: [...new Set(this.motors.map(m => m.brand).filter(Boolean))],
            price_range: {
                min: Math.min(...this.motors.map(m => parseFloat(m.price) || 0)),
                max: Math.max(...this.motors.map(m => parseFloat(m.price) || 0)),
                average: this.motors.reduce((sum, m) => sum + (parseFloat(m.price) || 0), 0) / this.motors.length
            },
            kv_ranges: [...new Set(this.motors.map(m => m.kv).filter(Boolean))],
            scraped_at: new Date().toISOString()
        };
        
        const reportPath = path.join(__dirname, 'scraping-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log('📊 Scraping report generated');
        
        return report;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Browser closed');
        }
    }
}

// Main execution function
async function main() {
    const scraper = new GetFPVMotorScraper();
    
    try {
        await scraper.initialize();
        
        // Scrape all motors
        await scraper.scrapeMotorListings();
        
        // Alternative: Scrape specific categories
        // await scraper.scrapeByCategory('https://www.getfpv.com/motors/brushless-motors.html');
        // await scraper.scrapeByCategory('https://www.getfpv.com/motors/brushless-motors/2204-2206.html');
        
        // Save data
        await scraper.saveToCSV();
        
        // Generate report
        const report = await scraper.generateReport();
        console.log('📈 Final Report:', report);
        
    } catch (error) {
        console.error('❌ Scraper failed:', error.message);
    } finally {
        await scraper.close();
    }
}

// Export for use as module
module.exports = { GetFPVMotorScraper, main };

// Run if called directly
if (require.main === module) {
    main();
} 