const puppeteer = require('puppeteer');

async function debugMotors() {
    console.log('🔍 Debugging GetFPV Motors page...');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    try {
        // Navigate to the motors page
        await page.goto('https://www.getfpv.com/motors.html', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });
        
        console.log('✅ Motors page loaded successfully');
        
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Get page title
        const title = await page.title();
        console.log(`📄 Page title: ${title}`);
        
        // Look for product containers
        const productContainers = await page.evaluate(() => {
            const containers = document.querySelectorAll('[class*="product"], [class*="item"], [class*="card"], [class*="grid"]');
            return Array.from(containers).map(container => ({
                className: container.className,
                tagName: container.tagName,
                hasLinks: container.querySelectorAll('a').length,
                text: container.textContent.trim().substring(0, 100),
                children: container.children.length
            })).slice(0, 15);
        });
        
        console.log('\n📦 Product containers found:');
        productContainers.forEach((container, index) => {
            console.log(`${index + 1}. ${container.tagName}.${container.className} (${container.hasLinks} links, ${container.children} children)`);
        });
        
        // Look for any links that might be products
        const allLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href]'));
            return links.map(link => ({
                href: link.href,
                text: link.textContent.trim().substring(0, 50),
                className: link.className,
                parentClass: link.parentElement ? link.parentElement.className : ''
            })).filter(link => 
                link.href.includes('getfpv.com') && 
                !link.href.includes('customer') &&
                !link.href.includes('account') &&
                !link.href.includes('cart') &&
                !link.href.includes('checkout') &&
                !link.href.includes('wishlist') &&
                !link.href.includes('contact') &&
                !link.href.includes('brands') &&
                !link.href.includes('category') &&
                !link.href.includes('motors.html')
            ).slice(0, 20);
        });
        
        console.log('\n🔗 Potential product links:');
        allLinks.forEach((link, index) => {
            console.log(`${index + 1}. ${link.text} -> ${link.href}`);
            console.log(`   Class: ${link.className}, Parent: ${link.parentClass}`);
        });
        
        // Look for specific motor product patterns
        const motorProducts = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href]'));
            return links.map(link => ({
                href: link.href,
                text: link.textContent.trim(),
                className: link.className
            })).filter(link => 
                link.href.includes('getfpv.com') && 
                (link.text.toLowerCase().includes('motor') ||
                 link.href.includes('motor') ||
                 link.href.includes('tmotor') ||
                 link.href.includes('lumenier'))
            );
        });
        
        console.log('\n⚡ Motor-specific links:');
        motorProducts.forEach((link, index) => {
            console.log(`${index + 1}. ${link.text} -> ${link.href}`);
        });
        
        // Check if there are any product grids or lists
        const productStructures = await page.evaluate(() => {
            const structures = [];
            
            // Look for common product grid patterns
            const grids = document.querySelectorAll('[class*="grid"], [class*="list"], [class*="products"]');
            grids.forEach(grid => {
                const products = grid.querySelectorAll('a[href*="getfpv.com"]');
                if (products.length > 0) {
                    structures.push({
                        type: 'grid/list',
                        className: grid.className,
                        productCount: products.length,
                        sampleLinks: Array.from(products).slice(0, 3).map(p => p.href)
                    });
                }
            });
            
            return structures;
        });
        
        console.log('\n🏗️ Product structures found:');
        productStructures.forEach((structure, index) => {
            console.log(`${index + 1}. ${structure.type}: ${structure.className} (${structure.productCount} products)`);
            structure.sampleLinks.forEach(link => console.log(`   - ${link}`));
        });
        
        // Take a screenshot
        await page.screenshot({ path: 'motors-page.png', fullPage: true });
        console.log('\n📸 Screenshot saved as motors-page.png');
        
    } catch (error) {
        console.error('❌ Error during debugging:', error.message);
    } finally {
        await browser.close();
        console.log('🔒 Browser closed');
    }
}

debugMotors(); 